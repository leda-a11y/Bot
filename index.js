const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  PermissionFlagsBits,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");
const fs = require("fs");
const express = require("express");

/* ==============================
   🌌 LEDA MARKERI — GLOBALNE VAR
============================== */

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const LOG_CHANNEL_ID = "1476647523539226785";
const ROLE_ID = "1476339229230370836";

const NEON_COLOR = "#8A2BE2";
const NEON_ACCENT = "#00E5FF";
const NEON_GIF = "https://i.imgur.com/3v5vOqi.gif";

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ DISCORD_TOKEN ili CLIENT_ID nije setovan!");
  process.exit(1);
}

/* ==============================
   🌍 KEEP ALIVE (Render)
============================= */

const app = express();
app.get("/", (req, res) => res.send("Leda Markeri bot radi 🔥"));
app.listen(3000, () => console.log("🌍 Web server aktivan"));

/* ==============================
   🤖 DISCORD CLIENT
============================= */

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

/* ==============================
   🎨 EMBED FACTORY
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

function progressEmbed(user, current, required) {
  return new EmbedBuilder()
    .setColor(NEON_ACCENT)
    .setAuthor({ name: "🔧 Napredak čišćenja — Leda NEON", iconURL: NEON_GIF })
    .setDescription(`🌐 **Korisnik:** ${user}\n⚡ **Progres:** \`${current}/${required}\``)
    .setThumbnail("https://i.imgur.com/eHl6C3S.png")
    .setFooter({ text: "Nastavi tako! 🔥", iconURL: NEON_GIF })
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

function log(guild, message) {
  const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
  if (channel) channel.send(message);
}

/* ==============================
   📜 SLASH COMMANDS
============================= */

const commands = [
  new SlashCommandBuilder()
    .setName("markeri")
    .setDescription("Postavi marker korisniku")
    .addUserOption(option =>
      option.setName("korisnik").setDescription("Izaberi korisnika").setRequired(true))
    .addIntegerOption(option =>
      option.setName("kolicina").setDescription("Koliko markera treba da očisti").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("unmarkeri")
    .setDescription("Ukloni marker korisniku")
    .addUserOption(option =>
      option.setName("korisnik").setDescription("Izaberi korisnika").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder().setName("ocisti").setDescription("Dodaj očišćeni marker"),
  new SlashCommandBuilder().setName("status").setDescription("Provjeri status markera"),
];

/* ==============================
   🚀 READY EVENT
============================= */

client.once("ready", async () => {
  console.log(`🌌 LEDA MARKERI ONLINE kao ${client.user.tag}`);

  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("⚡ Komande registrovane.");
  } catch (err) {
    console.error("❌ Greška pri registraciji komandi:", err);
  }
});

/* ==============================
   🎮 COMMAND HANDLER
============================= */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id.toString();
  const role = interaction.guild.roles.cache.get(ROLE_ID);

  if (!role) {
    return interaction.reply({
      embeds: [neonEmbed("Role greška", "Marker rola ne postoji.")],
      ephemeral: true
    });
  }

  const entry = userData[userId];

  if (interaction.commandName === "status") {
    if (!entry)
      return interaction.reply({ embeds: [neonEmbed("Nemaš marker", "Nemaš dodijeljen marker.")], ephemeral: true });

    return interaction.reply({
      embeds: [neonEmbed("Tvoj status", `Progres: \`${entry.current}/${entry.required}\``)],
      ephemeral: true
    });
  }
});

/* ==============================
   🚨 GLOBAL ERROR HANDLERI
============================= */

process.on("unhandledRejection", error => {
  console.error("❌ UNHANDLED REJECTION:", error);
});

process.on("uncaughtException", error => {
  console.error("❌ UNCAUGHT EXCEPTION:", error);
});

client.on("error", error => {
  console.error("❌ CLIENT ERROR:", error);
});

client.on("shardError", error => {
  console.error("❌ SHARD ERROR:", error);
});

/* ==============================
   🔐 LOGIN
============================= */

client.login(TOKEN)
  .then(() => console.log("✅ LOGIN POSLAN DISCORDU"))
  .catch(err => console.error("❌ LOGIN ERROR:", err));
