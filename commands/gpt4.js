const axios = require('axios');

module.exports = {
  name: 'gpt4',
  description: 'Ask a question to GPT-4',
  author: 'Deku (rest api)',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' ');

    if (prompt === "") {
      sendMessage(senderId, { text: "Usage: /gpt4 <question>" }, pageAccessToken);
      return; // Ensure the function doesn't continue
    }

    // Inform the user that content is being generated
    sendMessage(senderId, { text: 'Generating content... Please wait.' }, pageAccessToken);

    try {
      const apiUrl = `https://deku-rest-apis.ooguy.com/gpt4?prompt=${encodeURIComponent(prompt)}&uid=${senderId}`;
      const response = await axios.get(apiUrl);
      const text = response.data.gpt4;

      // Send the generated text to the user
      sendMessage(senderId, { text: "CHATBOT BY NELZY:\n\n" + text }, pageAccessToken);
    } catch (error) {
      console.error('Error calling GPT-4 API:', error);
      sendMessage(senderId, { text: 'There was an error generating the content. Please try again later.' }, pageAccessToken);
    }
  }
};
