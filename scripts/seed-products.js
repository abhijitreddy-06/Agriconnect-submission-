/**
 * Seed Script: Add 50 demo products per category with images.
 *
 * Usage:  node scripts/seed-products.js
 *
 * - Creates a demo farmer account (phone: 9999999999, password: demo1234)
 * - Downloads placeholder images from picsum.photos
 * - Uploads them to Supabase Storage
 * - Inserts 50 products × 8 categories = 400 products
 */

import "dotenv/config";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import bcrypt from "bcrypt";

const { Pool } = pg;

// ─── Config ─────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BUCKET = process.env.SUPABASE_BUCKET || "product-images";

const DEMO_FARMER = {
  username: "DemoFarmer",
  phone: "9999999999",
  password: "demo1234",
  role: "farmer",
};

// ─── Product Data (50 per category) ─────────────────────────────
const CATEGORIES = {
  Vegetables: {
    unit: "kilogram",
    priceRange: [15, 180],
    qualities: ["Premium", "Standard", "Economy"],
    items: [
      { name: "Fresh Tomatoes", desc: "Juicy red tomatoes, farm-fresh and naturally ripened" },
      { name: "Potatoes", desc: "Clean sorted potatoes, ideal for everyday cooking" },
      { name: "Onions", desc: "Firm red onions with strong flavor" },
      { name: "Carrots", desc: "Crunchy orange carrots, rich in beta-carotene" },
      { name: "Broccoli", desc: "Fresh green broccoli florets, packed with nutrients" },
      { name: "Cauliflower", desc: "White cauliflower heads, tightly packed and fresh" },
      { name: "Fresh Spinach", desc: "Tender baby spinach leaves, organically grown" },
      { name: "Green Cabbage", desc: "Firm crisp cabbage, great for salads and stir-fry" },
      { name: "Bell Peppers Mix", desc: "Colorful bell peppers - red, yellow, and green" },
      { name: "Cucumbers", desc: "Cool crisp cucumbers, freshly harvested" },
      { name: "Iceberg Lettuce", desc: "Crispy fresh lettuce heads for salads" },
      { name: "Eggplant", desc: "Glossy purple eggplant, firm and fresh" },
      { name: "Zucchini", desc: "Tender green zucchini, versatile cooking vegetable" },
      { name: "French Beans", desc: "Crunchy green beans, hand-picked and sorted" },
      { name: "Green Peas", desc: "Sweet fresh green peas in pods" },
      { name: "Sweet Corn", desc: "Golden sweet corn cobs, farm fresh" },
      { name: "White Radish", desc: "Crisp white radish, pungent and nutritious" },
      { name: "Beetroot", desc: "Deep red beetroot, earthy and sweet" },
      { name: "Celery Sticks", desc: "Fresh crisp celery, great for salads and juice" },
      { name: "Asparagus Bundle", desc: "Tender green asparagus spears" },
      { name: "Kale Bunch", desc: "Dark leafy kale, superfood for health" },
      { name: "Brussels Sprouts", desc: "Mini cabbage-like sprouts, nutty when roasted" },
      { name: "Sweet Potatoes", desc: "Orange-fleshed sweet potatoes, naturally sweet" },
      { name: "Turnips", desc: "Fresh purple-top turnips, mild flavor" },
      { name: "Button Mushrooms", desc: "White button mushrooms, clean and ready to cook" },
      { name: "Fresh Garlic", desc: "Plump garlic bulbs with strong aroma" },
      { name: "Ginger Root", desc: "Fresh ginger root, aromatic and spicy" },
      { name: "Green Chillies", desc: "Hot green chillies, adds spice to any dish" },
      { name: "Red Capsicum", desc: "Sweet red capsicums, great for grilling" },
      { name: "Bitter Gourd", desc: "Fresh bitter gourd, known for health benefits" },
      { name: "Bottle Gourd", desc: "Light green bottle gourd, mild and cooling" },
      { name: "Ridge Gourd", desc: "Tender ridge gourd, popular in Indian cooking" },
      { name: "Snake Gourd", desc: "Long snake gourd, light and easy to digest" },
      { name: "Drumsticks", desc: "Fresh moringa drumsticks, rich in nutrients" },
      { name: "Okra / Lady Finger", desc: "Tender okra pods, great for frying and curries" },
      { name: "Fresh Coriander", desc: "Aromatic coriander leaves, garnish and seasoning" },
      { name: "Fresh Mint", desc: "Cool mint leaves, perfect for chutneys and drinks" },
      { name: "Curry Leaves", desc: "Fragrant curry leaves for South Indian tempering" },
      { name: "Fenugreek Leaves", desc: "Fresh methi leaves, slightly bitter and nutritious" },
      { name: "Ivy Gourd / Tindora", desc: "Small crunchy tindora, quick-cook vegetable" },
      { name: "Pointed Gourd / Parwal", desc: "Green parwal, popular in Eastern Indian cuisine" },
      { name: "Cluster Beans / Guar", desc: "Thin cluster beans, high in dietary fiber" },
      { name: "Raw Banana", desc: "Green raw bananas, great for chips and curries" },
      { name: "Yam", desc: "Starchy purple yam, rich and filling" },
      { name: "Colocasia / Taro Root", desc: "Small taro roots, nutty flavor when cooked" },
      { name: "Raw Jackfruit", desc: "Green jackfruit, meaty texture for curries" },
      { name: "Green Papaya", desc: "Unripe papaya, great for salads and pickles" },
      { name: "Ash Gourd", desc: "White ash gourd, cooling and low calorie" },
      { name: "Pumpkin", desc: "Orange pumpkin, sweet and versatile" },
      { name: "Spring Onions", desc: "Green spring onions, mild and crunchy" },
    ],
  },

  Fruits: {
    unit: "kilogram",
    priceRange: [30, 500],
    qualities: ["Premium", "Standard", "Economy"],
    items: [
      { name: "Kashmiri Apples", desc: "Crisp red apples from Kashmir orchards" },
      { name: "Cavendish Bananas", desc: "Ripe yellow bananas, sweet and energy-rich" },
      { name: "Alphonso Mangoes", desc: "King of fruits - sweet Alphonso mangoes" },
      { name: "Green Grapes", desc: "Seedless green grapes, sweet and juicy" },
      { name: "Nagpur Oranges", desc: "Tangy sweet oranges from Nagpur farms" },
      { name: "Watermelon", desc: "Large juicy watermelon, perfect for summer" },
      { name: "Papaya", desc: "Ripe golden papaya, loaded with vitamins" },
      { name: "Pineapple", desc: "Sweet tropical pineapple, tangy and fresh" },
      { name: "Allahabad Guava", desc: "White-flesh guava, aromatic and crunchy" },
      { name: "Pomegranate", desc: "Ruby red pomegranate seeds, antioxidant-rich" },
      { name: "Litchi", desc: "Sweet juicy litchis from Bihar" },
      { name: "Strawberries", desc: "Fresh red strawberries, sweet and fragrant" },
      { name: "Blueberries", desc: "Plump blueberries, superfood berries" },
      { name: "Kiwi Fruit", desc: "Tangy green kiwi, vitamin C powerhouse" },
      { name: "Dragon Fruit", desc: "Exotic pink dragon fruit, mild sweet taste" },
      { name: "Avocado", desc: "Creamy ripe avocados, healthy fats" },
      { name: "Fresh Coconut", desc: "Tender coconut with sweet water inside" },
      { name: "Sweet Jackfruit", desc: "Ripe jackfruit pods, tropical sweetness" },
      { name: "Fresh Figs", desc: "Soft sweet figs, seasonal delicacy" },
      { name: "Passion Fruit", desc: "Tangy passion fruit, aromatic and exotic" },
      { name: "Custard Apple", desc: "Creamy sitaphal, naturally sweet" },
      { name: "Sapota / Chiku", desc: "Sweet brown chiku, malt-like flavor" },
      { name: "Jamun", desc: "Purple java plum, tangy-sweet seasonal fruit" },
      { name: "Star Fruit", desc: "Star-shaped tropical fruit, mildly sweet" },
      { name: "Amla / Gooseberry", desc: "Indian gooseberry, richest source of vitamin C" },
      { name: "Pears", desc: "Sweet juicy pears, buttery texture" },
      { name: "Plums", desc: "Dark purple plums, tangy and sweet" },
      { name: "Peaches", desc: "Fuzzy fresh peaches, fragrant and juicy" },
      { name: "Apricots", desc: "Golden apricots, sweet and velvety" },
      { name: "Cherries", desc: "Deep red cherries, sweet and tart" },
      { name: "Raspberries", desc: "Delicate red raspberries, sweet-tart flavor" },
      { name: "Blackberries", desc: "Plump blackberries, rich berry flavor" },
      { name: "Mulberries", desc: "Sweet dark mulberries, antioxidant-rich" },
      { name: "Indian Gooseberry Candy", desc: "Dried amla candy, tangy and healthy snack" },
      { name: "Tamarind", desc: "Sour tamarind pods, essential for chutneys" },
      { name: "Sugarcane Pieces", desc: "Fresh sugarcane sticks, natural sweetener" },
      { name: "Medjool Dates", desc: "Premium soft dates, nature's candy" },
      { name: "Wood Apple", desc: "Aromatic wood apple, used in traditional drinks" },
      { name: "Sweet Lime / Mosambi", desc: "Mild sweet citrus fruit, great for juice" },
      { name: "Lemon", desc: "Fresh green lemons, tangy and zesty" },
      { name: "Grapefruit", desc: "Pink grapefruit, bittersweet citrus" },
      { name: "Tangerine", desc: "Easy-peel tangerines, sweet and juicy" },
      { name: "Cape Gooseberry", desc: "Golden berries in papery husks, tart flavor" },
      { name: "Persimmon", desc: "Orange persimmon fruit, honey-sweet when ripe" },
      { name: "Breadfruit", desc: "Starchy breadfruit, versatile tropical staple" },
      { name: "Muskmelon", desc: "Orange-flesh muskmelon, sweet and fragrant" },
      { name: "Honeydew Melon", desc: "Green honeydew melon, mild and refreshing" },
      { name: "Red Grapes", desc: "Sweet red seedless grapes" },
      { name: "Black Grapes", desc: "Dark seedless grapes, rich and sweet" },
      { name: "Green Apple", desc: "Tart crispy green apples, refreshing taste" },
    ],
  },

  "Grains & Cereals": {
    unit: "kilogram",
    priceRange: [30, 250],
    qualities: ["Premium", "Standard", "Economy"],
    items: [
      { name: "Basmati Rice", desc: "Long-grain aromatic basmati rice, aged for flavor" },
      { name: "Brown Rice", desc: "Whole grain brown rice, fiber-rich and nutty" },
      { name: "Whole Wheat", desc: "Premium wheat grains for grinding fresh atta" },
      { name: "Jowar / Sorghum", desc: "Gluten-free millet, great for rotis" },
      { name: "Bajra / Pearl Millet", desc: "Hearty pearl millet, traditional winter grain" },
      { name: "Ragi / Finger Millet", desc: "Calcium-rich ragi, superfood grain" },
      { name: "Maize / Corn Grain", desc: "Dried corn kernels for flour and popcorn" },
      { name: "Barley", desc: "Whole barley grain, great for soups and health drinks" },
      { name: "Steel Cut Oats", desc: "Minimally processed oats, hearty breakfast grain" },
      { name: "Quinoa", desc: "Protein-rich quinoa, complete amino acid profile" },
      { name: "Amaranth / Rajgira", desc: "Tiny nutritious amaranth seeds, fasting-friendly" },
      { name: "Buckwheat / Kuttu", desc: "Gluten-free buckwheat, used during fasting" },
      { name: "Foxtail Millet", desc: "Ancient millet variety, light and easy to digest" },
      { name: "Little Millet", desc: "Small-grain millet, suitable for rice dishes" },
      { name: "Kodo Millet", desc: "Low glycemic millet, diabetic-friendly" },
      { name: "Barnyard Millet", desc: "Quick-cooking millet, high in iron" },
      { name: "Proso Millet", desc: "Mild-flavored millet, versatile in cooking" },
      { name: "Broken Wheat / Daliya", desc: "Cracked wheat, perfect for upma and porridge" },
      { name: "Rice Flour", desc: "Fine white rice flour, for idli batter and sweets" },
      { name: "Whole Wheat Flour / Atta", desc: "Stone-ground chakki atta, fresh and aromatic" },
      { name: "Semolina / Suji", desc: "Granulated wheat semolina, for rava dosa and halwa" },
      { name: "Corn Flour", desc: "Fine yellow corn flour for thickening and baking" },
      { name: "Gram Flour / Besan", desc: "Chickpea flour, essential for pakoras and sweets" },
      { name: "Rice Flakes / Poha", desc: "Flattened rice, quick breakfast staple" },
      { name: "Puffed Rice / Murmura", desc: "Light puffed rice, perfect for chaat and snacks" },
      { name: "Vermicelli / Sevai", desc: "Thin wheat vermicelli, for upma and kheer" },
      { name: "Sago / Sabudana", desc: "Tapioca pearls, fasting favorite" },
      { name: "Idli Rice", desc: "Short-grain parboiled rice, ideal for idli batter" },
      { name: "Ponni Rice", desc: "South Indian Ponni rice, soft and fluffy" },
      { name: "Sona Masoori Rice", desc: "Lightweight Sona Masoori, everyday table rice" },
      { name: "Ambemohar Rice", desc: "Aromatic Maharashtrian rice, fragrant like mango blossoms" },
      { name: "Red Rice", desc: "Unpolished red rice, rich in antioxidants" },
      { name: "Black Rice", desc: "Forbidden black rice, nutty and slightly sweet" },
      { name: "Wild Rice", desc: "Long dark wild rice grains, chewy and earthy" },
      { name: "Teff Grain", desc: "Tiny Ethiopian super grain, iron-rich" },
      { name: "Spelt Grain", desc: "Ancient wheat variety, nutty flavor" },
      { name: "Emmer Wheat / Khapli", desc: "Ancient variety, low gluten and nutritious" },
      { name: "Bulgur Wheat", desc: "Parboiled cracked wheat, quick-cooking and nutty" },
      { name: "Couscous", desc: "Semolina couscous, light North African staple" },
      { name: "Polenta / Cornmeal", desc: "Coarse ground corn, Italian comfort food base" },
      { name: "Farro", desc: "Italian ancient wheat grain, chewy texture" },
      { name: "Freekeh", desc: "Roasted green wheat, smoky flavor" },
      { name: "Rolled Oats", desc: "Quick-cook rolled oats, smooth texture" },
      { name: "Oat Bran", desc: "Fiber-rich oat bran, great for cholesterol" },
      { name: "Wheat Bran", desc: "Raw wheat bran, high fiber supplement" },
      { name: "Multi-Grain Flour", desc: "Blend of 7 grains for healthy rotis" },
      { name: "Ragi Flour", desc: "Ground finger millet flour, for ragi mudde and dosa" },
      { name: "Jowar Flour", desc: "Sorghum flour, gluten-free roti flour" },
      { name: "Bajra Flour", desc: "Pearl millet flour, warming winter rotis" },
      { name: "Sattu Powder", desc: "Roasted gram flour, Bihar's energy drink base" },
    ],
  },

  "Pulses & Legumes": {
    unit: "kilogram",
    priceRange: [60, 300],
    qualities: ["Premium", "Standard", "Economy"],
    items: [
      { name: "Toor Dal / Arhar", desc: "Yellow pigeon pea dal, everyday staple" },
      { name: "Moong Dal (Yellow)", desc: "Split yellow moong dal, light and easy to digest" },
      { name: "Masoor Dal (Red)", desc: "Quick-cooking red lentils, protein-packed" },
      { name: "Chana Dal", desc: "Split Bengal gram, nutty and versatile" },
      { name: "Urad Dal (White)", desc: "Split black gram, for dal makhani base" },
      { name: "Kulthi Dal / Horse Gram", desc: "Ancient pulse, high protein and iron" },
      { name: "Rajma / Kidney Beans", desc: "Red kidney beans, Punjabi curry favorite" },
      { name: "Kabuli Chana / Chickpeas", desc: "White chickpeas, for chhole and hummus" },
      { name: "Black Eyed Peas / Lobia", desc: "Creamy lobia, quick-cooking pulse" },
      { name: "Green Moong Whole", desc: "Whole green moong, sprout-friendly" },
      { name: "Black Gram / Urad Whole", desc: "Whole black urad, for dal makhani" },
      { name: "Moth Beans", desc: "Small brown moth beans, Rajasthani specialty" },
      { name: "Mixed Dal", desc: "Blend of 5 dals, nutritious one-pot meal" },
      { name: "Field Beans / Val", desc: "White flat beans, Maharashtrian favorite" },
      { name: "Green Peas (Dried)", desc: "Dried green peas, for curries and snacks" },
      { name: "White Peas (Dried)", desc: "Dried white peas, for ragda and chaat" },
      { name: "Navy Beans", desc: "Small white beans, creamy when cooked" },
      { name: "Pinto Beans", desc: "Speckled pinto beans, popular in Mexican cuisine" },
      { name: "Lima Beans", desc: "Large flat lima beans, buttery texture" },
      { name: "Fava Beans", desc: "Broad beans, earthy and rich" },
      { name: "Adzuki Beans", desc: "Small red beans, slightly sweet" },
      { name: "Moong Bean Sprouts", desc: "Fresh sprouted moong, crunchy and nutritious" },
      { name: "Soybean", desc: "Protein-rich soybean, versatile legume" },
      { name: "Black Beans", desc: "Shiny black beans, creamy and earthy" },
      { name: "Cannellini Beans", desc: "White Italian beans, smooth and mild" },
      { name: "Butter Beans", desc: "Large creamy butter beans, soft texture" },
      { name: "Cranberry Beans", desc: "Speckled cranberry beans, nutty flavor" },
      { name: "Borlotti Beans", desc: "Italian borlotti, great in soups and stews" },
      { name: "Hyacinth Beans / Avarai", desc: "Flat green beans, South Indian staple" },
      { name: "Cowpeas", desc: "Small oval cowpeas, traditional and nutritious" },
      { name: "Bengal Gram Whole / Kala Chana", desc: "Dark brown chickpeas, for sprouts and curries" },
      { name: "Red Lentils Whole", desc: "Whole red masoor, earthy flavor" },
      { name: "Black Lentils / Beluga", desc: "Tiny black lentils, hold shape when cooked" },
      { name: "French Green Lentils", desc: "Peppery green lentils, firm texture" },
      { name: "Yellow Lentils", desc: "Bright yellow lentils, quick dal base" },
      { name: "Moong Dal (Split Green)", desc: "Green skin moong split, for khichdi" },
      { name: "Chana (Roasted)", desc: "Roasted split chickpeas, crunchy snack" },
      { name: "Masoor Whole (Brown)", desc: "Whole brown lentils, hearty and filling" },
      { name: "Double Beans / Vaal", desc: "Large flat double beans, festive curry" },
      { name: "Turkish Red Lentils", desc: "Quick-cooking orange lentils, smooth texture" },
      { name: "Sprouted Mixed Beans", desc: "Mix of sprouted pulses, ready-to-cook" },
      { name: "Matki / Moth Bean", desc: "Sproutable moth beans, crunchy salad bean" },
      { name: "Kollu / Horse Gram", desc: "Ancient pulse, weight-loss friendly" },
      { name: "Karamani / Black Eyed Peas", desc: "Fresh cowpeas, quick-pressure-cook dal" },
      { name: "Green Gram Flour", desc: "Ground green moong, for cheela and sweets" },
      { name: "Urad Flour", desc: "Black gram flour, for papad and vada" },
      { name: "Besan / Chickpea Flour", desc: "Fine gram flour, countless Indian dishes" },
      { name: "Soy Chunks", desc: "Textured soy protein, meat alternative" },
      { name: "Soy Granules", desc: "Fine soy mince, quick-cook protein" },
      { name: "Papad (Urad)", desc: "Sun-dried urad papad, crispy accompaniment" },
    ],
  },

  Spices: {
    unit: "gram",
    priceRange: [30, 800],
    qualities: ["Premium", "Standard"],
    items: [
      { name: "Turmeric Powder", desc: "Bright yellow haldi, anti-inflammatory and flavorful" },
      { name: "Kashmiri Red Chilli Powder", desc: "Vibrant red color with mild heat, for curries" },
      { name: "Cumin Seeds / Jeera", desc: "Warm earthy cumin, essential for tadka" },
      { name: "Coriander Seeds / Dhania", desc: "Citrusy coriander seeds, base of every masala" },
      { name: "Black Pepper Whole", desc: "Pungent Malabar black pepper, king of spices" },
      { name: "Green Cardamom / Elaichi", desc: "Aromatic pods, for chai and desserts" },
      { name: "Ceylon Cinnamon Sticks", desc: "True cinnamon quills, sweet and delicate" },
      { name: "Whole Cloves / Laung", desc: "Strong aromatic cloves, for biryanis and chai" },
      { name: "Bay Leaves / Tej Patta", desc: "Dried bay leaves, subtle herbal aroma" },
      { name: "Yellow Mustard Seeds", desc: "Tiny mustard seeds for tempering" },
      { name: "Fenugreek Seeds / Methi", desc: "Bitter-sweet methi seeds, for pickles and dals" },
      { name: "Fennel Seeds / Saunf", desc: "Sweet anise-flavored fennel, digestive after meals" },
      { name: "Asafoetida / Hing", desc: "Pungent hing powder, onion-garlic substitute" },
      { name: "Star Anise", desc: "Star-shaped spice, sweet licorice flavor" },
      { name: "Mace / Javitri", desc: "Delicate lacy mace, warm nutmeg-like flavor" },
      { name: "Nutmeg / Jaiphal", desc: "Warm sweet nutmeg, for desserts and garam masala" },
      { name: "Kashmiri Saffron / Kesar", desc: "Premium saffron threads, world's most precious spice" },
      { name: "Kitchen King Masala", desc: "All-purpose curry powder blend" },
      { name: "Garam Masala", desc: "Warm spice blend, finishing touch for curries" },
      { name: "Chaat Masala", desc: "Tangy spice mix, for snacks and fruits" },
      { name: "Pav Bhaji Masala", desc: "Special blend for Mumbai street-style pav bhaji" },
      { name: "Biryani Masala", desc: "Aromatic spice blend for perfect biryani" },
      { name: "Tandoori Masala", desc: "Smoky red marinade spice for grilling" },
      { name: "Sambar Powder", desc: "South Indian lentil curry spice blend" },
      { name: "Rasam Powder", desc: "Peppery spice mix for tangy rasam soup" },
      { name: "Amchur / Dried Mango Powder", desc: "Tangy dried mango powder, souring agent" },
      { name: "Dry Ginger Powder / Sonth", desc: "Warming dried ginger, for chai and medicinal use" },
      { name: "White Pepper Powder", desc: "Mild peppery heat, for light-colored dishes" },
      { name: "Black Cardamom / Badi Elaichi", desc: "Smoky large cardamom pods, for savory dishes" },
      { name: "Carom Seeds / Ajwain", desc: "Thyme-like ajwain, for parathas and digestive aid" },
      { name: "Poppy Seeds / Khas Khas", desc: "Tiny white poppy seeds, for gravies and sweets" },
      { name: "Nigella Seeds / Kalonji", desc: "Black onion seeds, for naan and pickles" },
      { name: "White Sesame Seeds", desc: "Nutty sesame seeds, for laddu and garnish" },
      { name: "Caraway Seeds / Shahi Jeera", desc: "Refined cumin variant, for pulaos and meats" },
      { name: "Tamarind Paste", desc: "Concentrated sour tamarind, for chutneys and sambar" },
      { name: "Guntur Red Chilli", desc: "Fiery hot Andhra chillies, for serious heat" },
      { name: "Byadgi Chilli Powder", desc: "Deep red color, mild heat, Karnataka specialty" },
      { name: "Black Salt / Kala Namak", desc: "Sulphurous himalayan black salt, for chaat" },
      { name: "Pink Himalayan Salt", desc: "Mineral-rich pink rock salt crystals" },
      { name: "Kokum", desc: "Dried kokum rind, Konkan souring agent" },
      { name: "Kasuri Methi / Dried Fenugreek", desc: "Dried fenugreek leaves, buttery aroma for curries" },
      { name: "Mixed Herb Seasoning", desc: "Italian-style dried herb blend" },
      { name: "Panch Phoron", desc: "Bengali five-spice blend, for dals and vegetables" },
      { name: "Chole Masala", desc: "Robust spice mix for Punjabi chole" },
      { name: "Meat Masala", desc: "Bold spice blend for mutton and chicken curries" },
      { name: "Dal Tadka Masala", desc: "Quick spice blend for simple dal tempering" },
      { name: "Pickle Masala", desc: "Hot and tangy masala for homemade pickles" },
      { name: "Chai Masala", desc: "Warming spice mix for perfect masala tea" },
      { name: "Dried Red Chilli Whole", desc: "Dried whole red chillies, for tempering" },
      { name: "Cumin Powder", desc: "Ground roasted cumin, instant flavor enhancer" },
    ],
  },

  Dairy: {
    unit: "litre",
    priceRange: [25, 600],
    qualities: ["Premium", "Standard"],
    items: [
      { name: "Farm Fresh Cow Milk", desc: "Pure cow milk, delivered fresh every morning" },
      { name: "Buffalo Milk", desc: "Rich creamy buffalo milk, high fat content" },
      { name: "A2 Cow Milk", desc: "Premium A2 protein milk from desi cows" },
      { name: "Toned Milk", desc: "Standardized toned milk, balanced fat" },
      { name: "Full Cream Milk", desc: "Rich full cream milk, for tea and sweets" },
      { name: "Skimmed Milk", desc: "Fat-free milk, for health-conscious consumers" },
      { name: "Buttermilk / Chaas", desc: "Spiced churned buttermilk, cooling summer drink" },
      { name: "Fresh Curd / Dahi", desc: "Thick set curd, naturally fermented" },
      { name: "Greek Yogurt", desc: "Thick strained yogurt, high protein" },
      { name: "Mango Lassi", desc: "Sweet mango-flavored yogurt drink" },
      { name: "Fresh Paneer", desc: "Soft fresh cottage cheese, handmade daily" },
      { name: "Malai Paneer", desc: "Cream-enriched premium paneer, extra soft" },
      { name: "Fresh Mozzarella", desc: "Soft Italian-style mozzarella, for pizza" },
      { name: "Aged Cheddar", desc: "Sharp aged cheddar cheese block" },
      { name: "Fresh Butter", desc: "Hand-churned white butter, for parathas" },
      { name: "Unsalted Butter", desc: "Pure unsalted butter for cooking and baking" },
      { name: "Pure Desi Ghee", desc: "Clarified butter ghee, aromatic and golden" },
      { name: "A2 Cow Ghee", desc: "Premium A2 ghee from grass-fed desi cows" },
      { name: "Buffalo Ghee", desc: "Rich buffalo ghee, traditional Indian cooking fat" },
      { name: "Fresh Cream", desc: "Thick pouring cream, for desserts and curries" },
      { name: "Whipping Cream", desc: "Heavy cream for whipping, cakes and pastries" },
      { name: "Condensed Milk", desc: "Sweetened thick milk, for desserts and chai" },
      { name: "Milk Powder", desc: "Spray-dried milk powder, long shelf life" },
      { name: "Khoya / Mawa", desc: "Reduced milk solid, base for Indian sweets" },
      { name: "Shrikhand", desc: "Sweet strained yogurt dessert, Gujarati specialty" },
      { name: "Sweet Lassi", desc: "Thick sweet yogurt drink with cardamom" },
      { name: "Rose Lassi", desc: "Rose-flavored premium lassi drink" },
      { name: "Mishti Doi", desc: "Bengali sweet caramelized yogurt" },
      { name: "Hung Curd", desc: "Thick drained yogurt, for dips and marinades" },
      { name: "Raita Mix", desc: "Seasoned curd with cumin and herbs" },
      { name: "Cheese Spread", desc: "Smooth spreadable cheese, for sandwiches" },
      { name: "Processed Cheese Slices", desc: "Individually wrapped cheese slices" },
      { name: "Cream Cheese", desc: "Soft tangy cream cheese, for cheesecakes" },
      { name: "Goat Milk", desc: "Fresh goat milk, easily digestible" },
      { name: "Fresh Goat Cheese", desc: "Tangy soft goat cheese, artisanal" },
      { name: "Kefir", desc: "Probiotic fermented milk drink" },
      { name: "Probiotic Curd", desc: "Live-culture enriched curd, gut-friendly" },
      { name: "Flavored Milk - Chocolate", desc: "Cold chocolate milk, kids' favorite" },
      { name: "Flavored Milk - Strawberry", desc: "Sweet strawberry milk, refreshing drink" },
      { name: "Badam Milk", desc: "Almond-enriched saffron milk, traditional tonic" },
      { name: "Fresh Malai", desc: "Thick milk cream layer, for parathas and sweets" },
      { name: "Organic Whole Milk", desc: "Certified organic milk, pasture-raised cows" },
      { name: "Farm Fresh Whey", desc: "Protein-rich whey water, natural supplement" },
      { name: "Flavored Yogurt - Mango", desc: "Mango-flavored smooth yogurt cup" },
      { name: "Flavored Yogurt - Strawberry", desc: "Strawberry-flavored yogurt cup" },
      { name: "Amrakhand", desc: "Mango-flavored shrikhand, Maharashtrian sweet" },
      { name: "Masala Chaas", desc: "Spiced buttermilk with cumin and coriander" },
      { name: "Thandai Mix", desc: "Festive spiced milk powder, for Holi celebrations" },
      { name: "Rabri", desc: "Thick sweetened condensed milk dessert" },
      { name: "Basundi", desc: "Rich reduced milk sweet, Gujarati delicacy" },
    ],
  },

  "Nuts & Seeds": {
    unit: "gram",
    priceRange: [50, 1500],
    qualities: ["Premium", "Standard"],
    items: [
      { name: "California Almonds", desc: "Crunchy California almonds, whole and unprocessed" },
      { name: "Goa Cashews (W320)", desc: "Premium whole cashews, buttery smooth" },
      { name: "Kashmir Walnuts", desc: "Light-colored Kashmiri walnut halves, brain food" },
      { name: "Iranian Pistachios", desc: "Salted roasted pistachios, green and flavorful" },
      { name: "Raw Peanuts", desc: "Red-skin raw peanuts, for roasting and cooking" },
      { name: "Brazil Nuts", desc: "Large creamy Brazil nuts, selenium-rich" },
      { name: "Macadamia Nuts", desc: "Buttery rich macadamia, premium snack nut" },
      { name: "Pine Nuts / Chilgoza", desc: "Delicate pine nuts, for pesto and garnish" },
      { name: "Hazelnuts", desc: "Whole hazelnuts, aromatic and crunchy" },
      { name: "Pecans", desc: "Sweet buttery pecans, for baking and salads" },
      { name: "Chestnuts", desc: "Starchy sweet chestnuts, for roasting" },
      { name: "Tiger Nuts", desc: "Sweet chewy tuber nuts, ancient superfood" },
      { name: "Chia Seeds", desc: "Omega-3 rich chia seeds, superfood for smoothies" },
      { name: "Flax Seeds / Alsi", desc: "Golden flax seeds, fiber and omega-3 powerhouse" },
      { name: "Sunflower Seeds", desc: "Hulled sunflower seeds, light nutty snack" },
      { name: "Pumpkin Seeds / Pepita", desc: "Green pumpkin seeds, zinc-rich superfood" },
      { name: "Watermelon Seeds", desc: "Roasted watermelon seeds, magnesium-rich" },
      { name: "Muskmelon Seeds", desc: "Cooling melon seeds, traditional summer ingredient" },
      { name: "Hemp Seeds", desc: "Hulled hemp hearts, complete plant protein" },
      { name: "Basil Seeds / Sabja", desc: "Tiny basil seeds, swell in water for drinks" },
      { name: "Black Sesame Seeds", desc: "Mineral-rich black sesame, for Asian cooking" },
      { name: "White Sesame Seeds", desc: "Nutty white sesame, for laddu and tahini" },
      { name: "Mixed Nuts Premium", desc: "Curated blend of 6 premium nuts" },
      { name: "Trail Mix", desc: "Nuts, seeds, and dried fruit energy mix" },
      { name: "Roasted Almonds (Salted)", desc: "Lightly salted crunchy roasted almonds" },
      { name: "Salted Cashews", desc: "Perfectly salted roasted cashew halves" },
      { name: "Honey Roasted Peanuts", desc: "Sweet and savory coated peanuts" },
      { name: "Candied Walnuts", desc: "Caramelized walnut pieces, dessert topping" },
      { name: "Almond Flour", desc: "Fine blanched almond flour, for gluten-free baking" },
      { name: "Cashew Butter", desc: "Smooth creamy cashew spread, no additives" },
      { name: "Peanut Butter (Crunchy)", desc: "Chunky peanut butter, high protein spread" },
      { name: "Peanut Butter (Smooth)", desc: "Smooth peanut butter, natural and unsweetened" },
      { name: "Almond Butter", desc: "Rich almond butter, roasted and creamy" },
      { name: "Dried Coconut Pieces", desc: "Copra / dried coconut chunks for cooking" },
      { name: "Desiccated Coconut", desc: "Fine shredded dried coconut, for sweets" },
      { name: "Fox Nuts / Makhana", desc: "Popped lotus seeds, fasting and snack favorite" },
      { name: "Roasted Makhana (Peri Peri)", desc: "Spicy flavored fox nuts, healthy snack" },
      { name: "Roasted Makhana (Cream & Onion)", desc: "Creamy onion flavored fox nut snack" },
      { name: "Charoli Seeds", desc: "Tiny nutty charoli, for biryani garnish and sweets" },
      { name: "Garden Cress Seeds / Halim", desc: "Iron-rich halim seeds, sproutable superfood" },
      { name: "Edible Gum / Gond", desc: "Natural tree gum, for winter laddu" },
      { name: "Dry Fruit Laddu Mix", desc: "Pre-mixed nuts and seeds for making laddu" },
      { name: "Apricot Kernels", desc: "Soft apricot inner seeds, almond-like flavor" },
      { name: "Sacha Inchi Seeds", desc: "Star-shaped Incan seeds, highest plant omega" },
      { name: "Lotus Seeds Raw", desc: "Raw phool makhana, for roasting at home" },
      { name: "Mixed Seeds Pack", desc: "5-seed blend: pumpkin, sunflower, chia, flax, sesame" },
      { name: "Roasted Chana", desc: "Crunchy roasted chickpeas, protein snack" },
      { name: "Raisins / Kishmish", desc: "Golden seedless raisins, natural sweetener" },
      { name: "Dried Cranberries", desc: "Tangy dried cranberries, salad and trail mix topping" },
      { name: "Dried Apricots", desc: "Soft sweet Turkish dried apricots, iron-rich" },
    ],
  },

  Organic: {
    unit: "kilogram",
    priceRange: [50, 600],
    qualities: ["Premium", "Certified Organic"],
    items: [
      { name: "Organic Wheat Grain", desc: "Certified organic whole wheat, pesticide-free" },
      { name: "Organic Basmati Rice", desc: "Organic long-grain basmati, chemical-free farming" },
      { name: "Organic Toor Dal", desc: "Organic pigeon pea lentils, naturally grown" },
      { name: "Organic Raw Honey", desc: "Unprocessed wildflower honey, alive with enzymes" },
      { name: "Organic Jaggery / Gud", desc: "Unrefined cane jaggery, mineral-rich sweetener" },
      { name: "Organic Turmeric Powder", desc: "High-curcumin organic haldi, lab-tested purity" },
      { name: "Organic Desi Ghee", desc: "A2 organic ghee from grass-fed cows" },
      { name: "Organic A2 Milk", desc: "Fresh organic A2 cow milk, pasture-raised" },
      { name: "Organic Free-Range Eggs", desc: "Cage-free organic eggs, omega-3 enriched" },
      { name: "Organic Virgin Coconut Oil", desc: "Cold-pressed organic coconut oil, unrefined" },
      { name: "Organic Cold-Pressed Mustard Oil", desc: "Traditional kachi ghani mustard oil" },
      { name: "Organic Assam Tea", desc: "USDA certified organic CTC tea, bold flavor" },
      { name: "Organic Arabica Coffee", desc: "Single-estate organic coffee beans, South Indian" },
      { name: "Organic Cane Sugar", desc: "Minimally processed organic sugar crystals" },
      { name: "Organic Rock Salt", desc: "Unrefined mineral-rich organic rock salt" },
      { name: "Organic California Almonds", desc: "NPOP certified organic almonds, raw whole" },
      { name: "Organic Cashews", desc: "Organic whole cashews from Kerala" },
      { name: "Organic Raisins", desc: "Sun-dried organic grapes, no sulphites" },
      { name: "Organic Medjool Dates", desc: "Large organic dates, moist and caramelly" },
      { name: "Organic Amla Juice", desc: "Cold-pressed organic gooseberry juice" },
      { name: "Organic Apple Cider Vinegar", desc: "Raw unfiltered ACV with mother culture" },
      { name: "Organic Moringa Powder", desc: "Dried moringa leaf powder, superfood green" },
      { name: "Organic Spirulina", desc: "Organic blue-green algae, protein supplement" },
      { name: "Organic Ashwagandha Powder", desc: "Stress-relief adaptogenic herb, organic" },
      { name: "Organic Triphala Powder", desc: "Ayurvedic digestive blend, three-fruit formula" },
      { name: "Organic Neem Powder", desc: "Dried neem leaf powder, detox and skin care" },
      { name: "Organic Aloe Vera Juice", desc: "Pure organic aloe gel juice, for digestion" },
      { name: "Organic Tulsi Drops", desc: "Holy basil extract, immunity booster" },
      { name: "Organic Black Pepper Whole", desc: "Organic Malabar pepper, chemical-free" },
      { name: "Organic Cumin Seeds", desc: "Pesticide-free organic jeera, aromatic" },
      { name: "Organic Coriander Powder", desc: "Ground organic dhania, fresh and citrusy" },
      { name: "Organic Flax Seeds", desc: "Omega-3 rich organic flax, golden variety" },
      { name: "Organic Chia Seeds", desc: "Certified organic chia, Mexico origin" },
      { name: "Organic Indian Quinoa", desc: "Locally grown organic quinoa, lighter footprint" },
      { name: "Organic Rolled Oats", desc: "Whole grain organic oats, no preservatives" },
      { name: "Organic Muesli", desc: "No-sugar-added organic muesli with nuts" },
      { name: "Organic Granola", desc: "Crunchy organic granola with honey and seeds" },
      { name: "Organic Peanut Butter", desc: "Single-ingredient organic peanut butter" },
      { name: "Organic Sesame Oil", desc: "Cold-pressed organic gingelly oil" },
      { name: "Organic Sunflower Oil", desc: "Organic high-oleic sunflower cooking oil" },
      { name: "Organic Saffron", desc: "Grade-1 organic Kashmiri saffron, lab-certified" },
      { name: "Organic Green Cardamom", desc: "Organic elaichi pods, bold aroma" },
      { name: "Organic Cinnamon Sticks", desc: "True Ceylon organic cinnamon" },
      { name: "Organic Ginger Powder", desc: "Dried organic ginger, warming and sharp" },
      { name: "Organic Garlic Powder", desc: "Dehydrated organic garlic, convenient seasoning" },
      { name: "Organic Red Onion", desc: "Chemical-free organic onions, naturally grown" },
      { name: "Organic Potato", desc: "Farm-fresh organic potatoes, no pesticides" },
      { name: "Organic Tomato", desc: "Vine-ripened organic tomatoes, full flavor" },
      { name: "Organic Banana", desc: "Organic Cavendish bananas, naturally sweet" },
      { name: "Organic Alphonso Mango Pulp", desc: "Pure organic mango pulp, no preservatives" },
    ],
  },
};

// ─── Helper Functions ───────────────────────────────────────────

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function downloadImage(seed) {
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/300`;
  const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
  return Buffer.from(response.data);
}

async function uploadImage(buffer, farmerId, productName) {
  const safeName = productName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const filename = `products/${farmerId}/demo_${safeName}_${Date.now()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    console.error(`  Upload error for ${productName}:`, error.message);
    return "";
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

// ─── Main Seed Function ─────────────────────────────────────────

async function seed() {
  console.log("=== AgriConnect Product Seeder ===\n");

  // 1. Create or find demo farmer
  console.log("1. Setting up demo farmer account...");
  const hashedPassword = await bcrypt.hash(DEMO_FARMER.password, 10);

  let farmerResult = await pool.query("SELECT id FROM users WHERE phone_no = $1 AND role = $2", [
    DEMO_FARMER.phone,
    DEMO_FARMER.role,
  ]);

  let farmerId;
  if (farmerResult.rows.length > 0) {
    farmerId = farmerResult.rows[0].id;
    console.log(`   Found existing demo farmer (ID: ${farmerId})`);
  } else {
    const insertResult = await pool.query(
      "INSERT INTO users (username, phone_no, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [DEMO_FARMER.username, DEMO_FARMER.phone, hashedPassword, DEMO_FARMER.role]
    );
    farmerId = insertResult.rows[0].id;
    console.log(`   Created demo farmer (ID: ${farmerId})`);
  }

  // 2. Seed products per category
  const categoryNames = Object.keys(CATEGORIES);
  let totalCreated = 0;

  for (const categoryName of categoryNames) {
    const cat = CATEGORIES[categoryName];
    console.log(`\n2. Seeding "${categoryName}" (${cat.items.length} products)...`);

    // Pre-download a pool of 10 images for this category and cycle through them
    console.log(`   Downloading images for "${categoryName}"...`);
    const imagePool = [];
    for (let i = 0; i < 10; i++) {
      try {
        const seed = `${categoryName}_${i}_agriconnect`;
        const buffer = await downloadImage(seed);
        imagePool.push(buffer);
      } catch (err) {
        console.error(`   Failed to download image ${i}: ${err.message}`);
        imagePool.push(null);
      }
    }
    console.log(`   Downloaded ${imagePool.filter(Boolean).length}/10 images`);

    // Insert products
    for (let i = 0; i < cat.items.length; i++) {
      const item = cat.items[i];
      const price = randomBetween(cat.priceRange[0], cat.priceRange[1]);
      const quantity = randomBetween(5, 500);
      const quality = randomFrom(cat.qualities);

      // Upload image (cycle through the 10 downloaded)
      let imageUrl = "";
      const imgBuffer = imagePool[i % imagePool.length];
      if (imgBuffer) {
        try {
          imageUrl = await uploadImage(imgBuffer, farmerId, `${categoryName}_${item.name}`);
        } catch (err) {
          console.error(`   Image upload failed for "${item.name}": ${err.message}`);
        }
      }

      try {
        await pool.query(
          `INSERT INTO products (farmer_id, product_name, price, quantity, quality, description, image, quantity_unit, category)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [farmerId, item.name, price, quantity, quality, item.desc, imageUrl, cat.unit, categoryName]
        );
        totalCreated++;

        if ((i + 1) % 10 === 0) {
          console.log(`   ${i + 1}/${cat.items.length} products created`);
        }
      } catch (err) {
        console.error(`   Failed to insert "${item.name}": ${err.message}`);
      }
    }

    console.log(`   Done: ${cat.items.length} products seeded for "${categoryName}"`);
  }

  console.log(`\n=== Seeding Complete ===`);
  console.log(`Total products created: ${totalCreated}`);
  console.log(`Demo farmer login: phone=${DEMO_FARMER.phone}, password=${DEMO_FARMER.password}`);
}

// ─── Run ────────────────────────────────────────────────────────

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
    process.exit(0);
  });
