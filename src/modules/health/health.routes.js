import express from "express";
import {
  getRootHealth,
  getDatabaseHealth,
  getRedisHealth,
  getAuthConfigHealth,
  getStorageHealth,
  getEnvironmentHealth,
  getAllHealth,
} from "./health.controller.js";

const router = express.Router();

router.get("/", getRootHealth);
router.get("/db", getDatabaseHealth);
router.get("/redis", getRedisHealth);
router.get("/auth", getAuthConfigHealth);
router.get("/storage", getStorageHealth);
router.get("/env", getEnvironmentHealth);
router.get("/all", getAllHealth);

export default router;
