const { Client, GatewayIntentBits } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;

console.log("TOKEN:", TOKEN ? "OK" : "EMPTY");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

console.log("📡 Pokusavam login...");
client.login(TOKEN)
  .then(() => console.log("✅ LOGIN REQUEST POSLAN DISCORDU"))
  .catch(err => console.error("❌ LOGIN ERROR:", err));

client.once("ready", () => console.log("🌌 BOT ONLINE kao", client.user.tag));
