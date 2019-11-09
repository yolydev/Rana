const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const assert = require("assert");

const auth = require('../../JSON/auth.json');
const emoji = require('../../JSON/emoji.json');
const translate = require('../../JSON/translations.json');

const fs = require('fs');

const TeemoJS = require('teemojs');
let api = TeemoJS(auth.lolToken);

module.exports = class GameCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'game',
            group: 'league',
            memberName: 'game',
            description: 'Inactive Command',/*'Get information if a Summoner is in-game or not and if yes provide more information.',*/
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

    async run(message, { text }) {
        var fillerEmoji = `<:filler:637626828093259809>`;

        if(!text == '') {
            getLeagueName = text;
        } else {
            var userFile = `users/${message.author.id}.json`;
            if(fs.existsSync(userFile)) {
                var readJSFile = fs.readFileSync(userFile, 'utf8');
                var jsonData = JSON.parse(readJSFile);
                var getLeagueName = jsonData.leagueName;
            } else{
                message.reply('You have no summoner set, do **.editprofile <summonerName>** to set one!');
                return;
            }
        }

        if(getLeagueName == '') {
            message.reply('You have no summoner set, do **.editprofile <summonerName>** to set one!'); return;
        }
        try {
            const summoner = await api.get('euw1', 'summoner.getBySummonerName', getLeagueName);
            const spectator = await api.get('euw1', 'spectator.getCurrentGameInfoBySummoner', summoner.id);

            if(spectator == null) {
                message.reply(`**${getLeagueName}** currently not in-game`); return;
            }

            var teamBlueSummoners = "", teamBlueLeagues = "";
            var teamRedSummoners = "", teamRedLeagues = "";

            for(var i = 0; i < 10; i++) {
                const league = await api.get('euw1', 'league.getLeagueEntriesForSummoner', spectator.participants[i].summonerId);
                let entry = league.find(e => e.queueType === 'RANKED_SOLO_5x5');
                
                
                if(spectator.participants[i].teamId === 100) {
                    teamBlueSummoners += `<:${translate.Champions[spectator.participants[i].championId]}:${emoji[translate.Champions[spectator.participants[i].championId]]}> | ${spectator.participants[i].summonerName}\n`;
                    
                    if(entry === undefined) teamBlueLeagues += `Unranked\n`;
                    else teamBlueLeagues += `<:${entry.tier}:${emoji[entry.tier]}>${(entry.tier).charAt(0).toUpperCase() + (entry.tier).slice(1).toLowerCase()} ${entry.rank} (${entry.leaguePoints} LP)\n`;
                } else if(spectator.participants[i].teamId === 200) {
                    teamRedSummoners += `<:${translate.Champions[spectator.participants[i].championId]}:${emoji[translate.Champions[spectator.participants[i].championId]]}> | ${spectator.participants[i].summonerName}\n`;

                    if(entry === undefined) teamRedLeagues += `Unranked\n`;
                    else teamRedLeagues += `<:${entry.tier}:${emoji[entry.tier]}>${(entry.tier).charAt(0).toUpperCase() + (entry.tier).slice(1).toLowerCase()} ${entry.rank} (${entry.leaguePoints} LP)\n`;
                }
            }           

            const embed = new RichEmbed()
                .setTitle('Test')
                .setDescription('Test')
                .addField('Blue Team', `${teamBlueSummoners}`, true)
                .addField('Rank', `${teamBlueLeagues}`, true)
                .addField('Mastery', 'Soon', true)
                .addField('Red Team', `${teamRedSummoners}`, true)
                .addField('Rank', `${teamRedLeagues}`, true)
                .addField('Mastery', 'Soon', true)
            message.channel.send(embed);
        } catch(e) {
            console.error(e);
        }
        
    }
};