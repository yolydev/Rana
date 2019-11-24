const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const auth = require('../../JSON/auth.json');

const TeemoJS = require('teemojs');
let api = TeemoJS(auth.lolToken);


module.exports = class StatusCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'status',
            aliases: ['s'],
            group: 'league',
            memberName: 'status',
            description: 'Checks League Server status'
        });
    }

    async run(message) {
        try {
            const status = await api.get('euw1', 'lolStatus.getShardData');
            
            const embed = new RichEmbed()
                .setColor(0xED3D7D)
                .setTitle('League of Legends Status')
                .addField(status.services[0].name,status.services[0].status,true)
                .addField(status.services[1].name,status.services[1].status,true)
                .addBlankField()
                .addField(status.services[2].name,status.services[2].status,true)
                .addField(status.services[3].name,status.services[3].status,true)
                .addBlankField()
                .addField('Updates',`Severity: ${status.services[1].incidents[0].updates[0].severity}\n Header: ${status.services[1].incidents[0].updates[0].heading}\nContent: ${status.services[1].incidents[0].updates[0].content}\n`)
                .setFooter('EUW Status')    
            message.channel.send(embed);
        } catch(error) {
            console.error(error);
            message.reply('Error, please contact **CX#9996**');
        }
    }
};