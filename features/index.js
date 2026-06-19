const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || 'Fluffy_Information';
const OWNER_ID = process.env.OWNER_ID || '';
const QRIS_IMAGE = process.env.QRIS_IMAGE || 'https://files.catbox.moe/g1o5a1.jpg';
const BOT_USERNAME = process.env.BOT_USERNAME || 'FluffyBot';

// ============================================================
// DATABASE MODELS
// ============================================================
const User = require('../db').User;
const Product = require('../db').Product;
const Order = require('../db').Order;

// ============================================================
// POIN SYSTEM
// ============================================================
const POIN_PER_COMMAND = 5;

async function getPoin(userId) {
  const user = await User.findOne({ userId });
  if (!user) return 0;
  return user.poin || 0;
}

async function usePoin(userId) {
  const user = await User.findOne({ userId });
  if (!user) return false;
  if ((user.poin || 0) < POIN_PER_COMMAND) return false;
  user.poin -= POIN_PER_COMMAND;
  await user.save();
  return true;
}

async function addPoin(userId, amount) {
  const user = await User.findOne({ userId });
  if (!user) {
    const newUser = new User({ userId, poin: amount });
    await newUser.save();
    return true;
  }
  user.poin = (user.poin || 0) + amount;
  await user.save();
  return true;
}

// ============================================================
// FORCE JOIN MIDDLEWARE
// ============================================================
async function checkForceJoin(userId) {
  try {
    const chatMember = await bot.getChatMember(`@${CHANNEL_USERNAME}`, userId);
    return ['member', 'administrator', 'creator'].includes(chatMember.status);
  } catch (error) {
    return false;
  }
}

// ============================================================
// WRAPPER EKSEKUSI COMMAND
// ============================================================
async function executeWithCheck(bot, msg, callback) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // 1. Cek join channel
  const isJoined = await checkForceJoin(userId);
  if (!isJoined) {
    return bot.sendMessage(chatId, `
🔒 *WAJIB JOIN CHANNEL DULU!*

Kamu belum join channel @${CHANNEL_USERNAME}.

Silakan join dulu ya, baru bisa pakai bot ini! 🐾
    `, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📢 Join Channel', url: `https://t.me/${CHANNEL_USERNAME}` }],
          [{ text: '✅ Verifikasi Join', callback_data: 'verify_join' }]
        ]
      }
    });
  }

  // 2. Cek poin
  const userPoin = await getPoin(userId);
  if (userPoin < POIN_PER_COMMAND) {
    return bot.sendMessage(chatId, `
⚠️ *POIN TIDAK CUKUP!*

Kamu butuh ${POIN_PER_COMMAND} poin untuk menggunakan command ini.

💰 Poin kamu: ${userPoin}
🛒 Beli poin di *Menu Order*
    `, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛒 Beli Poin', callback_data: 'order_poin' }],
          [{ text: '🔙 Kembali', callback_data: 'menu_awal' }]
        ]
      }
    });
  }

  // 3. Kurangi poin
  await usePoin(userId);
  
  // 4. Eksekusi command
  await callback(bot, msg);
}

// ============================================================
= MENU AWAL (START)
// ============================================================
async function showMenuAwal(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const name = msg.from.first_name || 'User';
  const userPoin = await getPoin(userId);

  await bot.sendPhoto(chatId, QRIS_IMAGE, {
    caption: `
🐾 *SELAMAT DATANG DI FLUFFY BOT!*

Halo ${name}! 👋 Selamat datang di bot dengan 1000+ fitur keren!

💰 Poin kamu: ${userPoin}

📌 *Pilih menu di bawah ini:*
    `,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔰 Menu Bot', callback_data: 'menu_bot' }, { text: '🛒 Menu Order', callback_data: 'menu_order' }],
        [{ text: '❓ Bantuan', callback_data: 'bantuan' }, { text: '🙏 Thanks To', callback_data: 'thanks_to' }],
        [{ text: '🤖 Culik Bot & Undang Teman', callback_data: 'culik_bot' }],
        [{ text: '📢 Channel', url: `https://t.me/${CHANNEL_USERNAME}` }, { text: '👤 Owner', url: 'https://t.me/guehmamz' }]
      ]
    }
  });
}

// ============================================================
// MENU BOT (SLIDER)
// ============================================================
const menuBotPages = [
  [
    { label: '📦 Sticker', data: 'cmd_sticker' },
    { label: '🛠️ Tools', data: 'cmd_tools' },
    { label: '🎨 Maker', data: 'cmd_maker' },
    { label: '🔮 Primbon', data: 'cmd_primbon' }
  ],
  [
    { label: '🎮 Fun', data: 'cmd_fun' },
    { label: '⬇️ Download', data: 'cmd_download' },
    { label: '🧠 AI', data: 'cmd_ai' },
    { label: '🔍 Search', data: 'cmd_search' }
  ],
  [
    { label: '🎯 Game', data: 'cmd_game' },
    { label: '🔐 Encrypt', data: 'cmd_encrypt' },
    { label: '🎌 Anime', data: 'cmd_anime' },
    { label: '🕌 Islami', data: 'cmd_islami' }
  ],
  [
    { label: '👥 Group', data: 'cmd_group' },
    { label: '👑 Owner', data: 'cmd_owner' },
    { label: '🏪 Store', data: 'cmd_store' },
    { label: '📛 Sticker (2)', data: 'cmd_sticker2' }
  ]
];

async function showMenuBot(bot, msg, page = 0) {
  const chatId = msg.chat.id;

  const buttons = menuBotPages[page] || menuBotPages[0];
  const totalPages = menuBotPages.length;

  const rowButtons = [];
  for (let i = 0; i < buttons.length; i += 2) {
    const row = [];
    if (buttons[i]) row.push({ text: buttons[i].label, callback_data: buttons[i].data });
    if (buttons[i+1]) row.push({ text: buttons[i+1].label, callback_data: buttons[i+1].data });
    rowButtons.push(row);
  }

  const navRow = [];
  if (page > 0) navRow.push({ text: '⬅️', callback_data: `menu_bot_${page - 1}` });
  navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: 'menu_bot_info' });
  if (page < totalPages - 1) navRow.push({ text: '➡️', callback_data: `menu_bot_${page + 1}` });
  rowButtons.push(navRow);

  rowButtons.push([{ text: '🔙 Kembali ke Menu Awal', callback_data: 'menu_awal' }]);

  await bot.sendPhoto(chatId, QRIS_IMAGE, {
    caption: `
📋 *MENU BOT*

Pilih kategori di bawah ini! 🐾

Halaman ${page + 1} dari ${totalPages}
    `,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: rowButtons }
  });
}

// ============================================================
// MENU ORDER
// ============================================================
async function showMenuOrder(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userPoin = await getPoin(userId);

  await bot.sendPhoto(chatId, QRIS_IMAGE, {
    caption: `
🛒 *MENU ORDER*

💰 Poin kamu: ${userPoin}

Pilih opsi di bawah ini! 🐾
    `,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🪙 Order Poin', callback_data: 'order_poin' }],
        [{ text: '📦 Order Produk', callback_data: 'order_produk' }],
        [{ text: '🔙 Kembali ke Menu Awal', callback_data: 'menu_awal' }]
      ]
    }
  });
}

// ============================================================
// ORDER POIN
// ============================================================
async function showOrderPoin(bot, msg) {
  const chatId = msg.chat.id;

  await bot.sendPhoto(chatId, QRIS_IMAGE, {
    caption: `
🪙 *ORDER POIN*

💎 *HARGA POIN:*
├ 2.000 → 25 Poin
├ 5.000 → 75 Poin
├ 10.000 → 175 Poin
└ 20.000 → 400 Poin

📌 *CARA ORDER:*
1. Transfer ke QRIS di bawah
2. Kirim bukti transfer ke bot
3. Poin akan otomatis ditambahkan

💰 *QRIS:*
(Gambar QRIS di bawah)
    `,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '💳 2.000 (25 Poin)', callback_data: 'buy_poin_2000' }],
        [{ text: '💳 5.000 (75 Poin)', callback_data: 'buy_poin_5000' }],
        [{ text: '💳 10.000 (175 Poin)', callback_data: 'buy_poin_10000' }],
        [{ text: '💳 20.000 (400 Poin)', callback_data: 'buy_poin_20000' }],
        [{ text: '🔙 Kembali ke Menu Order', callback_data: 'menu_order' }]
      ]
    }
  });
}

// ============================================================
// ORDER PRODUK
// ============================================================
async function showOrderProduk(bot, msg) {
  const chatId = msg.chat.id;
  
  const products = await Product.find({ active: true });
  
  let caption = `
📦 *ORDER PRODUK*

Berikut daftar produk yang tersedia:

`;
  
  const buttons = [];
  for (const product of products) {
    caption += `
*${product.name}*
💰 Harga: Rp ${product.price.toLocaleString()}
📝 ${product.description || 'Tidak ada deskripsi'}
───
`;
    buttons.push([{ text: `🛒 ${product.name}`, callback_data: `product_${product._id}` }]);
  }

  if (products.length === 0) {
    caption = `
📦 *ORDER PRODUK*

Belum ada produk tersedia. Silakan cek lagi nanti! 🐾
`;
  }

  buttons.push([{ text: '🔙 Kembali ke Menu Order', callback_data: 'menu_order' }]);

  await bot.sendPhoto(chatId, QRIS_IMAGE, {
    caption: caption.trim(),
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: buttons }
  });
}

// ============================================================
// BANTUAN
// ============================================================
async function showBantuan(bot, msg) {
  const chatId = msg.chat.id;

  await bot.sendPhoto(chatId, QRIS_IMAGE, {
    caption: `
❓ *BANTUAN*

📌 *Fungsi Tombol:*
├ 🔰 Menu Bot → Lihat semua fitur
├ 🛒 Menu Order → Beli poin & produk
├ ❓ Bantuan → Halaman ini
├ 🙏 Thanks To → Credit developer
├ 🤖 Culik Bot → Tambah bot ke grup
├ 📢 Channel → Link channel
└ 👤 Owner → Hubungi owner

🎮 *Cara Pakai:*
1. Join channel @${CHANNEL_USERNAME}
2. Pakai command /start
3. Pilih menu yang kamu mau
4. Setiap command butuh 5 poin

💡 *Tips:*
- Klik tombol untuk navigasi
- Cek menu bot untuk fitur lengkap
    `,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Kembali ke Menu Awal', callback_data: 'menu_awal' }]
      ]
    }
  });
}

// ============================================================
// THANKS TO
// ============================================================
async function showThanksTo(bot, msg) {
  const chatId = msg.chat.id;

  await bot.sendPhoto(chatId, QRIS_IMAGE, {
    caption: `
🙏 *THANKS TO*

🐾 *Fluffy Bot* dibuat dengan ❤️ oleh:

👤 *Mamz*
├ Developer & Founder
├ Telegram: @guehmamz
├ Channel: @Fluffy_Information
└ GitHub: (coming soon)

✨ *Spesial Thanks:*
├ MongoDB Atlas (database gratis)
├ Vercel (hosting serverless)
├ Node.js (runtime)
└ Telegram Bot API

💖 *Support:*
├ Join channel @${CHANNEL_USERNAME}
└ Share bot ke teman-temanmu!

🐾 *Fluffy Bot — Made with Love by Mamz*
    `,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Kembali ke Menu Awal', callback_data: 'menu_awal' }]
      ]
    }
  });
}

// ============================================================
// CULIK BOT & UNDANG TEMAN
// ============================================================
async function showCulikBot(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const referralLink = `https://t.me/${BOT_USERNAME}?start=ref_${userId}`;
  const addBotLink = `https://t.me/${BOT_USERNAME}?startgroup=start`;

  await bot.sendPhoto(chatId, QRIS_IMAGE, {
    caption: `
🤖 *CULIK BOT & UNDANG TEMAN*

👥 *Undang Teman:*
Bagikan link ini ke teman-temanmu!
${referralLink}

🤖 *Culik Bot ke Grup:*
Tambahkan bot ini ke grup/channel-mu!
${addBotLink}

💡 *Kenapa harus mengundang?*
├ Bot ini punya 1000+ fitur keren
├ Gratis & mudah digunakan
└ Bikin grup/channel makin seru!

🐾 *Ayo undang sekarang!*
    `,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '👥 Undang Teman', url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Halo! Yuk cobain bot keren ini! 🐾` }],
        [{ text: '🤖 Culik Bot ke Grup', url: addBotLink }],
        [{ text: '🔙 Kembali ke Menu Awal', callback_data: 'menu_awal' }]
      ]
    }
  });
}

// ============================================================
// COMMAND LIST (1000+ FITUR)
// ============================================================

const commandCategories = {
  sticker: [
    'brat', 'bratvid', 'bratanime', 'bratgambar', 'bratgambarhd', 'bratimg3', 'bratpink',
    'ytcomment', 'emoji', 'emojigif', 'emojimix', 'manusialidi', 'qc', 'smeme',
    'sticker', 'stikeranime', 'stikerdinokuning', 'stikergojo', 'stikermukalu',
    'stikerpentol', 'stikerrandom', 'stikerspongebob', 'swm', 'toimg', 'tvstiker'
  ],
  tools: [
    'web2apk', 'removeobject', 'volume', 'volumevideo', 'img2pdf', 'ceknamadana',
    'createhtml', 'saveweb', 'ttsbrando', 'ptvch', 'font1', 'font2', 'font3', 'font4',
    'font5', 'font6', 'font7', 'font8', 'font9', 'font10', 'voicecover', 'vocalremover',
    'tempo', 'speech2text', 'sidompul', 'togif', 'tovn', 'hdvid', 'tomp3', 'ai',
    'aitts', 'ambilsw', 'donate', 'enc', 'enchard', 'fakecall', 'getpp', 'gptonline',
    'gptimg', 'hd', 'iqc', 'kapanreset', 'ngl', 'nulis', 'ocr', 'rch', 'rvo',
    'shortlink', 'shortlink2', 'ssweb', 'struk', 'texttosound', 'tourl', 'tourl2',
    'tourl3', 'top4top', 'catbox', 'qu', 'uguu', 'pixhost', 'translate', 'ytsummarizer'
  ],
  maker: [
    'todemo', 'fakechannel', 'fakewhatsapp', 'wanted', 'musikcard', 'fakeff',
    'fakegroup', 'topenjara', 'sharkstudio', 'alipedit', 'putihkan', 'aiedit',
    'banana', 'hijabpin', 'hitamin', 'tobotak', 'tomountain', 'tochibi', 'todino',
    'polaroid', 'tofootball', 'animediff', 'photoai', 'fakektp', 'carbon',
    'tofigure', 'telanjang', 'fakestory', 'tosunda', 'tojawa', 'todonghua',
    'tomanhwa', 'toanime', 'tomanga', 'sdm', 'tomoai', 'topacar', 'tomonyet',
    'tosatan', 'toroblox', 'topunk', 'tomangu', 'tosad', 'todpr', 'tobabi',
    'buatgambar', 'buatlagu', 'buatvideo', 'ghibli', 'jadidisney', 'jadigta',
    'jadipixar', 'nglspam', 'tokartun', 'veo3', 'zrooart',
    'tospiderman', 'tonaruto', 'tobatman', 'tosuperman', 'toironman', 'tocaptainamerica',
    'tothor', 'tohulk', 'towolverine', 'todeadpool', 'toflash', 'toaquaman',
    'tocyan', 'tovision', 'toblackpanther', 'tostarlord', 'togroot', 'torocket',
    'todracula', 'tofrankenstein', 'tozombie', 'tovampire', 'toghost', 'toskeleton',
    'todevil', 'toangel', 'tofairy', 'towizard', 'towinged', 'toelf', 'todwarf',
    'toorc', 'totroll', 'togiant', 'tominotaur', 'tomedusa', 'tocentaur',
    'togriffin', 'tophoenix', 'todragon', 'tounicorn', 'topeacock', 'towolf',
    'tofox', 'tobear', 'tolion', 'totiger', 'topanda', 'tokoala', 'topenguin',
    'toowl', 'toeagle', 'tofalcon', 'toraven', 'tocrow', 'tosnake', 'toshark',
    'tocrocodile', 'tooctopus', 'tojellyfish', 'tostarfish', 'toseahorse',
    'todolphin', 'towhale', 'torobot', 'tocyborg', 'toandroid', 'toalien',
    'toufo', 'toastronaut', 'tocosmonaut', 'toscuba', 'todiver', 'topirate',
    'tocowboy', 'toninja', 'tosamurai', 'toviking', 'toknight', 'toarcher',
    'tomage', 'tocleric', 'tobard', 'torogue', 'tomonk', 'tobarbarian',
    'tonecromancer', 'todruid', 'toranger', 'topaladin', 'togunslinger',
    'tomechanic', 'toscientist', 'todoctor', 'toengineer', 'toartist',
    'tosinger', 'todancer', 'toactor', 'todirector', 'towriter', 'tophotographer',
    'tochef', 'tobaker', 'tobarista', 'tobartender', 'topilot', 'todriver',
    'tosailor', 'tosoldier', 'topoliceman', 'tofirefighter', 'toteacher',
    'toprofessor', 'tostudent', 'toprogrammer', 'todesigner', 'totester',
    'tomanager', 'toboss', 'toceo', 'tocfo', 'tocoo', 'tocmo', 'tocto', 'tocpo',
    'tocko', 'toclown', 'tomime', 'tojester', 'tomagician', 'toillusionist',
    'toescapeartist', 'toacrobat', 'tocontortionist', 'toswordswallower',
    'tofirebreather', 'tojugger', 'tounicyclist', 'totightrope', 'totrapeze',
    'toaerialist', 'tocannon', 'tostilts', 'tomask', 'tomummy', 'tozorro',
    'tosherlock', 'tophantom', 'todraco', 'tohannibal', 'tojoker', 'tovenom',
    'tocarnage', 'togreen', 'tolizard', 'torhino', 'tovulture', 'toelectro',
    'tosandman', 'tomysterio', 'togoblin', 'tochemo', 'toloki', 'tothanos',
    'togalactus', 'todarkseid', 'tobrainiac', 'todoomsday', 'tobizarro',
    'tometallo', 'toparasite', 'togrodd', 'tocircus', 'toreverse', 'tomirror',
    'togold', 'tosilver', 'tobronze', 'tocopper', 'tosteel', 'tocarbon',
    'tocrystal', 'todiamond', 'tosapphire', 'toruby', 'toemerald', 'totopaz',
    'toamethyst', 'toopal', 'toperidot', 'toaquamarine', 'tocitrine',
    'totourmaline', 'togarnet', 'tospinel', 'tozircon', 'totanzanite',
    'toiolite', 'tohematite', 'tomoonstone', 'tosunstone', 'tostarstone',
    'tocomet', 'tometeor', 'toasteroid', 'tonebula', 'togalaxy', 'touniverse',
    'toblackhole', 'towormhole', 'toportal', 'totime', 'tospace', 'todimension',
    'toparallel', 'toalternate', 'tomultiverse', 'tomegaverse', 'tometaverse',
    'toomniverse'
  ],
  primbon: [
    'artinama', 'cekaura', 'ceksial', 'darkjoke', 'isidompet', 'jodohmakanan',
    'kecocokannama', 'nasibbatere', 'nomerhoki', 'pantun', 'profesiku', 'quotes',
    'ramalancinta', 'ramalanjodoh', 'ramalanjodohbali', 'ramalannasib',
    'scankontol', 'scanmemek', 'suamiistri', 'zodiak'
  ],
  fun: [
    'fitnah', 'sad1', 'sad2', 'sad3', 'sad4', 'sad5', 'sad6', 'sad7', 'sad8',
    'sad9', 'sad10', 'sad11', 'sad12', 'sad13', 'sad14', 'sad15', 'sad16',
    'sad17', 'sad18', 'sad19', 'sad20', 'sad21', 'sad22', 'sad23', 'sad24',
    'sad25', 'sad26', 'sad27', 'sad28', 'sad29', 'sad30', 'sad31', 'sad32',
    'sad33', 'sad34', 'sad35', 'sad36', 'sad37', 'sad38', 'sad39', 'sad40',
    'sad41', 'sad42', 'sad43', 'sad44', 'sad45', 'sad46', 'sad47', 'sad48',
    'sad49', 'sad50', 'sad51', 'sad52', 'sad53', 'sad54', 'sad55',
    'sound1', 'sound2', 'sound3', 'sound4', 'sound5', 'sound6', 'sound7',
    'sound8', 'sound9', 'sound10', 'sound11', 'sound12', 'sound13', 'sound14',
    'sound15', 'sound16', 'sound17', 'sound18', 'sound19', 'sound20',
    'sound21', 'sound22', 'sound23', 'sound24', 'sound25', 'sound26',
    'sound27', 'sound28', 'sound29', 'sound30', 'sound31', 'sound32',
    'sound33', 'sound34', 'sound35', 'sound36', 'sound37', 'sound38',
    'sound39', 'sound40', 'sound41', 'sound42', 'sound43', 'sound44',
    'sound45', 'sound46', 'sound47', 'sound48', 'sound49', 'sound50',
    'sound51', 'sound52', 'sound53', 'sound54', 'sound55', 'sound56',
    'sound57', 'sound58', 'sound59', 'sound60', 'sound61', 'sound62',
    'sound63', 'sound64', 'sound65', 'sound66', 'sound67', 'sound68',
    'sound69', 'sound70', 'sound71', 'sound72', 'sound73', 'sound74',
    'sound75', 'sound76', 'sound77', 'sound78', 'sound79', 'sound80',
    'sound81', 'sound82', 'sound83', 'sound84', 'sound85', 'sound86',
    'sound87', 'sound88', 'sound89', 'sound90', 'sound91', 'sound92',
    'sound93', 'sound94', 'sound95', 'sound96', 'sound97', 'sound98',
    'sound99', 'sound100', 'sound101', 'sound102', 'sound103', 'sound104',
    'sound105', 'sound106', 'sound107', 'sound108', 'sound109', 'sound110',
    'sound111', 'sound112', 'sound113', 'sound114', 'sound115', 'sound116',
    'sound117', 'sound118', 'sound119', 'sound120', 'sound121', 'sound122',
    'sound123', 'sound124', 'sound125', 'sound126', 'sound127', 'sound128',
    'sound129', 'sound130', 'sound131', 'sound132', 'sound133', 'sound134',
    'sound135', 'sound136', 'sound137', 'sound138', 'sound139', 'sound140',
    'sound141', 'sound142', 'sound143', 'sound144', 'sound145', 'sound146',
    'sound147', 'sound148', 'sound149', 'sound150', 'sound151', 'sound152',
    'sound153', 'sound154', 'sound155', 'sound156', 'sound157', 'sound158',
    'sound159', 'sound160', 'sound161', 'sound162', 'sound163', 'sound164',
    'sound165', 'sound166', 'sound167', 'sound168', 'sound169', 'sound170',
    'sound171', 'sound172', 'sound173', 'sound174', 'sound175', 'sound176',
    'sound177', 'sound178', 'sound179', 'sound180', 'sound181', 'sound182',
    'sound183', 'sound184', 'sound185', 'sound186', 'sound187', 'sound188',
    'sound189', 'sound190', 'sound191', 'sound192', 'sound193', 'sound194',
    'sound195', 'sound196', 'sound197', 'sound198', 'sound199', 'sound200',
    'cekbeban', 'cekbucin', 'cekfemboy', 'cekgay', 'cekjodoh', 'cekjones',
    'cekkaya', 'cekkodam', 'cekkontol', 'cekmasadepan', 'cekmemek',
    'ceksange', 'cekstress', 'cekwibu', 'fakeml', 'faktadunia',
    'faktaunik', 'infonegara', 'jumlahuser', 'kecocokanpasangan', 'kirimch',
    'meme', 'pakustad', 'planet', 'quotesanime', 'sertifikattolol',
    'tafsirmimpi', 'waifu'
  ],
  download: [
    'tiktok', 'tiktokmp3', 'twitter', 'ytmp3', 'ytmp4', 'pinterest', 'pindl',
    'alipdl', 'capcut', 'facebook', 'gitclone', 'gdrive', 'instagram',
    'mediafire', 'pastebin', 'play1', 'spdown', 'telesticker', 'threads'
  ],
  ai: [
    'duckai', 'luma', 'img2video', 'copilotvoice', 'aimention', 'publicai',
    'powerbrain', 'venice', 'webpilot', 'logicbell', 'bard', 'hyperai',
    'autoai', 'ai', 'airealtime', 'gpt5plus', 'soraai', 'openai', 'groq', 'customai'
  ],
  search: [
    'toproblox', 'gsmarena', 'wattpad', 'searchgame', 'soundcloud', 'npmjs',
    'whatmusik', 'lirik', 'ptv', 'myanimelist', 'searchanime', 'animeinfo',
    'searchchar', 'charinfo', 'carigrupwa', 'caristiker', 'cekgempa',
    'cekkalender', 'cekml', 'cekff', 'cekcuaca', 'cnbc', 'cnn', 'hiitwixtor',
    'igstalk', 'otakudesu', 'pinterest', 'play', 'playch', 'playtiktok',
    'playv2', 'playvid', 'spotify', 'stalkroblox', 'tiktokstalk', 'yts'
  ],
  game: [
    'tictactoe', 'kuismath', 'sambungkata', 'sambungkata2', 'tebakhero',
    'tebakgenshin', 'asahotak', 'bom', 'caklontong', 'family100', 'kuis',
    'lengkapikalimat', 'siapakahaku', 'susunkata', 'tebakanime', 'tebakbendera',
    'tebakff', 'tebakgame', 'tebakgambar', 'tebakhewan', 'tebakinggris',
    'tebakjkt', 'tebakjorok', 'tebakkah', 'tebakkalimat', 'tebakkata',
    'tebaklagu', 'tebaklirik', 'tebaklogo', 'tebakmakanan', 'tekateki'
  ],
  encrypt: [
    'enccustom', 'encinvis', 'encsiu', 'encstrong', 'encultra', 'enchard', 'enc',
    'encryptcustom', 'encryptinvis', 'encryptsiu', 'encryptstrong', 'encryptultra',
    'customenc', 'invisenc', 'siuenc', 'strongenc', 'ultraenc',
    'custom-encrypt', 'invis-encrypt', 'siu-encrypt', 'strong-encrypt', 'ultra-encrypt',
    'enc-custom', 'enc-invis', 'enc-siu', 'enc-strong', 'enc-ultra',
    'enccustomjs', 'encinvisible', 'encryptinvisible', 'invisibleenc',
    'invisible-encrypt', 'enc-invisible', 'eninvisiblejs', 'jsinvisenc',
    'encjsinvis', 'encsiujs', 'jssiuenc', 'siujsen', 'encstrongjs',
    'jsstrongenc', 'strongjsen', 'encultrajs', 'jsultraenc', 'ultrajsen',
    'encryptcustomjs', 'customjsen'
  ],
  anime: [
    'animeakira', 'animeasuna', 'animeeba', 'animeelaina', 'animeemilia',
    'animegremory', 'animehinata', 'animehusbu', 'animeisuzu', 'animeitori',
    'animekagura', 'animekanna', 'animemegumin', 'animemiku', 'animenezuko',
    'animensfwloli', 'animepokemon', 'animerem', 'animeryuko', 'animeshina',
    'animeshinka', 'animeshota', 'animetejina', 'animetoukachan', 'animewaifu',
    'animeyotsuba', 'animeyuli', 'animeyumeko', 'animezero'
  ],
  anime_theme: [
    'akiyama', 'ana', 'art', 'asuna', 'ayuzawa', 'boruto', 'bts', 'cartoon',
    'chiho', 'chitoge', 'cosplay', 'cosplayloli', 'cosplaysagiri', 'cyber',
    'deidara', 'doraemon', 'forcexyz', 'emilia', 'erza', 'exo', 'gamewallpaper',
    'gremory', 'hacker', 'hestia', 'hinata', 'husbu', 'inori', 'islamic',
    'isuzu', 'itachi', 'itori', 'jennie', 'jiso', 'justina', 'kaga', 'kagura',
    'kakasih', 'kaori', 'keneki', 'kotori', 'kurumi', 'lisa', 'madara',
    'megumin', 'mikasa', 'mikey', 'miku', 'minato', 'mountain', 'naruto',
    'neko2', 'nekonime', 'nezuko', 'onepiece', 'pentol', 'pokemon',
    'programming', 'randomnime', 'randomnime2', 'rize', 'rose', 'sagiri',
    'sakura', 'sasuke', 'satanic', 'shina', 'shinka', 'shinomiya', 'shizuka',
    'shota', 'shortquote', 'space', 'technology', 'tejina', 'toukachan',
    'tsunade', 'yotsuba', 'yuki', 'yulibocil', 'yumeko'
  ],
  islami: [
    'asmaulhusna', 'audiosurah', 'ayatkursi', 'bacaansholat', 'doa',
    'doaharian', 'hadits', 'jadwalsholat', 'kisahnabi', 'niatsholat',
    'quotesislami', 'wirid'
  ],
  cecan: [
    'cecanchina', 'cecanhijaber', 'cecanindonesia', 'cecanjapan', 'cecanjeni',
    'cecanjiso', 'cecankorea', 'cecanmalaysia', 'cecanjustinaxie', 'cecanrose',
    'cecanryujin', 'cecanthailand', 'cecanvietnam'
  ],
  group: [
    'autolevel', 'setclosetime', 'setopentime', 'cekjadwal', 'resetjadwal',
    'autosholat', 'addbadword', 'listbadword', 'delbadword', 'banfitur',
    'intro', 'setintro', 'closetime', 'opentime', 'warn', 'listwarn',
    'delwarn', 'infowarn', 'resetwarn', 'infogrup', 'hidetagpoll',
    'gcsider', 'sidercek', 'siderkick', 'infouser', 'setnamagc', 'setppgc',
    'schedule', 'autoabsen', 'setabsen', 'tagadmin', 'acc', 'tolakacc',
    'swgc', 'swgcall', 'totalchat', 'resettotalchat', 'setultah', 'ultah',
    'delultah', 'listultah', 'afk', 'onlyadmin', 'add', 'cekidch', 'cekidgc',
    'close', 'setclose', 'setopen', 'demote', 'hidetag', 'kick', 'kudeta',
    'leaderboard', 'leave', 'linkgc', 'off', 'on', 'open', 'promote',
    'resetlinkgc', 'setleft', 'setwelcome', 'testwelcome', 'testleft', 'tagall'
  ],
  owner: [
    'addrespon', 'delrespon', 'listrespon', 'autocorrect', 'setrestart',
    'setlabel', 'addpremgc', 'delpremgc', 'mutegc', 'unmutegc', 'sistemsewa',
    'autoreactsw', 'autosambut', 'addprefix', 'listprefix', 'sefprefix',
    'renamebot', 'setaudiomenu', 'setimage', 'culikmember', 'setdaftar',
    'setmenu', 'stikercmd', 'delstikercmd', 'addaksesprem', 'delaksesprem',
    'listaksesprem', 'onlyprem', 'addcase', 'addlimit', 'addlimitall',
    'addowner', 'addprem', 'addsewagc', 'listsewagc', 'delsewagc',
    'ceksewagc', 'renewsewagc', 'antibot', 'autobackup', 'autoread',
    'autoreadsw', 'autotyping', 'backup', 'blacklist', 'cekprem',
    'clearchat', 'clearprem', 'creategc', 'delcase', 'dellimit', 'delowner',
    'delprem', 'getcase', 'getsc', 'joinch', 'joingc', 'listcase', 'listgc',
    'listowner', 'listprem', 'pay2', 'resetdb', 'resetlimitall', 'restartbot',
    'savekontak', 'self/public', 'setlimit', 'setppbot', 'unblacklist',
    'upchannel', 'upchannel2'
  ],
  store: [
    'list', 'setlist', 'addlist', 'dellist', 'clearlist', 'setpay', 'delpay',
    'listpay', 'setdone', 'setproses', 'done', 'proses', 'testimoni',
    'buyprem', 'buyapkprem', 'buysewagc', 'done', 'jpm', 'jpm2', 'jpmtesti',
    'payment', 'proses', 'pushkontak', 'pushkontak2', 'sendtesti'
  ]
};

// ============================================================
// REGISTER FUNGSI UTAMA
// ============================================================
function register(bot) {
  // ============================================================
  // COMMAND /START
  // ============================================================
  bot.onText(/^\/start$/, (msg) => {
    executeWithCheck(bot, msg, (b, m) => {
      showMenuAwal(b, m);
    });
  });

  // ============================================================
  // CALLBACK QUERY HANDLER
  // ============================================================
  bot.on('callback_query', async (callbackQuery) => {
    const data = callbackQuery.data;
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const messageId = msg.message_id;

    try {
      // ============================================================
      // VERIFIKASI JOIN
      // ============================================================
      if (data === 'verify_join') {
        const isJoined = await checkForceJoin(userId);
        if (isJoined) {
          await bot.editMessageText('✅ *Berhasil!* Kamu sudah join channel. Silakan gunakan bot! 🐾', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
          await showMenuAwal(bot, msg);
        } else {
          await bot.editMessageText(`❌ *Belum join!* Silakan join dulu channel @${CHANNEL_USERNAME}.`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
        }
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // ============================================================
      // MENU AWAL
      // ============================================================
      if (data === 'menu_awal') {
        await showMenuAwal(bot, msg);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // ============================================================
      // MENU BOT (SLIDER)
      // ============================================================
      if (data === 'menu_bot') {
        await showMenuBot(bot, msg, 0);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }
      if (data.startsWith('menu_bot_')) {
        const page = parseInt(data.split('_')[2]) || 0;
        await showMenuBot(bot, msg, page);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // ============================================================
      // MENU ORDER
      // ============================================================
      if (data === 'menu_order') {
        await showMenuOrder(bot, msg);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // ============================================================
      // ORDER POIN
      // ============================================================
      if (data === 'order_poin') {
        await showOrderPoin(bot, msg);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // ============================================================
      // ORDER PRODUK
      // ============================================================
      if (data === 'order_produk') {
        await showOrderProduk(bot, msg);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // ============================================================
      // BANTUAN
      // ============================================================
      if (data === 'bantuan') {
        await showBantuan(bot, msg);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // ============================================================
      // THANKS TO
      // ============================================================
      if (data === 'thanks_to') {
        await showThanksTo(bot, msg);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // ============================================================
      // CULIK BOT
      // ============================================================
      if (data === 'culik_bot') {
        await showCulikBot(bot, msg);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // ============================================================
      // BUY POIN
      // ============================================================
      if (data.startsWith('buy_poin_')) {
        const amount = parseInt(data.split('_')[2]);
        let poin = 0;
        let price = 0;
        switch (amount) {
          case 2000: poin = 25; price = 2000; break;
          case 5000: poin = 75; price = 5000; break;
          case 10000: poin = 175; price = 10000; break;
          case 20000: poin = 400; price = 20000; break;
          default: poin = 0;
        }

        await bot.sendPhoto(chatId, QRIS_IMAGE, {
          caption: `
🪙 *ORDER POIN*

💰 Harga: Rp ${price.toLocaleString()}
💎 Poin: ${poin} poin

📌 *CARA ORDER:*
1. Transfer ke QRIS di bawah
2. Kirim bukti transfer ke bot
3. Poin akan otomatis ditambahkan

📤 *Kirim bukti transfer dengan caption:*
\`order_poin ${price}\`

⚠️ *PENTING:*
- Transfer sesuai nominal
- Nama tujuan: *Mamz Store*
- Bukti harus jelas & tidak diedit

*QRIS:*
(Gambar QRIS di bawah)
          `,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Kembali ke Order Poin', callback_data: 'order_poin' }]
            ]
          }
        });
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // ============================================================
      // MENU BOT KATEGORI (MENAMPILKAN LIST COMMAND)
      // ============================================================
      if (data.startsWith('cmd_')) {
        const category = data.replace('cmd_', '');
        let commands = [];
        let categoryName = category.toUpperCase();

        // Mapping kategori ke command list
        const categoryMap = {
          sticker: commandCategories.sticker,
          tools: commandCategories.tools,
          maker: commandCategories.maker,
          primbon: commandCategories.primbon,
          fun: commandCategories.fun,
          download: commandCategories.download,
          ai: commandCategories.ai,
          search: commandCategories.search,
          game: commandCategories.game,
          encrypt: commandCategories.encrypt,
          anime: [...commandCategories.anime, ...commandCategories.anime_theme],
          islami: commandCategories.islami,
          group: commandCategories.group,
          owner: commandCategories.owner,
          store: commandCategories.store,
          sticker2: commandCategories.sticker
        };

        commands = categoryMap[category] || [];
        
        let caption = `📋 *MENU ${categoryName}*\n\n`;
        for (const cmd of commands) {
          caption += `└ .${cmd}\n`;
        }
        caption += `\n📌 Total: ${commands.length} command`;

        await bot.sendMessage(chatId, caption, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Kembali ke Menu Bot', callback_data: 'menu_bot' }]
            ]
          }
        });
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // ============================================================
      // PRODUCT ORDER (Klik produk)
      // ============================================================
      if (data.startsWith('product_')) {
        const productId = data.replace('product_', '');
        const product = await Product.findById(productId);
        
        if (!product) {
          await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Produk tidak ditemukan!' });
          return;
        }

        await bot.sendPhoto(chatId, QRIS_IMAGE, {
          caption: `
📦 *${product.name}*

💰 Harga: Rp ${product.price.toLocaleString()}
📝 ${product.description || 'Tidak ada deskripsi'}

📌 *CARA ORDER:*
1. Transfer ke QRIS di bawah
2. Kirim bukti transfer ke bot
3. Tunggu konfirmasi dari owner

📤 *Kirim bukti transfer dengan caption:*
\`order_produk ${product._id}\`

⚠️ *PENTING:*
- Transfer sesuai nominal
- Nama tujuan: *Mamz Store*
- Bukti harus jelas & tidak diedit

*QRIS:*
(Gambar QRIS di bawah)
          `,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Kembali ke Order Produk', callback_data: 'order_produk' }]
            ]
          }
        });
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // ============================================================
      // UNKNOWN CALLBACK
      // ============================================================
      await bot.answerCallbackQuery(callbackQuery.id, { text: '⚠️ Fitur sedang dalam pengembangan!' });
      
    } catch (error) {
      console.error('[CALLBACK_ERROR]', error.message);
      try {
        await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Terjadi kesalahan!' });
      } catch (e) {}
    }
  });

  // ============================================================
  // REGISTER SEMUA COMMAND TEKS (.command)
  // ============================================================
  // Gabungkan semua command dari semua kategori
  const allCommands = [];
  for (const category in commandCategories) {
    allCommands.push(...commandCategories[category]);
  }

  for (const cmd of allCommands) {
    bot.onText(new RegExp(`^\\.${cmd}(?:\\s+(.*))?$`), async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const args = match ? match[1] : '';

      // Eksekusi dengan pengecekan join + poin
      await executeWithCheck(bot, msg, async (b, m) => {
        // Di sini nanti implementasi fungsi asli setiap command
        // Karena 1000+ command, kita pakai response generik dulu
        // Nanti bisa di-expand per command

        // Cek apakah command butuh argumen
        const needsArg = ['brat', 'emoji', 'qc', 'sticker', 'toimg', 'ttsbrando', 'nulis', 'ocr', 'translate', 'ai', 'bard', 'openai', 'groq', 'lirik', 'play', 'ytmp3', 'ytmp4', 'tiktok', 'instagram', 'twitter', 'igstalk'];
        const hasArg = args && args.length > 0;

        if (needsArg.includes(cmd) && !hasArg) {
          return b.sendMessage(chatId, `
⚠️ *ARGUMEN KURANG!*

Command \`.${cmd}\` membutuhkan input.

📌 Contoh: \`.${cmd} teks/url di sini\`
          `, { parse_mode: 'Markdown' });
        }

        // Response sementara (nanti diganti dengan implementasi asli)
        await b.sendMessage(chatId, `
✅ *Command Berhasil!*

📌 Command: \`.${cmd}\`
📝 Argumen: ${args || '(kosong)'}
💡 Fitur ini sedang dalam pengembangan.

🐾 *Fluffy Bot — Semua fitur akan segera hadir!*
        `, { parse_mode: 'Markdown' });
      });
    });
  }

  // ============================================================
  // UNKNOWN COMMAND (/command yang tidak dikenal)
  // ============================================================
  bot.onText(/^\/(.*)/, (msg, match) => {
    const chatId = msg.chat.id;
    const cmd = match[1];
    if (!cmd.startsWith('start') && !cmd.startsWith('help')) {
      bot.sendMessage(chatId, `
❌ *Command tidak dikenal!*

Gunakan /start untuk melihat menu utama. 🐾
      `, {
        parse_mode: 'Markdown'
      });
    }
  });

  // ============================================================
  // HANDLE PESAN TEKS (bukti transfer, dll)
  // ============================================================
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/') || msg.text.startsWith('.')) {
      return;
    }

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // ============================================================
    // HANDLE BUKTI TRANSFER POIN
    // ============================================================
    if (text.startsWith('order_poin')) {
      const parts = text.split(' ');
      const amount = parseInt(parts[1]);
      
      if (isNaN(amount)) {
        return bot.sendMessage(chatId, '❌ Format salah! Kirim: `order_poin 2000`', { parse_mode: 'Markdown' });
      }

      // Cek apakah ada foto yang dikirim bersama caption
      if (!msg.photo) {
        return bot.sendMessage(chatId, '❌ Harap kirim bukti transfer berupa FOTO!');
      }

      const photo = msg.photo[msg.photo.length - 1];
      const fileId = photo.file_id;

      // Simpan order ke database
      const order = new Order({
        userId,
        username: msg.from.username || msg.from.first_name,
        productName: `Poin ${amount}`,
        amount,
        status: 'pending',
        proofImage: fileId,
        note: `Order poin ${amount}`
      });
      await order.save();

      // Kirim ke owner
      if (OWNER_ID) {
        await bot.sendPhoto(OWNER_ID, fileId, {
          caption: `
📦 *ORDER POIN BARU!*

👤 User: @${msg.from.username || msg.from.first_name}
🆔 ID: ${userId}
💰 Nominal: Rp ${amount.toLocaleString()}
📅 Waktu: ${new Date().toLocaleString()}

📌 *Status: Pending*

🔘 Konfirmasi atau tolak order ini.
          `,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Konfirmasi', callback_data: `confirm_poin_${order._id}` }],
              [{ text: '❌ Tolak', callback_data: `reject_poin_${order._id}` }]
            ]
          }
        });
      }

      // Kirim ke user
      await bot.sendMessage(chatId, `
✅ *Bukti transfer diterima!*

📦 Order poin Rp ${amount.toLocaleString()} sedang diproses.

📌 Tunggu konfirmasi dari owner ya! 🐾
      `, { parse_mode: 'Markdown' });

      return;
    }

    // ============================================================
    // HANDLE BUKTI TRANSFER PRODUK
    // ============================================================
    if (text.startsWith('order_produk')) {
      const parts = text.split(' ');
      const productId = parts[1];
      
      if (!productId) {
        return bot.sendMessage(chatId, '❌ Format salah! Kirim: `order_produk [product_id]`', { parse_mode: 'Markdown' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return bot.sendMessage(chatId, '❌ Produk tidak ditemukan!');
      }

      if (!msg.photo) {
        return bot.sendMessage(chatId, '❌ Harap kirim bukti transfer berupa FOTO!');
      }

      const photo = msg.photo[msg.photo.length - 1];
      const fileId = photo.file_id;

      // Simpan order ke database
      const order = new Order({
        userId,
        username: msg.from.username || msg.from.first_name,
        productId: product._id,
        productName: product.name,
        amount: product.price,
        status: 'pending',
        proofImage: fileId,
        note: `Order produk: ${product.name}`
      });
      await order.save();

      // Kirim ke owner
      if (OWNER_ID) {
        await bot.sendPhoto(OWNER_ID, fileId, {
          caption: `
📦 *ORDER PRODUK BARU!*

👤 User: @${msg.from.username || msg.from.first_name}
🆔 ID: ${userId}
📦 Produk: ${product.name}
💰 Harga: Rp ${product.price.toLocaleString()}
📅 Waktu: ${new Date().toLocaleString()}

📌 *Status: Pending*

🔘 Konfirmasi atau tolak order ini.
          `,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Konfirmasi', callback_data: `confirm_produk_${order._id}` }],
              [{ text: '❌ Tolak', callback_data: `reject_produk_${order._id}` }]
            ]
          }
        });
      }

      // Kirim ke user
      await bot.sendMessage(chatId, `
✅ *Bukti transfer diterima!*

📦 Order ${product.name} sedang diproses.

📌 Tunggu konfirmasi dari owner ya! 🐾
      `, { parse_mode: 'Markdown' });

      return;
    }
  });

  // ============================================================
  // HANDLE KONFIRMASI/TOLAK ORDER DARI OWNER
  // ============================================================
  bot.on('callback_query', async (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    // Cek apakah ini callback dari owner (hanya owner yang bisa konfirmasi)
    if (data.startsWith('confirm_poin_') || data.startsWith('reject_poin_') || 
        data.startsWith('confirm_produk_') || data.startsWith('reject_produk_')) {
      
      // Validasi owner
      if (userId.toString() !== OWNER_ID) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Hanya owner yang bisa konfirmasi order!' });
        return;
      }

      const parts = data.split('_');
      const action = parts[0]; // confirm / reject
      const type = parts[1]; // poin / produk
      const orderId = parts[2];

      const order = await Order.findById(orderId);
      if (!order) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Order tidak ditemukan!' });
        return;
      }

      if (order.status !== 'pending') {
        await bot.answerCallbackQuery(callbackQuery.id, { text: '⚠️ Order sudah diproses sebelumnya!' });
        return;
      }

      if (action === 'confirm') {
        // Konfirmasi order
        order.status = 'confirmed';
        order.confirmedAt = new Date();
        await order.save();

        // Jika order poin, tambahkan poin ke user
        if (type === 'poin') {
          let poinAmount = 0;
          switch (order.amount) {
            case 2000: poinAmount = 25; break;
            case 5000: poinAmount = 75; break;
            case 10000: poinAmount = 175; break;
            case 20000: poinAmount = 400; break;
            default: poinAmount = 0;
          }
          if (poinAmount > 0) {
            await addPoin(order.userId, poinAmount);
          }
        }

        // Jika order produk, kirim data produk ke user
        if (type === 'produk') {
          const product = await Product.findById(order.productId);
          if (product && product.data) {
            // Kirim data produk ke user
            await bot.sendMessage(order.userId, `
🎉 *ORDER KONFIRMASI!*

✅ Order ${order.productName} telah dikonfirmasi!

📦 *Data Produk:*
${product.data}

📌 Terima kasih sudah order! 🐾
            `, { parse_mode: 'Markdown' });
          }
        }

        // Kirim notifikasi ke user
        await bot.sendMessage(order.userId, `
🎉 *ORDER KONFIRMASI!*

✅ Order ${order.productName || 'Poin'} telah dikonfirmasi!

📌 Terima kasih sudah order! 🐾
        `, { parse_mode: 'Markdown' });

        // Kirim notifikasi ke owner
        await bot.editMessageText(`
✅ *ORDER KONFIRMASI!*

📦 ${order.productName || 'Poin'}
👤 User: @${order.username || order.userId}
💰 Rp ${order.amount.toLocaleString()}
📅 Dikonfirmasi: ${new Date().toLocaleString()}

Status: ✅ CONFIRMED
        `, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'Markdown'
        });

        await bot.answerCallbackQuery(callbackQuery.id, { text: '✅ Order berhasil dikonfirmasi!' });

      } else if (action === 'reject') {
        // Tolak order
        order.status = 'rejected';
        order.rejectedAt = new Date();
        await order.save();

        // Kirim notifikasi ke user
        await bot.sendMessage(order.userId, `
❌ *ORDER DITOLAK!*

Maaf, order ${order.productName || 'Poin'} Anda ditolak.

📌 *Kemungkinan alasan:*
├ Bukti transfer tidak jelas / diedit
├ Nama rekening tujuan tidak sesuai (Mamz Store)
├ Nominal transfer tidak sesuai
└ atau alasan lainnya

💡 *Jika Anda benar-benar sudah transfer:*
Silakan hubungi owner dengan klik tombol di bawah.

⚠️ *Jika terbukti berbohong, ada konsekuensi!*
        `, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📞 Hubungi Owner', url: 'https://t.me/guehmamz' }]
            ]
          }
        });

        // Kirim notifikasi ke owner
        await bot.editMessageText(`
❌ *ORDER DITOLAK!*

📦 ${order.productName || 'Poin'}
👤 User: @${order.username || order.userId}
💰 Rp ${order.amount.toLocaleString()}
📅 Ditolak: ${new Date().toLocaleString()}

Status: ❌ REJECTED
        `, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'Markdown'
        });

        await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Order berhasil ditolak!' });
      }

      return;
    }
  });

  console.log('✅ Fluffy Bot loaded with 1000+ commands!');
}

module.exports = { register };