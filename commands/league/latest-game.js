const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const auth = require('../../JSON/auth.json');
const emoji = require('../../JSON/emoji.json');
const translate = require('../../JSON/translations.json');

const fs = require('fs');

const TeemoJS = require('teemojs');
let api = TeemoJS(auth.lolToken);

module.exports = class LatestGameCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'latest-game',
            group: 'league',
            memberName: 'latest-game',
            description: 'Get information about the most recent League of Legends Game of put Summoner or your own Account if added to the Bot',
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
        /*
            TODO: 
                fix cs (value too low)
                Victory/Defeat always wrong
        */
        var blue_summonerNames;
        var blue_playerInfo = "", blue_playerStats = "", blue_playerGold = "";
        var blue_championEmoji = "";
        var blue_championLevel, blue_creepScore, blue_goldEarned;
        var blue_kda, blue_kills, blue_deaths, blue_assists;
        var blue_teamKills = 0, blue_teamDeaths = 0, blue_teamAssists = 0;

        var red_summonerNames;
        var red_playerInfo = "", red_playerStats = "", red_playerGold = "";
        var red_championEmoji = "";
        var red_championLevel, red_creepScore, red_goldEarned;
        var red_kda, red_kills, red_deaths, red_assists;
        var red_teamKills = 0, red_teamDeaths = 0, red_teamAssists = 0;

        var scoreEmoji = `<:score:637624115150454814>`;
        var goldEmoji = `<:gold:637624671004524554>`;
        var minionEmoji = `<:minion:637624685261094912>`;
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
            const matchList = await api.get('euw1', 'match.getMatchlist', summoner.accountId, { season: 13}) //Filter champion, season and/or queue
            const match = await api.get('euw1', 'match.getMatch', matchList.matches[0].gameId);

            for(var k = 0; k < 5; ++k) {
                for(var blue = 0; blue < 5; ++blue) {
                    blue_championEmoji = `<:${translate.Champions[match.participants[k].championId]}:${emoji[`${translate.Champions[match.participants[k].championId]}`]}>`;

                    blue_kills = match.participants[k].stats.kills;
                    blue_deaths = match.participants[k].stats.deaths
                    blue_assists = match.participants[k].stats.assists
                    blue_kda = `${((match.participants[k].stats.kills + match.participants[k].stats.assists) / match.participants[k].stats.deaths).toFixed(2).replace('Infinity:1', 'Perfect')}`;

                    blue_championLevel = `${match.participants[k].stats.champLevel}`;
                    blue_goldEarned = match.participants[k].stats.goldEarned
                    blue_creepScore = `${match.participants[k].stats.totalMinionsKilled}`;
                }
                blue_teamKills += blue_kills;
                blue_teamDeaths += blue_deaths;
                blue_teamAssists += blue_assists;

                blue_summonerNames = `${match.participantIdentities[k].player.summonerName}`;
                blue_playerInfo += `${blue_championEmoji} ${blue_summonerNames}\n${fillerEmoji}\n`;
                blue_playerStats += `${scoreEmoji} **${blue_kills} / ${blue_deaths} / ${blue_assists}**\n${fillerEmoji}${((blue_kills+blue_assists)/blue_deaths).toFixed(2)}:1 KDA\n`.replace('Infinity:1', 'Perfect');
                blue_playerGold += `${goldEmoji} ${blue_goldEarned}\n${minionEmoji} ${blue_creepScore}\n`;
            }

            //Red Team  
            for(var l = 5; l < 10; ++l) {
                for(var red = 5; red < 10; ++red) {
                    red_championEmoji = `<:${translate.Champions[match.participants[l].championId]}:${emoji[`${translate.Champions[match.participants[l].championId]}`]}>`;
                    
                    red_kills = match.participants[l].stats.kills
                    red_deaths = match.participants[l].stats.deaths
                    red_assists = match.participants[l].stats.assists
                    red_kda = `${((match.participants[l].stats.kills + match.participants[l].stats.assists) / match.participants[l].stats.deaths).toFixed(2).replace('Infinity:1', 'Perfect')}`;

                    red_championLevel = `${match.participants[l].stats.champLevel}`;
                    red_goldEarned = `${match.participants[l].stats.goldEarned}`;
                    red_creepScore = `${match.participants[l].stats.totalMinionsKilled}`;
                }
                red_teamKills += red_kills;
                red_teamDeaths += red_deaths;
                red_teamAssists += red_assists;

                red_summonerNames = `${match.participantIdentities[l].player.summonerName}`;
                red_playerInfo += `${red_championEmoji} ${red_summonerNames}\n${fillerEmoji}\n`;
                red_playerStats += `${scoreEmoji} **${red_kills} / ${red_deaths} / ${red_assists}**\n${fillerEmoji}${((red_kills+red_assists)/red_deaths).toFixed(2)}:1 KDA\n`.replace('Infinity:1', 'Perfect');
                red_playerGold += `${goldEmoji} ${red_goldEarned}\n${minionEmoji} ${red_creepScore}\n`;
            }
            
            const embed = new RichEmbed()
                .setColor(0xED3D7D)
                .setTitle(`${summoner.name}`)
                //.setAuthor(`${winOrLoss}`)
                .setDescription(`Latest Game » **${translate.Queues[matchList.matches[0].queue]}**`)
                .addField(`Blue Team » ${blue_teamKills} / ${blue_teamDeaths} / ${blue_teamAssists}`, `${blue_playerInfo}`, true)
                .addField(`** **`, `${blue_playerStats}`, true)
                .addField(`** **`, `${blue_playerGold}`, true)
                .addField('** **', '** **')
                .addField(`Red Team » ${red_teamKills} / ${red_teamDeaths} / ${red_teamAssists}`, `${red_playerInfo}`, true)
                .addField(`** **`, `${red_playerStats}`, true)
                .addField(`** **`, `${red_playerGold}`, true)
            message.channel.send(embed);
            
        } catch(error) {
            console.error(error);
            message.reply('Error, please contact **CX#9996**');
        }
    }
};