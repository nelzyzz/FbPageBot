const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = 'pagebot';
let PAGE_ACCESS_TOKEN;

// Reading the Facebook Page Access Token from file (token.txt)
try {
  PAGE_ACCESS_TOKEN = fs.readFileSync('token.txt', 'utf8').trim();
} catch (error) {
  console.error('Error reading token file:', error);
  process.exit(1); // Exit the app if there's no token
}

// Facebook webhook verification
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

// Handle incoming messages
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message) {
          handleMessage(event, PAGE_ACCESS_TOKEN)
            .then(() => updatePageBio())
            .catch(error => console.error('Error handling message:', error));
        } else if (event.postback) {
          handlePostback(event, PAGE_ACCESS_TOKEN)
            .then(() => updatePageBio())
            .catch(error => console.error('Error handling postback:', error));
        }
      });
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Function to handle incoming messages (including GPT4O response)
async function handleMessage(event, PAGE_ACCESS_TOKEN) {
  const senderId = event.sender.id;
  const userMessage = event.message.text;

  try {
    await sendTypingIndicator(senderId, PAGE_ACCESS_TOKEN, true); // Start typing

    const botResponse = await fetchGPT4OResponse(userMessage); // Get response from GPT4O API

    await sendTypingIndicator(senderId, PAGE_ACCESS_TOKEN, false); // Stop typing
    await sendMessage(senderId, botResponse, PAGE_ACCESS_TOKEN); // Send GPT4O response back to the user
  } catch (error) {
    console.error('Error sending message:', error);
    await sendMessage(senderId, "Sorry, I'm having trouble processing your request.", PAGE_ACCESS_TOKEN);
  }
}

// Function to interact with your custom GPT4O API to get a response
async function fetchGPT4OResponse(input) {
  const apiUrl = `https://appjonellccapis.zapto.org/api/gpt4o?ask=${encodeURIComponent(input)}&id=1`;

  try {
    const response = await axios.get(apiUrl, {
      timeout: 5000, // Set a timeout to avoid hanging requests
    });

    // Check if the response format is as expected
    if (response.data && response.data.answer) {
      return response.data.answer;
    } else {
      console.error('Unexpected API response format:', response.data);
      return "Sorry, I couldn't understand the response.";
    }
  } catch (error) {
    if (error.response) {
      // Handle responses from the server (e.g., 4xx, 5xx errors)
      console.error('Error from GPT4O API:', error.response.data);
    } else if (error.request) {
      // Handle no response from the server (e.g., timeout)
      console.error('No response from GPT4O API:', error.request);
    } else {
      // Other errors
      console.error('Error in GPT4O request:', error.message);
    }
    return 'Sorry, I am unable to process your request at the moment.';
  }
}

// Function to send a typing indicator to Facebook Messenger
async function sendTypingIndicator(senderId, PAGE_ACCESS_TOKEN, isTyping) {
  const apiUrl = `https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  const action = isTyping ? 'typing_on' : 'typing_off'; // Define the action
  try {
    await axios.post(apiUrl, {
      recipient: { id: senderId },
      sender_action: action
    });
    console.log(`Typing indicator ${action} sent to user: ${senderId}`);
  } catch (error) {
    console.error(`Error sending typing indicator (${action}):`, error.response ? error.response.data : error.message);
  }
}

// Function to send message back to Facebook Messenger (existing)
async function sendMessage(senderId, message, PAGE_ACCESS_TOKEN) {
  const apiUrl = `https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

  try {
    await axios.post(apiUrl, {
      recipient: { id: senderId },
      message: { text: message }
    });
    console.log('Message sent successfully!');
  } catch (error) {
    console.error('Error sending message to Facebook:', error.response ? error.response.data : error.message);
  }
}

// Function to update the page bio (optional)
async function updatePageBio() {
  const bio = 'Please use /help to see all available commands'; // Customize your bio here
  const apiUrl = `https://graph.facebook.com/v17.0/me?bio=${encodeURIComponent(bio)}&access_token=${PAGE_ACCESS_TOKEN}`;

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
