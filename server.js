// server.js

/************************************************************************
 *                           DEPENDENCIES
 ************************************************************************/
import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import axios from "axios";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import https from "https";


/************************************************************************
 *                  LOAD ENVIRONMENT VARIABLES (.env)
 ************************************************************************/
// Load environment variables from a .env file (used in local development)
// On Railway, set these variables using the Railway Dashboard.
dotenv.config();

/************************************************************************
 *                        EXPRESS APP SETUP
 ************************************************************************/
const app = express(); // Create an Express application

// Use the PORT provided by Railway (via process.env.PORT) or default to 3000 for local development.
const port = process.env.PORT || 8080;

/************************************************************************
 *                   FILE PATH HELPERS
 ************************************************************************/
// These helpers determine the current file and directory name,
// which is useful for serving static files.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
/************************************************************************
 *                    SERVE STATIC FILES
 ************************************************************************/
// Serve files from the "public" directory so that assets like HTML, CSS, and JS are accessible.

// Serve files from the "uploads" directory (if uploads are stored outside of "public").
app.use("/uploads", express.static("uploads"));

/************************************************************************
 *                  CONFIGURE BODY PARSING
 ************************************************************************/
// Allow Express to parse JSON and URL-encoded data in incoming requests.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/************************************************************************
 *                     POSTGRESQL CONNECTION
 ************************************************************************/
const { Client } = pg;

// Debug: Log the DATABASE_URL to verify it's being set.
// IMPORTANT: In production on Railway, you must set DATABASE_URL via the Railway Dashboard.
console.log("DATABASE_URL:", process.env.DATABASE_URL);

// Check if DATABASE_URL is defined; if not, log a warning.
if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is undefined. Please set this variable in your Railway project settings."
  );
}

/*
  Create a new PostgreSQL client using the DATABASE_URL from your environment.
  We conditionally set SSL:
    - In production (NODE_ENV === 'production'), if SSL is needed, use { rejectUnauthorized: false }.
    - Otherwise, disable SSL.
  Adjust the SSL settings based on your Railway database requirements.
*/
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Connect to the PostgreSQL database and log the connection status.
db.connect((err) => {
  if (err) {
    console.error("Error connecting to PostgreSQL:", err);
  } else {
    console.log("Connected to PostgreSQL");
  }
});

/************************************************************************
 *                        ROUTES - AUTHENTICATION
 ************************************************************************/
// ----------------- SIGNUP / LOGIN (Farmer) -----------------

// Farmer Signup Route
app.post("/signup", async (req, res) => {
  try {
    const { username, phone, password } = req.body;

    // Validate input fields.
    if (!username || !phone || !password) {
      return res.send(
        `<script>alert("All fields are required."); window.location.href='/signup';</script>`
      );
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.send(
        `<script>alert("Phone number must be exactly 10 digits."); window.location.href='/signup';</script>`
      );
    }
    if (password.length < 6) {
      return res.send(
        `<script>alert("Password must be more than 6 characters."); window.location.href='/signup';</script>`
      );
    }

    // Check if a user with the same phone number already exists.
    const existingUser = await db.query(
      "SELECT * FROM signup WHERE phone_no = $1",
      [phone]
    );
    if (existingUser.rows.length > 0) {
      return res.send(
        `<script>alert("Account already exists."); window.location.href='/signup';</script>`
      );
    }

    // Hash the password before storing it in the database.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user record into the signup table.
    const insertQuery = `
      INSERT INTO signup (username, phone_no, password)
      VALUES ($1, $2, $3);
    `;
    await db.query(insertQuery, [username, phone, hashedPassword]);

    // Send the homepage for farmers after successful signup.
    res.sendFile(path.join(__dirname, "homepage.html"));
  } catch (err) {
    console.error("Signup Error:", err);
    res.send(
      `<script>alert("Something went wrong. Please try again."); window.location.href='/signup';</script>`
    );
  }
});

// Farmer Login Route
app.post("/login", async (req, res) => {
  const { phone, password } = req.body;
  try {
    // Look up the user by phone number.
    const result = await db.query("SELECT * FROM signup WHERE phone_no = $1", [
      phone,
    ]);
    if (result.rows.length === 0) {
      return res.send(`
        <script>
          alert('Account not found');
          window.location.href="/login";
        </script>
      `);
    }
    const user = result.rows[0];
    // Compare the provided password with the stored hashed password.
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      return res.redirect("/home");
    } else {
      return res.send(`
        <script>
          alert('Wrong password');
          window.location.href="/login";
        </script>
      `);
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send("Server error, please try again.");
  }
});

// ----------------- SIGNUP / LOGIN (Customer) -----------------

// Customer Signup Route
app.post("/signupcus", async (req, res) => {
  try {
    const { username, phone, password } = req.body;
    // Validate input fields.
    if (!username || !phone || !password) {
      return res.send(
        `<script>alert("All fields are required."); window.location.href='/signupcus';</script>`
      );
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.send(
        `<script>alert("Phone number must be exactly 10 digits."); window.location.href='/signupcus';</script>`
      );
    }
    if (password.length < 6) {
      return res.send(
        `<script>alert("Password must be more than 6 characters."); window.location.href='/signupcus';</script>`
      );
    }
    // Check if the customer already exists.
    const existingUser = await db.query(
      "SELECT * FROM cus_signup WHERE phone_no = $1",
      [phone]
    );
    if (existingUser.rows.length > 0) {
      return res.send(
        `<script>alert("Account already exists."); window.location.href='/signupcus';</script>`
      );
    }
    // Hash the password for secure storage.
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert new customer details into the cus_signup table.
    const insertQuery = `
      INSERT INTO cus_signup (username, phone_no, password)
      VALUES ($1, $2, $3);
    `;
    await db.query(insertQuery, [username, phone, hashedPassword]);

    // Send the customer homepage after signup.
    res.sendFile(path.join(__dirname, "homepage_cus.html"));
  } catch (err) {
    console.error("Signup Error:", err);
    res.send(
      `<script>alert("Something went wrong. Please try again."); window.location.href='/signupcus';</script>`
    );
  }
});

// Customer Login Route
app.post("/logincus", async (req, res) => {
  const { phone, password } = req.body;
  try {
    // Look up the customer by phone number.
    const result = await db.query(
      "SELECT * FROM cus_signup WHERE phone_no = $1",
      [phone]
    );
    if (result.rows.length === 0) {
      return res.send(`
        <script>
          alert('Account not found');
          window.location.href="/logincus";
        </script>
      `);
    }
    const user = result.rows[0];
    // Compare the provided password with the stored hashed password.
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      return res.redirect("/homecus");
    } else {
      return res.send(`
        <script>
          alert('Wrong password');
          window.location.href="/logincus";
        </script>
      `);
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send("Server error, please try again.");
  }
});

/************************************************************************
 *                FILE UPLOADS & PRODUCT LISTINGS
 ************************************************************************/
const uploadDir = path.join(__dirname, "public","uploads");
// Create the uploads directory if it doesn't exist.
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage for file uploads.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename using the current timestamp.
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Route to insert product data into the "products" table.
app.post("/api/products", upload.single("productImage"), async (req, res) => {
  const {
    productName,
    productPrice,
    productQuantity,
    productQuality,
    productDescription,
    contactNumber,
    priceCurrency,
    quantityUnit,
  } = req.body;
  const imagePath = req.file ? "/uploads/" + req.file.filename : "";

  try {
    // Convert price and quantity to float numbers.
    const parsedPrice = parseFloat(productPrice);
    const parsedQuantity = parseFloat(productQuantity);

    // Validate that the entered price and quantity are within allowed limits.
    const maxAllowedQuantity = 2000;
    const maxAllowedPrice = 20000;

    if (parsedQuantity > maxAllowedQuantity) {
      return res.send(
        `<script>alert("Max allowed quantity: ${maxAllowedQuantity}"); window.location.href='/sell';</script>`
      );
    } else if (parsedPrice > maxAllowedPrice) {
      return res.send(
        `<script>alert("Max allowed price: ₹${maxAllowedPrice}"); window.location.href='/sell';</script>`
      );
    } else {
      // Insert the product into the "products" table.
      const insertQuery = `
        INSERT INTO products
          (product_name, price, quantity, quality, description, contact_number, image, currency, quantity_unit)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `;
      const values = [
        productName,
        parsedPrice,
        parsedQuantity,
        productQuality,
        productDescription,
        contactNumber,
        imagePath,
        priceCurrency,
        quantityUnit,
      ];
      await db.query(insertQuery, values);
      res.redirect("/market");
    }
  } catch (error) {
    console.error("Error inserting product:", error);
    res.status(500).send("Server error");
  }
});

// Route to fetch all products from the "products" table.
app.get("/api/products", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Server error");
  }
});

/************************************************************************
 *                 SYMPTOM PREDICTION / GEMINI AI
 ************************************************************************/
// Route to upload images for symptom prediction.
// Route to upload images for symptom prediction.
app.post("/upload", upload.single("imageInput"), async (req, res) => {
  try {
    // Store just the filename, not full path
    const filePath = `/public/uploads/${req.file.filename}`;

    const query =
      "INSERT INTO predictions (image_path, description, language) VALUES ($1, $2, $3) RETURNING id";
    const values = [filePath, req.body.description, req.body.language];
    const result = await db.query(query, values);
    res.json({ success: true, predictionId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to analyze the uploaded image using Gemini AI.
app.post("/analyze", async (req, res) => {
  try {
    const { predictionId } = req.body;
    const dbResult = await db.query("SELECT * FROM predictions WHERE id = $1", [
      predictionId,
    ]);

    if (dbResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Prediction not found" });
    }

    const record = dbResult.rows[0];
    // Add this before constructing the prompt
    if (!record.image_path) {
      return res.status(400).json({
        success: false,
        error: "Image not found for this prediction",
      });
    }
    // Construct actual image URL from uploaded file
    // In your /analyze route
    const imageUrl = `https://chatty-mugs-shop.loca.lt/uploads/${path.basename(
      record.image_path
    )}`;

    // Improved prompt with actual image URL
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
    // Define the Gemini AI model and construct the API URL using your API key.
    const GEMINI_MODEL = "models/gemini-1.5-pro-002";
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const httpsAgent = new https.Agent({ keepAlive: true });

    // Make a POST request to the Gemini AI API with the constructed prompt.
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
    console.log("Gemini AI Full Response:", geminiResponse);

    if (!geminiResponse.candidates || geminiResponse.candidates.length === 0) {
      throw new Error("No response from Gemini AI.");
    }
    const responseText =
      geminiResponse.candidates[0]?.content?.parts[0]?.text ||
      "No valid response.";

    // Update the prediction record with the details returned by Gemini AI.
    await db.query("UPDATE predictions SET gemini_details = $1 WHERE id = $2", [
      responseText,
      predictionId,
    ]);

    // Send back the AI-generated details in the response.
    res.json({ success: true, data: { details: responseText } });
  } catch (error) {
    console.error("Error in /analyze:", error.message);
    if (error.response) {
      console.error("Response Data:", error.response.data);
      console.error("Response Status:", error.response.status);
    } else if (error.request) {
      console.error("No response received. Request:", error.request);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to fetch a prediction record by ID.
app.get("/prediction/:id", async (req, res) => {
  try {
    const query = "SELECT * FROM predictions WHERE id = $1";
    const values = [req.params.id];
    const result = await db.query(query, values);
    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows[0] });
    } else {
      res.status(404).json({ success: false, error: "Prediction not found" });
    }
  } catch (error) {
    console.error("Error in GET /prediction:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/************************************************************************
 *                         PAGE ROUTES
 ************************************************************************/
// Serve login page.
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "login.html"));
});
app.get("/main-bg", (req, res) => {
  // This will send the image file "logo.png" located in the "images" folder.
  res.sendFile(path.join(__dirname, "public", "images", "hero_grass.jpg"));
});
app.get("/main-bg1", (req, res) => {
  // This will send the image file "logo.png" located in the "images" folder.
  res.sendFile(path.join(__dirname, "public", "images", "hero_grass1.jpg"));
});
// Serve farmer signup page.
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "signUp.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "signUp.html"));
});
// Serve farmer homepage after login/signup.
app.get("/customer", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "images", "customer.jpg"));
});
app.get("/farmer-bg", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "images", "farmer-removebg-preview.png")
  );
});
app.get("/ind_farmer", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "images", "indian_farmer.jpg"));
});
app.get("/ind_farmer1", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "images",  "indian-farmer.avif"));
});
// Serve customer homepage after login/signup.
app.get("/homecus", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "homepage_cus.html"));
});



// Serve selling page for product listings.
app.get("/sell", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "selling.html"));
});

// Serve farmer market page.
app.get("/market", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "farmer-market.html"));
});

// Serve customer market page.
app.get("/marketcus", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "pages", "farmer-market_cus.html")
  );
});

// Serve page listing different types of users.
app.get("/whichusers", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "whichusers.html"));
});

// Serve customer signup page.
app.get("/signupcus", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "signupcus.html"));
});

// Serve customer login page.
app.get("/logincus", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "logincus.html"));
});

// Serve prediction page.
app.get("/predict", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "prediction.html"));
});
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "homepage.html"));
});
// Serve symptom upload page.
app.get("/upload", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "symptom.html"));
});

// Default route: serve the index page.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public","pages", "index.html"));
});
app.get("/favicon.ico", (req, res) => res.status(204).end());

/************************************************************************
 *                        START THE SERVER
 ************************************************************************/
// Start the Express server and listen on the designated port.
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
