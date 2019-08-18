const { Client, Util } = require('discord.js')
const discord = require('discord.js')
const TeemoJS  = require('teemojs')
const { DISCORD_TOKEN, LEAGUE_TOKEN, PREFIX } = require('./config')
const ytdl = require('ytdl-core')

const client = new Client({ disableEveryone: true })

const queue = new Map()
let api = TeemoJS(LEAGUE_TOKEN)

var status_active = false

client.on('warn', console.warn)
client.on('error', console.error)
client.on('ready', () =>  {
    console.log('RANA » Ready to start playing some music!')
    if(!status_active) {
        setInterval(function() {
            let statuses = ['twitch.tv/ehasywhin', 'quitw.ovh', 'github.com/yolydev']
            let status = statuses[Math.floor(Math.random() * statuses.length)]
            client.user.setPresence({ game: { name: status }, status: 'online'})
            client.user.setPresence({ activity: { name: status, /*type: 'PLAYING'(STREAMING;LISTENING;WATCHING) */ }, status: 'online'})
        }, 10000)
    }
})
client.on('disconnect', () => console.log('RANA » I just disconnected!'))
client.on('reconnecting', () => console.log('RANA » Trying to reconnect right now!'))
client.on('message', async msg => {
    if(msg.author.bot) return undefined
    if(!msg.content.startsWith(PREFIX)) return undefined;
    const args = msg.content.split(' ')
    const serverQueue = queue.get(msg.guild.id)

    if(msg.content.startsWith(`${PREFIX}elo`)) {
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
                        .addField('Ranked Solo/Duo', `Tier: ${convertTier(tier)} ${convertRank(rank)} mit ${lp}LP\n ${wins}W/${losses}L`, true)
                    msg.channel.send(embed)
                })
            })
        } catch(error) {
            console.error(error)
        }
    } else if(msg.content.startsWith(`${PREFIX}play`)) {
        console.log(`RANA » ${msg.author.username} just executed the play command.`);
        const voiceChannel = msg.member.voiceChannel;
        if(!voiceChannel) return msg.channel.send('**RANA** » You must be in a voice channel.');
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if(!permissions.has('CONNECT')) {
            return msg.channel.send('**RANA** » I cannot connect to your voice channel.')
        }
        if(!permissions.has('SPEAK')) {
            return msg.channel.send('**RANA** » I cannot speak in this voice channel.');
        }

        const songInfo = await ytdl.getInfo(args[1]);
        const song = {
            title: Util.escapeMarkdown(songInfo.title),
            url: songInfo.video_url
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

            queueConstruct.songs.push(song);

            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                play(msg.guild, queueConstruct.songs[0]);
            } catch (error) {
                console.error(`**RANA** » I could not join the voice channel: \n${error}.`);
                queue.delete(msg.guild.id);
                return msg.channel.send(`**RANA** » I could not join the voice channel: \n${error}.`);
            }
        } else {
            serverQueue.songs.push(song);
            console.log(serverQueue.songs);
            return msg.channel.send(`**RANA** » I just added **${song.title}** to the queue.`);
        }
        
        return undefined;
    } else if(msg.content.startsWith(`${PREFIX}skip`)) {
        console.log(`RANA » ${msg.author.username} just executed the skip command.`);
        if(!serverQueue) return msg.channel.send('**RANA** » There are no songs in the queue that I could skip.');
        serverQueue.connection.dispatcher.end();
        return undefined;
    } else if(msg.content.startsWith(`${PREFIX}leave`)) {
        console.log(`RANA » ${msg.author.username} just executed the leave command.`);
        if(!msg.member.voiceChannel) return msg.channel.send('**RANA** » You must be in a voice channel.');
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
        return undefined;
    } else if(msg.content.startsWith(`${PREFIX}vol`)) {
        console.log(`RANA » ${msg.author.username} just executed the vol command.`);
        if(!msg.member.voiceChannel) return msg.channel.send('**RANA** » You must be in a voice channel.');
        if(!serverQueue) return msg.channel.send('**RANA** » There is no song playing right now.');
        if(!args[1]) return msg.channel.send(`**RANA** » The current volume is: **${serverQueue.volume}**`);
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return msg.channel.send(`**RANA** » I changed the volume to: **${args[1]}**`);
    } else if(msg.content.startsWith(`${PREFIX}np`)) {
        console.log(`RANA » ${msg.author.username} just executed the np command.`);
        if(!serverQueue) return msg.channel.send('**RANA** » There is no song playing right now.');
        return msg.channel.send(`**RANA** » I am now playing: **${serverQueue.songs[0].title}**.`);
    } else if(msg.content.startsWith(`${PREFIX}queue`)) {
        console.log(`RANA » ${msg.author.username} just executed the queue command.`);
        if(!serverQueue) return msg.channel.send('**RANA** » There is no song playing right now.');
        return msg.channel.send(`
**Song Queue:**

${serverQueue.songs.map(song => `${song.title}`).join('\n')} 

**Now Playing: **

${serverQueue.songs[0].title}
        `);
    } else if(msg.content.startsWith(`${PREFIX}pause`)) {
        console.log(`RANA » ${msg.author.username} just executed the pause command.`);
        if(!msg.member.voiceChannel) return msg.channel.send('**RANA** » You must be in a voice channel.');
        if(serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return msg.channel.send('**RANA** » I just paused the current song for you.')
        }
        return msg.channel.send('**RANA** » There is no song playing right now.');
    } else if(msg.content.startsWith(`${PREFIX}resume`)) {
        console.log(`RANA » ${msg.author.username} just executed the resume command.`);
        if(!msg.member.voiceChannel) return msg.channel.send('**RANA** » You must be in a voice channel.');
        if(serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return msg.channel.send('**RANA** » I just resumed the current song for you.')
        }
        return msg.channel.send('**RANA** » There is no song playing right now.');
    } /*else if(msg.content.startsWith(`${PREFIX}setstream`)) {   
        const remainder = msg.content.substr('!setstream '.length);
        
        if(remainder === 'lec') {
            client.user.setPresence({ game: { name: ' - Watching LEC Live!', type: "Streaming", url: "https://www.twitch.tv/riotgames"}});
            status_active = true;
        } else if(remainder === 'lcs') {
            client.user.setPresence({ game: { name: ' - Watching LCS Live!', type: "Streaming", url: "https://www.twitch.tv/riotgames"}});
            status_active = true;
        } else if(remainder === 'reset') {
            status_active = false;
        }
        
    }*/
    return undefined;
});

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    
    if(!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    console.log(serverQueue.songs);

    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
            .on('end', () => {
                console.log('RANA » A Song just ended. Left voice channel.');
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            })
            .on('error', error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send(`**RANA** » I just started playing: **${song.title}**`);
}

function convertTier(tier) {
    const t = tier;
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

client.login(DISCORD_TOKEN);