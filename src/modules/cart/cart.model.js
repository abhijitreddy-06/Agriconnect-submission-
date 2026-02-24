import pool from "../../config/database.js";

export const getClient = async () => pool.connect();

export const findProduct = async (productId) => {
  const result = await pool.query(
    "SELECT id, quantity AS stock, farmer_id FROM products WHERE id = $1",
    [productId]
  );
  return result.rows[0] || null;
};

export const upsertCartItem = async (customerId, productId, quantity) => {
  const result = await pool.query(
    `INSERT INTO cart_items (customer_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (customer_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + $3
     RETURNING id, quantity`,
    [customerId, productId, quantity]
  );
  return result.rows[0];
};

export const findCartItems = async (customerId) => {
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
  return result.rows;
};

export const findCartItem = async (cartItemId, customerId) => {
  const result = await pool.query(
    "SELECT id FROM cart_items WHERE id = $1 AND customer_id = $2",
    [cartItemId, customerId]
  );
  return result.rows[0] || null;
};

export const updateQuantity = async (cartItemId, quantity) => {
  await pool.query("UPDATE cart_items SET quantity = $1 WHERE id = $2", [quantity, cartItemId]);
};

export const removeItem = async (cartItemId, customerId) => {
  const result = await pool.query(
    "DELETE FROM cart_items WHERE id = $1 AND customer_id = $2 RETURNING id",
    [cartItemId, customerId]
  );
  return result.rows[0] || null;
};

export const clearAll = async (customerId) => {
  await pool.query("DELETE FROM cart_items WHERE customer_id = $1", [customerId]);
};

export const findCartItemsForCheckout = async (client, customerId) => {
  const result = await client.query(
    `SELECT ci.id, ci.product_id, ci.quantity,
       p.price, p.quantity AS stock, p.product_name, p.farmer_id
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.customer_id = $1
     FOR UPDATE`,
    [customerId]
  );
  return result.rows;
};

export const createOrder = async (client, customerId, productId, quantity, totalPrice, deliveryAddress) => {
  const result = await client.query(
    `INSERT INTO orders (customer_id, product_id, quantity, total_price, status, delivery_address)
     VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING id`,
    [customerId, productId, quantity, totalPrice, deliveryAddress || null]
  );
  return result.rows[0];
};

export const reduceStock = async (client, productId, quantity) => {
  await client.query(
    "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
    [quantity, productId]
  );
};

export const clearCartForUser = async (client, customerId) => {
  await client.query("DELETE FROM cart_items WHERE customer_id = $1", [customerId]);
};
