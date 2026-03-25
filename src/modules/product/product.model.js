import pool from "../../config/database.js";

export const create = async (farmerId, data, imagePath) => {
  const result = await pool.query(
    `INSERT INTO products (
        farmer_id, product_name, price, quantity, quality, description, image,
        quantity_unit, category, is_organic, is_eco_certified, latitude, longitude, farm_region
      )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING id`,
    [
      farmerId,
      data.product_name,
      data.price,
      data.quantity,
      data.quality || "",
      data.description || "",
      imagePath,
      data.quantity_unit || "",
      data.category || "",
      Boolean(data.is_organic),
      Boolean(data.is_eco_certified),
      data.latitude,
      data.longitude,
      data.farm_region || null,
    ]
  );
  return result.rows[0];
};

export const findAll = async ({ conditions, params }) => {
  const whereClause = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

  const dataQuery = `
    SELECT p.*, u.phone_no AS contact_number, u.username AS farmer_name,
           COALESCE(pr.avg_rating, 0) AS product_avg_rating,
           COALESCE(pr.total_reviews, 0) AS product_total_reviews,
           COALESCE(fr.avg_rating, 0) AS farmer_avg_rating,
           COALESCE(fr.total_reviews, 0) AS farmer_total_reviews
    FROM products p
    LEFT JOIN users u ON p.farmer_id = u.id
    LEFT JOIN (
      SELECT product_id, AVG(rating)::numeric(10,2) AS avg_rating, COUNT(*) AS total_reviews
      FROM reviews
      GROUP BY product_id
    ) pr ON pr.product_id = p.id
    LEFT JOIN (
      SELECT farmer_id, AVG(rating)::numeric(10,2) AS avg_rating, COUNT(*) AS total_reviews
      FROM farmer_reviews
      GROUP BY farmer_id
    ) fr ON fr.farmer_id = p.farmer_id
    ${whereClause}
    ORDER BY p.id DESC
  `;

  const result = await pool.query(dataQuery, params);
  return result.rows;
};

export const findById = async (id) => {
  const result = await pool.query(
    `SELECT p.id, p.farmer_id, p.product_name, p.price, p.quantity, p.quality,
            p.description, p.image, p.quantity_unit, p.category,
            p.is_organic, p.is_eco_certified, p.latitude, p.longitude, p.farm_region,
            u.username AS farmer_name, u.phone_no AS contact_number,
            COALESCE(pr.avg_rating, 0) AS product_avg_rating,
            COALESCE(pr.total_reviews, 0) AS product_total_reviews,
            COALESCE(fr.avg_rating, 0) AS farmer_avg_rating,
            COALESCE(fr.total_reviews, 0) AS farmer_total_reviews
     FROM products p
     LEFT JOIN users u ON p.farmer_id = u.id
     LEFT JOIN (
       SELECT product_id, AVG(rating)::numeric(10,2) AS avg_rating, COUNT(*) AS total_reviews
       FROM reviews
       GROUP BY product_id
     ) pr ON pr.product_id = p.id
     LEFT JOIN (
       SELECT farmer_id, AVG(rating)::numeric(10,2) AS avg_rating, COUNT(*) AS total_reviews
       FROM farmer_reviews
       GROUP BY farmer_id
     ) fr ON fr.farmer_id = p.farmer_id
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
        category = COALESCE($7, category),
        is_organic = COALESCE($8, is_organic),
        is_eco_certified = COALESCE($9, is_eco_certified),
        latitude = COALESCE($10, latitude),
        longitude = COALESCE($11, longitude),
        farm_region = COALESCE($12, farm_region)
        ${imageUrl !== undefined ? ", image = $14" : ""}
    WHERE id = $13
  `;

  const params = [
    data.product_name,
    data.price,
    data.quantity,
    data.quality,
    data.description,
    data.quantity_unit,
    data.category,
    data.is_organic,
    data.is_eco_certified,
    data.latitude,
    data.longitude,
    data.farm_region,
    productId,
  ];
  if (imageUrl !== undefined) params.push(imageUrl);

  await pool.query(updateQuery, params);
};

export const remove = async (id) => {
  await pool.query("DELETE FROM products WHERE id = $1", [id]);
};

export const findCustomersAlsoBought = async (productId, limit) => {
  const result = await pool.query(
    `WITH buyers AS (
       SELECT DISTINCT customer_id
       FROM orders
       WHERE product_id = $1
     )
     SELECT p.*, u.phone_no AS contact_number, u.username AS farmer_name,
            COALESCE(pr.avg_rating, 0) AS product_avg_rating,
            COALESCE(pr.total_reviews, 0) AS product_total_reviews,
            COALESCE(fr.avg_rating, 0) AS farmer_avg_rating,
            COALESCE(fr.total_reviews, 0) AS farmer_total_reviews,
            COUNT(o.id) AS recommendation_score
     FROM orders o
     JOIN products p ON p.id = o.product_id
     JOIN buyers b ON b.customer_id = o.customer_id
     LEFT JOIN users u ON p.farmer_id = u.id
     LEFT JOIN (
       SELECT product_id, AVG(rating)::numeric(10,2) AS avg_rating, COUNT(*) AS total_reviews
       FROM reviews GROUP BY product_id
     ) pr ON pr.product_id = p.id
     LEFT JOIN (
       SELECT farmer_id, AVG(rating)::numeric(10,2) AS avg_rating, COUNT(*) AS total_reviews
       FROM farmer_reviews GROUP BY farmer_id
     ) fr ON fr.farmer_id = p.farmer_id
     WHERE o.product_id <> $1
     GROUP BY p.id, u.phone_no, u.username, pr.avg_rating, pr.total_reviews, fr.avg_rating, fr.total_reviews
     ORDER BY recommendation_score DESC, p.id DESC
     LIMIT $2`,
    [productId, limit]
  );

  return result.rows;
};

export const findSeasonalSuggestions = async (limit) => {
  const month = new Date().getMonth() + 1;
  const seasonalCategoriesByMonth = {
    1: ["Vegetables", "Fruits", "Dairy"],
    2: ["Vegetables", "Fruits", "Spices"],
    3: ["Vegetables", "Grains & Cereals", "Pulses & Legumes"],
    4: ["Vegetables", "Fruits", "Nuts & Seeds"],
    5: ["Fruits", "Spices", "Nuts & Seeds"],
    6: ["Vegetables", "Pulses & Legumes", "Grains & Cereals"],
    7: ["Vegetables", "Pulses & Legumes", "Organic"],
    8: ["Vegetables", "Dairy", "Organic"],
    9: ["Fruits", "Spices", "Organic"],
    10: ["Vegetables", "Fruits", "Grains & Cereals"],
    11: ["Vegetables", "Fruits", "Pulses & Legumes"],
    12: ["Vegetables", "Fruits", "Dairy"],
  };

  const categories = seasonalCategoriesByMonth[month] || ["Vegetables", "Fruits"];
  const result = await pool.query(
    `SELECT p.*, u.phone_no AS contact_number, u.username AS farmer_name,
            COALESCE(pr.avg_rating, 0) AS product_avg_rating,
            COALESCE(pr.total_reviews, 0) AS product_total_reviews,
            COALESCE(fr.avg_rating, 0) AS farmer_avg_rating,
            COALESCE(fr.total_reviews, 0) AS farmer_total_reviews
     FROM products p
     LEFT JOIN users u ON p.farmer_id = u.id
     LEFT JOIN (
       SELECT product_id, AVG(rating)::numeric(10,2) AS avg_rating, COUNT(*) AS total_reviews
       FROM reviews GROUP BY product_id
     ) pr ON pr.product_id = p.id
     LEFT JOIN (
       SELECT farmer_id, AVG(rating)::numeric(10,2) AS avg_rating, COUNT(*) AS total_reviews
       FROM farmer_reviews GROUP BY farmer_id
     ) fr ON fr.farmer_id = p.farmer_id
     WHERE p.category = ANY($1)
     ORDER BY p.is_organic DESC, p.id DESC
     LIMIT $2`,
    [categories, limit]
  );

  return result.rows;
};
