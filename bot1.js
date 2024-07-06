const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const fs = require('fs');

// Replace with your bot token
const token = '7333688116:AAHtbTwk9U2tOJ6NGglyS-xWF_a4gPZ3KHg';
const bot = new TelegramBot(token, { polling: true });
const adminId = '5988451717';

let botUsername = '';

// Load existing media store from JSON file
let mediaStore = {};
if (fs.existsSync('mediaStore.json')) {
  mediaStore = JSON.parse(fs.readFileSync('mediaStore.json', 'utf8'));
}

// Save media store to JSON file
function saveMediaStore() {
  fs.writeFileSync('mediaStore.json', JSON.stringify(mediaStore, null, 2));
}

// Get bot username
bot.getMe().then(me => {
  botUsername = me.username;
});

// Function to generate deeplink URL
function generateDeeplink(userId, mediaId) {
  return `https://t.me/${botUsername}?start=key_${mediaId}`;
}

// Function to check if the user is a member of the channel
async function isUserMember(chatId, userId) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getChatMember?chat_id=@dagetfreenewnew&user_id=${userId}`);
    const result = await response.json();
    return result.result.status !== 'member';
  } catch (error) {
    console.error(error);
    return false;
  }
}

// Command /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  const isAdmin = chatId === 5988451717; // Assuming admin is the bot creator

  if (isAdmin) {
    bot.sendMessage(chatId, `🖐🏻 Hello Admin!\n\nHere is how to use the bot:\n\n1. To add media or text, send /add followed by the media or text.\n\n2. You will receive a deeplink to access the media or text.\n\n3. Only users who have joined the @dagetfreenewnew channel can access the media or text through the deeplink.`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Channel", url: "https://t.me/dagetfreenewnew" }]
        ]
      }
    });
  } else {
    bot.sendMessage(chatId, `🖐🏻 Halo @${username} Join Channel Kami Yuk! 💡`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Channel", url: "https://t.me/dagetfreenewnew" }]
        ]
      }
    });
  }
});

// Command /add
bot.onText(/\/add(.*)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const isAdmin = chatId === 5988451717; // Assuming admin is the bot creator
  const text = match[1].trim();

  if (msg.photo || msg.video || msg.document) {
    const mediaId = msg.message_id;
    mediaStore[mediaId] = {
      type: msg.photo ? 'photo' : msg.video ? 'video' : 'document',
      file_id: msg.photo ? msg.photo[msg.photo.length - 1].file_id : msg.video ? msg.video.file_id : msg.document.file_id,
      caption: text || msg.caption || ''
    };
    saveMediaStore();
    const deeplink = generateDeeplink(userId, mediaId);
    bot.sendMessage(chatId, `💡 Here is your deeplink: ${deeplink}`);
  } else if (text) {
    const mediaId = msg.message_id;
    mediaStore[mediaId] = { type: 'text', text };
    saveMediaStore();
    const deeplink = generateDeeplink(userId, mediaId);
    bot.sendMessage(chatId, `💡 Here is your deeplink: ${deeplink}`);
  } else {
    bot.sendMessage(chatId, "❗ Please provide media or text with the /add command.");
  }
});

// Handling deeplink access
bot.onText(/\/start (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  const [key, mediaId] = match[1].split('_');
  const media = mediaStore[mediaId];

  if (await isUserMember(chatId, userId)) {
    bot.sendMessage(chatId, `process..`, { parse_mode: "MarkdownV2" }).then(async (sentMsg) => {
      if (media.type === 'photo') {
        await bot.sendPhoto(chatId, media.file_id, { caption: media.caption });
      } else if (media.type === 'video') {
        await bot.sendVideo(chatId, media.file_id, { caption: media.caption });
      } else if (media.type === 'document') {
        await bot.sendDocument(chatId, media.file_id, { caption: media.caption });
      } else if (media.type === 'text') {
        await bot.sendMessage(chatId, media.text);
      }
      bot.editMessageText(media.caption || media.text || '', { chat_id: sentMsg.chat.id, message_id: sentMsg.message_id });
    });
  } else {
    bot.sendMessage(chatId, `🖐🏻 Halo @${username} Silahkan Join Channel Kami Terlebih Dahulu`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Channel", url: "https://t.me/dagetfreenewnew" }],
          [{ text: "Try Again", callback_data: `retry_key_${mediaId}` }]
        ]
      }
    });
  }
});

// Handle "Try Again" button
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const userId = callbackQuery.from.id;
  const username = callbackQuery.from.username;
  const [_, adminId, mediaId] = callbackQuery.data.split('_');
  const media = mediaStore[mediaId];

  if (await isUserMember(msg.chat.id, userId)) {
    bot.answerCallbackQuery(callbackQuery.id, { text: "process..", show_alert: true }).then(async () => {
      if (media.type === 'photo') {
        await bot.sendPhoto(msg.chat.id, media.file_id, { caption: media.caption });
      } else if (media.type === 'video') {
        await bot.sendVideo(msg.chat.id, media.file_id, { caption: media.caption });
      } else if (media.type === 'document') {
        await bot.sendDocument(msg.chat.id, media.file_id, { caption: media.caption });
      } else if (media.type === 'text') {
        await bot.sendMessage(msg.chat.id, media.text);
      }
    });
  } else {
    bot.sendMessage(msg.chat.id, `🖐🏻 Halo @${username} Silahkan Join Channel Kami Terlebih Dahulu`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Channel", url: "https://t.me/dagetfreenewnew" }],
          [{ text: "Try Again", callback_data: `retry_key_${mediaId}` }]
        ]
      }
    });
  }
});
