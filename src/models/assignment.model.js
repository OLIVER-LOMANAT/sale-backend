// src/models/assignment.model.js
import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    sales_person: {
    type: String, 
  },
    state: {
      type: String,
      enum: ["available", "assigned", "in_progress", "pitched", "converted", "lost"],
      default: "available",
    },
    assignment_type: {
      type: String,
      enum: ["claim", "assign"],
    },
    assigned_at: Date,
    started_at: Date,
    pitched_at: Date,
    converted_at: Date,
    lost_at: Date,
    expires_at: Date,
    expired: {
      type: Boolean,
      default: false,
    },
    notes: String,
  },
  { timestamps: true }
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;