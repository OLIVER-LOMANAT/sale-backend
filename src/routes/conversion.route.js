import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMyConversions,
  getConversionById,
  createConversion,
  markConversionLost,
} from "../controllers/conversion.controller.js";

const router = express.Router();

router.get("/conversions/my-conversions", protectRoute, getMyConversions);
router.post("/conversions/create", protectRoute, createConversion);
router.get("/conversions/:id", protectRoute, getConversionById);
router.post("/conversions/:id/mark-lost", protectRoute, markConversionLost);

export default router;