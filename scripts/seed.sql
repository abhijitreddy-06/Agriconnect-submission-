-- ============================================================
-- AgriConnect Seed Script
-- Run this once against your Supabase PostgreSQL database.
-- Safe to re-run (idempotent).
-- ============================================================

-- 1. Schema migrations
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- 2. Demo farmer account (password: demo123)
INSERT INTO users (username, phone_no, password, role)
VALUES (
  'Demo Farmer',
  '0000000000',
  '$2b$10$mpeGbXrbiqSVPDtfKXd5o.pSu5VdvgGRN3LgHWGv/nmrVfEgj2Xku',
  'farmer'
)
ON CONFLICT (phone_no) DO NOTHING;

-- 3. 50 demo products (only inserts if demo farmer has no products yet)
DO $$
DECLARE
  farmer INT;
BEGIN
  SELECT id INTO farmer FROM users WHERE phone_no = '0000000000';
  IF farmer IS NULL THEN
    RAISE NOTICE 'Demo farmer not found, skipping products.';
    RETURN;
  END IF;

  -- Skip if products already seeded
  IF EXISTS (SELECT 1 FROM products WHERE farmer_id = farmer LIMIT 1) THEN
    RAISE NOTICE 'Demo products already exist, skipping.';
    RETURN;
  END IF;

  -- Vegetables (7)
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, quantity_unit, category) VALUES
    (farmer, 'Fresh Tomatoes', 40, 200, 'Premium', 'Vine-ripened red tomatoes, perfect for curries and salads', 'kilogram', 'Vegetables'),
    (farmer, 'Potatoes', 25, 500, 'Standard', 'Farm-fresh potatoes ideal for everyday cooking', 'kilogram', 'Vegetables'),
    (farmer, 'Red Onions', 35, 300, 'Premium', 'Crisp red onions with strong flavor, freshly harvested', 'kilogram', 'Vegetables'),
    (farmer, 'Green Chili', 60, 50, 'Standard', 'Spicy green chilies for authentic Indian dishes', 'kilogram', 'Vegetables'),
    (farmer, 'Cauliflower', 30, 150, 'Standard', 'Fresh white cauliflower heads, organically grown', 'kilogram', 'Vegetables'),
    (farmer, 'Spinach Bundle', 20, 100, 'Economy', 'Leafy green spinach bundles, rich in iron', 'kilogram', 'Vegetables'),
    (farmer, 'Brinjal', 35, 120, 'Standard', 'Purple brinjal perfect for bhartha and curries', 'kilogram', 'Vegetables');

  -- Fruits (7)
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, quantity_unit, category) VALUES
    (farmer, 'Alphonso Mangoes', 350, 80, 'Premium', 'Sweet Alphonso mangoes from Ratnagiri, export quality', 'kilogram', 'Fruits'),
    (farmer, 'Bananas', 40, 200, 'Standard', 'Ripe yellow bananas rich in potassium, farm fresh', 'kilogram', 'Fruits'),
    (farmer, 'Kashmir Apples', 180, 100, 'Premium', 'Crisp red apples from Kashmir valley orchards', 'kilogram', 'Fruits'),
    (farmer, 'Papaya', 45, 80, 'Standard', 'Ripe papaya great for breakfast and smoothies', 'kilogram', 'Fruits'),
    (farmer, 'Guava', 60, 90, 'Standard', 'Sweet pink guavas packed with Vitamin C', 'kilogram', 'Fruits'),
    (farmer, 'Pomegranate', 150, 70, 'Premium', 'Ruby red pomegranates with juicy sweet arils', 'kilogram', 'Fruits'),
    (farmer, 'Watermelon', 25, 150, 'Economy', 'Large sweet watermelons perfect for summer', 'kilogram', 'Fruits');

  -- Grains & Cereals (6)
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, quantity_unit, category) VALUES
    (farmer, 'Basmati Rice', 120, 300, 'Premium', 'Long-grain aromatic basmati rice from Punjab fields', 'kilogram', 'Grains & Cereals'),
    (farmer, 'Wheat Grain', 35, 500, 'Standard', 'Whole wheat grains for fresh flour and chapati', 'kilogram', 'Grains & Cereals'),
    (farmer, 'Maize Corn', 30, 200, 'Standard', 'Yellow maize kernels for feed and cooking', 'kilogram', 'Grains & Cereals'),
    (farmer, 'Jowar (Sorghum)', 45, 150, 'Standard', 'Nutritious jowar millets for rotis and porridge', 'kilogram', 'Grains & Cereals'),
    (farmer, 'Ragi (Finger Millet)', 55, 100, 'Premium', 'Calcium-rich ragi for health-conscious families', 'kilogram', 'Grains & Cereals'),
    (farmer, 'Brown Rice', 90, 120, 'Premium', 'Unpolished brown rice with high fiber content', 'kilogram', 'Grains & Cereals');

  -- Pulses & Legumes (6)
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, quantity_unit, category) VALUES
    (farmer, 'Toor Dal', 130, 200, 'Premium', 'Split pigeon peas for classic Indian dal recipes', 'kilogram', 'Pulses & Legumes'),
    (farmer, 'Moong Dal', 110, 180, 'Standard', 'Yellow moong dal, easy to digest and nutritious', 'kilogram', 'Pulses & Legumes'),
    (farmer, 'Chana Dal', 85, 250, 'Standard', 'Split chickpeas for dal fry and chana dishes', 'kilogram', 'Pulses & Legumes'),
    (farmer, 'Masoor Dal', 95, 200, 'Standard', 'Red lentils that cook quickly, great for soups', 'kilogram', 'Pulses & Legumes'),
    (farmer, 'Urad Dal', 120, 150, 'Premium', 'Black gram dal for idli batter and dal makhani', 'kilogram', 'Pulses & Legumes'),
    (farmer, 'Rajma (Kidney Beans)', 140, 100, 'Premium', 'Dark red kidney beans for Rajma Chawal', 'kilogram', 'Pulses & Legumes');

  -- Spices (6)
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, quantity_unit, category) VALUES
    (farmer, 'Turmeric Powder', 180, 50, 'Premium', 'Pure haldi powder with high curcumin content', 'gram', 'Spices'),
    (farmer, 'Red Chili Powder', 200, 40, 'Standard', 'Hot red chili powder for authentic spice flavor', 'gram', 'Spices'),
    (farmer, 'Cumin Seeds', 250, 30, 'Premium', 'Whole cumin seeds with rich earthy aroma', 'gram', 'Spices'),
    (farmer, 'Coriander Seeds', 150, 45, 'Standard', 'Dried coriander seeds for tempering and powder', 'gram', 'Spices'),
    (farmer, 'Black Pepper', 450, 20, 'Premium', 'Whole black peppercorns from Malabar region', 'gram', 'Spices'),
    (farmer, 'Green Cardamom', 500, 15, 'Premium', 'Fragrant green cardamom pods for sweets and chai', 'gram', 'Spices');

  -- Dairy (6)
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, quantity_unit, category) VALUES
    (farmer, 'Fresh Cow Milk', 60, 100, 'Premium', 'Pure cow milk delivered fresh from the dairy farm', 'kilogram', 'Dairy'),
    (farmer, 'Paneer', 320, 40, 'Premium', 'Fresh cottage cheese made from full cream milk', 'kilogram', 'Dairy'),
    (farmer, 'Curd (Dahi)', 50, 80, 'Standard', 'Thick set curd made from whole milk', 'kilogram', 'Dairy'),
    (farmer, 'Pure Ghee', 500, 30, 'Premium', 'Traditional hand-churned desi ghee from cow milk', 'kilogram', 'Dairy'),
    (farmer, 'Fresh Butter', 450, 25, 'Premium', 'Creamy white butter made from fresh cream', 'kilogram', 'Dairy'),
    (farmer, 'Buttermilk', 30, 60, 'Economy', 'Refreshing spiced buttermilk for hot summer days', 'kilogram', 'Dairy');

  -- Nuts & Seeds (6)
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, quantity_unit, category) VALUES
    (farmer, 'Almonds', 450, 30, 'Premium', 'California-style almonds, great for snacking', 'gram', 'Nuts & Seeds'),
    (farmer, 'Cashew Nuts', 400, 35, 'Premium', 'Whole cashews from Goa, perfectly roasted', 'gram', 'Nuts & Seeds'),
    (farmer, 'Peanuts', 80, 100, 'Standard', 'Raw groundnuts for snacking and cooking oil', 'kilogram', 'Nuts & Seeds'),
    (farmer, 'Sunflower Seeds', 200, 25, 'Standard', 'Hulled sunflower seeds rich in Vitamin E', 'gram', 'Nuts & Seeds'),
    (farmer, 'Flax Seeds', 180, 20, 'Premium', 'Omega-3 rich flax seeds for healthy diet', 'gram', 'Nuts & Seeds'),
    (farmer, 'Walnuts', 500, 20, 'Premium', 'Kashmir walnuts with rich buttery taste', 'gram', 'Nuts & Seeds');

  -- Organic (6)
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, quantity_unit, category) VALUES
    (farmer, 'Organic Tomatoes', 70, 80, 'Premium', 'Certified organic tomatoes grown without pesticides', 'kilogram', 'Organic'),
    (farmer, 'Organic Brown Rice', 140, 100, 'Premium', 'Pesticide-free brown rice from organic farms', 'kilogram', 'Organic'),
    (farmer, 'Organic Turmeric', 280, 30, 'Premium', 'Chemical-free turmeric root powder with high purity', 'gram', 'Organic'),
    (farmer, 'Organic Honey', 350, 40, 'Premium', 'Raw unprocessed honey from wild bee colonies', 'kilogram', 'Organic'),
    (farmer, 'Organic Jaggery', 100, 60, 'Standard', 'Natural sugarcane jaggery without chemicals', 'kilogram', 'Organic'),
    (farmer, 'Organic Amla', 120, 50, 'Premium', 'Fresh Indian gooseberry rich in Vitamin C', 'kilogram', 'Organic');

  RAISE NOTICE 'Seeded 50 demo products successfully.';
END $$;
