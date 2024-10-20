const axios = require('axios');

module.exports = {
    name: "ai",
    aliases: ["ai"],
    description: "Interact with the GPT-4 API or analyze images",
    author: "Coffee",

    async execute(message, senderId, args, pageAccessToken, sendMessage) {
        const prompt = args.join(" ") || "hi"; 
        const header = "(⁠◍⁠•⁠ᴗ⁠•⁠◍⁠) | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n・──────────────・";
        const footer = "・───── >ᴗ< ──────・";

        // Check for image attachments in the original message
        if (message.messageReply && message.messageReply.attachments && message.messageReply.attachments[0]?.type === "photo") {
            const attachment = message.messageReply.attachments[0];
            const imageURL = attachment.url;
            try {
                const geminiUrl = `https://joncll.serv00.net/chat.php?ask=${encodeURIComponent(prompt)}&imgurl=${encodeURIComponent(imageURL)}`;
                const response = await axios.get(geminiUrl);
                const { vision } = response.data;

                if (vision) {
                    await message.reply(`${header}\n${vision}\n${footer}`);
                } else {
                    await message.reply(`${header}\nFailed to recognize the image.\n${footer}`);
                }
            } catch (error) {
                console.error("Error fetching image recognition:", error);
                await message.reply(`${header}\nAn error occurred while processing the image.\n${footer}`);
            }
            return; // Exit after processing image
        }

        // Handle text queries using the GPT-4 API
        try {
            const { data } = await axios.get(`https://lorex-gpt4.onrender.com/api/gpt4?prompt=${encodeURIComponent(prompt)}&uid=${senderId}`);

            if (data && data.response) {
                await message.reply(`${header}\n${data.response}\n${footer}`);
            } else {
                await message.reply(`${header}\nSorry, I couldn't get a response from the API.\n${footer}`);
            }
        } catch (error) {
            console.error("Error fetching from GPT-4 API:", error);
            await message.reply(`${header}\nAn error occurred while trying to reach the API.\n${footer}`);
        }
    }
};
