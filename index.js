const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits, REST, Routes, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const express = require("express");

/* ==============================
   🌌 LEDA MARKERI — GLOBALNE VAR
============================= */

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const LOG_CHANNEL_ID = "1476647523539226785";
const ROLE_ID = "1476339229230370836";

const NEON_COLOR = "#8A2BE2"; // 💜 Neon Purple
const NEON_ACCENT = "#00E5FF"; // 🔵 Neon Cyan
const NEON_GIF = "https://i.imgur.com/3v5vOqi.gif"; // 🌟 Animirani neon GIF

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ DISCORD_TOKEN ili CLIENT_ID nije setovan!");
  process.exit(1);
}

/* ==============================
   🌍 KEEP ALIVE (Railway/Render)
============================= */

const app = express();
app.get("/", (req, res) => res.send("Leda Markeri bot radi 🔥"));
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🌍 Web server aktivan na portu", PORT);
});

/* ==============================
   🤖 DISCORD CLIENT
============================= */

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

/* ==============================
   🎨 NEON EMBED FACTORY
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
    .setDescription(`
🌐 **Korisnik:** ${user}
⚡ **Progres:** \`${current}/${required}\`
`)
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
    .addUserOption(option => option.setName("korisnik").setDescription("Izaberi korisnika").setRequired(true))
    .addIntegerOption(option => option.setName("kolicina").setDescription("Koliko markera treba da očisti").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("unmarkeri")
    .setDescription("Ukloni marker korisniku")
    .addUserOption(option => option.setName("korisnik").setDescription("Izaberi korisnika").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("ocisti")
    .setDescription("Dodaj očišćeni marker"),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Provjeri status markera")
];

/* ==============================
   🚀 REGISTER SLASH COMMANDS
============================= */

async function registerCommands() {
  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("⚡ Komande registrovane (NEON MODE).");
  } catch (err) {
    console.error("❌ Greška pri registraciji komandi:", err);
  }
}

/* ==============================
   🎮 COMMAND HANDLER
============================= */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  const userId = interaction.user.id.toString();
  const role = interaction.guild.roles.cache.get(ROLE_ID);

  if (!role) {
    return interaction.reply({ embeds: [neonEmbed("Role greška", "Marker rola ne postoji (pogrešan ROLE_ID).")], ephemeral: true });
  }

  try {
    if (commandName === "markeri") {
      const korisnik = interaction.options.getUser("korisnik");
      const kolicina = interaction.options.getInteger("kolicina");
      const member = await interaction.guild.members.fetch(korisnik.id);
      if (!member.manageable) throw new Error("Ne mogu dodati rolu korisniku.");

      await member.roles.add(role);
      userData[korisnik.id] = { current: 0, required: kolicina };
      saveData();

      interaction.reply({ embeds: [neonEmbed("Marker postavljen", `${korisnik} mora očistiti **${kolicina}** markera.`, "📌")], ephemeral: true });
      log(interaction.guild, `📌 ${interaction.user.tag} postavio ${kolicina} markera za ${korisnik.tag}`);
    }

    if (commandName === "unmarkeri") {
      const korisnik = interaction.options.getUser("korisnik");
      const member = await interaction.guild.members.fetch(korisnik.id);
      if (!userData[korisnik.id]) throw new Error("Korisnik nema aktivan marker.");

      if (member.manageable) await member.roles.remove(role);
      delete userData[korisnik.id];
      saveData();

      interaction.reply({ embeds: [neonEmbed("Marker uklonjen", `Marker uklonjen za ${korisnik}.`, "🗑️")], ephemeral: true });
      log(interaction.guild, `🗑️ ${interaction.user.tag} uklonio marker za ${korisnik.tag}`);
    }

    if (commandName === "ocisti") {
      const entry = userData[userId];
      if (!entry) return interaction.reply({ embeds: [neonEmbed("Nemaš marker", "Nemaš aktivan marker.")], ephemeral: true });

      entry.current++;
      saveData();

      if (entry.current >= entry.required) {
        const member = await interaction.guild.members.fetch(userId);
        if (member.manageable) await member.roles.remove(role);
        delete userData[userId];
        saveData();
        return interaction.reply({ embeds: [neonEmbed("Svi markeri očišćeni!", `${interaction.user} je završio sve!`, "🎉")] });
      }

      interaction.reply({ embeds: [progressEmbed(interaction.user, entry.current, entry.required)] });
    }

    if (commandName === "status") {
      const entry = userData[userId];
      if (!entry) return interaction.reply({ embeds: [neonEmbed("Nemaš marker", "Nemaš dodijeljen marker.", "❌")], ephemeral: true });
      interaction.reply({ embeds: [neonEmbed("Tvoj status markera", `Progres: \`${entry.current}/${entry.required}\``, "📊")], ephemeral: true });
    }

  } catch (err) {
    console.error("❌ ERROR U COMMAND HANDLERU:", err);
    interaction.reply({ embeds: [neonEmbed("Greška", `${err.message}`, "⚠")], ephemeral: true });
  }
});

/* ==============================
   🚨 GLOBAL ERROR HANDLERI
============================= */

process.on("unhandledRejection", err => console.error("❌ UNHANDLED REJECTION:", err.stack || err));
process.on("uncaughtException", err => console.error("❌ UNCAUGHT EXCEPTION:", err.stack || err));
client.on("error", err => console.error("❌ CLIENT ERROR:", err.stack || err));
client.on("shardError", err => console.error("❌ SHARD ERROR:", err.stack || err));

/* ==============================
   🔐 LOGIN
============================= */

console.log("TOKEN:", TOKEN ? "OK" : "EMPTY");

client.login(TOKEN)
  .then(() => {
    console.log("✅ LOGIN REQUEST POSLAN DISCORDU");
    registerCommands();
  })
  .catch(err => console.error("❌ LOGIN ERROR:", err));
