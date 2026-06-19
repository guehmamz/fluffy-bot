const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const features = require('../features');
const db = require('../db');
const app = express();

// ============================================================
// KONFIGURASI ENVIRONMENT
// ============================================================
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME || 'FluffyMD_bot';
const VERCEL_URL = process.env.VERCEL_URL || 'https://fluffy-bot.vercel.app';

// ============================================================
// VALIDASI TOKEN
// ============================================================
if (!BOT_TOKEN) {
  console.error('❌ ERROR: TELEGRAM_BOT_TOKEN not found in environment variables!');
  // Jangan exit, biar app tetap jalan tapi bot mati
}

// ============================================================
// INISIALISASI BOT
// ============================================================
const bot = new TelegramBot(BOT_TOKEN, { 
  polling: false, // Wajib false karena pake webhook
  onlyFirstMatch: true // Hanya proses command pertama yang cocok
});

// Simpan bot ke global agar bisa diakses di features
global.bot = bot;

// ============================================================
= KONEKSI DATABASE
// ============================================================
db.connect();

// ============================================================
= REGISTER FITUR
// ============================================================
features.register(bot);

// ============================================================
= SETUP EXPRESS
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
= ENDPOINT WEBHOOK
// ============================================================
app.post('/api/bot', async (req, res) => {
  try {
    // Proses update dari Telegram
    await bot.processUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('[WEBHOOK_ERROR]', error.message);
    // Selalu return 200 OK agar Telegram tidak ngirim ulang
    res.status(200).send('OK');
  }
});

// ============================================================
= ENDPOINT SET WEBHOOK
// ============================================================
app.get('/set-webhook', async (req, res) => {
  try {
    // Cek token dulu
    if (!BOT_TOKEN) {
      return res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:40px;text-align:center;">
            <h1 style="color:#ef4444;">❌ Error</h1>
            <p>TELEGRAM_BOT_TOKEN not set!</p>
            <p>Please add TELEGRAM_BOT_TOKEN to environment variables.</p>
          </body>
        </html>
      `);
    }

    const webhookUrl = `${VERCEL_URL}/api/bot`;
    
    // Hapus webhook lama
    await bot.deleteWebHook();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Set webhook baru
    await bot.setWebHook(webhookUrl);
    
    // Ambil info bot
    const botInfo = await bot.getMe();
    const webhookInfo = await bot.getWebHookInfo();
    
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fluffy Bot - Webhook Status</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: #0f172a;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #f8fafc;
            padding: 20px;
          }
          .card {
            background: #1e293b;
            border-radius: 24px;
            padding: 50px 40px;
            max-width: 500px;
            width: 100%;
            border: 1px solid rgba(255,255,255,0.05);
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            text-align: center;
          }
          .icon { font-size: 64px; margin-bottom: 16px; }
          h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
          .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 30px; }
          .status {
            display: inline-flex;
            align-items: center;
            background: rgba(34, 197, 94, 0.1);
            color: #4ade80;
            padding: 8px 20px;
            border-radius: 100px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 30px;
            border: 1px solid rgba(34, 197, 94, 0.2);
          }
          .status-dot {
            width: 8px;
            height: 8px;
            background: #22c55e;
            border-radius: 50%;
            margin-right: 10px;
            box-shadow: 0 0 10px #22c55e;
          }
          .info-grid {
            text-align: left;
            background: #0f172a;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            font-size: 14px;
          }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #94a3b8; }
          .info-value { color: #f8fafc; font-weight: 600; }
          .btn {
            display: inline-block;
            padding: 14px 28px;
            background: #38bdf8;
            color: #0f172a;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 14px;
            transition: all 0.2s;
          }
          .btn:hover { transform: translateY(-2px); opacity: 0.9; }
          .btn-secondary {
            background: transparent;
            color: #f8fafc;
            border: 1px solid rgba(255,255,255,0.1);
            margin-left: 10px;
          }
          .footer { margin-top: 24px; color: #475569; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🐾</div>
          <h1>Webhook Configured</h1>
          <p class="subtitle">Fluffy Bot is ready to serve!</p>
          
          <div class="status">
            <div class="status-dot"></div>
            <span>Connected</span>
          </div>
          
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Bot Name</span>
              <span class="info-value">${botInfo.first_name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Username</span>
              <span class="info-value">@${botInfo.username}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bot ID</span>
              <span class="info-value">${botInfo.id}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Webhook URL</span>
              <span class="info-value" style="font-size:12px;word-break:break-all;">${webhookUrl}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Pending Updates</span>
              <span class="info-value">${webhookInfo.pending_update_count || 0}</span>
            </div>
          </div>
          
          <div>
            <a class="btn" href="https://t.me/${botInfo.username}">🚀 Open Bot</a>
            <a class="btn btn-secondary" href="/">🏠 Dashboard</a>
          </div>
          
          <div class="footer">
            © 2026 Fluffy Bot — Made with ❤️ by Mamz
          </div>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('[SET_WEBHOOK_ERROR]', error.message);
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:40px;text-align:center;">
          <h1 style="color:#ef4444;">❌ Configuration Failed</h1>
          <p style="color:#94a3b8;">Error: ${error.message}</p>
          <p style="color:#94a3b8;font-size:14px;">Please check your environment variables and try again.</p>
        </body>
      </html>
    `);
  }
});

// ============================================================
= ENDPOINT DASHBOARD
// ============================================================
app.get('/', (req, res) => {
  const tokenStatus = BOT_TOKEN ? '✅ Set' : '❌ Not Set';
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fluffy Bot - Dashboard</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', -apple-system, sans-serif;
          background: #020617;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #f8fafc;
          padding: 20px;
        }
        .card {
          background: #0f172a;
          border-radius: 24px;
          padding: 50px 40px;
          max-width: 440px;
          width: 100%;
          border: 1px solid rgba(255,255,255,0.05);
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .icon { font-size: 72px; margin-bottom: 12px; }
        h1 { font-size: 32px; font-weight: 800; letter-spacing: -1px; }
        .subtitle { color: #94a3b8; font-size: 15px; margin-bottom: 32px; }
        .status-pill {
          display: inline-flex;
          align-items: center;
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          padding: 8px 20px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 32px;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          margin-right: 10px;
          box-shadow: 0 0 10px #22c55e;
        }
        .info-grid {
          text-align: left;
          background: #1e293b;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 28px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 14px;
        }
        .info-label { color: #94a3b8; }
        .info-value { color: #f8fafc; font-weight: 600; }
        .btn {
          display: inline-block;
          padding: 14px 32px;
          background: #38bdf8;
          color: #020617;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.2s;
        }
        .btn:hover { transform: translateY(-2px); opacity: 0.9; }
        .btn-secondary {
          background: #1e293b;
          color: #f8fafc;
          border: 1px solid rgba(255,255,255,0.1);
          margin-top: 12px;
        }
        .footer { margin-top: 28px; color: #475569; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">🐾</div>
        <h1>Fluffy Bot</h1>
        <p class="subtitle">Bot Telegram with 1000+ Features</p>
        
        <div class="status-pill">
          <div class="status-dot"></div>
          <span>Service Operational</span>
        </div>
        
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Bot Token</span>
            <span class="info-value">${tokenStatus}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Database</span>
            <span class="info-value">${db.isDbConnected() ? '✅ Connected' : '❌ Disconnected'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Environment</span>
            <span class="info-value">Vercel</span>
          </div>
        </div>
        
        <div>
          <a class="btn" href="/set-webhook">🔗 Set Webhook</a>
        </div>
        <div style="margin-top:8px;">
          <a class="btn btn-secondary" href="https://t.me/${BOT_USERNAME}" target="_blank">🚀 Open Bot</a>
        </div>
        
        <div class="footer">
          © 2026 Fluffy Bot — Made with ❤️ by Mamz
        </div>
      </div>
    </body>
    </html>
  `);
});

// ============================================================
= ERROR HANDLING GLOBAL
// ============================================================
// Handle uncaught exceptions agar server tidak mati
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT_EXCEPTION]', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});

// ============================================================
= EXPORT UNTUK VERCEL
// ============================================================
module.exports = app;
