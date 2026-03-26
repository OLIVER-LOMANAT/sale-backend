import Conversion from "../models/conversion.model.js";
import Assignment from "../models/assignment.model.js";
import Visit from "../models/visit.model.js";
import Lead from "../models/lead.model.js";

// GET /conversions/my-conversions/
export const getMyConversions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id.toString();

    let query = { sales_person: userId };
    if (status) query.status = status;

    const conversions = await Conversion.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Conversion.countDocuments(query);

    res.status(200).json({
      count,
      next: count > page * limit ? `/conversions/my-conversions/?page=${parseInt(page) + 1}` : null,
      previous: page > 1 ? `/conversions/my-conversions/?page=${parseInt(page) - 1}` : null,
      results: conversions,
    });
  } catch (error) {
    console.error("Error in getMyConversions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /conversions/:id/
export const getConversionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id.toString();

    const conversion = await Conversion.findOne({
      _id: id,
      sales_person: userId,
    });

    if (!conversion) {
      return res.status(404).json({ error: "Conversion not found" });
    }

    res.status(200).json(conversion);
  } catch (error) {
    console.error("Error in getConversionById:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /conversions/create/
export const createConversion = async (req, res) => {
  try {
    const { assignment_id, visit_id, subscription_amount, commission_rate, conversion_notes } = req.body;
    const userId = req.user.id.toString();

    // Find assignment
    const assignment = await Assignment.findOne({
      _id: assignment_id,
      sales_person: userId,
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    if (assignment.state !== "pitched") {
      return res.status(400).json({ error: "Assignment must be in pitched state to convert" });
    }

    // Update assignment to converted
    assignment.state = "converted";
    assignment.converted_at = new Date();
    await assignment.save();

    // Update lead status
    const lead = await Lead.findById(assignment.lead);
    if (lead) {
      lead.status = "Completed";
      lead.is_active = false;
      await lead.save();
    }

    // Create conversion record
    const conversion = new Conversion({
      assignment: assignment._id,
      lead: assignment.lead,
      sales_person: userId,
      status: "pending",
      subscription_amount: subscription_amount,
      commission_rate: commission_rate || 10,
      conversion_notes: conversion_notes,
      converted_at: new Date(),
    });

    // Calculate commission
    const amount = parseFloat(subscription_amount);
    const rate = parseFloat(commission_rate || 10);
    conversion.commission_amount = (amount * rate / 100).toString();

    await conversion.save();

    res.status(201).json(conversion);
  } catch (error) {
    console.error("Error in createConversion:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /conversions/:id/mark-lost/
export const markConversionLost = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id.toString();

    const conversion = await Conversion.findOne({
      _id: id,
      sales_person: userId,
    });

    if (!conversion) {
      return res.status(404).json({ error: "Conversion not found" });
    }

    if (conversion.status !== "pending") {
      return res.status(400).json({ error: "Only pending conversions can be marked as lost" });
    }

    conversion.status = "failed";
    if (notes) conversion.conversion_notes = notes;
    await conversion.save();

    // Update assignment state to lost
    await Assignment.findByIdAndUpdate(conversion.assignment, {
      state: "lost",
      lost_at: new Date(),
    });

    res.status(200).json(conversion);
  } catch (error) {
    console.error("Error in markConversionLost:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
