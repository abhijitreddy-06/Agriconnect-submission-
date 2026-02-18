-- ============================================================
-- AgriConnect Seed Script
-- Adds category column, delivery_address column, demo farmer, 50 products
-- Safe to re-run: uses IF NOT EXISTS and ON CONFLICT
-- ============================================================

-- Schema migrations
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Demo farmer account (password: demo123)
INSERT INTO users (username, phone_no, password, role)
VALUES ('Demo Farmer', '0000000000', '$2b$10$mpeGbXrbiqSVPDtfKXd5o.pSu5VdvgGRN3LgHWGv/nmrVfEgj2Xku', 'farmer')
ON CONFLICT (phone_no) DO NOTHING;

-- 50 demo products across 8 categories
DO $$
DECLARE
  v_farmer_id INT;
BEGIN
  SELECT id INTO v_farmer_id FROM users WHERE phone_no = '0000000000';
  IF v_farmer_id IS NULL THEN
    RAISE NOTICE 'Demo farmer not found. Skipping products.';
    RETURN;
  END IF;

  -- Skip if products already seeded
  IF (SELECT COUNT(*) FROM products WHERE farmer_id = v_farmer_id) >= 50 THEN
    RAISE NOTICE 'Products already seeded. Skipping.';
    RETURN;
  END IF;

  -- ═══ VEGETABLES (7 products) ═══
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, image, quantity_unit, category) VALUES
  (v_farmer_id, 'Fresh Carrots', 45, 200, 'Premium', 'Organic farm-fresh carrots, naturally sweet and crunchy.', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400', 'kilogram', 'Vegetables'),
  (v_farmer_id, 'Green Spinach', 30, 150, 'Premium', 'Tender baby spinach leaves, packed with iron and vitamins.', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400', 'kilogram', 'Vegetables'),
  (v_farmer_id, 'Red Tomatoes', 35, 300, 'Standard', 'Vine-ripened red tomatoes, perfect for cooking and salads.', 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400', 'kilogram', 'Vegetables'),
  (v_farmer_id, 'Fresh Potatoes', 25, 500, 'Standard', 'Farm-fresh potatoes, ideal for curries, fries and roasting.', 'https://images.unsplash.com/photo-1518977676601-b53f82ber40?w=400', 'kilogram', 'Vegetables'),
  (v_farmer_id, 'Green Capsicum', 60, 100, 'Premium', 'Crisp and fresh green bell peppers for stir-fry and salads.', 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400', 'kilogram', 'Vegetables'),
  (v_farmer_id, 'Fresh Cauliflower', 40, 180, 'Standard', 'White and tender cauliflower heads, locally grown.', 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400', 'kilogram', 'Vegetables'),
  (v_farmer_id, 'Lady Finger (Okra)', 50, 120, 'Premium', 'Tender okra pods, perfect for bhindi masala and frying.', 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=400', 'kilogram', 'Vegetables');

  -- ═══ FRUITS (7 products) ═══
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, image, quantity_unit, category) VALUES
  (v_farmer_id, 'Alphonso Mangoes', 350, 100, 'Premium', 'Sweet and juicy Alphonso mangoes from Ratnagiri farms.', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', 'kilogram', 'Fruits'),
  (v_farmer_id, 'Fresh Bananas', 40, 250, 'Standard', 'Ripe yellow bananas, rich in potassium and natural energy.', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', 'dozen', 'Fruits'),
  (v_farmer_id, 'Pomegranate', 180, 80, 'Premium', 'Ruby-red pomegranates with sweet, juicy arils.', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400', 'kilogram', 'Fruits'),
  (v_farmer_id, 'Green Grapes', 120, 100, 'Standard', 'Seedless green grapes, crisp and refreshing.', 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400', 'kilogram', 'Fruits'),
  (v_farmer_id, 'Fresh Papaya', 55, 150, 'Standard', 'Sweet and ripe papaya, great for breakfast and smoothies.', 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=400', 'kilogram', 'Fruits'),
  (v_farmer_id, 'Watermelon', 30, 200, 'Economy', 'Large juicy watermelons, perfect for summer refreshment.', 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?w=400', 'kilogram', 'Fruits'),
  (v_farmer_id, 'Sweet Oranges', 80, 180, 'Premium', 'Nagpur oranges, naturally sweet and packed with Vitamin C.', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400', 'kilogram', 'Fruits');

  -- ═══ GRAINS & CEREALS (6 products) ═══
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, image, quantity_unit, category) VALUES
  (v_farmer_id, 'Basmati Rice', 150, 300, 'Premium', 'Aged long-grain Basmati rice with aromatic fragrance.', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'kilogram', 'Grains & Cereals'),
  (v_farmer_id, 'Whole Wheat', 45, 400, 'Standard', 'Stone-ground whole wheat grain for fresh chapati flour.', 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', 'kilogram', 'Grains & Cereals'),
  (v_farmer_id, 'Pearl Millet (Bajra)', 38, 200, 'Standard', 'Nutritious bajra grains, perfect for rotis and porridge.', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'kilogram', 'Grains & Cereals'),
  (v_farmer_id, 'Sorghum (Jowar)', 42, 180, 'Economy', 'Gluten-free jowar grain, rich in fiber and minerals.', 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400', 'kilogram', 'Grains & Cereals'),
  (v_farmer_id, 'Finger Millet (Ragi)', 55, 150, 'Premium', 'Calcium-rich ragi grain for healthy dosa and porridge.', 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400', 'kilogram', 'Grains & Cereals'),
  (v_farmer_id, 'Corn (Maize)', 35, 250, 'Standard', 'Fresh dried corn kernels for popcorn and animal feed.', 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400', 'kilogram', 'Grains & Cereals');

  -- ═══ PULSES & LEGUMES (6 products) ═══
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, image, quantity_unit, category) VALUES
  (v_farmer_id, 'Toor Dal', 130, 200, 'Premium', 'Split pigeon peas, essential for sambar and dal fry.', 'https://images.unsplash.com/photo-1612257416648-ee7a6c5f4e4b?w=400', 'kilogram', 'Pulses & Legumes'),
  (v_farmer_id, 'Moong Dal', 110, 180, 'Standard', 'Yellow moong lentils, light and easy to digest.', 'https://images.unsplash.com/photo-1612257416648-ee7a6c5f4e4b?w=400', 'kilogram', 'Pulses & Legumes'),
  (v_farmer_id, 'Chana Dal', 95, 220, 'Standard', 'Split chickpeas, great for dal, sweets and snacks.', 'https://images.unsplash.com/photo-1515543904279-1f5e3e82cf5e?w=400', 'kilogram', 'Pulses & Legumes'),
  (v_farmer_id, 'Black Urad Dal', 120, 150, 'Premium', 'Whole black gram, perfect for dal makhani.', 'https://images.unsplash.com/photo-1612257416648-ee7a6c5f4e4b?w=400', 'kilogram', 'Pulses & Legumes'),
  (v_farmer_id, 'Masoor Dal (Red Lentils)', 100, 200, 'Economy', 'Quick-cooking red lentils for everyday dal.', 'https://images.unsplash.com/photo-1515543904279-1f5e3e82cf5e?w=400', 'kilogram', 'Pulses & Legumes'),
  (v_farmer_id, 'Rajma (Kidney Beans)', 140, 120, 'Premium', 'Dark red kidney beans from Himalayan farms.', 'https://images.unsplash.com/photo-1515543904279-1f5e3e82cf5e?w=400', 'kilogram', 'Pulses & Legumes');

  -- ═══ SPICES (7 products) ═══
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, image, quantity_unit, category) VALUES
  (v_farmer_id, 'Turmeric Powder', 180, 100, 'Premium', 'Pure Lakadong turmeric with high curcumin content.', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400', 'kilogram', 'Spices'),
  (v_farmer_id, 'Red Chilli Powder', 200, 80, 'Premium', 'Guntur red chilli powder, vibrant color and heat.', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'kilogram', 'Spices'),
  (v_farmer_id, 'Cumin Seeds (Jeera)', 250, 60, 'Premium', 'Whole cumin seeds, hand-sorted for purity.', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'kilogram', 'Spices'),
  (v_farmer_id, 'Coriander Seeds', 120, 100, 'Standard', 'Sun-dried coriander seeds for aromatic spice blends.', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'kilogram', 'Spices'),
  (v_farmer_id, 'Black Pepper', 450, 50, 'Premium', 'Malabar black pepper, the king of spices.', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'kilogram', 'Spices'),
  (v_farmer_id, 'Cardamom (Elaichi)', 500, 30, 'Premium', 'Green cardamom pods from Kerala, intensely aromatic.', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'kilogram', 'Spices'),
  (v_farmer_id, 'Mustard Seeds', 90, 120, 'Standard', 'Yellow mustard seeds for pickles, tempering and oil.', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'kilogram', 'Spices');

  -- ═══ DAIRY (6 products) ═══
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, image, quantity_unit, category) VALUES
  (v_farmer_id, 'Fresh Cow Milk', 60, 100, 'Premium', 'Farm-fresh A2 cow milk, delivered daily.', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', 'litre', 'Dairy'),
  (v_farmer_id, 'Pure Desi Ghee', 500, 50, 'Premium', 'Hand-churned desi ghee from grass-fed cow milk.', 'https://images.unsplash.com/photo-1631209121750-a9f656d30097?w=400', 'kilogram', 'Dairy'),
  (v_farmer_id, 'Fresh Paneer', 320, 40, 'Premium', 'Soft and fresh cottage cheese, made from full-cream milk.', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', 'kilogram', 'Dairy'),
  (v_farmer_id, 'Natural Curd (Dahi)', 50, 80, 'Standard', 'Thick and creamy homemade curd, set naturally.', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', 'kilogram', 'Dairy'),
  (v_farmer_id, 'Buffalo Milk', 70, 80, 'Standard', 'Rich and creamy buffalo milk, high in fat content.', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', 'litre', 'Dairy'),
  (v_farmer_id, 'Fresh Buttermilk', 25, 120, 'Economy', 'Refreshing spiced buttermilk (chaas), great for digestion.', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', 'litre', 'Dairy');

  -- ═══ NUTS & SEEDS (5 products) ═══
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, image, quantity_unit, category) VALUES
  (v_farmer_id, 'Raw Cashews', 450, 40, 'Premium', 'Whole W320 cashew nuts from Goa, naturally delicious.', 'https://images.unsplash.com/photo-1563292769-4e05b684851a?w=400', 'kilogram', 'Nuts & Seeds'),
  (v_farmer_id, 'Almonds (Badam)', 500, 35, 'Premium', 'California-style almonds, great for snacking and sweets.', 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400', 'kilogram', 'Nuts & Seeds'),
  (v_farmer_id, 'Groundnuts (Peanuts)', 80, 200, 'Standard', 'Roasted groundnuts, a protein-packed healthy snack.', 'https://images.unsplash.com/photo-1567575990843-bca521f3f1e0?w=400', 'kilogram', 'Nuts & Seeds'),
  (v_farmer_id, 'Flax Seeds (Alsi)', 200, 60, 'Premium', 'Omega-3 rich flax seeds for smoothies and health drinks.', 'https://images.unsplash.com/photo-1604244042498-4e09fa2fa4b1?w=400', 'kilogram', 'Nuts & Seeds'),
  (v_farmer_id, 'Sesame Seeds (Til)', 160, 80, 'Standard', 'White sesame seeds for laddu, chutney and oil extraction.', 'https://images.unsplash.com/photo-1604244042498-4e09fa2fa4b1?w=400', 'kilogram', 'Nuts & Seeds');

  -- ═══ ORGANIC (6 products) ═══
  INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, image, quantity_unit, category) VALUES
  (v_farmer_id, 'Organic Brown Rice', 120, 100, 'Premium', 'Unpolished organic brown rice, rich in fiber and nutrients.', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'kilogram', 'Organic'),
  (v_farmer_id, 'Organic Honey', 350, 50, 'Premium', 'Raw and unprocessed wildflower honey from forest beekeepers.', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400', 'kilogram', 'Organic'),
  (v_farmer_id, 'Organic Jaggery', 80, 150, 'Standard', 'Chemical-free jaggery made from organic sugarcane.', 'https://images.unsplash.com/photo-1604244042498-4e09fa2fa4b1?w=400', 'kilogram', 'Organic'),
  (v_farmer_id, 'Organic Coconut Oil', 250, 60, 'Premium', 'Cold-pressed virgin coconut oil, multi-purpose use.', 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400', 'litre', 'Organic'),
  (v_farmer_id, 'Organic Green Tea', 400, 30, 'Premium', 'Hand-picked organic green tea leaves from Darjeeling.', 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=400', 'kilogram', 'Organic'),
  (v_farmer_id, 'Organic Moringa Powder', 300, 40, 'Premium', 'Nutrient-dense moringa leaf powder, a superfood.', 'https://images.unsplash.com/photo-1604244042498-4e09fa2fa4b1?w=400', 'kilogram', 'Organic');

  RAISE NOTICE 'Successfully inserted 50 demo products.';
END $$;
