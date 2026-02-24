import pool from "../../config/database.js";

export const findOrderParticipants = async (orderId) => {
  const result = await pool.query(
    `SELECT o.id, o.customer_id, o.status, p.farmer_id
     FROM orders o JOIN products p ON o.product_id = p.id
     WHERE o.id = $1`,
    [orderId]
  );
  return result.rows[0] || null;
};

export const findMessages = async (orderId) => {
  const result = await pool.query(
    `SELECT cm.id, cm.order_id, cm.sender_id, cm.sender_role, cm.message, cm.created_at,
            u.username AS sender_name
     FROM chat_messages cm
     JOIN users u ON cm.sender_id = u.id
     WHERE cm.order_id = $1
     ORDER BY cm.created_at ASC`,
    [orderId]
  );
  return result.rows;
};

export const findChatInfo = async (orderId) => {
  const result = await pool.query(
    `SELECT o.id, o.customer_id, o.status, p.farmer_id, p.product_name,
            uc.username AS customer_name, uf.username AS farmer_name
     FROM orders o
     JOIN products p ON o.product_id = p.id
     JOIN users uc ON o.customer_id = uc.id
     JOIN users uf ON p.farmer_id = uf.id
     WHERE o.id = $1`,
    [orderId]
  );
  return result.rows[0] || null;
};
