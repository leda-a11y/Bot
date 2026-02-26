const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  PermissionFlagsBits,
  REST,
  Routes
} = require("discord.js");
const fs = require("fs");
const express = require("express");

/* ==============================
   🔐 ENVIRONMENT VARIABLES
============================== */

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const LOG_CHANNEL_ID = "1476647523539226785";

/* ============================== */

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ TOKEN ili CLIENT_ID nije postavljen!");
  process.exit(1);
}

/* ==============================
   🌍 KEEP ALIVE (Render)
============================== */

const app = express();
app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(3000, () => console.log("🌍 Web server ready"));

/* ==============================
   🤖 DISCORD CLIENT
============================== */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ==============================
   💾 DATA SYSTEM
============================== */

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
============================== */

const commands = [
  new SlashCommandBuilder()
    .setName("markeri")
    .setDescription("Postavi marker korisniku")
    .addUserOption(option =>
      option.setName("korisnik")
        .setDescription("Izaberi korisnika")
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName("kolicina")
        .setDescription("Koliko markera treba")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("ocisti")
    .setDescription("Dodaj očišćeni marker"),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Provjeri status markera")
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

/* ==============================
   🚀 BOT READY
============================== */

client.once("ready", async () => {
  console.log(`✅ Bot prijavljen kao ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Global slash komande registrovane.");
  } catch (err) {
    console.error("❌ Greška pri registraciji komandi:", err);
  }
});

/* ==============================
   🎮 COMMAND HANDLER
============================== */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  const userId = interaction.user.id;

  /* ===== MARKERI (ADMIN) ===== */

  if (commandName === "markeri") {
    const korisnik = interaction.options.getUser("korisnik");
    const kolicina = interaction.options.getInteger("kolicina");

    userData[korisnik.id] = {
      current: 0,
      required: kolicina
    };

    saveData();

    await interaction.reply({
      content: `✅ ${korisnik} treba očistiti **${kolicina}** markera.`,
      ephemeral: true
    });

    log(interaction.guild,
      `📌 ${interaction.user.tag} postavio ${kolicina} markera za ${korisnik.tag}`
    );
  }

  /* ===== OCISTI ===== */

  if (commandName === "ocisti") {

    if (
      !userData[userId] ||
      typeof userData[userId].current !== "number" ||
      typeof userData[userId].required !== "number"
    ) {
      return interaction.reply({
        content: "❌ Nemaš aktivan marker.",
        ephemeral: true
      });
    }

    userData[userId].current++;

    if (userData[userId].current >= userData[userId].required) {
      log(interaction.guild,
        `🎉 ${interaction.user.tag} završio sve markere!`
      );

      delete userData[userId];
      saveData();

      return interaction.reply({
        content: "🎉 Završio si sve markere!",
        ephemeral: true
      });
    }

    saveData();

    await interaction.reply({
      content: `🧹 Napredak: ${userData[userId].current}/${userData[userId].required}`,
      ephemeral: true
    });
  }

  /* ===== STATUS ===== */

  if (commandName === "status") {

    if (
      !userData[userId] ||
      typeof userData[userId].current !== "number" ||
      typeof userData[userId].required !== "number"
    ) {
      return interaction.reply({
        content: "❌ Nemaš aktivan marker.",
        ephemeral: true
      });
    }

    await interaction.reply({
      content: `📊 Trenutno stanje: ${userData[userId].current}/${userData[userId].required}`,
      ephemeral: true
    });
  }
});

/* ==============================
   🔐 LOGIN
============================== */

client.login(TOKEN);
