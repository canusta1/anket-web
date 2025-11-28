const router = require("express").Router();
const mongoose = require("mongoose");
const Response = require("../models/Response");
const auth = require("../middleware/auth");

// Yanıt oluştur (anonim de olabilir; login varsa userId ekleriz)
router.post("/", auth(false), async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.user?._id) body.userId = req.user._id; // token varsa
    const created = await Response.create(body);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Belirli ankete ait yanıtları listele (sadece yetkili kullanıcı görsün)
router.get("/:surveyId", auth(true), async (req, res) => {
  const { surveyId } = req.params;
  const items = await Response.find({ surveyId }).sort({ createdAt: -1 });
  res.json(items);
});

// Basit istatistik: çoktan seçmeli sorular için dağılım
router.get("/:surveyId/stats", auth(true), async (req, res) => {
  const { surveyId } = req.params;
  const oid = new mongoose.Types.ObjectId(surveyId);

  const pipeline = [
    { $match: { surveyId: oid } },
    { $unwind: "$answers" },
    { $group: {
        _id: { q: "$answers.questionIndex", v: "$answers.value" },
        count: { $sum: 1 }
    }},
    { $group: {
        _id: "$_id.q",
        total: { $sum: "$count" },
        options: { $push: { value: "$_id.v", count: "$count" } }
    }},
    { $project: { _id: 0, questionIndex: "$_id", total: 1, options: 1 } },
    { $sort: { questionIndex: 1 } }
  ];

  const stats = await Response.aggregate(pipeline);
  res.json(stats);
});

module.exports = router;
