const express = require("express");
const router = express.Router();
const UserContext = require("../models/UserContext");

// Get user context
router.get("/:senderId", async (req, res) => {
  try {
    const user = await UserContext.findOne({ senderId: req.params.senderId });
    if (user) {
      res.status(200).json(user.context);
    } else {
      res.status(404).json({ message: "No context found for this user" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Set user context
router.post("/:senderId", async (req, res) => {
  try {
    const senderId = req.params.senderId;
    const newContext = req.body.context;

    await UserContext.updateOne(
      { senderId },
      { $set: { context: newContext } },
      { upsert: true }
    );

    res.status(200).json({ message: "Context updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Clear user context
router.delete("/:senderId", async (req, res) => {
  try {
    await UserContext.deleteOne({ senderId: req.params.senderId });
    res.status(200).json({ message: "Context cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});



module.exports = router;
