const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { handleMessage } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');
const { sendMessage } = require('./handles/sendMessage'); // Assuming sendMessage.js has the sendMessage function
const axios = require('axios'); // Import axios for making API requests

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = 'pagebot';
const PAGE_ACCESS_TOKEN = fs.readFileSync('token.txt', 'utf8').trim();

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message) {
          // Send typing indicator before handling the message
          sendTypingIndicator(event.sender.id).then(() => {
            handleMessage(event, PAGE_ACCESS_TOKEN).then(() => updatePageBio()); // Update bio after successful execution
          });
        } else if (event.postback) {
          // Send typing indicator before handling the postback
          sendTypingIndicator(event.sender.id).then(() => {
            handlePostback(event, PAGE_ACCESS_TOKEN).then(() => updatePageBio()); // Update bio after successful postback execution
          });
        }
      });
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Function to send a typing indicator
async function sendTypingIndicator(recipientId) {
  const apiUrl = `https://graph.facebook.com/v13.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  
  const messageData = {
    recipient: { id: recipientId },
    sender_action: 'typing_on'
  };

  try {
    await axios.post(apiUrl, messageData);
    console.log(`Sent typing indicator to ${recipientId}`);
  } catch (error) {
    console.error('Error sending typing indicator:', error);
  }
}

// Function to update the page bio
async function updatePageBio() {
  const bio = 'This is the new bio for CarlJohn Bot, updated after successful execution!'; 
  const apiUrl = `https://graph.facebook.com/v13.0/me?bio=${encodeURIComponent(bio)}&access_token=${PAGE_ACCESS_TOKEN}`;

  try {
    const response = await axios.post(apiUrl);
    console.log('Page bio updated successfully:', response.data);
  } catch (error) {
    console.error('Error updating page bio:', error);
  }
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
