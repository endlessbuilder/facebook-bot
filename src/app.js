const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const dotenv = require("dotenv");
const connectDB = require("../config/db");
const contextRoutes = require("../routes/context");
const { getUserContext, clearUserContext, setUserContext, getConversationHistory, saveConversation } = require("../controllers/context");
const { getChatGPTResponse } = require("../utils");

dotenv.config();
connectDB();

// Initialize Express app
const app = express();
app.use(bodyParser.json());
// Middleware
app.use(express.json());

// Routes
app.use("/api/context", contextRoutes);

// Configuration Variables
const PORT = process.env.PORT || 3000;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const MAX_HISTORY_LENGTH = 5;



// Check inventory
// function checkInventory(msg) {
//   for (const key in inventory) {
//     if (msg.toLowerCase().includes(key.toLowerCase())) {
//       return inventory[key];
//     }
//   }
//   return null;
// }

app.get("/",(req,res) => {
  res.json({status:"working"})
})

// Webhook Verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

const isWithinOperationalHours = () => {
  const now = new Date();
  const day = now.getDay();
  const time = now.getHours() + now.getMinutes() / 60;

  if (day >= 1 && day <= 5) return time >= 9 && time <= 18; // Weekdays
  if (day === 0 || day === 6) return time >= 10 && time <= 16; // Weekends
  return false;
};


// Handle Incoming Messages
app.post("/webhook", async (req, res) => {
  const body = req.body;
  console.log(body.object ,"object ");

  if (body.object === "page") {
    body.entry.forEach(async (entry) => {
     try {
      const webhookEvent = entry.messaging[0];
      console.log(webhookEvent,"webhookEvent");

      const senderId = webhookEvent.sender.id;

      if (!senderId || !webhookEvent.message.text) {
        console.warn("Invalid message format");
        return;
      }

      if (webhookEvent.message && webhookEvent.message.text) {
        const receivedMessage = webhookEvent.message.text;
        console.log(`Received message: ${receivedMessage}`);
        const context = getUserContext(senderId);
        const history = await getConversationHistory(senderId);
        let botReply;

        // if (receivedMessage.includes("warehouse")) {
        //   botReply = "Our warehouse is located at 123 Commerce Street. Here's a photo: [link].";
        // }
        //  else if (receivedMessage.includes("discount")) {
        //   botReply = "We can offer you a 10% discount for pickup today. Does that work?";
        // }

        // const product = checkInventory(receivedMessage);
        // if (product) {
        //   await setUserContext(senderId, { lastProduct: product.name });
        //   botReply = `We have ${product.quantity} ${product.name}(s) available at $${product.price} each. Interested?`;
        // } else {
        //   // Fetch ChatGPT response with history for context
        //   const conversationContext = history.slice(-MAX_HISTORY_LENGTH).map(
        //       (entry) =>
        //         `User: ${entry.message}\nBot: ${entry.botReply}`
        //     )
        //     .join("\n");
        //   botReply = await getChatGPTResponse(receivedMessage, conversationContext);
        // }
       if (receivedMessage.toLowerCase().includes("done")) {
          clearUserContext(senderId);
        } else {      
            // Fetch ChatGPT response with history for context
            const conversationContext = history.slice(-MAX_HISTORY_LENGTH).map(
                (entry) =>
                  `User: ${entry.message}\nBot: ${entry.botReply}`
              )
              .join("\n");
            botReply = await getChatGPTResponse(receivedMessage, conversationContext);
          }
         // Save the conversation
         await saveConversation(senderId, receivedMessage, botReply);
        sendMessage(senderId, botReply);
      }
     } catch (error) {
      console.error("Error processing webhook event:", error);
     }
    });
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// Sends response messages via the Send API
function sendMessage(recipientId, text) {
  const url = `https://graph.facebook.com/v11.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const messageData = {
    recipient: { id: recipientId },
    message: { text: text },
  };

  axios
    .post(url, messageData)
    .then((response) => {
      console.log("Message sent:", response.data);
    })
    .catch((error) => {
      console.error("Error sending message:", error.response?.data?.error);
    });
}


// // Example Payment Methods
// function getPaymentMethods() {
//   return "We accept Cash, Venmo, Paypal, and Zelle. Which one works for you?";
// }

// // Example: Send warehouse details with photo
// function sendWarehouseDetails(recipientId) {
//   const url = `https://graph.facebook.com/v11.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
//   const messageData = {
//     recipient: { id: recipientId },
//     message: {
//       text: "Our warehouse is at 123 Commerce Street. Here's a photo for reference:",
//       attachment: {
//         type: "image",
//         payload: {
//           url: "https://example.com/warehouse-photo.jpg",
//         },
//       },
//     },
//   };
//   axios
//     .post(url, messageData)
//     .then((response) => {
//       console.log("Warehouse details sent:", response.data);
//     })
//     .catch((error) => {
//       console.error(
//         "Error sending warehouse details:",
//         error.response?.data?.error
//       );
//     });
// }

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});