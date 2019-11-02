const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const auth = require('../../JSON/auth.json');
const emoji = require('../../JSON/emoji.json');
const translate = require('../../JSON/translations.json');

const fs = require('fs');

const TeemoJS = require('teemojs');
let api = TeemoJS(auth.lolToken);

module.exports = class EloCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'elo',
            aliases: ['league'],
            group: 'league',
            memberName: 'elo',
            description: 'Get general information about a Summoner or your own Account if added to the Bot',
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

        var ranked, tft;
        var topChamps = "";
        var topMatchList = "";

        if(getLeagueName == '') {
            message.reply('You have no summoner set, do **.editprofile <summonerName>** to set one!'); return;
        }
        try {
            api.get('euw1', 'summoner.getBySummonerName', getLeagueName)
            .then(summonerData => {
                console.log(`Name:${summonerData.name}\nId:${summonerData.id}\nAccount Id:${summonerData.accountId}\nPUUID:${summonerData.puuid}\nSummonerLevel:${summonerData.summonerLevel}\nProfileIconId:${summonerData.profileIconId}`);

                api.get('euw1','league.getLeagueEntriesForSummoner', summonerData.id)
                .then(leagueEntry => {
                    let leagueData = leagueEntry.find(x => x.queueType == 'RANKED_SOLO_5x5');

                    if(leagueData == undefined) {
                        ranked = 'Unranked';
                    } else {
                        ranked = `${leagueData.tier} ${leagueData.rank}\n ${leagueData.leaguePoints} LP / ${leagueData.wins}W ${leagueData.losses}L`;
                        console.log(`\nSummoners Rift:\n\nTier:${leagueData.tier}\nRank:${leagueData.rank}\nLP:${leagueData.leaguePoints}\nWins:${leagueData.wins}\nLosses:${leagueData.losses}\n`);
                    }
                    
                    api.get('euw1', 'championMastery.getAllChampionMasteries', summonerData.id)
                    .then(championData => {
                        for(var i = 0; i <= 2; ++i) {   
                            topChamps += `<:${translate.Champions[championData[i].championId]}:${emoji[translate.Champions[championData[i].championId]]}> - ${championData[i].championPoints} pts [${championData[i].championLevel}]\n`;
                        }
                        console.log(topChamps);

                        api.get('euw1', 'match.getMatchlist', summonerData.accountId)
                        .then(matchListData => {
                            for(var j = 0; j <= 2; ++j) {
                                topMatchList += `<:${translate.Champions[matchListData.matches[j].champion]}:${emoji[translate.Champions[matchListData.matches[j].champion]]}> - ${translate.Queues[matchListData.matches[j].queue]}\n`;
                            }

                            const embed = new RichEmbed()
                                .setColor(0xED3D7D)
                                .setTitle(`op.gg: ${summonerData.name}`)
                                .setURL(`https://euw.op.gg/summoner/userName=${summonerData.name.replace(' ', '+')}`)
                                .setAuthor(`Summoner Profile: ${summonerData.name}`)
                                .setDescription('League of Legends')
                                .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/9.21.1/img/profileicon/${summonerData.profileIconId}.png`)
                                .addField('Accound Info', `Name: ${summonerData.name}\nLevel: ${summonerData.summonerLevel}\nRegion: EUW`)
                                .addField('Ranked Solo/Duo', ranked, true)
                                .addField('TFT', tft, true)
                                .addField('Top Champions', topChamps, true)
                                .addField('Latest Games', topMatchList, true)
                            message.channel.send(embed);
                        });
                    });
                });
            });
        } catch(error) {
            message.reply(error);
        }
    }
};