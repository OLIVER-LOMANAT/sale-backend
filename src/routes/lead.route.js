// src/routes/lead.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMyLeads,
  createLead,
  getAvailableLeads,
  getLeadById,
  claimLead,
} from "../controllers/lead.controller.js";

const router = express.Router();

router.get("/sales/leads", protectRoute, getMyLeads);
router.post("/sales/leads", protectRoute, createLead);
router.get("/sales/leads/available", protectRoute, getAvailableLeads);
router.get("/sales/leads/:id", protectRoute, getLeadById);
router.post("/sales/leads/:id/claim", protectRoute, claimLead);

export default router;