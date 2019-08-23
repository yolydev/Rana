const discord = require('discord.js')
const TeemoJS  = require('teemojs')
const YouTube = require('simple-youtube-api')
const ytdl = require('ytdl-core')
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
        let statuses = ['twitch.tv/ehasywhin', 'quitw.ovh', 'github.com/yolydev']
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
        //.setDescription('League of Legends')
        .setThumbnail(member.user.displayAvatarURL)
        .addField('**Name**', `${member.displayName}`, true)
        .addField('**Status**', isBot(), true)
        .addBlankField()
        .addField('**Joined At**', getDate())
        .setFooter(`There are now ${member.guild.memberCount} Users on this server.`, member.guild.iconURL)
    return channel.send(/*`${member}, welcome`, */embed)

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
    if(!msg.content.startsWith(prefix)) return msg.reply('that\'s not a command buddy.')
    const args = msg.content.split(' ')
    const searchString = args.slice(1).join(' ')
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : ''
    const serverQueue = queue.get(msg.guild.id)

    if(msg.content.startsWith(`${prefix}elo`)) {
        try {
            const remainder = msg.content.substr('!elo '.length)

            var profileIconId, name, id, summonerLevel, tier, rank, lp
            api.get('euw1', 'summoner.getBySummonerName', remainder)
            .then(data =>  {
                profileIconId = data.profileIconId
                name = data.name
                id = data.id
                summonerLevel = data.summonerLevel

                api.get('euw1', 'league.getLeagueEntriesForSummoner', id)
                .then(data => {
                    let entry = data.find(e => e.queueType == 'RANKED_SOLO_5x5')
                    tier = entry.tier
                    rank = entry.rank
                    lp = entry.leaguePoints
                    wins = entry.wins
                    losses = entry.losses

                    console.log(name + ' ' + id + '' + summonerLevel + ' ' + tier + ' ' + rank)

                    var embed = new discord.RichEmbed()
                        .setColor(0xED3D7D)
                        .setTitle(name + '\'s op.gg')
                        .setURL(`https://euw.op.gg/summoner/userName=${name.replace(' ', '+')}`)
                        .setAuthor(name + '\'s summoner profile')
                        .setDescription('League of Legends')
                        .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/9.16.1/img/profileicon/${profileIconId}.png`)
                        .addField('Account Info', `Name: ${name}\nLevel: ${summonerLevel}`, true)
                        .addField('Ranked Solo/Duo', `Tier: ${convertTier(tier)} ${convertRank(rank)} with ${lp}LP\n ${wins}W/${losses}L`, true)
                    msg.channel.send(embed)
                })
            })
        } catch(error) {
            console.error(error)
        }
    } else if(msg.content.startsWith(`${prefix}play`)) {
        console.log(`RANA » ${msg.author.username} just executed the play command.`)
        const voiceChannel = msg.member.voiceChannel
        if(!voiceChannel) return msg.reply('you must be in a voice channel.')
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

function convertTier(tier) {
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

function convertRank(rank) {
    const r = rank
    switch(rank) {
        case 'I': return r.replace('I', '1')
        case 'II': return r.replace('II', '2')
        case 'III': return r.replace('III', '3')
        case 'IV': return r.replace('IV', '4')
    }
}

client.login(discordToken);