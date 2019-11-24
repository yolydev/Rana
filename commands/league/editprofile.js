const { Command } = require('discord.js-commando');
const fs = require('fs');

module.exports = class ProfileCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'editprofile',
            group: 'league',
            memberName: 'editprofile',
            description: 'Add your Summoner Name to the Bot to check your own profile easierly',
            args: [
                {
                    key: 'text',
                    prompt: 'Please enter a valid Summoner Name string',
                    type: 'string'
                }
            ]
            
        });
    }

    run(message, { text }) {
        let json = {
            name: message.author.username,
            discriminator: message.author.discriminator,
            id: message.author.id,
            leagueName: text
        }
        json = JSON.stringify(json);
        fs.writeFile(`./users/${message.author.id}.json`, json, (err) => {
            if(!err) {
                console.log(`Changed username from ${message.author.id}`);
                message.reply(`changed your info to **${text}**!`)
            }
        });
    }
};