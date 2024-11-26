const mongoose = require("mongoose");

const userContextSchema = new mongoose.Schema({
    senderId: { type: String, required: true, unique: true },
    context: { type: Object, default: {} },
    history: [
      {
        message: String,
        botReply: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  });

module.exports = mongoose.model("UserContext", userContextSchema);
