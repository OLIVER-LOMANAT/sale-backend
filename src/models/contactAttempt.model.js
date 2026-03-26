import mongoose from "mongoose";

const contactAttemptSchema = new mongoose.Schema(
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
      type: String,
      required: true,
    },
    sales_person_name: {
      type: String,
    },
    channel: {
      type: String,
      enum: ["call", "email", "sms", "whatsapp", "meeting", "other"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "reached",
        "no_answer",
        "busy",
        "callback_requested",
        "left_voicemail",
        "email_sent",
        "email_opened",
        "email_bounced",
        "meeting_scheduled",
        "not_interested"
      ],
      required: true,
    },
    contacted_at: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
    next_follow_up_at: {
      type: Date,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
contactAttemptSchema.index({ assignment: 1, contacted_at: -1 });
contactAttemptSchema.index({ sales_person: 1, contacted_at: -1 });

const ContactAttempt = mongoose.model("ContactAttempt", contactAttemptSchema);

export default ContactAttempt;