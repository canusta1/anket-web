const router = require("express").Router();
const Survey = require("../models/Survey");

// CREATE
router.post("/", async (req, res) => {
  try { const created = await Survey.create(req.body); res.status(201).json(created); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// LIST
router.get("/", async (_req, res) => {
  const items = await Survey.find().sort({ createdAt: -1 });
  res.json(items);
});

// READ ONE
router.get("/:id", async (req, res) => {
  const item = await Survey.findById(req.params.id);
  if (!item) return res.status(404).json({ error: "Bulunamadı" });
  res.json(item);
});

// UPDATE
router.patch("/:id", async (req, res) => {
  try {
    const updated = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Bulunamadı" });
    res.json(updated);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Survey.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = router;
