const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');
const axios = require('axios');

const commands = new Map();
const prefix = '';

// Load command files
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name.toLowerCase(), command);
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text.trim().toLowerCase();

  // Check if the user sends "prefix" (case insensitive)
  if (messageText === 'prefix') {
    sendMessage(senderId, { text: `The prefix for commands in this bot is "${prefix}".` }, pageAccessToken);
    return;
  }

  // Check if the message starts with the prefix
  if (!messageText.startsWith(prefix)) {
    // Call the sim feature if there's no prefix
    await callSimAPI(senderId, messageText, pageAccessToken);
    return;
  }

  // Proceed with processing the command if it has the correct prefix
  const args = messageText.slice(prefix.length).split(' ');
  const commandName = args.shift().toLowerCase();

  // Check if the user just sent the prefix "/"
  if (commandName === '') {
    sendMessage(senderId, { text: 'Invalid command. Please provide a valid command.\n\n type help to see all available command' }, pageAccessToken);
    return;
  }

  // Check if the command exists
  if (commands.has(commandName)) {
    const command = commands.get(commandName);
    try {
      await command.execute(senderId, args, pageAccessToken, sendMessage);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      sendMessage(senderId, { text: 'There was an error executing that command.' }, pageAccessToken);
    }
  } else {
    sendMessage(senderId, { text: `The command "${commandName}" is not available. Please use a valid command.\n\n type help to see all available command` }, pageAccessToken);
  }
}

// Function to call the Sim API
async function callSimAPI(senderId, messageText, pageAccessToken) {
  const APIKEY = 'nsh-9c511a1676801419a3e805751e7a35b2';
  const apiUrl = `https://ccprojectapis.ddns.net/api/gen?ask=${encodeURIComponent(messageText)}&apiKey=${APIKEY}`;

  try {
    const response = await axios.get(apiUrl);
    const simResponse = response.data.response;

    // Send the response from Sim back to the user
    sendMessage(senderId, { text: simResponse }, pageAccessToken);
  } catch (error) {
    console.error('Error calling Sim API:', error);
    sendMessage(senderId, { text: 'There was an error communicating with Sim. Please try again later.' }, pageAccessToken);
  }
}

module.exports = { handleMessage };
