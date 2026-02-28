const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits, REST, Routes, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const express = require("express");

/* ==============================
   🌌 GLOBAL VARIABLES
============================= */

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const LOG_CHANNEL_ID = "1476647523539226785";
const ROLE_ID = "1476339229230370836";

const NEON_COLOR = "#8A2BE2";
const NEON_ACCENT = "#00E5FF";
const NEON_GIF = "https://i.imgur.com/3v5vOqi.gif";

if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN nije setovan!");
  process.exit(1);
}
if (!CLIENT_ID) {
  console.error("❌ CLIENT_ID nije setovan!");
  process.exit(1);
}

/* ==============================
   🌍 EXPRESS KEEP-ALIVE
============================= */

const app = express();
app.get("/", (req, res) => res.send("Leda Markeri bot radi 🔥"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Web server aktivan na portu ${PORT}`));

/* ==============================
   🤖 DISCORD CLIENT
============================= */

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

/* ==============================
   🎨 EMBED HELPERS
============================= */

function neonEmbed(title, desc, emoji = "✨") {
  return new EmbedBuilder()
    .setColor(NEON_COLOR)
    .setAuthor({ name: "🌌 Leda Markeri — NEON System", iconURL: NEON_GIF })
    .setTitle(`${emoji} ${title}`)
    .setDescription(desc)
    .setThumbnail("https://i.imgur.com/eHl6C3S.png")
    .setFooter({ text: "🌙 Leda Markeri • Neon Edition", iconURL: NEON_GIF })
    .setTimestamp();
}

/* ==============================
   💾 DATA SYSTEM
============================= */

let userData = {};
if (fs.existsSync("data.json")) {
  userData = JSON.parse(fs.readFileSync("data.json"));
}

function saveData() {
  fs.writeFileSync("data.json", JSON.stringify(userData, null, 2));
}

/* ==============================
   🚀 DEBUG LOGS I LOGIN
============================= */

console.log("TOKEN:", TOKEN ? "OK" : "EMPTY");

console.log("📡 Pokušavam login na Discord...");
client.login(TOKEN)
  .then(() => console.log("✅ LOGIN REQUEST POSLAN DISCORDU"))
  .catch(err => console.error("❌ LOGIN ERROR:", err));

client.once("ready", () => {
  console.log("🌌 BOT JE STVARNO ONLINE kao", client.user.tag);
});

/* ==============================
   🚨 ERROR HANDLERI
============================= */

process.on("unhandledRejection", err => console.error("❌ UNHANDLED REJECTION:", err));
process.on("uncaughtException", err => console.error("❌ UNCAUGHT EXCEPTION:", err));
client.on("error", err => console.error("❌ CLIENT ERROR:", err));
client.on("shardError", err => console.error("❌ SHARD ERROR:", err));

