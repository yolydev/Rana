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
            description: 'Get information if a Summoner is in-game or not and if yes provide more information.',
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

            var teamBlueSummoners = "", teamBlueLeagues = "", teamBlueChampionPoints = "";
            var teamRedSummoners = "", teamRedLeagues = "", teamRedChampionPoints = "";

            for(var i = 0; i < 10; i++) {
                const mastery = await api.get('euw1', 'championMastery.getChampionMastery', spectator.participants[i].summonerId, spectator.participants[i].championId);
                const league = await api.get('euw1', 'league.getLeagueEntriesForSummoner', spectator.participants[i].summonerId);
                let entry = league.find(e => e.queueType === 'RANKED_SOLO_5x5');
                
                if(spectator.participants[i].teamId === 100) {
                    teamBlueSummoners += `<:${translate.Champions[spectator.participants[i].championId]}:${emoji[translate.Champions[spectator.participants[i].championId]]}> | ${spectator.participants[i].summonerName}\n`;
                    
                    if(entry === undefined) teamBlueLeagues += `Unranked${fillerEmoji}\n`;
                    else teamBlueLeagues += `<:${entry.tier}:${emoji[entry.tier]}>${(entry.tier).charAt(0).toUpperCase() + (entry.tier).slice(1).toLowerCase()} ${entry.rank} (${entry.leaguePoints} LP)\n`;

                    if(mastery === null) teamBlueChampionPoints += `${fillerEmoji}0\n`;
                    else teamBlueChampionPoints += `<:${mastery.championLevel}:${emoji[mastery.championLevel]}> ${mastery.championPoints}\n`;
                } else if(spectator.participants[i].teamId === 200) {
                    teamRedSummoners += `<:${translate.Champions[spectator.participants[i].championId]}:${emoji[translate.Champions[spectator.participants[i].championId]]}> | ${spectator.participants[i].summonerName}\n`;

                    if(entry === undefined) teamRedLeagues += `Unranked${fillerEmoji}\n`;
                    else teamRedLeagues += `<:${entry.tier}:${emoji[entry.tier]}>${(entry.tier).charAt(0).toUpperCase() + (entry.tier).slice(1).toLowerCase()} ${entry.rank} (${entry.leaguePoints} LP)\n`;

                    if(mastery === null) teamRedChampionPoints += `${filƒlerEmoji}0\n`;
                    else teamRedChampionPoints += `<:${mastery.championLevel}:${emoji[mastery.championLevel]}> ${mastery.championPoints}\n`;
                }
            }           

            const embed = new RichEmbed()
                .setTitle(`${text}'s current game`)
                .setDescription(`${translate.Queues[spectator.gameQueueConfigId]}`)
                .addField('Blue Team', `${teamBlueSummoners}`, true)
                .addField('Rank', `${teamBlueLeagues}`, true)
                .addField('Mastery', `${teamBlueChampionPoints}`, true)
                .addField('Red Team', `${teamRedSummoners}`, true)
                .addField('Rank', `${teamRedLeagues}`, true)
                .addField('Mastery', `${teamRedChampionPoints}`, true)
            message.channel.send(embed);
        } catch(error) {
            console.error(error);
            message.reply('Error, please contact **CX#9996**');
        }   
    }
};