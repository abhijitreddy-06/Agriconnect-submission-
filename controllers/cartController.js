import pool from "../config/database.js";
import { cacheGet, cacheSet, cacheInvalidatePattern } from "../config/redis.js";

// POST /api/cart — Add item to cart (or increment quantity if exists)
export const addToCart = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const { product_id, quantity } = req.body;

        if (!product_id) {
            return res.status(400).json({ success: false, error: "Product ID is required." });
        }

        const qty = parseFloat(quantity) || 1;
        if (qty <= 0 || qty > 9999) {
            return res.status(400).json({ success: false, error: "Quantity must be between 1 and 9999." });
        }

        // Verify product exists and has stock
        const product = await pool.query(
            "SELECT id, quantity AS stock, farmer_id FROM products WHERE id = $1",
            [product_id]
        );

        if (product.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Product not found." });
        }

        // Prevent buying own product
        if (product.rows[0].farmer_id === customerId) {
            return res.status(400).json({ success: false, error: "You cannot add your own product to cart." });
        }

        // Upsert: insert or update quantity on conflict
        const result = await pool.query(
            `INSERT INTO cart_items (customer_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (customer_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING id, quantity`,
            [customerId, product_id, qty]
        );

        // Invalidate cart cache
        await cacheInvalidatePattern(`cart:${customerId}*`);

        return res.status(201).json({
            success: true,
            message: "Added to cart.",
            cartItem: result.rows[0],
        });
    } catch (error) {
        console.error("Error adding to cart:", error.message);
        return res.status(500).json({ success: false, error: "Failed to add to cart." });
    }
};

// GET /api/cart — Get all cart items for customer (cached 1 min)
export const getCart = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const cacheKey = `cart:${customerId}`;

        const cached = await cacheGet(cacheKey);
        if (cached) {
            return res.json({ success: true, data: cached });
        }

        const result = await pool.query(
            `SELECT ci.id, ci.product_id, ci.quantity,
              p.product_name, p.price, p.image, p.quantity_unit, p.quality,
              p.quantity AS stock, u.username AS farmer_name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN users u ON p.farmer_id = u.id
       WHERE ci.customer_id = $1
       ORDER BY ci.created_at DESC`,
            [customerId]
        );

        // Calculate totals
        const items = result.rows.map((item) => ({
            ...item,
            subtotal: parseFloat(item.price) * parseFloat(item.quantity),
        }));

        const cartTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

        const cartData = { items, cartTotal, itemCount: items.length };

        await cacheSet(cacheKey, cartData, 60); // 1 min cache

        return res.json({ success: true, data: cartData });
    } catch (error) {
        console.error("Error fetching cart:", error.message);
        return res.status(500).json({ success: false, error: "Failed to fetch cart." });
    }
};

// PUT /api/cart/:id — Update cart item quantity
export const updateCartItem = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const cartItemId = req.params.id;
        const { quantity } = req.body;

        const qty = parseFloat(quantity);
        if (!qty || qty <= 0 || qty > 9999) {
            return res.status(400).json({ success: false, error: "Quantity must be between 1 and 9999." });
        }

        // Verify ownership
        const item = await pool.query(
            "SELECT id FROM cart_items WHERE id = $1 AND customer_id = $2",
            [cartItemId, customerId]
        );

        if (item.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Cart item not found." });
        }

        await pool.query("UPDATE cart_items SET quantity = $1 WHERE id = $2", [qty, cartItemId]);

        await cacheInvalidatePattern(`cart:${customerId}*`);

        return res.json({ success: true, message: "Cart updated." });
    } catch (error) {
        console.error("Error updating cart:", error.message);
        return res.status(500).json({ success: false, error: "Failed to update cart." });
    }
};

// DELETE /api/cart/:id — Remove single item from cart
export const removeCartItem = async (req, res) => {
    try {
        const customerId = req.user.userId;
        const cartItemId = req.params.id;

        const result = await pool.query(
            "DELETE FROM cart_items WHERE id = $1 AND customer_id = $2 RETURNING id",
            [cartItemId, customerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Cart item not found." });
        }

        await cacheInvalidatePattern(`cart:${customerId}*`);

        return res.json({ success: true, message: "Item removed from cart." });
    } catch (error) {
        console.error("Error removing cart item:", error.message);
        return res.status(500).json({ success: false, error: "Failed to remove item." });
    }
};

// DELETE /api/cart — Clear entire cart
export const clearCart = async (req, res) => {
    try {
        const customerId = req.user.userId;

        await pool.query("DELETE FROM cart_items WHERE customer_id = $1", [customerId]);
        await cacheInvalidatePattern(`cart:${customerId}*`);

        return res.json({ success: true, message: "Cart cleared." });
    } catch (error) {
        console.error("Error clearing cart:", error.message);
        return res.status(500).json({ success: false, error: "Failed to clear cart." });
    }
};

// POST /api/cart/checkout — Convert entire cart into orders
export const checkout = async (req, res) => {
    const client = await pool.connect();

    try {
        const customerId = req.user.userId;

        await client.query("BEGIN");

        // Get all cart items with product details
        const cartResult = await client.query(
            `SELECT ci.id, ci.product_id, ci.quantity,
              p.price, p.quantity AS stock, p.product_name, p.farmer_id
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.customer_id = $1
       FOR UPDATE`,
            [customerId]
        );

        if (cartResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, error: "Cart is empty." });
        }

        const errors = [];
        const orderIds = [];

        for (const item of cartResult.rows) {
            // Check stock
            if (parseFloat(item.stock) < parseFloat(item.quantity)) {
                errors.push(`"${item.product_name}" only has ${item.stock} in stock (you requested ${item.quantity}).`);
                continue;
            }

            const totalPrice = parseFloat(item.price) * parseFloat(item.quantity);

            // Create order
            const orderResult = await client.query(
                `INSERT INTO orders (customer_id, product_id, quantity, total_price, status)
         VALUES ($1, $2, $3, $4, 'pending') RETURNING id`,
                [customerId, item.product_id, item.quantity, totalPrice]
            );

            orderIds.push(orderResult.rows[0].id);

            // Reduce stock
            await client.query(
                "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
                [item.quantity, item.product_id]
            );
        }

        if (errors.length > 0 && orderIds.length === 0) {
            // All items failed
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, error: errors.join(" ") });
        }

        // Clear cart (only successfully ordered items)
        await client.query("DELETE FROM cart_items WHERE customer_id = $1", [customerId]);

        await client.query("COMMIT");

        // Invalidate caches
        await cacheInvalidatePattern(`cart:${customerId}*`);
        await cacheInvalidatePattern("orders:*");
        await cacheInvalidatePattern("products:*");

        return res.status(201).json({
            success: true,
            message: `${orderIds.length} order(s) placed successfully.`,
            orderIds,
            warnings: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Checkout error:", error.message);
        return res.status(500).json({ success: false, error: "Checkout failed." });
    } finally {
        client.release();
    }
};
