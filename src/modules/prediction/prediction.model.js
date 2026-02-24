import pool from "../../config/database.js";

export const createPrediction = async (farmerId, desc, lang) => {
  const result = await pool.query(
    "INSERT INTO predictions (farmer_id, image_path, description, language, status) VALUES ($1, $2, $3, $4, 'analyzing') RETURNING id",
    [farmerId, "", desc, lang]
  );
  return result.rows[0];
};

export const updateResult = async (predictionId, result, status) => {
  await pool.query(
    "UPDATE predictions SET prediction_result = $1, status = $2 WHERE id = $3",
    [result, status, predictionId]
  );
};

export const markFailed = async (predictionId) => {
  await pool.query(
    "UPDATE predictions SET status = $1 WHERE id = $2",
    ["failed", predictionId]
  ).catch(() => {});
};

export const findById = async (predictionId) => {
  const result = await pool.query(
    "SELECT * FROM predictions WHERE id = $1",
    [predictionId]
  );
  return result.rows[0] || null;
};
