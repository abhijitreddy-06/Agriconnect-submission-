import catchAsync from "../../utils/catchAsync.js";
import * as AddressService from "./address.service.js";
import sendResponse from "../../utils/sendResponse.js";

export const createAddress = catchAsync(async (req, res) => {
  const address = await AddressService.createAddress(req.user.userId, req.body);
  return sendResponse(res, 201, "Address added successfully.", address);
});

export const getAddresses = catchAsync(async (req, res) => {
  const addresses = await AddressService.getAddresses(req.user.userId);
  return sendResponse(res, 200, "Addresses fetched successfully.", addresses);
});

export const getAddressById = catchAsync(async (req, res) => {
  const address = await AddressService.getAddressById(req.user.userId, req.params.id);
  return sendResponse(res, 200, "Address fetched successfully.", address);
});

export const updateAddress = catchAsync(async (req, res) => {
  const address = await AddressService.updateAddress(req.user.userId, req.params.id, req.body);
  return sendResponse(res, 200, "Address updated successfully.", address);
});

export const deleteAddress = catchAsync(async (req, res) => {
  await AddressService.deleteAddress(req.user.userId, req.params.id);
  return sendResponse(res, 200, "Address deleted successfully.", null);
});

export const setDefaultAddress = catchAsync(async (req, res) => {
  await AddressService.setDefaultAddress(req.user.userId, req.params.id);
  return sendResponse(res, 200, "Default address updated.", null);
});
