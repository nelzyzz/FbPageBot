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
          handleMessage(event, PAGE_ACCESS_TOKEN).then(() => updatePageBio()); // Update bio after successful execution
        } else if (event.postback) {
          handlePostback(event, PAGE_ACCESS_TOKEN).then(() => updatePageBio()); // Update bio after successful postback execution
        }
      });
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Function to update the page bio
async function updatePageBio() {
  const bio = 'please use /help to see all available command'; // Customize your bio here
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
