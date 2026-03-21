import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMyVisits,
  startVisit,
  endVisit,
  getVisitById,
} from "../controllers/visit.controller.js";

const router = express.Router();

router.get("/visits/my-visits", protectRoute, getMyVisits);
router.post("/visits/start", protectRoute, startVisit);
router.post("/visits/:id/end", protectRoute, endVisit);
router.get("/visits/:id", protectRoute, getVisitById);

export default router;