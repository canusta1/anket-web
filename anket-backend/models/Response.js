const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },      // 0,1,2...
    value: mongoose.Schema.Types.Mixed,                    // "iyi" | ["A","B"] | "serbest metin"
  },
  { _id: false }
);

const ResponseSchema = new mongoose.Schema(
  {
    surveyId: { type: mongoose.Types.ObjectId, ref: "Survey", required: true, index: true },
    userId:   { type: mongoose.Types.ObjectId, ref: "User" }, // anonimse boş kalabilir
    answers:  { type: [AnswerSchema], default: [] },
  },
  { timestamps: true }
);

// sık sorgular için indexler
ResponseSchema.index({ surveyId: 1, createdAt: -1 });
ResponseSchema.index({ userId: 1, surveyId: 1 });

module.exports = mongoose.model("Response", ResponseSchema);
