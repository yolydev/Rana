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

    run(message, { text }) {
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
        api.get('euw1', 'summoner.getBySummonerName', getLeagueName)
        .then(summonerData => {
            console.log(`Name:${summonerData.name}\nId:${summonerData.id}\nAccount Id:${summonerData.accountId}\nPUUID:${summonerData.puuid}\nSummonerLevel:${summonerData.summonerLevel}\nProfileIconId:${summonerData.profileIconId}`);

            api.get('euw1', 'match.getMatchlist', summonerData.accountId, { /*champion: 142,*/ season: 13/*, queue: 420*/}) //Filter champion, season and/or queue
            .then(matchlistData => { 
                console.log(matchlistData.matches[0].gameId);
                console.log(matchlistData.matches.queue);

                api.get('euw1', 'match.getMatch', matchlistData.matches[0].gameId)
                .then(matchData => {
                    //Blue Team
                    for(var k = 0; k < 5; ++k) {
                        for(var blue = 0; blue < 5; ++blue) {
                            blue_championEmoji = `<:${translate.Champions[matchData.participants[k].championId]}:${emoji[`${translate.Champions[matchData.participants[k].championId]}`]}>`;

                            blue_kills = matchData.participants[k].stats.kills;
                            blue_deaths = matchData.participants[k].stats.deaths
                            blue_assists = matchData.participants[k].stats.assists
                            blue_kda = `${((matchData.participants[k].stats.kills + matchData.participants[k].stats.assists) / matchData.participants[k].stats.deaths).toFixed(2)}`;

                            blue_championLevel = `${matchData.participants[k].stats.champLevel}`;
                            blue_goldEarned = matchData.participants[k].stats.goldEarned
                            blue_creepScore = `${matchData.participants[k].stats.totalMinionsKilled}`;
                        }
                        blue_teamKills += blue_kills;
                        blue_teamDeaths += blue_deaths;
                        blue_teamAssists += blue_assists;

                        blue_summonerNames = `${matchData.participantIdentities[k].player.summonerName}`;
                        blue_playerInfo += `${blue_championEmoji} ${blue_summonerNames}\n${fillerEmoji}\n`;
                        blue_playerStats += `${scoreEmoji} **${blue_kills} / ${blue_deaths} / ${blue_assists}**\n${fillerEmoji}${((blue_kills+blue_assists)/blue_deaths).toFixed(2)}:1 KDA\n`.replace('Infinity:1', 'Perfect');
                        blue_playerGold += `${goldEmoji} ${blue_goldEarned}\n${minionEmoji} ${blue_creepScore}\n`;
                    }

                    //Red Team  
                    for(var l = 5; l < 10; ++l) {
                        for(var red = 5; red < 10; ++red) {
                            red_championEmoji = `<:${translate.Champions[matchData.participants[l].championId]}:${emoji[`${translate.Champions[matchData.participants[l].championId]}`]}>`;
                            
                            red_kills = matchData.participants[l].stats.kills
                            red_deaths = matchData.participants[l].stats.deaths
                            red_assists = matchData.participants[l].stats.assists
                            red_kda = `${((matchData.participants[l].stats.kills + matchData.participants[l].stats.assists) / matchData.participants[l].stats.deaths).toFixed(2).replace('Infinity:1', 'Perfect')}`;

                            red_championLevel = `${matchData.participants[l].stats.champLevel}`;
                            red_goldEarned = `${matchData.participants[l].stats.goldEarned}`;
                            red_creepScore = `${matchData.participants[l].stats.totalMinionsKilled}`;
                        }
                        red_teamKills += red_kills;
                        red_teamDeaths += red_deaths;
                        red_teamAssists += red_assists;

                        red_summonerNames = `${matchData.participantIdentities[l].player.summonerName}`;
                        red_playerInfo += `${red_championEmoji} ${red_summonerNames}\n${fillerEmoji}\n`;
                        red_playerStats += `${scoreEmoji} **${red_kills} / ${red_deaths} / ${red_assists}**\n${fillerEmoji}${((red_kills+red_assists)/red_deaths).toFixed(2)}:1 KDA\n`;
                        red_playerGold += `${goldEmoji} ${red_goldEarned}\n${minionEmoji} ${red_creepScore}\n`;
                    }
                    
                    const embed = new RichEmbed()
                        .setColor(0xED3D7D)
                        .setTitle(`${summonerData.name}`)
                        //.setAuthor(`${winOrLoss}`)
                        .setDescription(`Latest Game » **${translate.Queues[matchlistData.matches[0].queue]}**`)
                        .addField(`Blue Team » ${blue_teamKills} / ${blue_teamDeaths} / ${blue_teamAssists}`, `${blue_playerInfo}`, true)
                        .addField(`** **`, `${blue_playerStats}`, true)
                        .addField(`** **`, `${blue_playerGold}`, true)
                        .addField('** **', '** **')
                        .addField(`Red Team » ${red_teamKills} / ${red_teamDeaths} / ${red_teamAssists}`, `${red_playerInfo}`, true)
                        .addField(`** **`, `${red_playerStats}`, true)
                        .addField(`** **`, `${red_playerGold}`, true)
                    message.channel.send(embed);
                });
            });
        });
    }
};