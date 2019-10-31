const { Command } = require('discord.js-commando');

module.exports = class ProfileCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'champion',
            group: 'league',
            memberName: 'champion',
            description: 'Inactive Command',
            args: [
                {
                    key: 'text',
                    prompt: 'Please enter a valid summoner string',
                    type: 'string'
                }
            ]
            
        });
    }

    run(message, { text }) {

    }
};