// ================== IMPORTS ==================
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const express = require("express");
const fs = require("fs");

// ================== EXPRESS ==================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).send("Bot is running");
});

app.listen(PORT, () => {
  console.log(`🌍 Web server running on port ${PORT}`);
});

// ================== TOKEN CHECK ==================
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN nije postavljen!");
  process.exit(1);
}

// ================== CLIENT ==================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const punishRoleName = "Marker";
const dataFile = "./data.json";
let userData = {};

// ================== LOAD DATA ==================
if (fs.existsSync(dataFile)) {
  try {
    userData = JSON.parse(fs.readFileSync(dataFile));
  } catch {
    userData = {};
  }
}

function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(userData, null, 2));
}

function sendLog(guild, content) {
  const logChannel = guild.channels.cache.find(
    c => c.name === "mod-log"
  );
  if (logChannel) logChannel.send(content);
}

// ================== SLASH COMMANDS ==================
const commands = [
  new SlashCommandBuilder()
    .setName("markeri")
    .setDescription("Dodaj Marker rolu korisniku")
    .addUserOption(option =>
      option.setName("user").setDescription("Korisnik").setRequired(true))
    .addIntegerOption(option =>
      option.setName("amount").setDescription("Koliko puta mora očistiti").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ocisti")
    .setDescription("Očisti jedan marker"),

  new SlashCommandBuilder()
    .setName("unmarkeri")
    .setDescription("Ukloni Marker rolu")
    .addUserOption(option =>
      option.setName("user").setDescription("Korisnik").setRequired(true)),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Provjeri svoj napredak")
].map(c => c.toJSON());

// ================== READY ==================
client.once("ready", async () => {
  console.log(`🤖 Bot online kao ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log("✅ Slash komande registrovane.");
  } catch (err) {
    console.error(err);
  }
});

// ================== INTERACTIONS ==================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  const guild = interaction.guild;
  const markerRole = guild.roles.cache.find(r => r.name === punishRoleName);

  // ADMIN CHECK
  if (["markeri", "unmarkeri"].includes(commandName)) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({
        content: "❌ Nemaš dozvolu.",
        ephemeral: true
      });
    }
  }

  // ================== /markeri ==================
  if (commandName === "markeri") {
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    const member = await guild.members.fetch(user.id);

    if (!markerRole) {
      return interaction.reply({
        content: "❌ Napravi rolu 'Marker'.",
        ephemeral: true
      });
    }

    await member.roles.add(markerRole);

    userData[user.id] = {
      current: 0,
      required: amount
    };

    saveData();

    sendLog(guild, `🛑 ${user.tag} dobio Marker (${amount})`);

    return interaction.reply({
      content: `⚠️ ${user.tag} mora očistiti ${amount} puta.`,
      ephemeral: true
    });
  }

  // ================== /ocisti ==================
  if (commandName === "ocisti") {
    const userId = interaction.user.id;

    if (!userData[userId]) {
      return interaction.reply({
        content: "Nemaš aktivan marker.",
        ephemeral: true
      });
    }

    userData[userId].current++;
    saveData();

    sendLog(
      guild,
      `🧹 ${interaction.user.tag} očistio marker (${userData[userId].current}/${userData[userId].required})`
    );

    if (userData[userId].current >= userData[userId].required) {
      const member = await guild.members.fetch(userId);
      await member.roles.remove(markerRole);

      delete userData[userId];
      saveData();

      sendLog(guild, `✅ ${interaction.user.tag} završio kaznu.`);

      return interaction.reply({
        content: "🎉 Kazna završena!",
        ephemeral: true
      });
    }

    return interaction.reply({
      content: `🧹 Napredak: ${userData[userId].current}/${userData[userId].required}`,
      ephemeral: true
    });
  }

  // ================== /unmarkeri ==================
  if (commandName === "unmarkeri") {
    const user = interaction.options.getUser("user");
    const member = await guild.members.fetch(user.id);

    if (markerRole) await member.roles.remove(markerRole);

    delete userData[user.id];
    saveData();

    sendLog(guild, `🔓 ${user.tag} je oslobođen markera.`);

    return interaction.reply({
      content: `✅ ${user.tag} je oslobođen markera.`,
      ephemeral: true
    });
  }

  // ================== /status ==================
  if (commandName === "status") {
    const data = userData[interaction.user.id];

    if (!data) {
      return interaction.reply({
        content: "Nemaš aktivan marker.",
        ephemeral: true
      });
    }

    return interaction.reply({
      content: `📊 Napredak: ${data.current}/${data.required}`,
      ephemeral: true
    });
  }
});

// ================== LOGIN ==================
client.login(process.env.DISCORD_TOKEN);
