import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createAddressSchema, updateAddressSchema, idParamSchema } from "./address.validation.js";
import { createAddress, getAddresses, getAddressById, updateAddress, deleteAddress, setDefaultAddress } from "./address.controller.js";

const router = express.Router();

router.post("/", verifyToken, validate(createAddressSchema), createAddress);
router.get("/", verifyToken, getAddresses);
router.get("/:id", verifyToken, validate(idParamSchema), getAddressById);
router.put("/:id", verifyToken, validate(idParamSchema), validate(updateAddressSchema), updateAddress);
router.delete("/:id", verifyToken, validate(idParamSchema), deleteAddress);
router.patch("/:id/default", verifyToken, validate(idParamSchema), setDefaultAddress);

export default router;
