const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const auth = require('../../JSON/auth.json');
const emoji = require('../../JSON/emoji.json');
const fs = require('fs');

const TeemoJS = require('teemojs');
let api = TeemoJS(auth.lol);

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
        //return message.say(text);
        //var profileIconId, name, puuid, summonerLevel, id, accountId;

        /*
            TODO: 
                fix cs (value too low)
                Victory/Defeat wrong (check code below)
        */
        var blue_summonerNames;
        var blue_playerInfo = "", blue_playerStats = "", blue_playerGold = "", blue_playerCS = "";
        var blue_championEmoji = "";
        var blue_championLevel, blue_creepScore, blue_goldEarned;
        var blue_teamGoldEarned = 0;
        var blue_kills, blue_deaths, blue_assists, blue_kda;
        var blue_teamKills = 0, blue_teamDeaths = 0, blue_teamAssists = 0;

        var red_summonerNames;
        var red_playerInfo = "", red_playerStats = "", red_playerGold = "", red_playerCS = "";
        var red_championEmoji = "";
        var red_championLevel, red_creepScore, red_goldEarned;
        var red_teamGoldEarned = 0;
        var red_kills, red_deaths, red_assists, red_kda;
        var red_teamKills = 0, red_teamDeaths = 0, red_teamAssists = 0;

        var scoreEmoji = `<:score:637624115150454814>`;
        var goldEmoji = `<:gold:637624671004524554>`;
        var minionEmoji = `<:minion:637624685261094912>`;
        var fillerEmoji = `<:filler:637626828093259809>`;

        if(!text == '') {
            getLeagueName = text;
        } else {
            var readJSFile = fs.readFileSync(`users/${message.author.id}.json`, 'utf8');
            var jsonData = JSON.parse(readJSFile);
            var getLeagueName = jsonData.leagueName;
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
                            blue_championEmoji = `<:${ChampionIdIntoName[matchData.participants[k].championId]}:${emoji[`${ChampionIdIntoName[matchData.participants[k].championId]}`]}>`;

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
                        blue_playerCS += `${minionEmoji} ${blue_creepScore}\n`;
                    }

                    //Red Team  
                    for(var l = 5; l < 10; ++l) {
                        for(var red = 5; red < 10; ++red) {
                            red_championEmoji = `<:${ChampionIdIntoName[matchData.participants[l].championId]}:${emoji[`${ChampionIdIntoName[matchData.participants[l].championId]}`]}>`;

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
                        red_playerCS += `${minionEmoji} ${red_creepScore}\n`;
                    }
                    //playerStats += `${matchData.participantIdentities[k].player.summonerName}: ${championEmoji} ${kills}/${deaths}/${assists} (${kda}:1) - ${creepScore}CS - ${goldEarned}Gold\n\n`;
                    
                    /*
                    var winOrLoss = "";
                    Victory/Defeat
                    if(matchData.participantIdentities[k].player.summonerName == summonerData.name) {
                        console.log(`${matchData.participantIdentities[k].player.summonerName}`);
                        console.log(`${summonerData.name}`);

                        console.log(`${matchData.participants[k].stats.win}`);
                        if(`${matchData.participants[k].stats.win}` == true) {
                            winOrLoss = 'VICTORY';
                        } else {
                            winOrLoss = 'DEFEAT';
                        }
                    }
                    */
                    const embed = new RichEmbed()
                        .setColor(0xED3D7D)
                        .setTitle(`${summonerData.name}`)
                        //.setURL(`https://euw.op.gg/summoner/userName=${summonerData.name.replace(' ', '+')}`)
                        //.setAuthor(`${winOrLoss}`)
                        .setDescription(`Latest Game » **${QueueIds[matchlistData.matches[0].queue]}**`/*`Game Id: ${matchData.gameId}`*/)
                        //.setThumbnail(`http://ddragon.leagueoflegends.com/cdn/9.20.1/img/profileicon/${summonerData.profileIconId}.png`)
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

        /*
            api.get('euw1', 'match.getMatchlist', summonerData.accountId)
            .then(matchListData => {
                for(var j = 0; j <= 2; ++j) {
                    topMatchList += `${ChampionIds[matchListData.matches[j].champion]} - ${QueueIds[matchListData.matches[j].queue]}\n`;
                }
            });
        */

        const ChampionIdIntoName = {
            1: 'Annie',
            2: 'Olaf',
            3: 'Galio',
            4: 'TwistedFate',
            5: 'XinZhao',
            6: 'Urgot',
            7: 'Leblanc',
            8: 'Vladimir',
            9: 'Fiddlesticks',
            10: 'Kayle',
            11: 'MasterYi',
            12: 'Alistar',
            13: 'Ryze',
            14: 'Sion',
            15: 'Sivir',
            16: 'Soraka',
            17: 'Teemo',
            18: 'Tristana',
            19: 'Warwick',
            20: 'Nunu',
            21: 'MissFortune',
            22: 'Ashe',
            23: 'Tryndamere',
            24: 'Jax',
            25: 'Morgana',
            26: 'Zilean',
            27: 'Singed',
            28: 'Evelynn',
            29: 'Twitch',
            30: 'Karthus',
            31: 'Chogath',
            32: 'Amumu',
            33: 'Rammus',
            34: 'Anivia',
            35: 'Shaco',
            36: 'DrMundo',
            37: 'Sona',
            38: 'Kassadin',
            39: 'Irelia',
            40: 'Janna',
            41: 'Gangplank',
            42: 'Corki',
            43: 'Karma',
            44: 'Taric',
            45: 'Veigar',
            48: 'Trundle',
            50: 'Swain',
            51: 'Caitlyn',
            53: 'Blitzcrank',
            54: 'Malphite',
            55: 'Katarina',
            56: 'Nocturne',
            57: 'Maokai',
            58: 'Renekton',
            59: 'JarvanIV',
            60: 'Elise',
            61: 'Orianna',
            62: 'MonkeyKing',
            63: 'Brand',
            64: 'LeeSin',
            67: 'Vayne',
            68: 'Rumble',
            69: 'Cassiopeia',
            72: 'Skarner',
            74: 'Heimerdinger',
            75: 'Nasus',
            76: 'Nidalee',
            77: 'Udyr',
            78: 'Poppy',
            79: 'Gragas',
            80: 'Pantheon',
            81: 'Ezreal',
            82: 'Mordekaiser',
            83: 'Yorick',
            84: 'Akali',
            85: 'Kennen',
            86: 'Garen',
            89: 'Leona',
            90: 'Malzahar',
            91: 'Talon',
            92: 'Riven',
            96: 'KogMaw',
            98: 'Shen',
            99: 'Lux',
            101: 'Xerath',
            102: 'Shyvana',
            103: 'Ahri',
            104: 'Graves',
            105: 'Fizz',
            106: 'Volibear',
            107: 'Rengar',
            110: 'Varus',
            111: 'Nautilus',
            112: 'Viktor',
            113: 'Sejuani',
            114: 'Fiora',
            115: 'Ziggs',
            117: 'Lulu',
            119: 'Draven',
            120: 'Hecarim',
            121: 'Khazix',
            122: 'Darius',
            126: 'Jayce',
            127: 'Lissandra',
            131: 'Diana',
            133: 'Quinn',
            134: 'Syndra',
            136: 'AurelionSol',
            141: 'Kayn',
            142: 'Zoe',
            143: 'Zyra',
            145: 'Kaisa',
            150: 'Gnar',
            154: 'Zac',
            157: 'Yasuo',
            161: 'Velkoz',
            163: 'Taliyah',
            164: 'Camille',
            201: 'Braum',
            202: 'Jhin',
            203: 'Kindred',
            222: 'Jinx',
            223: 'TahmKench',
            236: 'Zed',
            238: 'Kled',
            245: 'Ekko',
            246: 'Qiyana',
            254: 'Vi',
            266: 'Aatrox',
            267: 'Nami',
            268: 'Azir',
            350: 'Yuumi',
            412: 'Thresh',
            420: 'Illaoi',
            421: 'RekSai',
            427: 'Ivern',
            429: 'Kalista',
            432: 'Bard',
            497: 'Rakan',
            498: 'Xayah',
            516: 'Ornn',
            517: 'Sylas',
            518: 'Neeko',
            555: 'Pyke'
        };

        const QueueIds = {
            0: 'Custom Games',
            76: 'URF',
            400: 'Draft Pick 5v5',
            420: 'Ranked Solo 5v5',
            430: 'Blind Pick 5v5',
            440: 'Ranked Flex 5v5',
            450: 'ARAM',
            470: 'Ranked Flex 3v3',
            700: 'Clash Games',
            900: 'URF',
            910: 'Ascension',
            940: 'Nexus Siege',
            960: 'Doom Bots',
            1090: 'TFT',
            1100: 'Ranked TFT'
        };
    }
};