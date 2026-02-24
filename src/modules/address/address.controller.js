import catchAsync from "../../utils/catchAsync.js";
import * as AddressService from "./address.service.js";

export const createAddress = catchAsync(async (req, res) => {
  const address = await AddressService.createAddress(req.user.userId, req.body);

  return res.status(201).json({
    success: true,
    message: "Address added successfully.",
    data: address,
  });
});

export const getAddresses = catchAsync(async (req, res) => {
  const addresses = await AddressService.getAddresses(req.user.userId);

  return res.json({
    success: true,
    data: addresses,
  });
});

export const getAddressById = catchAsync(async (req, res) => {
  const address = await AddressService.getAddressById(req.user.userId, req.params.id);

  return res.json({
    success: true,
    data: address,
  });
});

export const updateAddress = catchAsync(async (req, res) => {
  const address = await AddressService.updateAddress(req.user.userId, req.params.id, req.body);

  return res.json({
    success: true,
    message: "Address updated successfully.",
    data: address,
  });
});

export const deleteAddress = catchAsync(async (req, res) => {
  await AddressService.deleteAddress(req.user.userId, req.params.id);

  return res.json({
    success: true,
    message: "Address deleted successfully.",
  });
});

export const setDefaultAddress = catchAsync(async (req, res) => {
  await AddressService.setDefaultAddress(req.user.userId, req.params.id);

  return res.json({
    success: true,
    message: "Default address updated.",
  });
});
