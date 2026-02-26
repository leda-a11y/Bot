const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setuproles")
    .setDescription("Postavi NEON reaction role panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const guild = interaction.guild;
      const channelId = "1476700778109341827"; // zameni sa ID kanala ﹝🔶﹞ʀᴏʟᴏᴠɪ
      const channel = guild.channels.cache.get(channelId);
      if (!channel) return interaction.reply({ content: "❌ Kanal nije pronađen!", ephemeral: true });

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

      // Pošalji embed
      await channel.send({ embeds: [rolesEmbed], components: [row] });
      await interaction.reply({ content: "✅ Reaction role panel postavljen!", ephemeral: true });
    } catch (err) {
      console.error("❌ Greška prilikom postavljanja reaction role panela:", err);
      await interaction.reply({ content: "❌ Došlo je do greške!", ephemeral: true });
    }
  }
};

// Dugmad handler – stavi ovo u tvoj index.js gde već handluješ interactionCreate
/*
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const member = interaction.member;
  const ROLE_MUSKO = "1311811932776300616";  
  const ROLE_ZENSKO = "1311811981992263771"; 

  let newRoleId;
  if (interaction.customId === "role_musko") newRoleId = ROLE_MUSKO;
  if (interaction.customId === "role_zensko") newRoleId = ROLE_ZENSKO;
  if (!newRoleId) return;

  const newRole = interaction.guild.roles.cache.get(newRoleId);
  if (!newRole) return;

  // Ukloni drugu rolu ako postoji
  const otherRoles = [ROLE_MUSKO, ROLE_ZENSKO].filter(id => id !== newRoleId);
  for (const rId of otherRoles) {
    if (member.roles.cache.has(rId)) await member.roles.remove(rId);
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
*/
