// src/models/visit.model.js
import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    sales_person: {
    type: String,  // changed from ObjectId
    required: true,
  },
    sales_person_name: String,
    lead_name: String,
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    scheduled_at: Date,
    started_at: Date,
    ended_at: Date,
    duration_minutes: Number,
    check_in_location: String,
    check_out_location: String,
    proximity_verified: {
      type: Boolean,
      default: false,
    },
    proximity_distance_meters: Number,
    impossible_travel_detected: {
      type: Boolean,
      default: false,
    },
    contact_name: String,
    contact_phone: String,
    contact_email: String,
    contact_position: String,
    interest_level: {
      type: String,
      enum: ["none", "low", "medium", "high", "very_high"],
    },
    notes: String,
    follow_up_required: {
      type: Boolean,
      default: false,
    },
    follow_up_date: Date,
    photos: {
      type: Object,
      default: {},
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verified_by: String,
    verified_at: Date,
    verification_notes: String,
  },
  { timestamps: true }
);

const Visit = mongoose.model("Visit", visitSchema);

export default Visit;