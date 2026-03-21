// src/controllers/lead.controller.js
import mongoose from "mongoose";
import Lead from "../models/lead.model.js";
import Assignment from "../models/assignment.model.js";

export const createLead = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("User from middleware:", req.user);

    const {
      name,
      category,
      address,
      city,
      state,
      country,
      postal_code,
      phone,
      email,
      website,
      notes,
    } = req.body;

    const userId = req.user.id.toString();

    const lead = new Lead({
      name,
      category,
      address,
      city,
      state,
      country,
      postal_code,
      phone,
      email,
      website,
      notes,
      created_by: userId,
      created_by_name: req.user.name,
      created_by_sales_person: userId,
      lead_source: "sales_person_posted",
    });

    await lead.save();
    console.log("Lead created:", lead);
    res.status(201).json(lead);
  } catch (error) {
    console.error("Error in createLead: ", error);
    res.status(500).json({ error: error.message });
  }
};

export const getMyLeads = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const userId = req.user.id.toString();

    let query = { created_by: userId };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Lead.countDocuments(query);

    res.status(200).json({
      count,
      next: count > page * limit ? `/sales/leads/?page=${parseInt(page) + 1}` : null,
      previous: page > 1 ? `/sales/leads/?page=${parseInt(page) - 1}` : null,
      results: leads,
    });
  } catch (error) {
    console.error("Error in getMyLeads: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAvailableLeads = async (req, res) => {
  try {
    const leads = await Lead.find({
      lead_source: "admin_posted",
      is_active: true,
    }).sort({ createdAt: -1 });

    res.status(200).json(leads);
  } catch (error) {
    console.error("Error in getAvailableLeads: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id.toString();

    const lead = await Lead.findOne({
      _id: id,
      created_by: userId,
    });

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.status(200).json(lead);
  } catch (error) {
    console.error("Error in getLeadById: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const claimLead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id.toString();

    const lead = await Lead.findOne({
      _id: id,
      lead_source: "admin_posted",
    });

    if (!lead) {
      return res.status(404).json({ error: "Lead not available" });
    }

    // Check if assignment already exists
    let assignment = await Assignment.findOne({ lead: lead._id });

    if (!assignment) {
      // Create assignment for claimed lead
      assignment = new Assignment({
        lead: lead._id,
        sales_person: userId,
        state: "assigned",
        assignment_type: "claim",
        assigned_at: new Date(),
      });
      await assignment.save();
    } else if (assignment.state === "available") {
      // Update existing assignment
      assignment.sales_person = userId;
      assignment.state = "assigned";
      assignment.assignment_type = "claim";
      assignment.assigned_at = new Date();
      await assignment.save();
    } else {
      return res.status(400).json({ error: "Lead already assigned" });
    }

    res.status(200).json({ message: "Lead claimed successfully", lead });
  } catch (error) {
    console.error("Error in claimLead: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};