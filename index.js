require("dotenv").config();

const fs = require("fs");
const { Mistral } = require("@mistralai/mistralai");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

const client = new Mistral({ apiKey: MISTRAL_API_KEY });

const bot = new TelegramBot(TOKEN, { polling: true });

const db = "./db.json";

function loadData() {
  if (fs.existsSync(db)) {
    return JSON.parse(fs.readFileSync(db, "utf8"));
  }
  return {};
}

function saveData(data) {
  fs.writeFileSync(db, JSON.stringify(data, null, 2), "utf8");
}

const helpMessage = `
Привет! Чем я могу помочь? Давайте проведем интересный и увлекательный разговор. Вот несколько вещей, которые мы можем сделать:

1. Викторина: Я могу задать вам вопросы на любую тему, или вы можете устроить викторину для меня.
2. Ассоциации: Я скажу слово, а вы ответите первым словом, которое приходит в голову. Мы можем чередоваться.
3. Построение истории: Мы будем поочередно добавлять предложения, создавая историю.
4. Шутки: Я могу рассказать вам шутки, или вы попробуете меня рассмешить.
5. Общий разговор: Мы можем обсудить широкий круг тем.

Что бы вы хотели сделать?
`;

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, helpMessage);
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const name = msg.from.first_name;
  const username = msg.from.username;

  if (!text || text.trim() === "") {
    bot.sendMessage(chatId, "Please, write your question.");
    return;
  }

  let data = loadData();

  if (!data[chatId]) {
    data[chatId] = {
      name,
      username,
      messages: [],
    };
  }

  data[chatId].messages.push(text);

  saveData(data);

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
