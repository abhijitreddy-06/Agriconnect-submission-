import path from "path";
import axios from "axios";
import https from "https";
import pool from "../config/database.js";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image uploaded." });
    }

    const farmerId = req.user.userId;
    const filePath = `/public/uploads/${req.file.filename}`;
    const { description, language } = req.body;

    const query =
      "INSERT INTO predictions (farmer_id, image_path, description, language, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING id";
    const values = [farmerId, filePath, description || "", language || ""];
    const result = await pool.query(query, values);
    res.json({ success: true, predictionId: result.rows[0].id });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ success: false, error: "Failed to upload image." });
  }
};

export const analyzeImage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { predictionId } = req.body;

    if (!predictionId) {
      return res
        .status(400)
        .json({ success: false, error: "Prediction ID is required." });
    }

    const dbResult = await pool.query(
      "SELECT * FROM predictions WHERE id = $1",
      [predictionId]
    );

    if (dbResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Prediction not found." });
    }

    const record = dbResult.rows[0];

    // Verify farmer owns this prediction
    if (record.farmer_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to analyze this prediction.",
      });
    }

    if (!record.image_path) {
      return res.status(400).json({
        success: false,
        error: "Image not found for this prediction.",
      });
    }

    const baseUrl =
      process.env.BASE_URL || `http://localhost:${process.env.PORT || 8080}`;
    const imageUrl = `${baseUrl}/uploads/${path.basename(record.image_path)}`;

    const prompt = `
**Plant Health Analysis Request**

Analyze this plant health issue based on:
- Image Observation: ${imageUrl}
- User Description (${record.language}): ${record.description}

Provide structured response in ${record.language} with:

### 🌿 Recommended Organic Treatments
1. [Primary solution using common ingredients]
2. [Alternative approach with household items]
3. [Preventative measures]

### 🔬 Probable Causes
- Likely pathogen type (fungal/bacterial/viral)
- Common environmental contributors
- Typical transmission vectors

### 📝 Management Plan
Step-by-step technical guidance covering:
1. Immediate containment measures
2. Long-term prevention strategies
3. Soil/foliage treatment options
4. Beneficial companion plants

**Format Requirements:**
- Use clear markdown formatting
- Include measurement units
- Bold key scientific terms
- Focus on cost-effective solutions
`;

    // Update status to analyzing
    await pool.query(
      "UPDATE predictions SET status = $1 WHERE id = $2",
      ["analyzing", predictionId]
    );

    const geminiModel =
      process.env.GEMINI_MODEL || "models/gemini-1.5-pro-002";
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const httpsAgent = new https.Agent({ keepAlive: true });

    const response = await axios.post(
      geminiApiUrl,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
        httpsAgent,
      }
    );

    const geminiResponse = response.data;

    if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
      throw new Error("No response from Gemini AI.");
    }

    const responseText =
      geminiResponse.candidates[0]?.content?.parts[0]?.text ||
      "No valid response.";

    // Update prediction with status and details
    await pool.query(
      "UPDATE predictions SET gemini_details = $1, status = $2 WHERE id = $3",
      [responseText, "complete", predictionId]
    );

    res.json({ success: true, data: { details: responseText } });
  } catch (error) {
    // Update status to failed if error occurs
    if (error.message && predictionId) {
      await pool
        .query("UPDATE predictions SET status = $1 WHERE id = $2", [
          "failed",
          predictionId,
        ])
        .catch(() => {});
    }

    console.error("Error in /analyze:", error.message);
    if (error.response) {
      console.error("API response status:", error.response.status);
    }
    res
      .status(500)
      .json({ success: false, error: "Analysis failed. Please try again." });
  }
};

export const getPrediction = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM predictions WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows[0] });
    } else {
      res
        .status(404)
        .json({ success: false, error: "Prediction not found." });
    }
  } catch (error) {
    console.error("Error in GET /prediction:", error.message);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch prediction." });
  }
};
