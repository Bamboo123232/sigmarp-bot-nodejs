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
    .setName('polacz')
    .setDescription('Użyj tej komendy do połączenia swojego konta Discord z serwerem MTA')
    .addStringOption(option => option.setName('kod').setDescription('Wpisz tutaj poprawny kod autoryzacji').setRequired(true)),
  async execute(interaction) {
    const kodzik = interaction.options.getString('kod');

    const embedError = new EmbedBuilder()
      .setColor('Red')
      .setDescription('❌ Wystąpił błąd podczas sprawdzania konta')

      bazadanych.query(`SELECT * FROM pystories_users WHERE code = ?`, [kodzik], async (err, rows) => { // Sprawdzanie czy kod jest prawidłowy
      if (err) {
        return await interaction.reply({ embeds: [embedError], ephemeral: true });
      }

      if (!rows.length) {
        const embedBlad = new EmbedBuilder()
          .setColor('Red')
          .setDescription('❌ Podany kod weryfikacyjny jest nieprawidłowy!');
        return await interaction.reply({ embeds: [embedBlad], ephemeral: true });
      }

      bazadanych.query(`SELECT * FROM discord_connect WHERE sid = ?`, [interaction.user.id], async (err, rows2) => { // Sprawdzanie czy użytkownik ma już połączone konto
        if (err) {
          return await interaction.reply({ embeds: [embedError], ephemeral: true });
        }

        if (rows2.length) {
          const embedSprawdzanie1 = new EmbedBuilder()
            .setColor('Red')
            .setDescription('❌ Posiadasz już połączone konto z serwerem!');
          return await interaction.reply({ embeds: [embedSprawdzanie1], ephemeral: true });
        }

        bazadanych.query(`SELECT * FROM discord_connect WHERE serial = ?`, [rows[0].register_serial], async (err, rows1) => { // Sprawdzanie czy kod nie jest już użyty przez inne konto
          if (err) {
            return await interaction.reply({ embeds: [embedError], ephemeral: true });
          }

          if (rows1.length) {
            const embedSprawdzanie = new EmbedBuilder()
              .setColor('Red')
              .setDescription('❌ To konto jest już połączone z serwerem!');
            return await interaction.reply({ embeds: [embedSprawdzanie], ephemeral: true });
          }

          const embedFinal = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Pomyślnie połączono konto!')
            .setDescription(`Twoje konto zostało pomyślnie połączone z kontem gracza:\n> **${rows[0].login}** (SID: **${rows[0].id}**)\n> Serial: **${rows[0].register_serial}**`)
            .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
            .setFooter({ text: interaction.user.tag, iconURL: interaction.user.avatarURL({ dynamic: true }) })
            .setTimestamp();

            bazadanych.query(`INSERT INTO discord_connect (did, sid, serial, discord_login, nick, avatarurl) VALUES (?, ?, ?, ?, ?, ?)`, [interaction.user.id, rows[0].id, rows[0].register_serial, interaction.user.tag, rows[0].login, interaction.user.displayAvatarURL({ format: 'png', size: 512 })], async (err) => {
            if (err) {
              return console.error('[Łączenie konta] - Wystąpił błąd podczas zapisywania konta w bazie danych, log błędu:', err);
            } else {
              bazadanych.query(`UPDATE pystories_users SET avatar = ?, discordconnected = ? WHERE kod = ?`, [interaction.user.displayAvatarURL({ format: 'png', size: 512 }), 'TAK', kodzik], async (err) => {
                if (err) {
                  console.error('[Łączenie konta] - Błąd podczas zapisywania do bazy danych:', err);
                } else {
                  console.log('[Łączenie konta] - Dane konta zostały zapisane do bazy danych.');
                }
              });
            }
            await interaction.reply({ embeds: [embedFinal], ephemeral: true });
          });
        });
      });
    });
  },
};
