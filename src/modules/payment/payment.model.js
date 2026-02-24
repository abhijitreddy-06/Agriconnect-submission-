import pool from "../../config/database.js";

export const getClient = async () => pool.connect();

export const findCartItemsForPayment = async (customerId) => {
  const result = await pool.query(
    `SELECT ci.id, ci.product_id, ci.quantity,
       p.price, p.quantity AS stock, p.product_name, p.farmer_id
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.customer_id = $1`,
    [customerId]
  );
  return result.rows;
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

export const createOrder = async (client, customerId, productId, quantity, totalPrice, deliveryAddress, razorpayOrderId, razorpayPaymentId) => {
  const result = await client.query(
    `INSERT INTO orders (customer_id, product_id, quantity, total_price, status, delivery_address, razorpay_order_id, razorpay_payment_id, payment_status)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, 'paid') RETURNING id`,
    [customerId, productId, quantity, totalPrice, deliveryAddress || null, razorpayOrderId, razorpayPaymentId]
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

export const findOrdersByRazorpayOrderId = async (razorpayOrderId) => {
  const result = await pool.query(
    "SELECT id, payment_status FROM orders WHERE razorpay_order_id = $1",
    [razorpayOrderId]
  );
  return result.rows;
};

export const updatePaymentStatus = async (razorpayOrderId, status, razorpayPaymentId) => {
  await pool.query(
    `UPDATE orders SET payment_status = $1, razorpay_payment_id = COALESCE($2, razorpay_payment_id)
     WHERE razorpay_order_id = $3`,
    [status, razorpayPaymentId, razorpayOrderId]
  );
};
