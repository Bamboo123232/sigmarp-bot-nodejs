/*
 - Autor kodu: GrabeKK
 - Discord: grabekk.
 - Zakazuje się używania kodu bez zgody autora!
*/

const { Client, GatewayIntentBits, EmbedBuilder, Collection } = require('discord.js');
const fs = require('fs');
const config = require('./config');
require('./deploy-commands');

const mysql = require('./database');
mysql.createDBConnection1()
setInterval(mysql.keepDBAlive1, 5000);


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

client.commands = new Collection();

for (const folder of fs.readdirSync('./commands')) {
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);

    client.commands.set(command.data.name, command);
  }
}

client.once('ready', () => {
  console.log(`Pomyślnie zalogowano jako ${client.user.tag}`);
  client.user.setActivity(`SIGMARP`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    return console.error('Nie znaleziono takiej komendy');
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Wystąpił błąd podczas wykonywania tej komendy', ephemeral: true });
  }
});



client.login(config.token);
