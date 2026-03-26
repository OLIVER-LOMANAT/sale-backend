// src/models/conversion.model.js
import mongoose from "mongoose";

const conversionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visit",
    },
    sales_person: {
    type: String,  
    required: true,
  },
    sales_person_name: String,
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    lead_name: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "pending",
    },
    subscription_id: String,
    subscription_created_at: Date,
    subscription_amount: String,
    commission_rate: {
      type: String,
      default: "10.00",
    },
    commission_amount: String,
    converted_at: Date,
    conversion_notes: String,
    saga_id: String,
    saga_status: String,
  },
  { timestamps: true }
);

const Conversion = mongoose.model("Conversion", conversionSchema);

export default Conversion;