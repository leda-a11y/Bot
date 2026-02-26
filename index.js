// ================== EXPRESS (za deployment) ==================
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).send("Bot is running");
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// ================== DISCORD BOT ==================
const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const fs = require("fs");

// Provjera tokena
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN nije postavljen u Environment Variables!");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const punishRoleName = "Marker";
const dataFile = "./data.json";
let userData = {};

// Učitavanje podataka
if (fs.existsSync(dataFile)) {
  try {
    userData = JSON.parse(fs.readFileSync(dataFile));
  } catch (err) {
    console.error("Greška pri čitanju data.json:", err);
    userData = {};
  }
}

function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(userData, null, 2));
}

// Kada se bot upali
client.once("ready", () => {
  console.log(`🤖 Bot je online kao ${client.user.tag}`);
});

// ================== KOMANDE ==================
client.on("messageCreate", async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const args = message.content.trim().split(/\s+/);
  const command = args[0].toLowerCase();

  // ================== !markeri ==================
  if (command === "!markeri") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("❌ Nemaš dozvolu.");
    }

    const member = message.mentions.members.first();
    const amount = parseInt(args[2]);

    if (!member) return message.reply("Taguj člana.");
    if (!amount || amount < 1) return message.reply("Upiši validan broj.");

    const role = message.guild.roles.cache.find(r => r.name === punishRoleName);
    if (!role) return message.reply("Napravi rolu 'Marker'.");

    await member.roles.add(role);

    userData[member.id] = {
      current: 0,
      required: amount
    };

    saveData();

    return message.channel.send(
      `⚠️ ${member.user.tag} mora očistiti ${amount} puta.`
    );
  }

  // ================== !unmarkeri ==================
  if (command === "!unmarkeri") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("❌ Nemaš dozvolu.");
    }

    const member = message.mentions.members.first();
    if (!member) return message.reply("Taguj člana.");

    const role = message.guild.roles.cache.find(r => r.name === punishRoleName);
    if (role) await member.roles.remove(role);

    delete userData[member.id];
    saveData();

    return message.channel.send(
      `✅ ${member.user.tag} je oslobođen markera.`
    );
  }

  // ================== !ocisti ==================
  if (command === "!ocisti") {
    const member = message.member;

    if (!member.roles.cache.some(role => role.name === punishRoleName)) return;
    if (!userData[member.id]) return;

    userData[member.id].current++;
    saveData();

    await message.channel.send(
      `🧹 Napredak: ${userData[member.id].current}/${userData[member.id].required}`
    );

    if (userData[member.id].current >= userData[member.id].required) {
      const role = message.guild.roles.cache.find(r => r.name === punishRoleName);
      if (role) await member.roles.remove(role);

      delete userData[member.id];
      saveData();

      await message.channel.send("🎉 Kazna završena. Vraćen ti je pristup.");
    }
  }
});

// ================== LOGIN ==================
client.login(process.env.DISCORD_TOKEN);
