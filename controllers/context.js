const UserContext = require("../models/UserContext");

async function getUserContext(senderId) {
    const user = await UserContext.findOne({ senderId });
    return user ? user.context : {};
  }
  
  async function setUserContext(senderId, newContext) {
    await UserContext.updateOne(
      { senderId },
      { $set: { context: newContext } },
      { upsert: true }
    );
  }
  
  async function clearUserContext(senderId) {
    await UserContext.deleteOne({ senderId });
  }

  async function saveConversation(senderId, userMessage, botReply) {
    await UserContext.updateOne(
      { senderId },
      {
        $push: {
          history: { message: userMessage, botReply },
        },
      },
      { upsert: true }
    );
  }

  async function getConversationHistory(senderId) {
    const user = await UserContext.findOne({ senderId });
    return user ? user.history : [];
  }
  

  module.exports = {getUserContext,setUserContext,clearUserContext,saveConversation,getConversationHistory};
  