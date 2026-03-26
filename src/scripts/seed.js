import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../lib/db.js";
import Lead from "../models/lead.model.js";
import Assignment from "../models/assignment.model.js";
import Visit from "../models/visit.model.js";
import Conversion from "../models/conversion.model.js";

dotenv.config();

const SALES_PERSON_ID = "62";
const SALES_PERSON_NAME = "Ruben Lipshutz";

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const daysAgo = (n) => new Date(Date.now() - n * 86400000);

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const categories = [
  "Restaurant", "Retail", "Technology", "Healthcare",
  "Education", "Finance", "Real Estate", "Hospitality",
  "Manufacturing", "Logistics"
];

const cities = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];

const businessNames = [
  "Acme Corp", "Sunrise Cafe", "TechHub Ltd", "Green Valley Farm",
  "Blue Ocean Store", "Peak Solutions", "Horizon Logistics",
  "Savanna Health", "Metro Finance", "Urban Spaces",
  "Safari Tours", "Kilimanjaro Foods", "Coastal Traders",
  "Rift Valley Motors", "Nairobi Digital",
];

const interestLevels = ["low", "medium", "high", "very_high"];

// Seed 
async function seed() {
  await connectDB();

  // Clear existing data for this user
  await Lead.deleteMany({ created_by: SALES_PERSON_ID });
  await Assignment.deleteMany({ sales_person: SALES_PERSON_ID });
  await Visit.deleteMany({ sales_person: SALES_PERSON_ID });
  await Conversion.deleteMany({ sales_person: SALES_PERSON_ID });

  //  Create Leads
  const leads = [];
  for (let i = 0; i < 15; i++) {
    const lead = await Lead.create({
      name: businessNames[i] || `Business ${i + 1}`,
      address: `${randomBetween(1, 999)} Main Street`,
      city: randomFrom(cities),
      state: randomFrom(cities),
      country: "Kenya",
      phone: `+254${randomBetween(700000000, 799999999)}`,
      email: `contact${i + 1}@business${i + 1}.co.ke`,
      category: randomFrom(categories),
      lead_source: "sales_person_posted",
      created_by: SALES_PERSON_ID,
      is_active: true,
      notes: `Potential client in ${randomFrom(cities)} area`,
    });
    leads.push(lead);
  }
  console.log(`Created ${leads.length} leads`);

  // Create Assignments 
  const assignments = [];

  const stateDistribution = [
    "assigned", "assigned", "assigned",
    "in_progress", "in_progress",
    "pitched", "pitched", "pitched",
    "converted", "converted", "converted",
    "lost", "lost",
    "assigned", "in_progress",
  ];

  for (let i = 0; i < leads.length; i++) {
    const state = stateDistribution[i];
    const createdDaysAgo = randomBetween(1, 14);

    const assignment = await Assignment.create({
      lead: leads[i]._id,
      sales_person: SALES_PERSON_ID,
      state,
      assignment_type: "assign",
      assigned_at: daysAgo(createdDaysAgo),
      started_at: ["in_progress", "pitched", "converted", "lost"].includes(state)
        ? daysAgo(createdDaysAgo - 1) : null,
      pitched_at: ["pitched", "converted", "lost"].includes(state)
        ? daysAgo(createdDaysAgo - 2) : null,
      converted_at: state === "converted" ? daysAgo(randomBetween(1, 5)) : null,
      lost_at: state === "lost" ? daysAgo(randomBetween(1, 5)) : null,
      expired: false,
    });
    assignments.push(assignment);
  }
  console.log(`Created ${assignments.length} assignments`);

  // Create Visits
  const visits = [];

  const visitableAssignments = assignments.filter(a =>
    ["pitched", "converted", "lost"].includes(a.state)
  );

  for (const assignment of visitableAssignments) {
    const lead = leads.find(l => l._id.toString() === assignment.lead.toString());
    const daysAgoCount = randomBetween(1, 10);
    const startedAt = daysAgo(daysAgoCount);
    const endedAt   = new Date(startedAt.getTime() + randomBetween(20, 90) * 60000);

    const visit = await Visit.create({
      assignment: assignment._id,
      lead: assignment.lead,
      sales_person: SALES_PERSON_ID,
      sales_person_name: SALES_PERSON_NAME,
      lead_name: lead?.name || "Unknown",
      status: "completed",
      started_at: startedAt,
      ended_at: endedAt,
      duration_minutes: Math.round((endedAt - startedAt) / 60000),
      check_in_location: `${randomBetween(-1, 1)}.${randomBetween(100000, 999999)}, ${randomBetween(36, 37)}.${randomBetween(100000, 999999)}`,
      proximity_verified: true,
      proximity_distance_meters: randomBetween(10, 90),
      interest_level: randomFrom(interestLevels),
      contact_name: `John ${randomFrom(["Doe", "Smith", "Kamau", "Omondi", "Wanjiku"])}`,
      contact_phone: `+254${randomBetween(700000000, 799999999)}`,
      contact_email: `manager@${lead?.name?.toLowerCase().replace(/\s/g, '')}.co.ke`,
      contact_position: randomFrom(["CEO", "Manager", "Director", "Owner", "CFO"]),
      notes: `Good meeting. Client showed ${randomFrom(["strong", "moderate", "high"])} interest in our services.`,
      follow_up_required: Math.random() > 0.5,
      follow_up_date: Math.random() > 0.5 ? daysAgo(-randomBetween(1, 7)) : null,
      verified: true,
    });
    visits.push(visit);
  }

  const inProgressAssignments = assignments.filter(a => a.state === "in_progress");
  for (const assignment of inProgressAssignments) {
    const lead = leads.find(l => l._id.toString() === assignment.lead.toString());
    const visit = await Visit.create({
      assignment: assignment._id,
      lead: assignment.lead,
      sales_person: SALES_PERSON_ID,
      sales_person_name: SALES_PERSON_NAME,
      lead_name: lead?.name || "Unknown",
      status: "in_progress",
      started_at: new Date(Date.now() - randomBetween(10, 60) * 60000),
      check_in_location: `${randomBetween(-1, 1)}.${randomBetween(100000, 999999)}, ${randomBetween(36, 37)}.${randomBetween(100000, 999999)}`,
      proximity_verified: true,
      proximity_distance_meters: randomBetween(10, 90),
    });
    visits.push(visit);
  }

  console.log(`Created ${visits.length} visits`);

  // Create Conversions
  const convertedAssignments = assignments.filter(a => a.state === "converted");
  const conversions = [];

  for (const assignment of convertedAssignments) {
    const lead = leads.find(l => l._id.toString() === assignment.lead.toString());
    const visit = visits.find(v => v.assignment.toString() === assignment._id.toString());
    const subscriptionAmount = randomBetween(10000, 100000);
    const commissionRate = randomFrom([5, 8, 10, 12, 15]);
    const commissionAmount = (subscriptionAmount * commissionRate / 100).toFixed(2);

    const conversion = await Conversion.create({
      assignment: assignment._id,
      visit: visit?._id || null,
      sales_person: SALES_PERSON_ID,
      sales_person_name: SALES_PERSON_NAME,
      lead: assignment.lead,
      lead_name: lead?.name || "Unknown",
      status: randomFrom(["confirmed", "confirmed", "pending"]),
      subscription_amount: subscriptionAmount.toString(),
      commission_rate: commissionRate.toString(),
      commission_amount: commissionAmount,
      converted_at: assignment.converted_at || daysAgo(randomBetween(1, 5)),
      conversion_notes: `Signed up for ${randomFrom(["Basic", "Standard", "Premium"])} plan.`,
      saga_status: "completed",
    });
    conversions.push(conversion);
  }
  console.log(`Created ${conversions.length} conversions`);

  console.log("\n Seed complete!");
  console.log(`   Leads:       ${leads.length}`);
  console.log(`   Assignments: ${assignments.length}`);
  console.log(`   Visits:      ${visits.length}`);
  console.log(`   Conversions: ${conversions.length}`);
  console.log(`\n   User ID used: ${SALES_PERSON_ID}`);
  console.log("   Restart your backend and refresh the frontend!");

  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});