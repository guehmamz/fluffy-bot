# 🐾 Fluffy MD Bot

> **Bot Telegram dengan 1000+ fitur keren!**  
> Aktif 24/7 tanpa server berbayar, deploy di Vercel + MongoDB Atlas.

---

## 📌 **Fitur Utama**

| Kategori | Fitur |
|----------|-------|
| 🎨 **Sticker** | `.brat`, `.emoji`, `.sticker`, `.toimg`, `.qc`, `.smeme`, dan 20+ command |
| 🛠️ **Tools** | `.ssweb`, `.tourl`, `.translate`, `.ocr`, `.nulis`, `.shortlink`, dan 50+ command |
| 🎨 **Maker** | `.toanime`, `.tomanga`, `.tomanhwa`, `.ghibli`, `.carbon`, dan 200+ command |
| 🔮 **Primbon** | `.artinama`, `.zodiak`, `.quotes`, `.ramalanjodoh`, dan 20+ command |
| 🎮 **Fun** | `.meme`, `.fitnah`, `.cek*`, `.sound*`, `.sad*`, dan 30+ command |
| ⬇️ **Download** | `.tiktok`, `.ytmp3`, `.ytmp4`, `.instagram`, `.twitter`, dan 20+ command |
| 🧠 **AI** | `.ai`, `.bard`, `.openai`, `.groq`, `.gpt5plus`, `.soraai`, dan 20+ command |
| 🔍 **Search** | `.lirik`, `.play`, `.igstalk`, `.cekgempa`, `.wattpad`, dan 30+ command |
| 🎯 **Game** | `.tebakgambar`, `.tebaklagu`, `.kuis`, `.tictactoe`, dan 30+ command |
| 🔐 **Encrypt** | `.enc`, `.encstrong`, `.encultra`, `.encinvis`, dan 50+ command |
| 🎌 **Anime** | `.animewaifu`, `.animehusbu`, `.randomnime`, dan 80+ command |
| 🕌 **Islami** | `.doa`, `.jadwalsholat`, `.hadits`, `.ayatkursi`, dan 12+ command |
| 👥 **Group** | `.warn`, `.kick`, `.promote`, `.tagall`, `.hidetag`, dan 50+ command |
| 👑 **Owner** | `.addprem`, `.addlimit`, `.setmenu`, `.restartbot`, dan 50+ command |
| 🏪 **Store** | `.list`, `.setlist`, `.addlist`, `.buyapkprem`, dan 20+ command |

**📌 Total Fitur: 1000+ Command!** 🚀

---

## 🛒 **Sistem Poin & Order**

| Fitur | Keterangan |
|-------|------------|
| **💎 Poin** | Setiap command = -5 poin |
| **🪙 Beli Poin** | 2.000 → 25 Poin, 5.000 → 75 Poin, 10.000 → 175 Poin, 20.000 → 400 Poin |
| **📦 Order Produk** | Owner bisa tambah produk, user order dengan QRIS, konfirmasi/tolak otomatis |

---

## 🔧 **Cara Deploy**

### 1. **Persiapan**
- Buat bot di [@BotFather](https://t.me/BotFather)
- Dapatkan `TELEGRAM_BOT_TOKEN`
- Buat database di [MongoDB Atlas](https://www.mongodb.com/atlas)
- Dapatkan `MONGODB_URI`

### 2. **Environment Variables**
Isi `.env` dengan data berikut:
```

TELEGRAM_BOT_TOKEN=your_bot_token
BOT_USERNAME=FluffyMD_bot
CHANNEL_USERNAME=Fluffy_Information
OWNER_ID=your_telegram_id
QRIS_IMAGE=https://files.catbox.moe/g1o5a1.jpg
MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=fluffy_bot

```

### 3. **Deploy ke Vercel**
1. Push kode ke GitHub
2. Import repository ke [Vercel](https://vercel.com)
3. Tambahkan Environment Variables
4. Deploy
5. Akses `https://your-bot.vercel.app/set-webhook`

---

## 📊 **Struktur Folder**

```

fluffy-bot/
├── api/
│   └── bot.js              # Entry point Vercel
├── features/
│   └── index.js            # Semua fitur (1000+ command)
├── db/
│   └── index.js            # Koneksi MongoDB + Model
├── .env.example            # Template environment variables
├── .gitignore              # File yang tidak di-commit
├── package.json            # Dependencies
├── vercel.json             # Konfigurasi deploy Vercel
└── README.md               # Dokumentasi

```

---

## 💬 **Kontak & Support**

| Platform | Link |
|----------|------|
| **👤 Owner** | [@guehmamz](https://t.me/guehmamz) |
| **📢 Channel** | [@Fluffy_Information](https://t.me/Fluffy_Information) |
| **🐾 Bot** | [@FluffyMD_bot](https://t.me/FluffyMD_bot) |

---

## ⚠️ **Disclaimer**

Bot ini dibuat untuk tujuan **edukasi dan hiburan**.  
Gunakan dengan bijak, patuhi hukum yang berlaku di negara Anda.

---

## 📝 **License**

MIT © 2026 [Mamz](https://t.me/guehmamz)

---

## ⭐ **Support**

Jika kamu suka dengan bot ini, jangan lupa kasih ⭐ di repository ini!  
Terima kasih sudah menggunakan Fluffy MD Bot! 🐾
