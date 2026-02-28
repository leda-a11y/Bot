const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

/* ==============================
   🔐 ENV VAR
============================== */

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN nije setovan!");
  process.exit(1);
}

/* ==============================
   🌍 KEEP ALIVE (Render)
============================== */

const app = express();
app.get("/", (req, res) => res.send("Bot radi 🔥"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🌍 Web server aktivan na portu", PORT);
});

/* ==============================
   🤖 DISCORD CLIENT
============================== */

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once("ready", () => {
  console.log("✅ BOT JE STVARNO ONLINE kao", client.user.tag);
});

client.on("error", err => console.error("CLIENT ERROR:", err));
process.on("unhandledRejection", err => console.error("UNHANDLED:", err));
process.on("uncaughtException", err => console.error("UNCAUGHT:", err));

console.log("TOKEN:", TOKEN ? "OK" : "EMPTY");

client.login(TOKEN)
  .then(() => console.log("📡 LOGIN REQUEST POSLAN DISCORDU"))
  .catch(err => console.error("❌ LOGIN ERROR:", err));
