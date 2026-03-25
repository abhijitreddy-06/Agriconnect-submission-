import catchAsync from "../../utils/catchAsync.js";
import * as ArticleService from "./article.service.js";
import sendResponse from "../../utils/sendResponse.js";
import AppError from "../../utils/AppError.js";

export const listArticles = catchAsync(async (req, res) => {
  const result = ArticleService.listArticles(req.query);
  return sendResponse(res, 200, "Extension articles fetched successfully.", result);
});

export const getArticleById = catchAsync(async (req, res) => {
  const article = ArticleService.getArticleById(req.params.id);
  if (!article) {
    throw new AppError("Article not found.", 404);
  }
  return sendResponse(res, 200, "Extension article fetched successfully.", article);
});
