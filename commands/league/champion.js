const { Command } = require('discord.js-commando');
const auth = require('../../JSON/auth.json');

const TeemoJS = require('teemojs');
let api = TeemoJS(auth.lol);


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
                    prompt: 'Please enter a valid Summoner Name',
                    type: 'string',
                    default: '',
                }
            ]
        });
    }

    run(message) {
        message.reply('currently unavailable');
    }
};