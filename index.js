const { CommandoClient } = require('discord.js-commando');
const auth = require('./JSON/auth.json');
const path = require('path');
const fs = require('fs');

//Bot invite
//https://discordapp.com/oauth2/authorize?&client_id=611533931304452126&scope=bot&permissions=0

const client = new CommandoClient({
    commandPrefix: '.',
    owner: '246632397863387139',
    invite: 'https://discord.gg/xmnZKjQ',
});

client.registry
    .registerDefaultTypes()
    .registerGroups([
        ['league', 'League Related Commands'],
    ])
    .registerDefaultGroups()
    .registerDefaultCommands({
        eval: false,
    })
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.on('guildMemberAdd', member => {
    createUserFile(member);
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}! (${client.user.id})`);
    client.user.setActivity('.editprofile <name>');
});

client.login(auth.token);

function createUserFile(member) {
    let jsonFile = {
        name: member.user.username,
        discriminator: member.user.discriminator,
        id: member.user.id,
        leagueName: ''
    };

    jsonFile = JSON.stringify(jsonFile);
    fs.writeFile(`users/${member.user.id}.json`, jsonFile, (err) => {
        if(!err) {
            console.log(`Created JSON file of ${member.id}`);
        }
    });
}