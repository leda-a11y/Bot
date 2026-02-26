const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = async (client) => {
  const channel = client.channels.cache.find(c => c.name === "﹝🔶﹞ʀᴏʟᴏᴠɪ");
  if (!channel) return console.log("❌ Kanal ﹝🔶﹞ʀᴏʟᴏᴠɪ nije pronađen.");

  // NEON Embed
  const rolesEmbed = new EmbedBuilder()
    .setColor("#00FFFF")
    .setTitle("🌌 Izaberi svoju rolu!")
    .setDescription(`
Klikni dugme ispod da dobiješ svoju rolu (samo jedna):

🔵 │𝗠𝘂𝘀𝗸𝗼  
🔴 │Ž𝐞𝐧𝐬𝐤𝐨
    `)
    .setFooter({ text: "Leda NEON Roles System", iconURL: "https://i.imgur.com/3v5vOqi.gif" })
    .setTimestamp();

  // Dugmad
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("role_musko")
        .setLabel("🔵 │𝗠𝘂𝘀𝗸𝗼")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("role_zensko")
        .setLabel("🔴 │Ž𝐞𝐧𝐬𝐤𝐨")
        .setStyle(ButtonStyle.Danger)
    );

  // Pošalji embed sa dugmadima
  channel.send({ embeds: [rolesEmbed], components: [row] });

  // Dugmad handler
  client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    const member = interaction.member;

    // Role ID-ovi
    const ROLE_MUSKO = "1311811932776300616";   // stavi pravi ID
    const ROLE_ZENSKO = "1311811981992263771"; // stavi pravi ID

    let newRoleId;
    if (interaction.customId === "role_musko") newRoleId = ROLE_MUSKO;
    if (interaction.customId === "role_zensko") newRoleId = ROLE_ZENSKO;
    if (!newRoleId) return;

    const newRole = interaction.guild.roles.cache.get(newRoleId);
    if (!newRole) return;

    // Ukloni drugu rolu ako postoji
    const otherRoles = [ROLE_MUSKO, ROLE_ZENSKO].filter(id => id !== newRoleId);
    for (const rId of otherRoles) {
      if (member.roles.cache.has(rId)) {
        await member.roles.remove(rId);
      }
    }

    // Dodeli novu rolu ili ukloni ako je ista
    if (member.roles.cache.has(newRoleId)) {
      await member.roles.remove(newRole);
      await interaction.reply({ content: `❌ Uklonjena ti je rola ${newRole.name}`, ephemeral: true });
    } else {
      await member.roles.add(newRole);
      await interaction.reply({ content: `✅ Dodeljena ti je rola ${newRole.name}`, ephemeral: true });
    }
  });
};