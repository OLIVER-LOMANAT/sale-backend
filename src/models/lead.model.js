import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: String,
    address: String,
    city: String,
    state: String,
    country: String,
    postal_code: String,
    phone: String,
    email: String,
    website: String,
    notes: String,
    status: {
      type: String,
      enum: ["On Going", "On Hold", "Pending", "Completed", "Canceled"],
      default: "On Going",
    },
    lead_source: {
      type: String,
      enum: ["admin_posted", "sales_person_posted"],
      default: "sales_person_posted",
    },
    created_by: {
      type: String,
      required: true,
    },
    created_by_name: String,
    created_by_sales_person: String,
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;