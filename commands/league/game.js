const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
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

    run(message, { text }) {
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

        var blue_playerName = "", blue_playerRank = "", blue_playerMasteries = "";
        var red_playerName = "", red_playerRank = "", red_playerMasteries = "";

        var msg = false;
        var id
        if(getLeagueName == '') {
            message.reply('You have no summoner set, do **.editprofile <summonerName>** to set one!'); return;
        }
        try {
            api.get('euw1', 'summoner.getBySummonerName', getLeagueName)
            .then(summonerData => {
                api.get('euw1', 'spectator.getCurrentGameInfoBySummoner', summonerData.id)
                .then(spectatorData => {
                    console.log(spectatorData.participants.length);
                    //for(var i = 0; i < 10; i++) {
                        
                        /*if(spectatorData.participants[i].teamId == 100) {
                            blue_playerName += `<:${translate.Champions[spectatorData.participants[i].championId]}:${emoji[translate.Champions[spectatorData.participants[i].championId]]}> | ${spectatorData.participants[i].summonerName}\n`;
                        } else if(spectatorData.participants[i].teamId == 200) {
                            red_playerName += `<:${translate.Champions[spectatorData.participants[i].championId]}:${emoji[translate.Champions[spectatorData.participants[i].championId]]}> | ${spectatorData.participants[i].summonerName}\n`;
                        } */
                    
                        api.get('euw1', 'league.getLeagueEntriesForSummoner',  spectatorData.participants.forEach(x => { x.summonerId; console.log(x.summonerId); })/*spectatorData.participants[i].summonerId */)
                        .then(leagueData => {
                            
                            let solo = leagueData.find(x => x.queueType == 'RANKED_SOLO_5x5');
                            
                            if(solo == undefined) blue_playerRank += `Unranked\n`
                            else blue_playerRank += `<:${solo.tier}:${emoji[solo.tier]}>\n`;

                            console.log(blue_playerRank);

                            /*const embed = new RichEmbed()
                                .setTitle('Test')
                                .setDescription('Test')
                                .addField('Blue Team', `a${blue_playerName}`, true)
                                .addField('Rank', `a${blue_playerRank}`, true)
                                .addField('Mastery', 'a', true)
                                .addField('Red Team', `a${red_playerName}`, true)
                                .addField('Rank', 'a', true)
                                .addField('Mastery', 'a', true)
                            message.channel.send(embed);*/
                        }); 
                    //}
                });
            });

/*
                        
                    
                    
                    
                    if(teamId == 100) {
                            blue_playerName += `<:${translate.Champions[spectatorData.participants[i].championId]}:${emoji[translate.Champions[spectatorData.participants[i].championId]]}> | ${spectatorData.participants[i].summonerName}\n`;
                        } else if(teamId == 200) {
                            red_playerName += `<:${translate.Champions[spectatorData.participants[i].championId]}:${emoji[translate.Champions[spectatorData.participants[i].championId]]}> | ${spectatorData.participants[i].summonerName}\n`;
                        }

                    api.get('euw1', 'league.getLeagueEntriesForSummoner', spectatorData.participants[i].summonerId)
                    .then(leagueData => {
                        for(var j = 0; j < 10; ++j) {
                            if(spectatorData.participants[i].teamId == 100) {
                                blue_playerRank += `<:${leagueData.tier}:${emoji[leagueData.tier]}>`;
                            } else if(spectatorData.participants[i].teamId == 200) {
                                blue_playerRank += `<:${leagueData.tier}:${emoji[leagueData.tier]}>`;
                            }
                        } 

                        */
                
        } catch(error) {
            message.reply('Summoner not found.');
        }
    }
};