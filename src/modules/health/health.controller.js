import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as HealthService from "./health.service.js";

export const getRootHealth = catchAsync(async (_req, res) => {
  const result = await HealthService.getSystemHealth();
  const status = result.healthy ? 200 : 503;
  return sendResponse(res, status, result.healthy ? "System healthy." : "System degraded.", result.payload);
});

export const getDatabaseHealth = catchAsync(async (_req, res) => {
  const data = await HealthService.checkDatabase();
  return sendResponse(res, 200, "Database check successful.", data);
});

export const getRedisHealth = catchAsync(async (_req, res) => {
  const data = await HealthService.checkRedis();
  return sendResponse(res, 200, "Redis check successful.", data);
});

export const getAuthConfigHealth = catchAsync(async (_req, res) => {
  const data = HealthService.getAuthConfigHealth();
  return sendResponse(res, 200, "Auth configuration check successful.", data);
});

export const getStorageHealth = catchAsync(async (_req, res) => {
  const data = HealthService.getStorageConfigHealth();
  return sendResponse(res, 200, "Storage configuration check successful.", data);
});

export const getEnvironmentHealth = catchAsync(async (_req, res) => {
  const data = HealthService.getEnvironmentHealth();
  return sendResponse(res, 200, "Environment check successful.", data);
});

export const getAllHealth = catchAsync(async (_req, res) => {
  const result = await HealthService.getAllHealthChecks();
  const status = result.healthy ? 200 : 503;
  return sendResponse(
    res,
    status,
    result.healthy ? "All health checks passed." : "One or more health checks failed.",
    result.payload
  );
});
