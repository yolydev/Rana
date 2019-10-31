const { Command } = require('discord.js-commando');
const { RichEmbed } = require('discord.js');
const auth = require('../../JSON/auth.json');
const emoji = require('../../JSON/emoji.json');
const fs = require('fs');

const TeemoJS = require('teemojs');
let api = TeemoJS(auth.lol);

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
            var readJSFile = fs.readFileSync(`users/${message.author.id}.json`, 'utf8');
            var jsonData = JSON.parse(readJSFile);
            var getLeagueName = jsonData.leagueName;
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
                    let tftData = leagueEntry.find(y => y.queueType == 'RANKED_TFT');

                    if(leagueData == undefined) {
                        ranked = 'Unranked';
                    } else {
                        ranked = `${leagueData.tier} ${leagueData.rank}\n ${leagueData.leaguePoints} LP / ${leagueData.wins}W ${leagueData.losses}L`;
                        console.log(`\nSummoners Rift:\n\nTier:${leagueData.tier}\nRank:${leagueData.rank}\nLP:${leagueData.leaguePoints}\nWins:${leagueData.wins}\nLosses:${leagueData.losses}\n`);
                    }

                    if(tftData == undefined) {
                        tft = 'Unranked';
                    } else {
                        tft = `${tftData.tier} ${tftData.rank}\n ${tftData.leaguePoints} LP / ${tftData.wins}W ${tftData.losses}L`;
                        console.log(`TFT:\n\nTier:${tftData.tier}\nRank:${tftData.rank}\nLP:${tftData.leaguePoints}\nWins:${tftData.wins}\nLosses:${tftData.losses}`);
                    }

                    api.get('euw1', 'championMastery.getAllChampionMasteries', summonerData.id)
                    .then(championData => {
                        for(var i = 0; i <= 2; ++i) {
                            topChamps += `<:${ChampionIds[championData[i].championId]}:${emoji[ChampionIds[championData[i].championId]]}> - ${championData[i].championPoints} pts [${championData[i].championLevel}]\n`;
                        }
                        console.log(topChamps);

                        api.get('euw1', 'match.getMatchlist', summonerData.accountId)
                        .then(matchListData => {
                            for(var j = 0; j <= 2; ++j) {
                                topMatchList += `<:${ChampionIds[matchListData.matches[j].champion]}:${emoji[ChampionIds[matchListData.matches[j].champion]]}> - ${QueueIds[matchListData.matches[j].queue]}\n`;
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

        const ChampionIds = {
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
            240: 'Ekko',
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
        }
    }
};