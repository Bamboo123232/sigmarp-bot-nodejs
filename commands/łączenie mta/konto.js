/*
 - Autor kodu: GrabeKK
 - Discord: grabekk.
 - Zakazuje się używania kodu bez zgody autora!
*/

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const mysql = require('../../database');
const bazadanych = mysql.getDBConnection1()
setInterval(mysql.keepDBAlive1, 5000);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('konto')
    .setDescription('Sprawdź informacje na temat konta w grze')
    .addUserOption(option => option.setName('użytkownik').setDescription('Oznacz użytkownika, którego konto chcesz sprawdzić').setRequired(false)),
  async execute(interaction) {
    let target = interaction.options.getUser('użytkownik');
    if (!target) {
      target = interaction.user;
    }

    const embedBłąd = new EmbedBuilder()
    .setColor('Red')
    .setDescription('❌ Wystąpił błąd podczas sprawdzania informacji.')

    bazadanych.query(`SELECT * FROM discord_connect WHERE did = ?`, [target.id], async (err, results) => { // Sprawdzanie czy użytkownik posiada połączone konto
      if (err) {
        return await interaction.reply({ embeds: [embedBłąd], ephemeral: true });
      }

      if (!results.length) {
        const embedzikee = new EmbedBuilder()
          .setColor('Red')
          .setDescription(`❌ To konto nie jest połączone z serwerem!`)
        return interaction.reply({ embeds: [embedzikee] });
      }

      bazadanych.query(`SELECT * FROM pystories_users WHERE id = ?`, [results[0].sid], async (err, rows1) => { // Pobieranie informacji na temat użytkownika
        if (err) {
          return await interaction.reply({ embeds: [embedBłąd], ephemeral: true });
        }

        const replace = {
          "1": "Tak",
          "0": "Nie",
        };

        const totalMinutes = rows1[0].hours;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const embed = new EmbedBuilder()
          .setTitle(`Konto użytkownika ${rows1[0].login}`)
          .setThumbnail(target.avatarURL({ dynamic: true }))
          .setTimestamp()
          .setFooter({ text: `Wywołane przez: ${interaction.user.tag}`, iconURL: `${interaction.user.avatarURL({ dynamic: true })}` })
          .addFields(
            { name: "Informacje:", value: `🤵 Login: **${rows1[0].login}** (SID: **${rows1[0].id}**)\n📅 Data utworzenia konta: **${formatujCzas(rows1[0].registered)}**\n🕹️ Level: **${rows1[0].exp}** (EXP: **${rows1[0].exp}**)\n🕒 Przegrany czas: **${hours}** godzin(y) | **${minutes}** Minut\n💸 Pieniądze: **${addCommasToNumber(rows1[0].money)}** PLN\n💰 Pieniądze w banku: **${addCommasToNumber(rows1[0].bank_money)}** PLN` },
            { name: "Prawo jazdy", value: `🛵 Kat A: **${replace[rows1[0].pjA]}**\n🚗 Kat B: **${replace[rows1[0].pjB]}**\n🚚 Kat C: **${replace[rows1[0].pjC]}**\n✈️ Kat L: **${replace[rows1[0].pjL]}**` }
          );

        await interaction.reply({ embeds: [embed] });
      });
    });
  }
};

function formatujCzas(data) {
  const Data1 = new Date(data);
  if (isNaN(Data1.getTime())) {
      return 'Brak informacji!';
  }
  const OpcjeCzasu = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
  const FormatPolski = new Intl.DateTimeFormat('pl-PL', OpcjeCzasu);
  return FormatPolski.format(Data1);
}

function addCommasToNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};