const extensionArticles = [
  {
    id: 1,
    title: "Integrated Pest Management for Vegetable Farms",
    category: "Pest Control",
    summary: "Combine scouting, biological controls, and threshold-based spraying for safer harvests.",
    content: "Start with weekly scouting, identify pest hotspots early, and use bio-controls before chemical sprays. Rotate active ingredients to avoid resistance and track outcomes after each intervention.",
    tags: ["ipm", "vegetables", "best-practice"],
  },
  {
    id: 2,
    title: "Market Timing for Better Farm Profits",
    category: "Market Tips",
    summary: "Use demand windows, grade consistency, and staggered harvest plans to improve margins.",
    content: "Analyze weekly price movement for your crop, hold back non-perishable produce strategically, and maintain consistent grading so repeat buyers trust your quality and accept premium pricing.",
    tags: ["pricing", "market", "profit"],
  },
  {
    id: 3,
    title: "Soil Health Checklist Before Sowing",
    category: "Farming Guides",
    summary: "A quick pre-season checklist for pH, organic matter, moisture, and nutrient readiness.",
    content: "Test soil pH, apply compost for organic matter, check drainage, and tailor NPK application based on crop requirements. Build a simple soil log each season to improve decisions year-over-year.",
    tags: ["soil", "pre-season", "guide"],
  },
  {
    id: 4,
    title: "Post-Harvest Handling to Reduce Loss",
    category: "Best Practices",
    summary: "Simple packing and temperature control steps that protect produce quality in transit.",
    content: "Pre-cool produce quickly, sort damaged pieces, use breathable crates, and avoid direct sunlight during loading. Label lot batches so quality issues can be traced and corrected early.",
    tags: ["post-harvest", "quality", "logistics"],
  },
];

export const listArticles = (query) => {
  const search = String(query.search || "").trim().toLowerCase();
  const category = String(query.category || "").trim().toLowerCase();

  const filtered = extensionArticles.filter((item) => {
    const categoryMatch = !category || item.category.toLowerCase() === category;
    const searchMatch = !search
      || item.title.toLowerCase().includes(search)
      || item.summary.toLowerCase().includes(search)
      || item.tags.some((tag) => tag.includes(search));

    return categoryMatch && searchMatch;
  });

  return { articles: filtered };
};

export const getArticleById = (id) => {
  const article = extensionArticles.find((item) => item.id === Number(id));
  return article || null;
};
