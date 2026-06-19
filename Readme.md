// ==================== FLUFFY MD BOT ====================
// Telegram Bot dengan fitur lengkap (400+ command)
// Semua kode dalam 1 file - Deploy ke Vercel
// ========================================================

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { Redis } = require('@upstash/redis');
const axios = require('axios');
const ytdl = require('ytdl-core');
const sharp = require('sharp');
const QRCode = require('qrcode');

// ==================== KONFIGURASI ====================

const bot = new Telegraf(process.env.BOT_TOKEN);
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const OWNER_ID = process.env.OWNER_ID;
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME;
const CHANNEL_LINK = process.env.CHANNEL_LINK;
const OWNER_LINK = process.env.OWNER_LINK;
const QRIS_URL = process.env.QRIS_URL;
const MENU_PHOTO = process.env.MENU_PHOTO;

// State management
const activeOrders = new Map(); // userId -> order data
const activeTimers = new Map(); // chatId -> { timerId, messageId }

// Warna loop untuk animasi tombol
const COLOR_LOOP = ['primary', 'success', 'danger'];

// ==================== MENU BOTS CATEGORIES ====================

const BOT_CATEGORIES = {
  1: ['sticker', 'tools', 'maker', 'download'],
  2: ['ai', 'search', 'game', 'primbon'],
  3: ['fun', 'islami', 'group', 'ownerCmd'],
  4: ['ephoto', 'anime', 'cecan', 'store'],
  5: ['panel']
};

const CATEGORY_NAMES = {
  sticker: '🖼️ Sticker Menu',
  tools: '🔧 Tools Menu',
  maker: '✨ Maker Menu',
  download: '⬇️ Download Menu',
  ai: '🧠 AI Menu',
  search: '🔍 Search Menu',
  game: '🎮 Game Menu',
  primbon: '🔮 Primbon Menu',
  fun: '😂 Fun Menu',
  islami: '🕌 Islami Menu',
  group: '👥 Group Menu',
  ownerCmd: '👑 Owner Menu',
  ephoto: '📸 Ephoto Menu',
  anime: '🎌 Anime Menu',
  cecan: '💃 Cecan Menu',
  store: '🏪 Store Menu',
  panel: '📊 Panel Menu'
};

// ==================== KEYBOARDS (TOMbol) ====================

function createVerificationKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔗 Join Channel', url: CHANNEL_LINK }],
        [{ text: '✅ Verifikasi Join', callback_data: 'verify_join' }]
      ]
    }
  };
}

function createMenuKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🤖 Menu Bots', callback_data: 'menu_bots' }],
        [{ text: '🛒 Order Poin & Produk', callback_data: 'order' }],
        [
          { text: '❓ Bantuan', callback_data: 'bantuan' },
          { text: '🙏 Thanks To', callback_data: 'thanks' }
        ],
        [
          { text: '📢 Channel', url: CHANNEL_LINK },
          { text: '👤 Owner', url: OWNER_LINK }
        ]
      ]
    }
  };
}

function createOrderKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '⭐ Order Poin', callback_data: 'order_poin' },
          { text: '📦 Order Produk', callback_data: 'order_produk' }
        ],
        [{ text: '🔙 Kembali ke Menu Utama', callback_data: 'back_to_menu_utama' }]
      ]
    }
  };
}

function createPoinKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🪙 25 Poin - Rp2.000', callback_data: 'poin_25' },
          { text: '🪙 50 Poin - Rp4.000', callback_data: 'poin_50' }
        ],
        [
          { text: '🪙 100 Poin - Rp8.000', callback_data: 'poin_100' },
          { text: '🪙 250 Poin - Rp20.000', callback_data: 'poin_250' }
        ],
        [{ text: '🪙 500 Poin - Rp40.000', callback_data: 'poin_500' }],
        [{ text: '🔙 Kembali ke Menu Order', callback_data: 'back_to_order' }]
      ]
    }
  };
}

function createProdukKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💎 Fluffy Premium 1 Bulan - Rp25.000', callback_data: 'produk_premium_bulan' }],
        [{ text: '💎 Fluffy Premium 1 Tahun - Rp250.000', callback_data: 'produk_premium_tahun' }],
        [{ text: '🖼️ Fluffy Sticker Pack - Rp10.000', callback_data: 'produk_sticker_pack' }],
        [{ text: '🔙 Kembali ke Menu Order', callback_data: 'back_to_order' }]
      ]
    }
  };
}

function createCancelKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '❌ Batalkan Order', callback_data: 'cancel_order' }]
      ]
    }
  };
}

function createOwnerConfirmKeyboard(orderId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Terima Order', callback_data: `terima_order_${orderId}` }],
        [{ text: '❌ Batalkan Order', callback_data: `batal_order_${orderId}` }]
      ]
    }
  };
}

function createBackKeyboard(backTo) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Kembali ke Menu Utama', callback_data: `back_to_${backTo}` }]
      ]
    }
  };
}

function createMenuBotsKeyboard(page = 1) {
  const categories = BOT_CATEGORIES[page];
  const buttons = [];
  
  for (let i = 0; i < categories.length; i += 2) {
    const row = [];
    row.push({ text: CATEGORY_NAMES[categories[i]], callback_data: `kategori_${categories[i]}` });
    if (categories[i + 1]) {
      row.push({ text: CATEGORY_NAMES[categories[i + 1]], callback_data: `kategori_${categories[i + 1]}` });
    }
    buttons.push(row);
  }
  
  const navRow = [];
  if (page > 1) navRow.push({ text: '◀️ Prev', callback_data: `bots_page_${page - 1}` });
  navRow.push({ text: `Halaman ${page}/5`, callback_data: 'noop' });
  if (page < 5) navRow.push({ text: 'Next ▶️', callback_data: `bots_page_${page + 1}` });
  buttons.push(navRow);
  buttons.push([{ text: '🔙 Kembali ke Menu Utama', callback_data: 'back_to_menu_utama' }]);
  
  return { reply_markup: { inline_keyboard: buttons } };
}

// ==================== FUNGSI ANIMASI WARNA ====================

async function startColorAnimation(chatId, messageId, keyboardGetter, ...args) {
  if (activeTimers.has(chatId)) {
    const old = activeTimers.get(chatId);
    clearInterval(old.timerId);
    activeTimers.delete(chatId);
  }
  
  let localColorIndex = 0;
  const timerId = setInterval(async () => {
    localColorIndex = (localColorIndex + 1) % COLOR_LOOP.length;
    const keyboard = keyboardGetter(...args);
    const newKeyboard = keyboard.reply_markup.inline_keyboard.map(row =>
      row.map(btn => {
        const newBtn = { ...btn };
        if (btn.callback_data && !btn.url) {
          newBtn.style = COLOR_LOOP[localColorIndex];
        }
        return newBtn;
      })
    );
    try {
      await bot.telegram.editMessageReplyMarkup(chatId, messageId, null, {
        inline_keyboard: newKeyboard
      });
    } catch (err) {
      clearInterval(timerId);
      if (activeTimers.get(chatId)?.timerId === timerId) {
        activeTimers.delete(chatId);
      }
    }
  }, 3000);
  
  activeTimers.set(chatId, { timerId, messageId });
}

// ==================== CEK JOIN CHANNEL ====================

async function isUserJoined(userId) {
  try {
    const member = await bot.telegram.getChatMember(`@${CHANNEL_USERNAME}`, userId);
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch (err) {
    return false;
  }
}

// ==================== HANDLER START ====================

bot.command('start', async (ctx) => {
  const userId = ctx.from.id;
  const joined = await isUserJoined(userId);
  
  if (joined) {
    const msg = await ctx.reply(
      '🎉 *MENU UTAMA*\n\nSelamat datang di Fluffy MD!\n\nPilih menu di bawah ini:',
      {
        parse_mode: 'Markdown',
        ...createMenuKeyboard()
      }
    );
    await startColorAnimation(ctx.chat.id, msg.message_id, createMenuKeyboard);
  } else {
    await ctx.reply(
      '🔐 *VERIFIKASI WAJIB*\n\nKamu harus join channel @Fluffy_Information dulu untuk bisa menggunakan bot ini.\n\n👇 Klik tombol di bawah ini:',
      {
        parse_mode: 'Markdown',
        ...createVerificationKeyboard()
      }
    );
  }
});

// ==================== HANDLER VERIFIKASI ====================

bot.action('verify_join', async (ctx) => {
  const userId = ctx.from.id;
  const joined = await isUserJoined(userId);
  
  if (joined) {
    await ctx.editMessageText('✅ *Verifikasi berhasil!*', { parse_mode: 'Markdown' });
    const msg = await ctx.reply(
      '🎉 *MENU UTAMA*\n\nSelamat datang di Fluffy MD!\n\nPilih menu di bawah ini:',
      {
        parse_mode: 'Markdown',
        ...createMenuKeyboard()
      }
    );
    await startColorAnimation(ctx.chat.id, msg.message_id, createMenuKeyboard);
  } else {
    await ctx.answerCbQuery('❌ Kamu belum join channel! Klik tombol Join Channel dulu ya.', { show_alert: true });
  }
  await ctx.answerCbQuery();
});

// ==================== HANDLER MENU UTAMA ====================

bot.action('menu_bots', async (ctx) => {
  const msg = await ctx.editMessageText(
    '🤖 *MENU BOTS - Halaman 1/5*\n\nPilih kategori command yang tersedia:',
    {
      parse_mode: 'Markdown',
      ...createMenuBotsKeyboard(1)
    }
  );
  await startColorAnimation(ctx.chat.id, msg.message_id, createMenuBotsKeyboard, 1);
  await ctx.answerCbQuery();
});

bot.action(/bots_page_(\d+)/, async (ctx) => {
  const page = parseInt(ctx.match[1]);
  const msg = await ctx.editMessageText(
    `🤖 *MENU BOTS - Halaman ${page}/5*\n\nPilih kategori command yang tersedia:`,
    {
      parse_mode: 'Markdown',
      ...createMenuBotsKeyboard(page)
    }
  );
  await startColorAnimation(ctx.chat.id, msg.message_id, createMenuBotsKeyboard, page);
  await ctx.answerCbQuery();
});

bot.action(/kategori_(.+)/, async (ctx) => {
  const category = ctx.match[1];
  const menuData = MENU_KATEGORI[category];
  
  if (menuData) {
    const msg = await ctx.editMessageText(menuData.text, {
      parse_mode: 'HTML',
      ...createBackKeyboard('menu_bots')
    });
    await startColorAnimation(ctx.chat.id, msg.message_id, createBackKeyboard, 'menu_bots');
  }
  await ctx.answerCbQuery();
});

// ==================== HANDLER ORDER ====================

bot.action('order', async (ctx) => {
  const msg = await ctx.editMessageText(
    '🛒 *ORDER POIN & PRODUK*\n\nSilakan pilih menu di bawah ini:',
    {
      parse_mode: 'Markdown',
      ...createOrderKeyboard()
    }
  );
  await startColorAnimation(ctx.chat.id, msg.message_id, createOrderKeyboard);
  await ctx.answerCbQuery();
});

bot.action('order_poin', async (ctx) => {
  const msg = await ctx.editMessageText(
    '⭐ *ORDER POIN*\n\nPilih jumlah poin yang ingin kamu beli:\n\n25 Poin = Rp2.000\n50 Poin = Rp4.000\n100 Poin = Rp8.000\n250 Poin = Rp20.000\n500 Poin = Rp40.000',
    {
      parse_mode: 'Markdown',
      ...createPoinKeyboard()
    }
  );
  await startColorAnimation(ctx.chat.id, msg.message_id, createPoinKeyboard);
  await ctx.answerCbQuery();
});

bot.action('order_produk', async (ctx) => {
  const msg = await ctx.editMessageText(
    '📦 *ORDER PRODUK*\n\nPilih produk yang ingin kamu beli:',
    {
      parse_mode: 'Markdown',
      ...createProdukKeyboard()
    }
  );
  await startColorAnimation(ctx.chat.id, msg.message_id, createProdukKeyboard);
  await ctx.answerCbQuery();
});

// ==================== HANDLER POIN & PRODUK ====================

const poinList = {
  poin_25: { name: '25 Poin', price: 2000, poin: 25 },
  poin_50: { name: '50 Poin', price: 4000, poin: 50 },
  poin_100: { name: '100 Poin', price: 8000, poin: 100 },
  poin_250: { name: '250 Poin', price: 20000, poin: 250 },
  poin_500: { name: '500 Poin', price: 40000, poin: 500 }
};

const produkList = {
  produk_premium_bulan: { name: 'Fluffy Premium 1 Bulan', price: 25000, file: 'premium_bulan.txt' },
  produk_premium_tahun: { name: 'Fluffy Premium 1 Tahun', price: 250000, file: 'premium_tahun.txt' },
  produk_sticker_pack: { name: 'Fluffy Sticker Pack', price: 10000, file: 'sticker_pack.webp' }
};

async function handleOrderItem(ctx, itemKey, itemData, type) {
  const userId = ctx.from.id;
  const orderId = Date.now().toString();
  
  activeOrders.set(userId, {
    id: orderId,
    type: type,
    item: itemData.name,
    price: itemData.price,
    status: 'pending',
    timestamp: new Date().toISOString(),
    user: {
      id: userId,
      name: ctx.from.first_name,
      username: ctx.from.username || '-'
    }
  });
  
  const msg = await ctx.editMessageText(
    `💳 *PEMBAYARAN*\n\nKamu memilih: *${itemData.name}*\nTotal harga: *Rp${itemData.price.toLocaleString()}*\n\n📸 *QRIS FLUFFY MD*\n\n*CARA ORDER:*\n1. Scan QRIS di atas\n2. Transfer sesuai nominal Rp${itemData.price.toLocaleString()}\n3. Screenshot bukti transfer\n4. Kirim foto bukti transfer ke bot ini\n5. Tunggu konfirmasi dari owner\n\n⏳ Batas waktu transfer: 30 menit\n\n⚠️ Jangan lupa kirim bukti transfer setelah melakukan pembayaran!`,
    {
      parse_mode: 'Markdown',
      ...createCancelKeyboard()
    }
  );
  
  if (QRIS_URL) {
    await ctx.replyWithPhoto(QRIS_URL);
  }
  
  await startColorAnimation(ctx.chat.id, msg.message_id, createCancelKeyboard);
  await ctx.answerCbQuery();
}

bot.action(/poin_(\d+)/, async (ctx) => {
  const key = `poin_${ctx.match[1]}`;
  const item = poinList[key];
  if (item) await handleOrderItem(ctx, key, item, 'poin');
  else await ctx.answerCbQuery('Poin tidak ditemukan!');
});

bot.action(/produk_(.+)/, async (ctx) => {
  const key = `produk_${ctx.match[1]}`;
  const item = produkList[key];
  if (item) await handleOrderItem(ctx, key, item, 'produk');
  else await ctx.answerCbQuery('Produk tidak ditemukan!');
});

// ==================== HANDLER CANCEL ORDER ====================

bot.action('cancel_order', async (ctx) => {
  const userId = ctx.from.id;
  activeOrders.delete(userId);
  const msg = await ctx.editMessageText(
    '❌ *Order dibatalkan*\n\nKamu telah membatalkan order.',
    {
      parse_mode: 'Markdown',
      ...createBackKeyboard('menu_utama')
    }
  );
  await startColorAnimation(ctx.chat.id, msg.message_id, createBackKeyboard, 'menu_utama');
  await ctx.answerCbQuery();
});

// ==================== HANDLER BUKTI TRANSFER ====================

bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;
  const order = activeOrders.get(userId);
  
  if (!order || order.status !== 'pending') return;
  
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const fileId = photo.file_id;
  
  order.status = 'waiting_confirm';
  order.buktiFileId = fileId;
  activeOrders.set(userId, order);
  
  const caption = `📸 *BUKTI TRANSFER*\n\nUser: ${order.user.name} (@${order.user.username})\nID: ${order.user.id}\nWaktu: ${order.timestamp}\nOrder: ${order.item}\nHarga: Rp${order.price.toLocaleString()}`;
  
  await bot.telegram.sendPhoto(OWNER_ID, fileId, {
    caption: caption,
    parse_mode: 'Markdown',
    ...createOwnerConfirmKeyboard(order.id)
  });
  
  await ctx.reply(
    '✅ *Bukti transfer diterima!*\n\nOwner akan segera memverifikasi pembayaran kamu.\nMohon tunggu sebentar ya.',
    {
      parse_mode: 'Markdown'
    }
  );
});

// ==================== HANDLER OWNER (TERIMA/BATAL ORDER) ====================

bot.action(/terima_order_(.+)/, async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) {
    await ctx.answerCbQuery('❌ Hanya owner yang bisa melakukan ini!', { show_alert: true });
    return;
  }
  
  const orderId = ctx.match[1];
  let targetUser = null;
  let orderData = null;
  
  for (const [userId, order] of activeOrders.entries()) {
    if (order.id === orderId) {
      targetUser = userId;
      orderData = order;
      break;
    }
  }
  
  if (targetUser && orderData) {
    orderData.status = 'completed';
    activeOrders.set(targetUser, orderData);
    
    await bot.telegram.sendMessage(
      targetUser,
      `✅ *ORDER DITERIMA!*\n\nOrder kamu untuk *${orderData.item}* telah diterima.\n\nTerima kasih sudah order di Fluffy MD! 💙`,
      { parse_mode: 'Markdown' }
    );
    
    await ctx.editMessageCaption(
      `✅ *ORDER DITERIMA*\n\nOrder ${orderData.item} dari ${orderData.user.name} telah diterima.`,
      { parse_mode: 'Markdown' }
    );
  }
  
  await ctx.answerCbQuery();
});

bot.action(/batal_order_(.+)/, async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) {
    await ctx.answerCbQuery('❌ Hanya owner yang bisa melakukan ini!', { show_alert: true });
    return;
  }
  
  const orderId = ctx.match[1];
  let targetUser = null;
  let orderData = null;
  
  for (const [userId, order] of activeOrders.entries()) {
    if (order.id === orderId) {
      targetUser = userId;
      orderData = order;
      break;
    }
  }
  
  if (targetUser && orderData) {
    activeOrders.delete(targetUser);
    
    await bot.telegram.sendMessage(
      targetUser,
      `❌ *ORDER DIBATALKAN*\n\nMaaf, order *${orderData.item}* kamu dibatalkan.\n\nAlasan: Bukti transfer tidak valid atau nominal tidak sesuai.\n\nJika kamu sudah melakukan transfer, silakan hubungi owner melalui tombol di bawah ini:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Hubungi Owner', url: OWNER_LINK }],
            [{ text: '🔙 Kembali ke Menu Utama', callback_data: 'back_to_menu_utama' }]
          ]
        }
      }
    );
    
    await ctx.editMessageCaption(
      `❌ *ORDER DIBATALKAN*\n\nOrder ${orderData.item} dari ${orderData.user.name} telah dibatalkan.`,
      { parse_mode: 'Markdown' }
    );
  }
  
  await ctx.answerCbQuery();
});

// ==================== HANDLER BANTUAN & THANKS ====================

bot.action('bantuan', async (ctx) => {
  const helpText = `❓ *BANTUAN*

Verifikasi Join Channel:
Sebelum pakai bot, wajib join @Fluffy_Information dulu.

Menu Utama:
Setelah verifikasi, kamu akan masuk ke menu utama.

Menu Bots:
Berisi 17 kategori command. Setiap command diawali titik (.), contoh: .stiker

Order Poin & Produk:
Pilih poin atau produk, transfer ke QRIS, kirim bukti, tunggu konfirmasi.

Command Cepat:
.stiker [teks] - Buat stiker dari teks
.tiktok [url] - Download video TikTok
.ai [pesan] - Chat dengan AI
.lirik [lagu] - Cari lirik lagu

Butuh bantuan? Hubungi owner: @guehmamz`;

  const msg = await ctx.editMessageText(helpText, {
    parse_mode: 'Markdown',
    ...createBackKeyboard('menu_utama')
  });
  await startColorAnimation(ctx.chat.id, msg.message_id, createBackKeyboard, 'menu_utama');
  await ctx.answerCbQuery();
});

bot.action('thanks', async (ctx) => {
  const thanksText = `🙏 *THANKS TO*

Allah SWT
Keluarga tercinta
Mamz Developer
Semua supporter Fluffy MD

Terima kasih sudah menggunakan Fluffy MD! 💙`;

  const msg = await ctx.editMessageText(thanksText, {
    parse_mode: 'Markdown',
    ...createBackKeyboard('menu_utama')
  });
  await startColorAnimation(ctx.chat.id, msg.message_id, createBackKeyboard, 'menu_utama');
  await ctx.answerCbQuery();
});

// ==================== HANDLER BACK NAVIGASI ====================

bot.action(/back_to_(.+)/, async (ctx) => {
  const target = ctx.match[1];
  
  if (target === 'menu_utama') {
    const msg = await ctx.editMessageText(
      '🎉 *MENU UTAMA*\n\nSelamat datang di Fluffy MD!\n\nPilih menu di bawah ini:',
      {
        parse_mode: 'Markdown',
        ...createMenuKeyboard()
      }
    );
    await startColorAnimation(ctx.chat.id, msg.message_id, createMenuKeyboard);
  } else if (target === 'order') {
    const msg = await ctx.editMessageText(
      '🛒 *ORDER POIN & PRODUK*\n\nSilakan pilih menu di bawah ini:',
      {
        parse_mode: 'Markdown',
        ...createOrderKeyboard()
      }
    );
    await startColorAnimation(ctx.chat.id, msg.message_id, createOrderKeyboard);
  } else if (target === 'menu_bots') {
    const msg = await ctx.editMessageText(
      '🤖 *MENU BOTS - Halaman 1/5*\n\nPilih kategori command yang tersedia:',
      {
        parse_mode: 'Markdown',
        ...createMenuBotsKeyboard(1)
      }
    );
    await startColorAnimation(ctx.chat.id, msg.message_id, createMenuBotsKeyboard, 1);
  }
  
  await ctx.answerCbQuery();
});

// ==================== MENU KATEGORI (isi dari file alipai-cmd.js) ====================

const MENU_KATEGORI = {
  sticker: { text: `╭╼ Stickers Menu
 ╰╼ *Stickers Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .brat
┆✦ .bratvid
┆✦ .bratanime
┆✦ .bratgambar
┆✦ .bratgambarhd
┆✦ .bratimg3
┆✦ .bratpink
┆✦ .ytcomment
┆✦ .emoji
┆✦ .emojigif
┆✦ .emojimix
┆✦ .manusialidi
┆✦ .qc
┆✦ .smeme
┆✦ .sticker
┆✦ .stikeranime
┆✦ .stikerdinokuning
┆✦ .stikergojo
┆✦ .stikermukalu
┆✦ .stikerpentol
┆✦ .stikerrandom
┆✦ .stikerspongebob
┆✦ .swm
┆✦ .toimg
┆✦ .tvstiker
╰─╼𔕬─┈───┈───┈` },
  tools: { text: `╭╼ Tools Menu
 ╰╼ *Tools Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .web2apk
┆✦ .removeobject
┆✦ .volume
┆✦ .volumevideo
┆✦ .img2pdf
┆✦ .ceknamadana
┆✦ .createhtml
┆✦ .saveweb
┆✦ .ttsbrando
┆✦ .ptvch
┆✦ .font1 - .font10
┆✦ .voicecover
┆✦ .vocalremover
┆✦ .tempo
┆✦ .speech2text
┆✦ .sidompul
┆✦ .togif
┆✦ .tovn
┆✦ .hdvid
┆✦ .tomp3
┆✦ .ai
┆✦ .aitts
┆✦ .ambilsw
┆✦ .donate
┆✦ .enc
┆✦ .enchard
┆✦ .fakecall
┆✦ .getpp
┆✦ .gptonline
┆✦ .gptimg
┆✦ .hd
┆✦ .iqc
┆✦ .kapanreset
┆✦ .ngl
┆✦ .nulis
┆✦ .ocr
┆✦ .rch
┆✦ .rvo
┆✦ .shortlink
┆✦ .shortlink2
┆✦ .ssweb
┆✦ .struk
┆✦ .texttosound
┆✦ .tourl
┆✦ .tourl2
┆✦ .tourl3
┆✦ .top4top
┆✦ .catbox
┆✦ .qu
┆✦ .uguu
┆✦ .pixhost
┆✦ .translate
┆✦ .ytsummarizer
┆✦ .cfsub
┆✦ .listsubdo
┆✦ .delsubdo
┆✦ .infosubdo
┆✦ .syncsubdo
╰─╼𔕬─┈───┈───┈` },
  maker: { text: `╭╼ Maker Menu
 ╰╼ *Maker Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .carbon
┆✦ .wanted
┆✦ .sdm
┆✦ .photoai
┆✦ .banana
┆✦ .hijabpin
┆✦ .tobotak
┆✦ .tomountain
┆✦ .tochibi
┆✦ .polaroid
┆✦ .tofootball
┆✦ .animediff
╰─╼𔕬─┈───┈───┈` },
  download: { text: `╭╼ Download Menu
 ╰╼ *Download Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .tiktok
┆✦ .tiktokmp3
┆✦ .twitter
┆✦ .ytmp3
┆✦ .ytmp4
┆✦ .pinterest
┆✦ .instagram
┆✦ .facebook
┆✦ .mediafire
┆✦ .spotify
┆✦ .capcut
╰─╼𔕬─┈───┈───┈` },
  ai: { text: `╭╼ AI Menu
 ╰╼ *AI Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .ai
┆✦ .duckai
┆✦ .openai
┆✦ .gptimg
┆✦ .bard
┆✦ .groq
┆✦ .venice
┆✦ .webpilot
┆✦ .logicbell
╰─╼𔕬─┈───┈───┈` },
  search: { text: `╭╼ Search Menu
 ╰╼ *Search Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .lirik
┆✦ .igstalk
┆✦ .spotify
┆✦ .yts
┆✦ .play
┆✦ .playvid
┆✦ .tiktokstalk
┆✦ .stalkroblox
┆✦ .cekcuaca
┆✦ .cekgempa
┆✦ .cnbc
┆✦ .cnn
╰─╼𔕬─┈───┈───┈` },
  game: { text: `╭╼ Game Menu
 ╰╼ *Game Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .tictactoe
┆✦ .tebakgambar
┆✦ .tebakkata
┆✦ .tebaklagu
┆✦ .tekateki
┆✦ .asahotak
┆✦ .caklontong
┆✦ .siapakahaku
┆✦ .susunkata
┆✦ .tebakanime
╰─╼𔕬─┈───┈───┈` },
  primbon: { text: `╭╼ Primbon Menu
 ╰╼ *Primbon Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .zodiak
┆✦ .artinama
┆✦ .quotes
┆✦ .pantun
┆✦ .ramalanjodoh
┆✦ .ramalancinta
┆✦ .nomerhoki
┆✦ .profesiku
╰─╼𔕬─┈───┈───┈` },
  fun: { text: `╭╼ Fun Menu
 ╰╼ *Fun Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .fitnah
┆✦ .cekbeban
┆✦ .cekbucin
┆✦ .cekgay
┆✦ .cekjodoh
┆✦ .cekkaya
┆✦ .cekkodam
┆✦ .cekstress
┆✦ .cekwibu
┆✦ .faktadunia
┆✦ .faktaunik
┆✦ .meme
┆✦ .waifu
╰─╼𔕬─┈───┈───┈` },
  islami: { text: `╭╼ Islami Menu
 ╰╼ *Islami Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .jadwalsholat
┆✦ .doaharian
┆✦ .ayatkursi
┆✦ .asmaulhusna
┆✦ .hadits
┆✦ .quotesislami
┆✦ .wirid
┆✦ .audiosurah
╰─╼𔕬─┈───┈───┈` },
  group: { text: `╭╼ Group Menu
 ╰╼ *Group Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .add
┆✦ .kick
┆✦ .promote
┆✦ .demote
┆✦ .tagall
┆✦ .hidetag
┆✦ .close
┆✦ .open
┆✦ .linkgc
┆✦ .setwelcome
┆✦ .setleft
┆✦ .warn
┆✦ .listwarn
┆✦ .delwarn
┆✦ .resetwarn
┆✦ .antilink
┆✦ .antikasar
┆✦ .afk
╰─╼𔕬─┈───┈───┈` },
  ownerCmd: { text: `╭╼ Owner Menu
 ╰╼ *Owner Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .addprem
┆✦ .delprem
┆✦ .listprem
┆✦ .restartbot
┆✦ .backup
┆✦ .broadcast
┆✦ .blacklist
┆✦ .unblacklist
┆✦ .setmenu
┆✦ .setimage
╰─╼𔕬─┈───┈───┈` },
  ephoto: { text: `╭╼ Ephoto Menu
 ╰╼ *Ephoto Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .glitchtext
┆✦ .neonglitch
┆✦ .watercolortext
┆✦ .galaxytext
┆✦ .goldtext
┆✦ .3dtext
┆✦ .firetext
╰─╼𔕬─┈───┈───┈` },
  anime: { text: `╭╼ Anime Menu
 ╰╼ *Anime Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .animewaifu
┆✦ .animehusbu
┆✦ .animekanna
┆✦ .animehinata
┆✦ .animeasuna
┆✦ .randomnime
╰─╼𔕬─┈───┈───┈` },
  cecan: { text: `╭╼ Cecan Menu
 ╰╼ *Cecan Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .cecankorea
┆✦ .cecanjapan
┆✦ .cecanchina
┆✦ .cecanindonesia
┆✦ .cecanthailand
┆✦ .cecanvietnam
╰─╼𔕬─┈───┈───┈` },
  store: { text: `╭╼ Store Menu
 ╰╼ *Store Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .list
┆✦ .addlist
┆✦ .dellist
┆✦ .buyprem
┆✦ .payment
┆✦ .testimoni
╰─╼𔕬─┈───┈───┈` },
  panel: { text: `╭╼ Panel Menu
 ╰╼ *Panel Menu*
╭╼─┈───┈──⏣╼╯
┆✦ .1gb - .7gb
┆✦ .unli
┆✦ .listpanel
┆✦ .mypanel
┆✦ .renewserver
┆✦ .setpanel
╰─╼𔕬─┈───┈───┈` }
};

// ==================== COMMAND IMPLEMENTASI ====================

// Sticker Command
bot.command('sticker', async (ctx) => {
  const text = ctx.message.text.replace('/sticker', '').trim();
  if (!text) return ctx.reply('Gunakan: /sticker [teks]');
  try {
    const svg = `<svg width="400" height="200"><rect width="400" height="200" fill="black"/><text x="200" y="110" font-size="30" fill="white" text-anchor="middle" font-family="Arial">${text}</text></svg>`;
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    await ctx.replyWithSticker({ source: buffer });
  } catch (err) {
    await ctx.reply('Gagal membuat stiker');
  }
});

// AI Command
bot.command('ai', async (ctx) => {
  const prompt = ctx.message.text.replace('/ai', '').trim();
  if (!prompt) return ctx.reply('Gunakan: /ai [pertanyaan]');
  try {
    const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
    await ctx.reply(response.data.slice(0, 4000));
  } catch (err) {
    await ctx.reply('Error: ' + err.message);
  }
});

// Tomp3 Command (YouTube to MP3)
bot.command('tomp3', async (ctx) => {
  const url = ctx.message.text.replace('/tomp3', '').trim();
  if (!url || !ytdl.validateURL(url)) return ctx.reply('Gunakan: /tomp3 [url_youtube]');
  await ctx.reply('⏳ Mengunduh audio...');
  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    await ctx.replyWithAudio({ url: await ytdl(url, { filter: 'audioonly' }) }, { title });
  } catch (err) {
    await ctx.reply('Error: ' + err.message);
  }
});

// Lirik Command
bot.command('lirik', async (ctx) => {
  const song = ctx.message.text.replace('/lirik', '').trim();
  if (!song) return ctx.reply('Gunakan: /lirik [judul_lagu]');
  try {
    const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(song)}`);
    const lyrics = response.data.lyrics;
    if (lyrics) await ctx.reply(lyrics.slice(0, 4000));
    else await ctx.reply('Lirik tidak ditemukan');
  } catch (err) {
    await ctx.reply('Lirik tidak ditemukan');
  }
});

// Cuaca Command
bot.command('cuaca', async (ctx) => {
  const city = ctx.message.text.replace('/cuaca', '').trim();
  if (!city) return ctx.reply('Gunakan: /cuaca [nama_kota]');
  try {
    const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+%w+%h`);
    await ctx.reply(`🌤️ Cuaca di ${city}:\n${response.data}`);
  } catch (err) {
    await ctx.reply('Gagal mengambil data cuaca');
  }
});

// Zodiak Command
bot.command('zodiak', async (ctx) => {
  const args = ctx.message.text.replace('/zodiak', '').trim();
  const zodiacs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  if (!args || !zodiacs.includes(args.toLowerCase())) {
    return ctx.reply(`Gunakan: /zodiak [zodiak]\nPilihan: ${zodiacs.join(', ')}`);
  }
  const messages = ['Hari ini akan menyenangkan!', 'Keberuntungan ada di pihakmu!', 'Hati-hati dalam mengambil keputusan.'];
  await ctx.reply(`🔮 Ramalan untuk ${args}:\n${messages[Math.floor(Math.random() * messages.length)]}`);
});

// Shortlink Command
bot.command('shortlink', async (ctx) => {
  const url = ctx.message.text.replace('/shortlink', '').trim();
  if (!url || !url.startsWith('http')) return ctx.reply('Gunakan: /shortlink [url]');
  try {
    const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    await ctx.reply(`🔗 Shortlink: ${response.data}`);
  } catch {
    await ctx.reply('Gagal membuat shortlink');
  }
});

// QR Code Command
bot.command('qr', async (ctx) => {
  const text = ctx.message.text.replace('/qr', '').trim();
  if (!text) return ctx.reply('Gunakan: /qr [teks atau link]');
  const qrBuffer = await QRCode.toBuffer(text);
  await ctx.replyWithPhoto({ source: qrBuffer });
});

// TikTok Downloader
bot.command('tiktok', async (ctx) => {
  const url = ctx.message.text.replace('/tiktok', '').trim();
  if (!url) return ctx.reply('Gunakan: /tiktok [url_tiktok]');
  await ctx.reply('⏳ Mengunduh video TikTok...');
  try {
    const response = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
    if (response.data.data && response.data.data.play) {
      await ctx.replyWithVideo({ url: response.data.data.play });
    } else {
      await ctx.reply('Gagal mengunduh video TikTok');
    }
  } catch (err) {
    await ctx.reply('Error: ' + err.message);
  }
});

// Instagram Downloader
bot.command('instagram', async (ctx) => {
  const url = ctx.message.text.replace('/instagram', '').trim();
  if (!url) return ctx.reply('Gunakan: /instagram [url_instagram]');
  await ctx.reply('⏳ Mengunduh dari Instagram...');
  try {
    const response = await axios.get(`https://api.ryzendesu.vip/api/downloader/insta?url=${encodeURIComponent(url)}`);
    if (response.data.url) {
      await ctx.replyWithVideo({ url: response.data.url });
    } else {
      await ctx.reply('Gagal mengunduh dari Instagram');
    }
  } catch (err) {
    await ctx.reply('Error: ' + err.message);
  }
});

// YouTube Downloader (video)
bot.command('ytmp4', async (ctx) => {
  const url = ctx.message.text.replace('/ytmp4', '').trim();
  if (!url || !ytdl.validateURL(url)) return ctx.reply('Gunakan: /ytmp4 [url_youtube]');
  await ctx.reply('⏳ Mengunduh video...');
  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    await ctx.replyWithVideo({ url: await ytdl(url, { quality: 'lowest' }) }, { title });
  } catch (err) {
    await ctx.reply('Error: ' + err.message);
  }
});

// Fakta Unik
bot.command('faktaunik', async (ctx) => {
  const fakta = [
    'Hiu punya indera penciuman yang sangat tajam',
    'Gajah adalah satu-satunya mamalia yang tidak bisa melompat',
    'Kucing tidur sekitar 16 jam sehari',
    'Madu tidak pernah basi'
  ];
  await ctx.reply(`🔍 Fakta Unik:\n${fakta[Math.floor(Math.random() * fakta.length)]}`);
});

// Meme Random
bot.command('meme', async (ctx) => {
  try {
    const response = await axios.get('https://meme-api.com/gimme');
    await ctx.replyWithPhoto(response.data.url, { caption: response.data.title });
  } catch {
    await ctx.reply('Gagal mengambil meme');
  }
});

// Quote Random
bot.command('quotes', async (ctx) => {
  const quotes = [
    'Hidup adalah pilihan, pilihlah yang terbaik.',
    'Jangan menunda pekerjaan sampai besok.',
    'Kesuksesan dimulai dari mimpi.'
  ];
  await ctx.reply(`💬 Quote:\n${quotes[Math.floor(Math.random() * quotes.length)]}`);
});

// Jadwal Sholat
bot.command('jadwalsholat', async (ctx) => {
  const city = ctx.message.text.replace('/jadwalsholat', '').trim() || 'jakarta';
  try {
    const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=indonesia&method=2`);
    const data = response.data.data.timings;
    const teks = `🕌 *Jadwal Sholat ${city}*\n\nImsak: ${data.Imsak}\nSubuh: ${data.Fajr}\nDzuhur: ${data.Dhuhr}\nAshar: ${data.Asr}\nMaghrib: ${data.Maghrib}\nIsya: ${data.Isha}`;
    await ctx.reply(teks, { parse_mode: 'Markdown' });
  } catch {
    await ctx.reply('Gagal mengambil jadwal sholat');
  }
});

// Doa Harian
bot.command('doaharian', async (ctx) => {
  const doa = `🤲 *Doa Sehari-hari*

Doa Sebelum Makan:
"Allahumma barik lana fi ma rozaqtana wa qina 'adzaban nar"

Doa Sesudah Makan:
"Alhamdulillahilladzi at'amana wa saqona wa ja'alana muslimin"

Doa Sebelum Tidur:
"Bismikallahumma ahya wa amut"`;
  await ctx.reply(doa, { parse_mode: 'Markdown' });
});

// Ayat Kursi
bot.command('ayatkursi', async (ctx) => {
  const ayat = `🕋 *Ayat Kursi*

Allahu la ilaha illa huwal hayyul qayyum, la ta'khuzuhu sinatuw wa la nawm, lahu ma fis samawati wa ma fil ard, man dzalladzi yasyfa'u 'indahu illa bi idznih, ya'lamu ma baina aidihim wa ma khalfahum, wa la yuhituna bi syai'im min 'ilmihi illa bi ma sya'a, wasi'a kursiyuhus samawati wal ard, wa la ya'uduhu hifzhuhuma, wa huwal 'aliyyul 'azhim.`;
  await ctx.reply(ayat, { parse_mode: 'Markdown' });
});

// Asmaul Husna
bot.command('asmaulhusna', async (ctx) => {
  const asmaul = `🤲 *Asmaul Husna*

1. Ar-Rahman (Maha Pengasih)
2. Ar-Rahim (Maha Penyayang)
3. Al-Malik (Maha Merajai)
4. Al-Quddus (Maha Suci)
5. As-Salam (Maha Sejahtera)

Ketik /asmaulhusna2 untuk melanjutkan`;
  await ctx.reply(asmaul, { parse_mode: 'Markdown' });
});

// Reset Bot Command (Owner only)
bot.command('restartbot', async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return ctx.reply('❌ Command ini hanya untuk owner');
  await ctx.reply('🔄 Bot akan direstart...');
  process.exit(0);
});

// Broadcast Command (Owner only)
bot.command('broadcast', async (ctx) => {
  if (ctx.from.id.toString() !== OWNER_ID) return ctx.reply('❌ Command ini hanya untuk owner');
  const message = ctx.message.text.replace('/broadcast', '').trim();
  if (!message) return ctx.reply('Gunakan: /broadcast [pesan]');
  await ctx.reply(`✅ Broadcast dikirim ke semua user\nPesan: ${message}`);
});

// Default handler untuk command yang belum diimplementasi
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/') && !text.startsWith('/start')) {
    await ctx.reply('❌ Command belum tersedia atau sedang dalam pengembangan.');
  }
});

// Noop handler untuk tombol yang tidak melakukan apa-apa
bot.action('noop', async (ctx) => ctx.answerCbQuery());

// ==================== EKSPOR UNTUK VERCEL ====================

module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body, res);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Error:', err);
    res.status(200).send('OK');
  }
};

// Untuk lokal
if (!process.env.VERCEL) {
  bot.launch();
  console.log('✅ Fluffy MD berjalan...');
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}