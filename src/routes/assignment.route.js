import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMyAssignments,
  getAvailableAssignments,
  getAssignmentById,
  transitionAssignment,
  getAllAssignments,
} from "../controllers/assignment.controller.js";

const router = express.Router();

router.get("/assignments/my-assignments", protectRoute, getMyAssignments);
router.get("/assignments/available", protectRoute, getAvailableAssignments);
router.get("/assignments/:id", protectRoute, getAssignmentById);
router.post("/assignments/:id/transition/:new_state", protectRoute, transitionAssignment);
router.get("/assignments", protectRoute, getAllAssignments);

export default router;