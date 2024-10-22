const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('../../database'); // Ensure this exports your DB connection setup

const bazadanych = mysql.getDBConnection1();
setInterval(mysql.keepDBAlive1, 5000);

// List of cars with their model and cost
const cars = {
  'Premier': { model: 426, cost: 1750000 },
  'Jester': { model: 559, cost: 325000 },
  'Buffalo': { model: 402, cost: 400000 },
  'Sentinel': { model: 405, cost: 450000 },
  'Cheetah': { model: 415, cost: 44500000 },
  'Sultan': { model: 560, cost: 70000000 },
  'Windsor': { model: 555, cost: 36000000 },
  'Stafford': { model: 580, cost: 29500000 },
  'ZR-350': { model: 477, cost: 39000000 },
  'Elegy': { model: 562, cost: 32500000 },
  'Banshee': { model: 429, cost: 43500000 },
  'Sandking': { model: 495, cost: 28000000 },
  'Broadway': { model: 575, cost: 15800000 },
  'Tornado': { model: 576, cost: 16400000 },
  'Remington': { model: 534, cost: 18200000 },
  'Voodoo': { model: 412, cost: 17650000 },
  'Tesla Roadster Sport': { model: 587, cost: 5200000 },
  'Tesla Model S': { model: 550, cost: 3500000 },
  'Koenigsegg Agera': { model: 551, cost: 750000 },
  'Subaru Impreza': { model: 585, cost: 3000000 },
  'Ferrari Italia': { model: 526, cost: 4750000 },
  'Nissan GTR': { model: 401, cost: 6250000 },
  'Lamborgini Murcielago': { model: 541, cost: 5600000 },
  'Mercedes AMG GT c63': { model: 561, cost: 7550000 },
  'Audi RS6': { model: 546, cost: 6200000 },

};

module.exports = {
    data: new SlashCommandBuilder()
    .setName('kuppojazd')
    .setDescription('Zakup pojazd zdalnie')
    .addStringOption(option =>
      option.setName('model')
        .setDescription('Model Auta')
        .setRequired(true)
        .addChoices(...Object.keys(cars).map(car => ({
          name: `${car} - ${cars[car].cost.toLocaleString()} PLN`,
          value: car
        }))))
    .addIntegerOption(option =>
      option.setName('sid')
        .setDescription('SID Gracza *nie uid*')
        .setRequired(true)),

  async execute(interaction) {
    if (!interaction.isCommand()) return;

    const carName = interaction.options.getString('model');
    const ownedPlayer = interaction.options.getInteger('sid');

    if (!cars[carName]) {
      return interaction.reply({ 
        content: '❌ Invalid car selection.', 
        ephemeral: true 
      });
    }

    const { model, cost } = cars[carName];

    // Error and success messages
    const embedError = new EmbedBuilder()
      .setColor('Red')
      .setDescription('❌ Błąd.');
      
    const embedInsufficientFunds = new EmbedBuilder()
      .setColor('Red')
      .setDescription('❌ Nie posiadasz pieniędzy.');
      
    const embedSuccess = new EmbedBuilder()
      .setColor('Green')
      .setDescription(`✅ Kupiono auto ${carName} za ${cost} PLN!`);

    // Check if the player has enough money
    const checkMoneySql = 'SELECT money FROM pystories_users WHERE id = ?';
    bazadanych.query(checkMoneySql, [ownedPlayer], (err, results) => {
      if (err) {
        console.error('Error checking money:', err);
        return interaction.reply({ embeds: [embedError], ephemeral: true });
      }

      if (results.length === 0) {
        // Player not found
        return interaction.reply({ embeds: [embedError], ephemeral: true });
      }

      const playerMoney = results[0].money;
      if (playerMoney < cost) {
        // Not enough money
        return interaction.reply({ embeds: [embedInsufficientFunds], ephemeral: true });
      }

      // Deduct the money
      const deductMoneySql = 'UPDATE pystories_users SET money = money - ? WHERE id = ?';
      bazadanych.query(deductMoneySql, [cost, ownedPlayer], (err) => {
        if (err) {
          console.error('Error deducting money:', err);
          return interaction.reply({ embeds: [embedError], ephemeral: true });
        }

        // Insert or update the vehicle record
        const vehicleSql = `
          INSERT INTO pystories_vehicles (model, ownedPlayer, parking) 
          VALUES (?, ?, 1)
          ON DUPLICATE KEY UPDATE 
          ownedPlayer = VALUES(ownedPlayer), 
          parking = VALUES(parking);
        `;

        bazadanych.query(vehicleSql, [model, ownedPlayer], async (err) => {
          if (err) {
            console.error('Error executing vehicle query:', err);
            return interaction.reply({ embeds: [embedError], ephemeral: true });
          }

          // Successful completion
          await interaction.reply({ embeds: [embedSuccess] });
        });
      });
    });
  }
};
