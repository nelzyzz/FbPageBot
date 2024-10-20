const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'ai',
  description: 'Interact with Mixtral-8B AI model',
  author: 'coffee',

  async execute(senderId, args) {
    const pageAccessToken = token;

    if (!Array.isArray(args) || args.length === 0) {
      return await sendError(senderId, 'Error: Please provide a question or prompt for Mixtral-8B.', pageAccessToken);
    }

    const input = args.join(' ').trim();
    await handleMixtralResponse(senderId, input, pageAccessToken);
  },
};

const handleMixtralResponse = async (senderId, input, pageAccessToken) => {
  const apiUrl = `https://deku-rest-apis.ooguy.com/api/mixtral-8b?q=${encodeURIComponent(input)}`;

  try {
    const { data } = await axios.get(apiUrl);
    
    if (data.status && data.result) {
      const responseText = data.result;
      const formattedMessage = `🤖 | 𝙼𝚒𝚡𝚝𝚛𝚊𝚕-𝟾𝙱\n・───────────・\n${responseText}\n・──── >ᴗ< ────・`;

      await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);
    } else {
      await sendError(senderId, 'Error: Unable to get a valid response from Mixtral-8B.', pageAccessToken);
    }
  } catch (error) {
    console.error('Error processing Mixtral-8B request:', error);
    await sendError(senderId, 'Error: Unable to process your request to Mixtral-8B.', pageAccessToken);
  }
};

const sendError = async (senderId, errorMessage, pageAccessToken) => {
  await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
};
