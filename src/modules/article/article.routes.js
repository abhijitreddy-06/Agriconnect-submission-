import express from "express";
import { listArticles, getArticleById } from "./article.controller.js";

const router = express.Router();

router.get("/", listArticles);
router.get("/:id", getArticleById);

export default router;
