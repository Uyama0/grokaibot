require("dotenv").config();

const { Mistral } = require("@mistralai/mistralai");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

const client = new Mistral({ apiKey: MISTRAL_API_KEY });

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
Hello! How can I assist you today? Let's have a friendly and engaging conversation. Here are a few things we could do:

1. Trivia: I can ask you questions on a topic of your choice, or you can quiz me.
2. Word association: I say a word, and you respond with the first word that comes to your mind. We can go back and forth.
3. Story building: We can take turns adding sentences to create a story.
4. Jokes: I can tell you some jokes, or you can try to make me laugh.
5. General conversation: We can discuss a wide range of topics.

What would you like to do?
`;

  bot.sendMessage(chatId, helpMessage);
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.trim() === "") {
    bot.sendMessage(chatId, "Please, write your question.");
    return;
  }

  try {
    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [{ role: "user", content: text }],
    });

    const reply =
      response.choices[0]?.message?.content?.trim() ||
      "Something went wrong, try again...";

    bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error("Ai error:", error);
    bot.sendMessage(chatId, "Something went wrong, try again...");
  }
});
