const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ["text", "single", "multi"], default: "text" },
  options: { type: [String], default: [] },
}, { _id: false });

const SurveySchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  questions:   { type: [QuestionSchema], default: [] },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Survey", SurveySchema);
