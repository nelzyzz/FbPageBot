const axios = require('axios');
const fs = require('fs');

const { sendMessage, sendError } = require('../handles/messageUtils');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'ai',
  description: 'Interact with the GPT-4o API',
  usage: '-gpt4o [hello!, how can i assist you today?]',
  author: 'coffee',

  async execute(senderId, args) {
    const input = this.parseInput(args);
    if (!input) {
      return await sendError(senderId, 'Error: Missing input!', token);
    }

    try {
      const response = await this.fetchGPT4OResponse(input);
      await sendMessage(senderId, this.formatResponse(response), token);
    } catch (error) {
      console.error('Error processing input:', error);
      await sendError(senderId, 'Error: Unexpected error occurred while processing the input.', token);
    }
  },

  parseInput(args) {
    if (!Array.isArray(args) || args.length === 0) {
      return null;
    }
    return args.join(' ').trim();
  },

  async fetchGPT4OResponse(input) {
    const apiUrl = `https://appjonellccapis.zapto.org/api/gpt4o?ask=${encodeURIComponent(input)}&id=1`;
    const { data } = await axios.get(apiUrl);
    return data;
  },

  formatResponse(data) {
    if (data.status) {
      return `🗨️ | 𝙶𝙿𝚃-4𝚘\n・───────────・\n${data.response || 'This is an example response.'}\n・──── >ᴗ< ────・`;
    }
    return 'Error: Unable to fetch response.';
  },
};
