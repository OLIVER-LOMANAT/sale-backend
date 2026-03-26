import Assignment from "../models/assignment.model.js";
import Lead from "../models/lead.model.js";
import ContactAttempt from "../models/contactAttempt.model.js";

// GET /assignments/my-assignments/
export const getMyAssignments = async (req, res) => {
  try {
    const { state, page = 1, limit = 10, search } = req.query;
    const userId = req.user.id.toString();

    let query = { sales_person: userId };
    if (state) query.state = state;

    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Assignment.countDocuments(query);

    // Populate lead info
    const populated = await Promise.all(
      assignments.map(async (a) => {
        const lead = await Lead.findById(a.lead);
        return {
          ...a.toObject(),
          lead_name: lead?.name || "Unknown",
          lead_category: lead?.category || null,
          lead_location: lead?.city && lead?.state
            ? `${lead.city}, ${lead.state}`
            : lead?.city || lead?.state || "Unknown",
        };
      })
    );

    res.status(200).json({
      count,
      next: count > page * limit ? `/assignments/my-assignments/?page=${parseInt(page) + 1}` : null,
      previous: page > 1 ? `/assignments/my-assignments/?page=${parseInt(page) - 1}` : null,
      results: populated,
    });
  } catch (error) {
    console.error("Error in getMyAssignments:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /assignments/available/
export const getAvailableAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ state: "available" })
      .sort({ createdAt: -1 });

    const populated = await Promise.all(
      assignments.map(async (a) => {
        const lead = await Lead.findById(a.lead);
        return {
          ...a.toObject(),
          lead_name: lead?.name || "Unknown",
          lead_category: lead?.category || null,
          lead_location: lead?.city && lead?.state
            ? `${lead.city}, ${lead.state}`
            : "Unknown",
        };
      })
    );

    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in getAvailableAssignments:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /assignments/:id/
export const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id.toString();

    const assignment = await Assignment.findOne({
      _id: id,
      sales_person: userId,
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const lead = await Lead.findById(assignment.lead);

    res.status(200).json({
      ...assignment.toObject(),
      lead_name: lead?.name || "Unknown",
      lead_category: lead?.category || null,
      lead_location: lead?.city && lead?.state
        ? `${lead.city}, ${lead.state}`
        : "Unknown",
    });
  } catch (error) {
    console.error("Error in getAssignmentById:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /assignments/:id/transition/:new_state/
export const transitionAssignment = async (req, res) => {
  try {
    const { id, new_state } = req.params;
    const userId = req.user.id.toString();

    const validStates = ["available", "assigned", "in_progress", "pitched", "converted", "lost"];

    if (!validStates.includes(new_state)) {
      return res.status(400).json({ error: `Invalid state. Must be one of: ${validStates.join(", ")}` });
    }

    const assignment = await Assignment.findOne({
      _id: id,
      sales_person: userId,
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Update state and relevant timestamp
    assignment.state = new_state;

    if (new_state === "in_progress") assignment.started_at = new Date();
    if (new_state === "pitched") assignment.pitched_at = new Date();
    if (new_state === "converted") assignment.converted_at = new Date();
    if (new_state === "lost") assignment.lost_at = new Date();

    await assignment.save();

    // Update lead status based on assignment state
    const lead = await Lead.findById(assignment.lead);
    if (lead) {
      if (new_state === "converted") {
        lead.status = "Completed";
        lead.is_active = false;
      } else if (new_state === "lost") {
        lead.status = "Canceled";
        lead.is_active = false;
      } else if (new_state === "in_progress" || new_state === "pitched") {
        lead.status = "On Going";
        lead.is_active = true;
      } else {
        lead.status = "On Going";
        lead.is_active = true;
      }
      await lead.save();
    }

    res.status(200).json({
      ...assignment.toObject(),
      lead_name: lead?.name || "Unknown",
      lead_category: lead?.category || null,
    });
  } catch (error) {
    console.error("Error in transitionAssignment:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /assignments/ (all - for future admin use)
export const getAllAssignments = async (req, res) => {
  try {
    const { state, page = 1, limit = 10 } = req.query;

    let query = {};
    if (state) query.state = state;

    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Assignment.countDocuments(query);

    res.status(200).json({ count, results: assignments });
  } catch (error) {
    console.error("Error in getAllAssignments:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


// GET /assignments/{id}/contact-attempts/
export const getContactAttempts = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id.toString();

    // Verify assignment belongs to this sales person
    const assignment = await Assignment.findOne({
      _id: id,
      sales_person: userId,
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const contactAttempts = await ContactAttempt.find({ assignment: id })
      .sort({ contacted_at: -1 });

    res.status(200).json(contactAttempts);
  } catch (error) {
    console.error("Error in getContactAttempts:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /assignments/{id}/contact-attempts/
export const createContactAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id.toString();
    const {
      channel,
      status,
      notes,
      next_follow_up_at,
      metadata,
    } = req.body;

    // Validate required fields
    if (!channel || !status) {
      return res.status(400).json({ error: "Channel and status are required" });
    }

    // Verify assignment belongs to this sales person
    const assignment = await Assignment.findOne({
      _id: id,
      sales_person: userId,
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Get lead info
    const lead = await Lead.findById(assignment.lead);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const contactAttempt = new ContactAttempt({
      assignment: assignment._id,
      lead: assignment.lead,
      sales_person: userId,
      sales_person_name: req.user.name,
      channel,
      status,
      notes,
      next_follow_up_at: next_follow_up_at || null,
      metadata: metadata || {},
    });

    await contactAttempt.save();

    res.status(201).json(contactAttempt);
  } catch (error) {
    console.error("Error in createContactAttempt:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};