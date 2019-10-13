const discord = require('discord.js')
const TeemoJS  = require('teemojs')
const YouTube = require('simple-youtube-api')
const ytdl = require('ytdl-core')
const fs = require('fs')
const {
	prefix,
    discordToken,
    leagueToken,
    youtubeToken
} = require('./config.json');

const client = new discord.Client()
const youtube = new YouTube(youtubeToken)
let api = TeemoJS(leagueToken)

const queue = new Map()

client.on('warn', console.warn)
client.on('error', console.error)
client.on('ready', () =>  {
    console.log('RANA » Ready to start playing some music!')
    setInterval(function() {
        let statuses = ['twitch.tv/ehasywhin', 'quitw.ovh', 'github.com/yolydev', 'dope ass music!']
        let status = statuses[Math.floor(Math.random() * statuses.length)]
        client.user.setPresence({ game: { name: status }, status: 'online'})
        client.user.setPresence({ activity: { name: status, /*type: 'PLAYING'(STREAMING;LISTENING;WATCHING) */ }, status: 'online'})
    }, 10000)
})
client.on('disconnect', () => console.log('RANA » I just disconnected!'))
client.on('reconnecting', () => console.log('RANA » Trying to reconnect right now!'))
client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.filter(c => c.type === 'text').find('name', 'welcome')
    if(!channel) return undefined;
    var embed = new discord.RichEmbed()
        .setColor(0xED3D7D)
        .setTitle('quitw.ovh - my homepage')
        .setURL('http://www.quitw.ovh')
        .setAuthor(`Welcome ${member.user.tag} to the server ${member.guild.name}!`, member.guild.iconURL)
        .setThumbnail(member.user.displayAvatarURL)
        .addField('**Name**', `${member.displayName}`, true)
        .addField('**Status**', isBot(), true)
        .addBlankField()
        .addField('**Joined At**', getDate())
        .setFooter(`There are now ${member.guild.memberCount} Users on this server.`, member.guild.iconURL)
    return channel.send(embed)

    function isBot() {
        if(member.user.bot) return 'Bot'
        else return 'Human'
    }

    function getDate() {
        var today = new Date()
        var date = today.getDate()
        var month = today.getMonth()
        var year = today.getFullYear()
        var day = today.getDay()
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thurdays', 'Friday', 'Saturday']

        var hour = today.getHours()
        var minute = today.getMinutes()

        if(minute < 10) minute = '0' + minute
        else minute = minute

        return `${days[day]}, ${date}.${month}.${year} at ${hour}:${minute} CET`;
    }
})
client.on('message', async msg => {
    //https://gist.github.com/y21/a599ef74c8746341dbcbd32093a69eb8
    if(msg.author.bot) return undefined
    const voice = msg.member.guild.channels.filter(a => a.type === 'voice').find('name', 'radio')
    const args = msg.content.split(' ')
    const searchString = args.slice(1).join(' ')
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : ''
    const serverQueue = queue.get(msg.guild.id)
    
    if(msg.content.startsWith(`${prefix}elo`)) {
        try {
            var remainder = msg.content.substr('!elo '.length)
            var region = remainder.split(' ')[0]
            var summonerName = remainder.substr((`${region} `).length)
            var fixedRegion = ''

            switch(region) {
                case 'br': fixedRegion = 'br1'; break;
                case 'eune': fixedRegion = 'eun1'; break;
                case 'euw': fixedRegion = 'euw1'; break;
                case 'lan': fixedRegion = 'la1'; break;
                case 'las': fixedRegion = 'la2'; break;
                case 'na': fixedRegion = 'na1'; break; //North America has NA for new accounts and NA1 for old accounts
                case 'oce': fixedRegion = 'oc1'; break;
                case 'tr': fixedRegion = 'tr1'; break;
                case 'ru': fixedRegion = 'ru'; break;
                case 'pbe': fixedRegion = 'pbe1'; break;
                default: msg.reply('Please enter a valid region! Use !region for all available regions.'); break;
            }

            console.log('Remainder: ' + remainder)
            console.log('Input Region: ' + region)
            console.log('Real Region: ' + fixedRegion)
            
            var profileIconId, name, id, summonerLevel, accId
            var tier, rank, lp, wins, losses, ratio, leagueId
            var champId = ''
            var latestChampsPlayed = ''

            //TODO: pass function
            api.get(fixedRegion, 'summoner.getBySummonerName', summonerName)
                .then(data => {
                    profileIconId = data.profileIconId
                    name = data.name
                    id = data.id
                    summonerLevel = data.summonerLevel
                    accId = data.accountId

                    console.log('Name: ' + name)
                    console.log('Id: ' + id)
                    console.log('AccId: ' + accId)
                    console.log('Level: ' + summonerLevel)

                    api.get(fixedRegion, 'league.getLeagueEntriesForSummoner', id)
                        .then(data => { 
                            let entry = data.find(e => e.queueType == 'RANKED_SOLO_5x5')
                            tier = entry.tier
                            rank = entry.rank
                            leagueId = entry.leagueId
                            lp = entry.leaguePoints
                            wins = entry.wins
                            losses = entry.losses
                            ratio = (wins / (wins + losses)) * 100
                            
                            console.log('Tier: ' + tier)
                            console.log('Rank: ' + rank)
                            console.log('League: ' + leagueId)
                            console.log('W/L: ' + wins + '/' + losses)
                            console.log('Ratio: ' + ratio)

                            
                            api.get(fixedRegion, 'championMastery.getAllChampionMasteries', id)
                                .then(data => {
                                    for(var i = 0; i <= 2; ++i) {
                                        champId += `[${data[i].championLevel}]  ${IdIntoChamp(data[i].championId)}: ${data[i].championPoints}\n`
                                        console.log(champId)
                                    }

                                    api.get(fixedRegion, 'match.getMatchlist', accId /*, { champion: 101, season: 11}*/) //Filter Champion or Season
                                        .then(data => {
                                            for(var j = 0; j <= 2; ++j) {
                                                latestChampsPlayed += `${IdIntoChamp(data.matches[j].champion)} - ${QueueIdIntoString(data.matches[j].queue)}\n`
                                            }
                                            //console.log(data.matches)

                                            var embed = new discord.RichEmbed()
                                                .setColor(0xED3D7D)
                                                .setTitle(`op.gg: ${name}`)
                                                .setURL(`https://euw.op.gg/summoner/userName=${name.replace(' ', '+')}`)
                                                .setAuthor(`Summoner Profile: ${name}`)
                                                .setDescription('League of Legends')
                                                .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/9.16.1/img/profileicon/${profileIconId}.png`)
                                                .addField('Account Info', `Name: ${name}\nLevel: ${summonerLevel}\nRegion: ${region.toUpperCase()}`, true)
                                                .addField('Ranked Solo/Duo', `**${ConvertTier(tier)} ${ConvertRank(rank)}\n ${lp}LP** / ${wins}W ${losses}L\nWin Ratio ${ratio.toFixed(2)}%`, true)
                                                .addField('Top Champions', `${champId}`, true)
                                                .addField('Latest Games', `${latestChampsPlayed}`, true)
                                            msg.channel.send(embed)
                                        })
                                })
                                
                        })
                })
        } catch(error) {
            console.error(error)
        }
    } else if(msg.content.startsWith(`${prefix}champion`)) {
        const errorMsg = `AurelionSol\nChogath\nDrMundo\nJarvanIV\nKaisa\nKhazix\nKogMaw\nLeblanc\nLeeSin\nMasterYi\nMissFortune\nWukong = MonkeyKing\nRekSai\nTahmKench\nTwistedFate\nVelkoz`
        try {
            const remainder = msg.content.substr('!champion '.length)
            if(remainder == '') {
                msg.reply('Make sure to enter a champion name!');
                return
            }
            var champion = remainder.replace(/^./, remainder[0].toUpperCase())
            /*if(remainder.includes('twisted') || remainder.includes('tf'))
                champion = 'TwistedFate'
            console.log(champion)*/
            console.log(champion)
            var content = fs.readFileSync(`champion_9.19.1/${champion}.json`, 'utf8')
            var jsonData = JSON.parse(content)
            var championData = jsonData.data[`${champion}`] //Case sensitive
            var skinData = championData['skins']
            
            var skinString = ""
            for(var i = 1; i < skinData.length; ++i) {
                if(i == 1)
                    skinString += skinData[i].name
                else
                    skinString +=  ", " + skinData[i].name
            }
            console.log(skinData)
            console.log(skinString)

            var embed = new discord.RichEmbed()
                .setColor(0xED3D7D)
                .setTitle(champion)
                .addField('Id', `${championData.id}`, true)
                .addField('Name', `${championData.name}`, true)
                .addField('Key', `${championData.key}`)
                .addField('Skins', `${skinString}`, true)
                .setThumbnail(`http://cdn.communitydragon.org/9.19.1/champion/${champion}/square`)

                //.setURL(`https://euw.op.gg/summoner/userName=${name.replace(' ', '+')}`)
                //.setAuthor(name + '\'s summoner profile')
                //.setDescription('League of Legends')
                //.addField('Account Info', `Name: ${name}\nLevel: ${summonerLevel}`, true)
            msg.channel.send(embed)
        } catch(error) {
            msg.reply(`make sure you entered the right **champion name**. Here\'s a list of champions with **special characters** in their names: (Names are case-sensitive!)\n\n${errorMsg}`)
        }
        
    } else if(msg.content.startsWith(`${prefix}region`)) {
        msg.reply('BR, EUNE, EUW, JP, KR, LAN, LAS, NA, OCE, TR, RU, PBE')
    } else if(msg.content.startsWith(`${prefix}play`)) {
        console.log(`RANA » ${msg.author.username} just executed the play command.`)
        const voiceChannel = msg.member.voiceChannel
        if(!voiceChannel) return msg.reply('you must be in a voice channel.')
        if(voiceChannel.name !== voice.name) return msg.reply('you must be in the radio channel.')
        const permissions = voiceChannel.permissionsFor(msg.client.user)
        if(!permissions.has('CONNECT')) {
            return msg.reply('I cannot connect to your voice channel.')
        }
        if(!permissions.has('SPEAK')) {
            return msg.reply('I cannot speak in this voice channel.')
        }

        if(url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url)
            const videos = await playlist.getVideos()
            //if(videos.length > 100) return msg.channel.send('**RANA** » I couldn\'t add the playlist because it is too large. Choose a smaller playlist.')
            for(const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id)
                await handleVideo(video2, msg, voiceChannel, true)
            }
            return msg.reply(`I just added the playlist **${playlist.title}** to the queue.`)
        } else {
            try {
                var video = await youtube.getVideo(url)
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 1)
                    var video = await youtube.getVideoByID(videos[0].id)
                } catch (err) {
                    console.error(err);
                    return msg.reply('I could not find anything.')
                }
            }

            return handleVideo(video, msg, voiceChannel)
        }
    } else if(msg.content.startsWith(`${prefix}skip`)) {
        if(!serverQueue) return msg.reply('there are no songs in the queue that I could skip.')
        serverQueue.connection.dispatcher.end(`RANA » ${msg.author.username} just executed the skip command.`)
        return undefined
    } else if(msg.content.startsWith(`${prefix}leave`)) {
        if(!msg.member.voiceChannel) return msg.reply('you must be in a voice channel.')
        serverQueue.songs = []
        serverQueue.connection.dispatcher.end(`RANA » ${msg.author.username} just executed the leave command.`)
        return undefined
    } else if(msg.content.startsWith(`${prefix}vol`)) {
        console.log(`RANA » ${msg.author.username} just executed the vol command.`)
        if(!msg.member.voiceChannel) return msg.reply('*you must be in a voice channel.')
        if(!serverQueue) return msg.reply('there is no song playing right now.')
        if(!args[1]) return msg.reply(`the current volume is: **${serverQueue.volume}**`)
        serverQueue.volume = args[1]
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5)
        return msg.reply(`I changed the volume to: **${args[1]}**`)
    } else if(msg.content.startsWith(`${prefix}np`)) {
        console.log(`RANA » ${msg.author.username} just executed the np command.`);
        if(!serverQueue) return msg.reply('there is no song playing right now.')
        return msg.reply(`I am now playing: **${serverQueue.songs[0].title}**.`)
    } else if(msg.content.startsWith(`${prefix}queue`)) {
        console.log(`RANA » ${msg.author.username} just executed the queue command.`)
        if(!serverQueue) return msg.reply('there is no song playing right now.')
        return msg.channel.send(`
**Song Queue:**

${serverQueue.songs.map(song => `${song.title}`).join('\n')} 

**Now Playing:** ${serverQueue.songs[0].title}
        `)
    } else if(msg.content.startsWith(`${prefix}pause`)) {
        console.log(`RANA » ${msg.author.username} just executed the pause command.`)
        if(!msg.member.voiceChannel) return msg.reply('you must be in a voice channel.')
        if(serverQueue && serverQueue.playing) {
            serverQueue.playing = false
            serverQueue.connection.dispatcher.pause()
            return msg.reply('I just paused the current song for you.')
        }
        return msg.reply('there is no song playing right now.') // CHECK .REPLY BELOW HERE
    } else if(msg.content.startsWith(`${prefix}resume`)) {
        console.log(`RANA » ${msg.author.username} just executed the resume command.`)
        if(!msg.member.voiceChannel) return msg.reply('you must be in a voice channel.');
        if(serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume()
            return msg.channel.send('▶ I just resumed the current song for you.')
        }
        return msg.reply('there is no song playing right now.')
    }
    return undefined
});

async function handleVideo(video, msg, voiceChannel, playlist=false) {
    const serverQueue = queue.get(msg.guild.id)
    console.log(video)
        const song = {
            id: video.id,
            title: video.title,
            url: `https://www.youtube.com/watch?v=${video.id}`
        }
        if(!serverQueue) {
            const queueConstruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
            queue.set(msg.guild.id, queueConstruct);

            queueConstruct.songs.push(song)

            try {
                var connection = await voiceChannel.join()
                queueConstruct.connection = connection
                play(msg.guild, queueConstruct.songs[0])
            } catch (error) {
                console.error(`**RANA** » I could not join the voice channel: \n${error}.`)
                queue.delete(msg.guild.id)
                return msg.reply(`I could not join the voice channel: \n${error}.`)
            }
        } else {
            serverQueue.songs.push(song)
            console.log(serverQueue.songs)
            if(playlist) return undefined
            else return msg.channel.send(`✅ I just added **${song.title}** to the queue.`)
        }
    return undefined;
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id)
    
    if(!song) {
        serverQueue.voiceChannel.leave()
        queue.delete(guild.id);
        return;
    }
    console.log(serverQueue.songs)

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
            .on('end', reason => {
                /*if(reason === 'Stream is not generating quickly enough.') console.log('Song ended.')
                else*/ console.log(reason)
                serverQueue.songs.shift()
                play(guild, serverQueue.songs[0])
            })
            .on('error', error => console.error(error))
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)

    serverQueue.textChannel.send(`🎶 I just started playing **${song.title}**.`)
}

function IdIntoChamp(champId) {
    switch(champId) {
        case 1: return 'Annie'
        case 2: return 'Olaf'
        case 3: return 'Galio'
        case 4: return 'Twisted Fate'
        case 5: return 'Xin Zhao'
        case 6: return 'Urgot'
        case 7: return 'Le Blanc'
        case 8: return 'Vladimir'
        case 9: return 'Fiddlesticks'
        case 10: return 'Kayle'
        case 11: return 'Master Yi'
        case 12: return 'Alistar'
        case 13: return 'Ryze'
        case 14: return 'Sion'
        case 15: return 'Sivir'
        case 16: return 'Soraka'
        case 17: return 'Teemo'
        case 18: return 'Tristana'
        case 19: return 'Warwick'
        case 20: return 'Nunu & Willump'
        case 21: return 'Miss Fortune'
        case 22: return 'Ashe'
        case 23: return 'Tryndamere'
        case 24: return 'Jax'
        case 25: return 'Morgana'
        case 26: return 'Zilean'
        case 27: return 'Singed'
        case 28: return 'Evelynn'
        case 29: return 'Twitch'
        case 30: return 'Karthus'
        case 31: return 'Cho\'Gath'
        case 32: return 'Amumu'
        case 33: return 'Rammus'
        case 34: return 'Anivia'
        case 35: return 'Shaco'
        case 36: return 'Dr. Mundo'
        case 37: return 'Sona'
        case 38: return 'Kassadin'
        case 39: return 'Irelia'
        case 40: return 'Janna'
        case 41: return 'Gangplank'
        case 42: return 'Corki'
        case 43: return 'Karma'
        case 44: return 'Taric'
        case 45: return 'Veigar'
        case 48: return 'Trundle'
        case 50: return 'Swain'
        case 51: return 'Caitlyn'
        case 53: return 'Blitzcrank'
        case 54: return 'Malphite'
        case 55: return 'Katarina'
        case 56: return 'Nocturne'
        case 57: return 'Maokai'
        case 58: return 'Renekton'
        case 59: return 'Jarvan IV.'
        case 60: return 'Elise'
        case 61: return 'Orianna'
        case 62: return 'Wukong'
        case 63: return 'Brand'
        case 64: return 'Lee Sin'
        case 67: return 'Vayne'
        case 68: return 'Rumble'
        case 69: return 'Cassiopeia'
        case 72: return 'Skarner'
        case 74: return 'Heimerdinger'
        case 101: return 'Xerath'
        case 102: return 'Shyvana'
        case 103: return 'Ahri'
        case 104: return 'Graves'
        case 105: return 'Fizz'
        case 106: return 'Volibear'
        case 107: return 'Rengar'
        case 110: return 'Varus'
        case 111: return 'Nautilus'
        case 112: return 'Viktor'
        case 113: return 'Sejuani'
        case 114: return 'Fiora'
        case 115: return 'Ziggs'
        case 117: return 'Lulu'
        case 119: return 'Draven'
        case 120: return 'Hecarim'
        case 121: return 'Kha\'Zix'
        case 122: return 'Darius'
        case 126: return 'Jayce'
        case 127: return 'Lissandra'
        case 131: return 'Diana'
        case 133: return 'Quinn'
        case 134: return 'Syndra'
        case 136: return 'Aurelion Sol'
        case 141: return 'Kayn'
        case 142: return 'Zoe'
        case 143: return 'Zyra'
        case 145: return 'Kai\'Sa'
        case 150: return 'Gnar'
        case 154: return 'Zac'
        case 157: return 'Yasuo'
        case 161: return 'Vel\'Koz'
        case 163: return 'Taliyah'
        case 164: return 'Camille'
        case 201: return 'Braum'
        case 202: return 'Jhin'
        case 203: return 'Kindred'
        case 222: return 'Jinx'
        case 223: return 'Tahm Kench'
        case 236: return 'Zed'
        case 238: return 'Kled'
        case 240: return 'Ekko'
        case 246: return 'Qiyana'
        case 254: return 'Vi'
        case 266: return 'Aatrox'
        case 267: return 'Nami'
        case 268: return 'Azir'
        case 350: return 'Yuumi'
        case 412: return 'Thresh'
        case 420: return 'Illaoi'
        case 421: return 'Rek\'Sai'
        case 427: return 'Ivern'
        case 429: return 'Kalista'
        case 432: return 'Bard'
        case 497: return 'Rakan'
        case 498: return 'Xayah'
        case 516: return 'Ornn'
        case 517: return 'Sylas'
        case 518: return 'Neeko'
        case 555: return 'Pyke'
        default: return 'Error.'
    }
}

function QueueIdIntoString(queue) {
    switch(queue) {
        case 400: return 'Draft 5v5'
        case 420: return 'Ranked Solo'
        case 430: return 'Blind 5v5'
        case 440: return 'Ranked Flex'
        case 450: return 'ARAM'
        case 700: return 'Clash Games'
    }
}

function ConvertTier(tier) {
    const t = tier
    switch(tier) {
        case 'IRON': return t.replace('IRON', 'Iron')
        case 'SILVER': return t.replace('SILVER', 'Silver')
        case 'GOLD': return t.replace('GOLD', 'Gold')
        case 'PLATINUM': return t.replace('PLATINUM', 'Platinum')
        case 'DIAMOND': return t.replace('DIAMOND', 'Diamond')
        case 'MASTER': return t.replace('MASTER', 'Master')
        case 'GRANDMASTER': return t.replace('GRANDMASTER', 'Grandmaster')
        case 'CHALLENGER': return t.replace('CHALLENGER', 'Challenger')
    }
}

function ConvertRank(rank) {
    const r = rank
    switch(rank) {
        case 'I': return r.replace('I', '1')
        case 'II': return r.replace('II', '2')
        case 'III': return r.replace('III', '3')
        case 'IV': return r.replace('IV', '4')
    }
}

client.login(discordToken);