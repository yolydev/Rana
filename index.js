const { Client, Util } = require('discord.js');
const { TOKEN, PREFIX } = require('./config');
const ytdl = require('ytdl-core');

const client = new Client({ disableEveryone: true });

const queue = new Map();

client.on('warn', console.warn);
client.on('error', console.error);
client.on('ready', () => console.log('bot ready!'));
client.on('disconnect', () => console.log('disconnected!'));
client.on('reconnecting', () => console.log('reconnecting now!'));

client.on('message', async msg => {
    if(msg.author.bot) return undefined;
    if(!msg.content.startsWith(PREFIX)) return undefined;
    const args = msg.content.split(' ');
    const serverQueue = queue.get(msg.guild.id);

    if(msg.content.startsWith(`${PREFIX}play`)) {
        const voiceChannel = msg.member.voiceChannel;
        if(!voiceChannel) return msg.channel.send('You must be in a voice channel.');
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if(!permissions.has('CONNECT')) {
            return msg.channel.send('I cannot connect to your voice channel.')
        }
        if(!permissions.has('SPEAK')) {
            return msg.channel.send('I cannot speak in this voice channel.');
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
                console.error(`Could not join a voice channel: ${error}`);
                queue.delete(msg.guild.id);
                return msg.channel.send(`I could not join the voice channel: ${error}.`);
            }
        } else {
            serverQueue.songs.push(song);
            console.log(serverQueue.songs);
            return msg.channel.send(`**${song.title}** has been added to the queue.`);
        }
        
        return undefined;
    } else if(msg.content.startsWith(`${PREFIX}skip`)) {
        if(!serverQueue) return msg.channel.send('Nothing I could skip in the queue.');
        serverQueue.connection.dispatcher.end();
        return undefined;
    } else if(msg.content.startsWith(`${PREFIX}leave`)) {
        if(!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel.');
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
        return undefined;
    } else if(msg.content.startsWith(`${PREFIX}vol`)) {
        if(!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel.');
        if(!serverQueue) return msg.channel.send('There is no song playing right now.');
        if(!args[1]) return msg.channel.send(`The current volume is: **${serverQueue.volume}**`);
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return msg.channel.send(`Volume set to: **${args[1]}**`);
    } else if(msg.content.startsWith(`${PREFIX}np`)) {
        if(!serverQueue) return msg.channel.send('There is no song playing right now.');
        return msg.channel.send(`Now Playing: **${serverQueue.songs[0].title}**.`);
    } else if(msg.content.startsWith(`${PREFIX}queue`)) {
        if(!serverQueue) return msg.channel.send('There is no song playing right now.');
        return msg.channel.send(`
**Song Queue:**

${serverQueue.songs.map(song => `${song.title}`).join('\n')} 

**Now Playing: **

${serverQueue.songs[0].title}**
        `);
    }  else if(msg.content.startsWith(`${PREFIX}pause`)) {
        if(!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel.');
        if(serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return msg.channel.send('Paused current song for you.')
        }
        return msg.channel.send('There is no song playing right now.');
    }  else if(msg.content.startsWith(`${PREFIX}resume`)) {
        if(!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel.');
        if(serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return msg.channel.send('Resumed current song for you.')
        }
        return msg.channel.send('There is no song playing right now.');
    }

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
                console.log('song ended!');
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            })
            .on('error', error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    serverQueue.textChannel.send(`Start Playing: **${song.title}**`);
}

client.login(TOKEN);