const TelegramBot = require('node-telegram-bot-api');

// Ganti YOUR_TELEGRAM_BOT_TOKEN dengan token bot Anda dari BotFather
const token = '7534541078:AAGm61ixlg0eAwxX_PV_Pn0xiN7t0XhlXgo';
const bot = new TelegramBot(token, { polling: true });

// Admin IDs (Ganti dengan ID admin Telegram sebenarnya)
const adminIds = [5988451717];

// Penyimpanan sementara untuk pertanyaan dan jawaban yang ditambahkan secara dinamis
const dynamicQuestions = [];

// Pertanyaan dan jawaban yang telah ditentukan sebelumnya
const predefinedQuestions = {
  q1: 'Bagaimana cara bergabung dengan grup ini?\n\n_Untuk bergabung, Anda hanya perlu klik tautan undangan yang telah dibagikan, atau minta admin untuk menambahkan Anda._',
  q2: 'Apa aturan utama dalam grup ini?\n\n_Aturan utama biasanya meliputi: tidak ada spam, hormati sesama anggota, tidak ada konten SARA, dan hindari topik yang dapat memicu konflik._',
  q3: 'Siapa saja admin di grup ini?\n\n_Untuk melihat daftar admin, tanyakan langsung di grup._',
  q4: 'Apa yang harus dilakukan jika ada anggota yang melanggar aturan?\n\n_Laporkan ke admin dengan mengirim pesan pribadi._',
  q5: 'Setelah bergabung dengan grup ini, apa yang harus saya lakukan?\n\nA) *Berbagi aplikasi.*\nB) *Mengobrol tentang berbagai hal yang positif.*',
  q6: 'Grup apa ini?\n\n_Ini adalah grup berbagi aplikasi yang aktif 24 jam._',
  q7: 'Apakah ada apk yang bagus?\n\n_Pemilik grup merekomendasikan aplikasi ini. Silakan gunakan tautan ini untuk melakukan pendaftaran\n\nlink pendaftaran :\nhttps://ecomamoni.uk/join?i=18Fazb6)_',
  q8: 'Bisakah Anda menunjukkan bukti penarikan dana dari platform yang Anda rekomendasikan?\n\n_Ini adalah bukti screenshot yang bisa Anda lihat._',
  q9: 'Manfaat bergabung grup ini?\n\n_Akses informasi, berbagi pengetahuan, diskusi dengan orang sejenis, dan networking._',
  q10: 'Cara mengajukan saran?\n\n_Hubungi admin atau gunakan fitur saran yang tersedia di grup._',
  q11: 'Topik yang boleh dibahas?\n\n_Topik sesuai aturan grup. Hindari topik sensitif kecuali itu fokus grup._', 
  q12: 'Tujuan grup ini?\n\n_Berbagi informasi, diskusi, bantuan, dan membangun komunitas dengan minat yang sama.._', 
  q13: 'Siapa admin grup ini?\n\n_Anda bisa melihat di bawah deskripsi grup ini._', 
  q14: 'Bolehkah saya mengirimkan link grup ini?\n\n_Cek aturan grup atau tanyakan admin terlebih dahulu._', 
  q15: 'Apa grup ini selalu aktif?\n\n_Ya grup ini selalu aktif dan kamu bisa mengirimkan pesan apapun namun tetap mematuhi peraturan grup ini._'
};

// Fungsi pembantu untuk membuat menu utama secara dinamis
const getMainMenu = () => {
  // Mengonversi predefinedQuestions menjadi tombol keyboard inline
  const predefinedButtons = Object.keys(predefinedQuestions).map(key => {
    return [{ text: predefinedQuestions[key].split('\n')[0].replace('*', ''), callback_data: key }];
  });

  // Mengonversi dynamicQuestions menjadi tombol keyboard inline
  const dynamicButtons = dynamicQuestions.map((q, index) => [{ text: q.question, callback_data: `dynamic_q${index}` }]);

  // Menggabungkan tombol predefined dan dynamic
  const inline_keyboard = [...predefinedButtons, ...dynamicButtons, [{ text: 'Close', callback_data: 'close' }]];

  return { reply_markup: { inline_keyboard } };
};

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Silahkan kirimkan /bantuan untuk mendapatkan jawaban dari berbagai pertanyaan anda');
});

// /bantuan command
bot.onText(/\/bantuan/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username ? '@' + msg.from.username : 'Pengguna';
  bot.sendMessage(chatId, `Halo ${username},\n\nBerikut pertanyaan yang sering ditanyakan!`, getMainMenu());
});

// Command admin untuk menambahkan pertanyaan
bot.onText(/\/add/, (msg) => {
  if (!adminIds.includes(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, 'Maaf, anda tidak memiliki izin untuk menambahkan pertanyaan.');
  }

  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Silahkan kirimkan pertanyaan baru:');

  // Mendengarkan pesan berikutnya sebagai pertanyaan
  bot.once('message', (qMsg) => {
    if (qMsg.text) {
      const newQuestion = qMsg.text;
      bot.sendMessage(chatId, 'Terima kasih. sekarang kirimkan jawaban untuk pertanyaan ini (Anda dapat mengirim teks atau media dengan caption):');

      // Mendengarkan pesan berikutnya sebagai jawaban
      bot.once('message', (aMsg) => {
        const newAnswer = {
          type: aMsg.photo ? 'photo' : aMsg.video ? 'video' : aMsg.audio ? 'audio' : aMsg.document ? 'document' : 'text',
          content: aMsg.photo ? aMsg.photo[aMsg.photo.length - 1].file_id : aMsg.video ? aMsg.video.file_id : aMsg.audio ? aMsg.audio.file_id : aMsg.document ? aMsg.document.file_id : aMsg.text,
          caption: aMsg.caption || ''
        };

        dynamicQuestions.push({ question: newQuestion, answer: newAnswer });
        bot.sendMessage(chatId, 'pertanyaan dan jawaban telah ditambahkan ke daftar.', getMainMenu());
      });
    } else {
      bot.sendMessage(chatId, 'Pertanyaan tidak valid. silakan coba lagi.');
    }
  });
});

// Menangani query callback
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  if (data === 'close') {
    bot.editMessageText('Terimakasih sudah menggunakan bot ini, senang membantu anda! jika ada hal yang belum dimengerti silahkan hubungi admin grup.', {
      chat_id: chatId,
      message_id: message.message_id
    });
  } else if (predefinedQuestions[data]) {
    bot.editMessageText(predefinedQuestions[data], {
      chat_id: chatId,
      message_id: message.message_id,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Back', callback_data: 'back' }],
        ]
      }
    });
  } else if (data.startsWith('dynamic_q')) {
    const index = parseInt(data.slice(10), 10);
    const question = dynamicQuestions[index];

    if (question.answer.type === 'text') {
      bot.sendMessage(chatId, question.answer.content, {
        reply_to_message_id: message.message_id,
        parse_mode: 'Markdown'
      });
    } else {
      bot.sendChatAction(chatId, 'upload_' + question.answer.type);
      const mediaOptions = { caption: question.answer.caption };

      switch (question.answer.type) {
        case 'photo':
          bot.sendPhoto(chatId, question.answer.content, mediaOptions);
          break;
        case 'video':
          bot.sendVideo(chatId, question.answer.content, mediaOptions);
          break;
        case 'audio':
          bot.sendAudio(chatId, question.answer.content, mediaOptions);
          break;
        case 'document':
          bot.sendDocument(chatId, question.answer.content, mediaOptions);
          break;
      }
    }
  } else if (data === 'back') {
    bot.editMessageText('berikut pertanyaan yang sering ditanyakan!', {
      chat_id: chatId,
      message_id: message.message_id,
      reply_markup: getMainMenu().reply_markup
    });
  }
});

// Menangani pesan pengguna yang mirip dengan pertanyaan yang ada
bot.on('message', (msg) => {
  if (msg.text) {
    const chatId = msg.chat.id;
    const userMessage = msg.text.toLowerCase();

    // Cek pertanyaan yang telah ditentukan sebelumnya
    for (let key in predefinedQuestions) {
      const questionText = predefinedQuestions[key].split('\n')[0].toLowerCase().replace('*', '').replace('?', '');
      if (userMessage.includes(questionText)) {
        bot.sendMessage(chatId, predefinedQuestions[key], { parse_mode: 'Markdown' });
        return;
      }
    }

    // Cek pertanyaan dinamis
    for (let i = 0; i < dynamicQuestions.length; i++) {
      const questionText = dynamicQuestions[i].question.toLowerCase();
      if (userMessage.includes(questionText)) {
        const answer = dynamicQuestions[i].answer;
        if (answer.type === 'text') {
          bot.sendMessage(chatId, answer.content, { parse_mode: 'Markdown' });
        } else {
          bot.sendChatAction(chatId, 'upload_' + answer.type);
          const mediaOptions = { caption: answer.caption };

          switch (answer.type) {
            case 'photo':
              bot.sendPhoto(chatId, answer.content, mediaOptions);
              break;
            case 'video':
              bot.sendVideo(chatId, answer.content, mediaOptions);
              break;
            case 'audio':
              bot.sendAudio(chatId, answer.content, mediaOptions);
              break;
            case 'document':
              bot.sendDocument(chatId, answer.content, mediaOptions);
              break;
          }
        }
        return;
      }
    }
  }
});
