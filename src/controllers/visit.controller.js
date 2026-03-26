// src/controllers/visit.controller.js
import mongoose from "mongoose";
import Visit from "../models/visit.model.js";
import Assignment from "../models/assignment.model.js";
import Lead from "../models/lead.model.js";

export const getMyVisits = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id.toString();

    let query = { sales_person: userId };

    if (status) {
      query.status = status;
    }

    const visits = await Visit.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Visit.countDocuments(query);

    res.status(200).json({
      count,
      next: count > page * limit ? `/visits/my-visits/?page=${parseInt(page) + 1}` : null,
      previous: page > 1 ? `/visits/my-visits/?page=${parseInt(page) - 1}` : null,
      results: visits,
    });
  } catch (error) {
    console.error("Error in getMyVisits: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const startVisit = async (req, res) => {
  try {
    const { latitude, longitude, assignment_id, lead_id } = req.body;
    const userId = req.user.id.toString();

    let assignment = null;
    let lead = null;


    if (assignment_id) {
      assignment = await Assignment.findOne({
        _id: assignment_id,
        sales_person: userId,
        state: "assigned",
      });
      if (assignment) {
        lead = await Lead.findById(assignment.lead);
      }
    }
    // Case 2: Using lead_id (for leads you created yourself)
    else if (lead_id) {
      lead = await Lead.findOne({
        _id: lead_id,
        created_by: userId,
        lead_source: "sales_person_posted",
      });

      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      // Create a temporary assignment for your own lead
      assignment = new Assignment({
        lead: lead._id,
        sales_person: userId,
        state: "in_progress",
        assignment_type: "assign",
        assigned_at: new Date(),
        started_at: new Date(),
      });
      await assignment.save();
    }

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // If assignment was in "assigned" state, update it
    if (assignment.state === "assigned") {
      assignment.state = "in_progress";
      assignment.started_at = new Date();
      await assignment.save();
    }

    // Get the lead if not already fetched
    if (!lead && assignment) {
      lead = await Lead.findById(assignment.lead);
    }

    // Create visit with lead contact information
    const visit = new Visit({
      assignment: assignment._id,
      lead: assignment.lead,
      sales_person: userId,
      sales_person_name: req.user.name,
      lead_name: lead ? lead.name : null,
      // Copy contact information from lead
      contact_name: lead ? lead.name : null,
      contact_phone: lead ? lead.phone : null,
      contact_email: lead ? lead.email : null,
      contact_position: lead ? lead.contact_position : null,
      status: "in_progress",
      started_at: new Date(),
      check_in_location: latitude && longitude ? `${latitude},${longitude}` : null,
    });

    await visit.save();

    res.status(200).json(visit);
  } catch (error) {
    console.error("Error in startVisit: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const endVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      latitude,
      longitude,
      notes,
      interest_level,
      contact_name,
      contact_phone,
      contact_email,
      contact_position,
      follow_up_required,
      follow_up_date,
    } = req.body;

    const userId = req.user.id.toString();

    const visit = await Visit.findOne({
      _id: id,
      sales_person: userId,
    });

    if (!visit) {
      return res.status(404).json({ error: "Visit not found" });
    }

    if (visit.status !== "in_progress") {
      return res.status(400).json({ error: "Visit is not in progress" });
    }

    // Update visit - preserve existing contact info if not provided
    visit.status = "completed";
    visit.ended_at = new Date();
    visit.check_out_location = latitude && longitude ? `${latitude},${longitude}` : null;
    visit.notes = notes || visit.notes;
    visit.interest_level = interest_level;
    
    // Only update contact fields if provided, otherwise keep original from lead
    if (contact_name) visit.contact_name = contact_name;
    if (contact_phone) visit.contact_phone = contact_phone;
    if (contact_email) visit.contact_email = contact_email;
    if (contact_position) visit.contact_position = contact_position;
    
    visit.follow_up_required = follow_up_required || false;
    visit.follow_up_date = follow_up_date || null;

    // Calculate duration
    if (visit.started_at) {
      const duration = (new Date(visit.ended_at) - new Date(visit.started_at)) / 60000;
      visit.duration_minutes = Math.round(duration);
    }

    await visit.save();

    // Update assignment state
    await Assignment.findByIdAndUpdate(visit.assignment, {
      state: "pitched",
      pitched_at: new Date(),
    });

    res.status(200).json(visit);
  } catch (error) {
    console.error("Error in endVisit: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getVisitById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id.toString();

    const visit = await Visit.findOne({
      _id: id,
      sales_person: userId,
    });

    if (!visit) {
      return res.status(404).json({ error: "Visit not found" });
    }

    res.status(200).json(visit);
  } catch (error) {
    console.error("Error in getVisitById: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};