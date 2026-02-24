import * as AddressModel from "./address.model.js";
import AppError from "../../utils/AppError.js";

export const createAddress = async (userId, data) => {
  if (data.is_default) {
    await AddressModel.unsetDefaults(userId);
  }

  const count = await AddressModel.countByUser(userId);
  const isFirst = count === 0;

  return await AddressModel.create(userId, { ...data, is_default: data.is_default || isFirst });
};

export const getAddresses = async (userId) => {
  return await AddressModel.findAllByUser(userId);
};

export const getAddressById = async (userId, addressId) => {
  const address = await AddressModel.findByIdAndUser(addressId, userId);
  if (!address) throw new AppError("Address not found.", 404);
  return address;
};

export const updateAddress = async (userId, addressId, data) => {
  const existing = await AddressModel.findByIdAndUser(addressId, userId);
  if (!existing) throw new AppError("Address not found.", 404);

  if (data.is_default) {
    await AddressModel.unsetDefaults(userId, addressId);
  }

  const updated = await AddressModel.update(addressId, userId, data);
  return updated;
};

export const deleteAddress = async (userId, addressId) => {
  const deleted = await AddressModel.remove(addressId, userId);
  if (!deleted) throw new AppError("Address not found.", 404);

  if (deleted.is_default) {
    await AddressModel.setMostRecentAsDefault(userId);
  }
};

export const setDefaultAddress = async (userId, addressId) => {
  const existing = await AddressModel.findByIdAndUser(addressId, userId);
  if (!existing) throw new AppError("Address not found.", 404);

  await AddressModel.unsetDefaults(userId);
  await AddressModel.setDefault(addressId);
};
