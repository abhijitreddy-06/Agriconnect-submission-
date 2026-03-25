import pool from "../../config/database.js";

export const create = async (farmerId, data, imagePath) => {
  const result = await pool.query(
    `INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, image, quantity_unit, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [farmerId, data.product_name, data.price, data.quantity, data.quality || "", data.description || "", imagePath, data.quantity_unit || "", data.category || ""]
  );
  return result.rows[0];
};

export const findAll = async ({ conditions, params, limit, offset }) => {
  const whereClause = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM products p${whereClause}`,
    params.slice()
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit, offset);
  const dataQuery = `SELECT p.*, u.phone_no AS contact_number, u.username AS farmer_name FROM products p LEFT JOIN users u ON p.farmer_id = u.id${whereClause} ORDER BY p.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const result = await pool.query(dataQuery, params);

  return { rows: result.rows, total };
};

export const findById = async (id) => {
  const result = await pool.query(
    `SELECT p.id, p.farmer_id, p.product_name, p.price, p.quantity, p.quality,
            p.description, p.image, p.quantity_unit, p.category,
            u.username AS farmer_name, u.phone_no AS contact_number
     FROM products p
     LEFT JOIN users u ON p.farmer_id = u.id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const update = async (productId, data, imageUrl) => {
  const updateQuery = `
    UPDATE products
    SET product_name = COALESCE($1, product_name),
        price = COALESCE($2, price),
        quantity = COALESCE($3, quantity),
        quality = COALESCE($4, quality),
        description = COALESCE($5, description),
        quantity_unit = COALESCE($6, quantity_unit),
        category = COALESCE($7, category)
        ${imageUrl !== undefined ? ", image = $9" : ""}
    WHERE id = $8
  `;

  const params = [data.product_name, data.price, data.quantity, data.quality, data.description, data.quantity_unit, data.category, productId];
  if (imageUrl !== undefined) params.push(imageUrl);

  await pool.query(updateQuery, params);
};

export const remove = async (id) => {
  await pool.query("DELETE FROM products WHERE id = $1", [id]);
};
