const funConfig = config.commands.fun;
const commandConfig = funConfig.arguments.game.inputs;
const {randomColor, timeout, getUserInfo, currencyFormat} = require ('./functions');

module.exports = {
    name: 'fun',
    summoner: funConfig.alias,
    async execute (message, args) {
        let member = message.member;
        if (commandConfig.wyr.includes (args[1])) {
            let eitherAnswer;
            await fetch ('http://either.io/', {method: 'get'})
            .then (res => res.text())
            .then (body => eitherAnswer = body.split('window.initial_question')[1]);
            let option1Object = {
                name: eitherAnswer.split('n_1":"')[1].split('","opt')[0],
                number: parseInt(eitherAnswer.split('1_total":"')[1].split('"')[0]),
            }
            let option2Object = {
                name: eitherAnswer.split('n_2":"')[1].split('","opt')[0],
                number: parseInt(eitherAnswer.split('2_total":"')[1].split('"')[0]),
            }
            const totalNumber = option1Object.number + option2Object.number;
            option1Object.percent = 100 * option1Object.number / totalNumber;
            option2Object.percent = 100 * option2Object.number / totalNumber;
            const link = '(http://either.io/' + eitherAnswer.split('"id":"')[1].split('","liv')[0] + '/' + eitherAnswer.split('lug":"')[1].split('","pre')[0] + ')'
            const embed = {
                title: 'Fun - Either',
                color: randomColor ('all'),
                timestamp: new Date().toISOString(),
                description: '[Would you rather...]' + link + ' 🟦 **' + option1Object.name + '** 🟦 [or]' + link + ' 🟥 **' + option2Object.name + '** 🟥?',
                fields: [{name: 'Results:', value: '||**' + option1Object.name + '**| ' + option1Object.number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '| ' + option1Object.percent.toFixed() + '%\n **' + option2Object.name + '**| ' + option2Object.number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '| ' + option2Object.percent.toFixed() + '%||', inline: true}]
            }
            const sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed});
            sentMessage.addReaction ('🟦');
            sentMessage.addReaction ('🟥');
        }
        else if (commandConfig.gam.includes (args[1])) {
            let userInfo = await getUserInfo (member, message.channel.guild);
            let wagerString = (args[2]) ? args[2].replace (/[,$]/g, "") : null;
            let wagerFloat = parseFloat (wagerString);
            let oddsFloat = parseFloat (args[3] ? args[3] : 50);
            let winValue = wagerFloat * (-1+(100/oddsFloat))
            let errors = []
            if (isNaN(wagerFloat) || wagerFloat <= 0 || wagerFloat > 1000000000 || userInfo.money < wagerFloat) errors.push ('currency');
            if (isNaN(oddsFloat) || oddsFloat >= 100 || oddsFloat <= 0 || args[4]) errors.push ('odds')
            if (errors.length) return errorLog (message, args, 'fun', 'invalidUsage', errors);
            let embedStart = {
                title: 'Fun - Gamble',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                description: 'Are you sure you want to gamble ' + currencyFormat(wagerFloat) + '?',
                fields: [
                    {name: 'Gambler:', value: member.mention, inline: true},
                    {name: 'Winning:', value: oddsFloat.toFixed() + '% chance of winning ' + currencyFormat(winValue), inline: true},
                    {name: 'Losing:', value: (100-oddsFloat).toFixed() + '% chance of losing ' + currencyFormat(wagerFloat), inline: true}
                ]
            }
            let sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embedStart});
            sentMessage.addReaction ('👍');
			const filter = (mes, emj, usr) => emj.name == '👍' && usr == member.id;
			const collector = new reactionCollector (client, sentMessage, filter, {time: 300000});
			collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
                let random = Math.random() * 100;
                userInfo = await getUserInfo (member, message.channel.guild);
                if (oddsFloat > random) {
                    embedStart.description = 'Luck was on your side, you won ' + currencyFormat(winValue) + ' from gambling.';
                    embedStart.color = randomColor ('blue');
                    userInfo.money = userInfo.money + winValue;
                }
                else {
                    embedStart.description = 'Luck was not on your side, you lost' + currencyFormat(wagerFloat) + ' from gambling.';
                    embedStart.color = randomColor ('orange');
                    userInfo.money = userInfo.money - wagerFloat;
                }
                sentMessage.edit ({content: member.mention + ',', embed: embedStart});
                userInfo.save()
                collector.stop('stopped')
            })
            collector.on ('end', (collected, reason) => {
                if (reason == 'stopped') return;
                embedStart.description = 'Your gambling request was cancelled because you took too long to respond.';
                embedStart.color = randomColor ('orange');
                sentMessage.edit ({content: member.mention + ',', embed: embedStart});
            })
        }
        else if (commandConfig.pic.includes (args[1])) {
            let embedStart = {
                title: 'Fun - Pictionary',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                description: 'One randomly selected player will secretly be given a random topic. The rest of the players will attempt to guess the topic. React with 👍 to play.',
                fields: [
                    {name: 'Players', value: '3-12 players', inline: true},
                    {name: 'Length', value: '2 Minutes', inline: true},
                    {name: 'Options', value: 'None', inline: true}
                ]
            }
            let lobbyMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embedStart});
            gameLobby (lobbyMessage, embedStart, 'Pictionary', member.mention, 3, 12, pictionary);
        }
        else if (commandConfig.dec.includes (args[1])) {
            let wager = 0; let error = false;
            if (args[2]) {
                const index = message.content.toLowerCase().indexOf(args[2]);
                const settings = message.content.substring(0, message.content.length - 1).slice(index).replace (/\[n]/g, '\n');
                const settingsSplit = settings.split ('`| ');
                const settingsConfig = funConfig.arguments.deceptionSettings.inputs;
                settingsSplit.forEach (ele => {
                    let eleSplit = ele.split(/: ?`/);
                    let backTickNumber = (eleSplit[1].split('`').length - 1);
                    if (!eleSplit [1] || eleSplit[2] || 1 == backTickNumber % 2);
                    else if (settingsConfig.wgr.includes (eleSplit[0]) && Boolean(eleSplit[1].match(/^\d+$/g))) return wager = parseFloat(eleSplit[1]);
                    return error = true;
                })
            }
            if (error == true) return errorLog (message, args, 'Fun', 'invalidUsage', ['deceptionSettings']);
            let embedStart = {
                title: 'Fun - Deception',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                description: 'One randomly selected player will prove their deceptive abilities through the means of justifying.' + ((wager > 0) ? '\n**ATTENTION:** This game is a wager match, it will cost $' + wager + ' to enter.' : ''),
                fields: [
                    {name: 'Players', value: '3-8 players', inline: true},
                    {name: 'Length', value: '8 Minutes', inline: true},
                    {name: 'Options', value: 'Wager: `' + wager + '`', inline: true}
                ]
            }
            let lobbyMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embedStart});
            gameLobby (lobbyMessage, embedStart, 'Deception', member.mention, 1, 8, deceptionStarter, wager);
        }
        else if (commandConfig.rdl.includes (args[1])) {
            let riddleAnswer;
            await fetch ('https://fungenerators.com/random/riddle', {method: 'get'})
            .then (res => res.text())
            .then (body => riddleAnswer = body.split('<h2 class="')[1].split('<p class="wow')[0]);
            const embed = {
                title: 'Fun - Riddle',
                color: randomColor ('all'),
                timestamp: new Date().toISOString(),
                description: riddleAnswer.split('">')[1].split('</h2>')[0],
                fields: [{name: 'Answer:', value: '||' + riddleAnswer.split('<div class="">')[1].split('</div>')[0] + '||', inline: false}]
            }
            message.channel.createMessage ({content: member.mention + ',', embed: embed});
        }
        else if (commandConfig.chs.includes (args[1]) && process.env.CHANNEL_TRANSPORT == '716471682717712439') {
            let embedStart = {
                title: 'Fun - Chess',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                description: 'The classic game of chess. A two player game of strategy with a steady learning curve.',
                fields: [
                    {name: 'Players', value: '2 players', inline: true},
                    {name: 'Length', value: '12 Minutes', inline: true},
                    {name: 'Options', value: 'None', inline: true}
                ]
            }
            let lobbyMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embedStart});
            gameLobby (lobbyMessage, embedStart, 'Chess', member.mention, 2, 2, chessStarter, 0);
        }
        else return errorLog (message, args, 'Fun', 'invalidUsage', ['game']);
    }
}

async function gameLobby (sentMessage, sentEmbed, gameName, host, minPlayers, maxPlayers, gameFunction, wager) {
    sentMessage.addReaction ('👍');
    let startID = 0;
    const filter = (mes, emj, usr) => emj.name == '👍' && mes.reactions['👍'].count == minPlayers + 1;
    const collector = new reactionCollector (client, sentMessage, filter, {time: 600000});
    collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
        startID++;
        let compareID = startID;
        setTimeout(async () => {
            let userInfos = [];
            if (compareID != startID) return;
            let messageReaction = await sentMessage.channel.getMessageReaction(sentMessage.id, '👍', maxPlayers + 1);
            let userInfoPromise = new Promise ((resolve) => {
                if (wager == 0) return resolve();
                messageReaction.forEach(async (ele,i) => {
                    let userInfo = await getUserInfo(ele.id, sentMessage.channel.guild.id);
                    userInfos.push(userInfo);
                    if (i == messageReaction.length-1) resolve();
                })
            })
            userInfoPromise.then (() => {
                messageReaction = messageReaction.filter ((ele, i) => !ele.bot && (wager == 0 || userInfos[i].money >= wager));
                if (messageReaction.length < minPlayers) return;
                if (messageReaction.length > maxPlayers) messageReaction.pop();
                collector.stop ('started');
                gameFunction (sentMessage, messageReaction, wager);
            })
        }, 30000);
    })
    collector.on ('end', (collected, reason) => {
        if (reason == 'started') return;
        sentEmbed.fields[0] = {name: 'Game Cancelled', value: gameName + ' won\'t start with fewer than ' + minPlayers + ' players.'};
        sentEmbed.color = randomColor ('orange');
        sentMessage.edit ({content: host + ',', embed: sentEmbed});
    })
}

async function pictionary (startMessage, startPlayers) {
    let playerMentions = '';
    startPlayers.forEach(ele => playerMentions = playerMentions + ele.mention);
    let canvas = [['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'], ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛']];
    const decimal = config.discordInfo.emoji.numbers;
    const letters = config.discordInfo.emoji.letters.slice(0, 16);
    let editedCanvas = [];
    for (i = 0; i < 10; i++) {
        editedCanvas.push(decimal[i] + canvas[i].join(''));
    }
    const artist = startPlayers[Math.floor(Math.random() * startPlayers.length)];
    const artistChannel = await client.getDMChannel(artist.id);
    const topic = funConfig.arguments.constants.randomWords [Math.floor(Math.random() * 453)];
    const artistEmbed = {
        title: 'Fun - Pictionary',
        color: randomColor ('white'),
        timestamp: new Date().toISOString(),
        description: 'You are the artist for this round. Your drawing topic is: __' + topic.toUpperCase() + '__',
    }
    artistChannel.createMessage ({content: artist.mention + ',', embed: artistEmbed});
    let embedGame = {
        title: 'Fun - Pictionary',
        color: randomColor ('blue'),
        timestamp: new Date().toISOString(),
        fields: [
            {name: 'Artist:', value: 'Type `draw <A-P> <0-9> [emoji]` to draw.', inline: true},
            {name: 'Audience:', value: 'Type `guess <word>` to guess.', inline: true},
            {name: 'Canvas', value: '⏺️' + letters.join('') + '\n' + editedCanvas.join('\n'), inline: false}
        ]
    }
    await timeout (1000)
    let sentMessage = await startMessage.channel.createMessage ({content: playerMentions + ',', embed: embedGame});
    setTimeout (() => {
        if (embedGame.fields.length == 2) return;
        embedGame.color = randomColor ('white');
        sentMessage.edit ({content: playerMentions + ',', embed: embedGame});
    }, 90000)
    let defaultEmoji = '⬜';
    const filter = (mes) => startPlayers.find(ele => ele.id == mes.author.id);
    const collector = new messageCollector (client, sentMessage.channel, filter, {time: 120000});
    collector.on ('collect', async (messageReceiver) => {
        if (messageReceiver.author.id == artist.id) {
            if (!messageReceiver.content.startsWith('draw ') || (!messageReceiver.content.match(/[^\p{L}\p{N}\p{P}\p{Z}]/gu) && messageReceiver.content[9]) || messageReceiver.content[6] != ' ' || (messageReceiver.content[8] && messageReceiver.content[8] != ' ')) return;
            const xValue = parseInt(messageReceiver.content[5].toLowerCase().charCodeAt(0)-97);
            const yValue = parseInt(messageReceiver.content[7]);
            const zValue = messageReceiver.content.substring(9, 11) || defaultEmoji;
            if (isNaN(xValue) || isNaN(yValue) || !zValue) return;
            canvas[yValue][xValue] = zValue;
            defaultEmoji = zValue;
            let editedCanvas = [];
            for (i = 0; i < 10; i++) {
                editedCanvas.push(decimal[i] + canvas[i].join(''));
            }
            embedGame.fields[2].value = '⏺️' + letters.join('') + '\n' + editedCanvas.join('\n');
        }
        else {
            if (!messageReceiver.content.startsWith('guess ') || messageReceiver.content.substring(6).toLowerCase() != topic) return;
            embedGame.fields[1] = {name: 'Game Finished', value: 'The player, ' + messageReceiver.member.mention + ', guessed the word correctly: __' + topic.toUpperCase() + '__', inline: false}
            embedGame.color = randomColor ('blue');
            collector.stop('won')
        }
        sentMessage.edit ({content: playerMentions + ',', embed: embedGame});
    })
    collector.on ('end', async (collected, reason) => {
        if (reason != 'won') {
            embedGame.fields[1] = {name: 'Game Finished', value: 'No one guessed the topic of the drawing correctly: __' + topic.toUpperCase() + '__', inline: false}
            embedGame.color = randomColor ('orange');
        }
        embedGame.fields.shift();
        sentMessage.edit ({content: playerMentions + ',', embed: embedGame});
        setTimeout (async () => {
            let embedStart = {
                title: 'Fun - Pictionary',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                description: 'Regathering players for another match of pictionary. The artist and topic are randomly swapped in every match.',
                fields: [
                    {name: 'Players', value: '3-10 players', inline: true},
                    {name: 'Length', value: '2 Minutes', inline: true},
                    {name: 'Options', value: 'None', inline: true}
                ]
            }
            let lobbyMessage = await sentMessage.channel.createMessage ({content: playerMentions + ',', embed: embedStart});
            return gameLobby (lobbyMessage, embedStart, 'Pictionary', playerMentions, 3, 12, pictionary);
        }, 5000)
    })
}

async function deceptionStarter (startMessage, startPlayers, wager) {
    let playerMentions = '';
    startPlayers.forEach(ele => playerMentions = playerMentions + ele.mention);
    let colors = ['⚪​', '🟤', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣']
    let embedGame = {
        title: 'Fun - Deception',
        color: randomColor ('blue'),
        timestamp: new Date().toISOString(),
        description: 'All players will be privately messaged the prompt.',
        fields: [
            {name: 'How To Play:', value: 'All players that are not the spy has been messaged a word (as a prompt). All players will attempt to place their dot in a location that best represents the prompt. Players will be required to justify their response to others all the while they\'re trying find the spy.', inline: false}
        ]
    }
    const spyIndex = Math.floor(Math.random() * startPlayers.length)
    let playerPromise = new Promise ((resolve) => {
        startPlayers.forEach (async (ele, i) => {
            let colorsExtract = Math.floor(Math.random() * colors.length);
            startPlayers[i].color = colors[colorsExtract];
            colors.splice(colorsExtract, 1);
            startPlayers[i].privateChannel = await client.getDMChannel(ele.id);
            startPlayers[i].extra = Math.floor(Math.random() * 4);
            startPlayers[i].alive = true;
            startPlayers[i].spy = (spyIndex == i);
            if (i == startPlayers.length - 1) resolve();
        })
    })
    playerPromise.then (async () => {
        let helpMessage = await startMessage.channel.createMessage ({content: playerMentions + ',', embed: embedGame});
        return deceptionRound (helpMessage, startPlayers, embedGame, wager)
    })
}

async function deceptionRound (startMessage, startPlayers, startEmbed, wager) {
    const topic = funConfig.arguments.constants.questions [Math.floor(Math.random()*funConfig.arguments.constants.questions.length)];
    let currentPlayers = 0;
    startPlayers.forEach (ele => {if (ele.alive == true) currentPlayers++});
    const totalValue = startPlayers.length*2;
    const exponentValue = totalValue**10;
    let canvas = '';
    for (let i = 0; i < 15; i++) {
        canvas = canvas + Math.floor(Math.random()*exponentValue).toString(totalValue).padStart(10, '0');
    }
    for (let i = 0; i < totalValue; i++) {
        if (i < totalValue-currentPlayers+1) canvas = canvas.split(i.toString(totalValue)).join('🌫️');
        else canvas = canvas.split(i.toString(totalValue)).join('⬛​​');
    }
    const decimal = config.discordInfo.emoji.numbers;
    const letters = config.discordInfo.emoji.letters.slice(0, 10);
    startPlayers.forEach(async (ele, i) => {
        if (ele.alive == false) return;
        const startIndex = 3*Math.floor(Math.random()*50);
        if (!ele.privateChannel) startPlayers[i].privateChannel = await client.getDMChannel(ele.id);
        let editedCanvas = [];
        for (let i2 = 0; i2 < 10; i2++) {
            editedCanvas.push(decimal[i2] + canvas.substring(i2*30+startIndex, i2*30+startIndex+30) + '​​');
        }
        let embedPrompt = {
            title: 'Fun - Deception',
            color: randomColor ('white'),
            timestamp: new Date().toISOString(),
            description: 'Type `place <A-J> <0-9>` to place your dot. Fogged areas are unplacable.' + (ele.spy ? ' As a spy, you are uninformed of the prompt.' : ''),
            fields: [
                {name: 'Color:', value: ele.color, inline: true},
                {name: 'Extra Dots:', value: ele.extra, inline: true},
                {name: 'Prompt:', value: (ele.spy ? 'You\'re the spy' : topic.charAt(0).toUpperCase() + topic.slice(1)), inline: true},
                {name: 'Gameboard:', value: '⏺️' + letters.join('') + '\n' + editedCanvas.join('\n'), inline: false}
            ]
        }
        let messagePrompt; let errorOccur = false;
        try {messagePrompt = await ele.privateChannel.createMessage ({content: ele.mention + ',', embed: embedPrompt})}
        catch {
            errorOccur = true;
            startEmbed.fields.push({name: 'Reference Error:', value: 'The bot was unable to message the DMs of ' + ele.username + ', their movements will be randomly assigned this round.', inline: false})
            startMessage.edit({content: startMessage.content, embed: startEmbed})
        }
        startPlayers[i].move = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
        if (errorOccur) return;
        let finishedMove = false;
        let filter = (msg) => msg.content.startsWith('place ');
        const collector = new messageCollector (client, ele.privateChannel, filter, {time: 60000});
        collector.on ('collect', async (messageReceiver) => {
            if (messageReceiver.content[9] || messageReceiver.content[7] != ' ') return;
            const xValue = parseInt(messageReceiver.content[6].toLowerCase().charCodeAt(0)-97);
            const yValue = parseInt(messageReceiver.content[8]);
            if (isNaN(xValue) || isNaN(yValue) || xValue>9 || xValue<0 || editedCanvas[yValue].slice(3*xValue-32, 3*xValue-29) != '⬛​​') return;
            if (finishedMove == true) {
                ele.extra = ele.extra - 1;
                startPlayers[i].move.push (xValue, yValue);
                embedPrompt.fields[1].value = ele.extra
            }
            else startPlayers[i].move = [xValue, yValue];
            editedCanvas[yValue] = editedCanvas[yValue].slice(0, 3*xValue-32) + ele.color + '​' + editedCanvas[yValue].slice(3*xValue-29);
            embedPrompt.fields[3].value = '⏺️' + letters.join('') + '\n' + editedCanvas.join('\n');
            embedPrompt.description = 'You successfully placed your dot. ' + ((ele.extra > 0) ? 'You could place extra dots to better clear your name.' : 'Please wait till the time limit is reached.');
            messagePrompt.edit ({content: ele.mention + ',', embed: embedPrompt});
            finishedMove = true;
            if (ele.extra <= 0) collector.stop();
        })
        setTimeout (() => {
            embedPrompt.color = randomColor ('orange');
            messagePrompt.edit ({content: ele.mention + ',', embed: embedPrompt});
        }, 30000)
    })
    setTimeout (async () => {
        canvas = canvas = canvas.split('🌫️').join('⬛​​') + '​​';
        startPlayers.sort ((a, b) => a.yValue*10+a.xValue - b.yValue*10+b.xValue);
        let outerLayers = []; let playerColors = ''; let emojiArray = []; let userIDArray = [];
        startPlayers.forEach (ele => {
            if (ele.alive == false) return;
            playerColors = playerColors + ele.color + ' `' + ele.username + '`| ';
            emojiArray.push(ele.color);
            userIDArray.push(ele.id);
            for (let i2 = 0; i2 < ele.move.length/2; i2++) {
                const arrayValue = ele.move[i2*2]*3+ele.move[i2*2+1]*30;
                const chartValue = canvas.substring(arrayValue, arrayValue+3);
                if (chartValue == '⬛​​') {
                    canvas = canvas.substring(0, arrayValue) + ele.color + '​' + canvas.substring(arrayValue+3);
                }
                else if (chartValue == '❇️​') outerLayers[outerLayers.length-1].colors.push(ele.color);
                else {
                    outerLayers.push({colors: [chartValue, ele.color], yValue: ele.move[i2*2+1]});
                    canvas = canvas.substring(0, arrayValue) + '❇️​' + canvas.substring(arrayValue+3);
                }
            }
        })
        let editedCanvas = []
        for (i = 0; i < 10; i++) {
            editedCanvas.push(canvas.slice(i*30,(i+1)*30));
        }
        outerLayers.forEach((ele, i) => {editedCanvas[ele.yValue] = editedCanvas[ele.yValue] + ' ｜ ' + ele.colors.join('')});
        let playerMentions = '';
        startPlayers.forEach(ele => {if (ele.alive == true) playerMentions = playerMentions + ' ' + ele.mention});
        let embedDeduce = {
            title: 'Fun - Deception',
            color: randomColor ('blue'),
            timestamp: new Date().toISOString(),
            description: 'The prompt was: **' + topic.charAt(0).toUpperCase() + topic.slice(1) + '**. Vote who you believe placed dots that worst represent the prompt.',
            fields: [
                {name: 'Players:', value: playerColors.slice(0,-2), inline: false},
                {name: 'Gameboard:', value: editedCanvas.join('\n'), inline: false}
            ]
        }
        let messageDeduce = await startMessage.channel.createMessage ({content: playerMentions + ',', embed: embedDeduce});
        setTimeout (() => {
            embedDeduce.color = randomColor ('white');
            messageDeduce.edit ({content: playerMentions + ',', embed: embedDeduce});
        }, 60000)
        setTimeout (() => {
            embedDeduce.color = randomColor ('orange');
            messageDeduce.edit ({content: playerMentions + ',', embed: embedDeduce});
        }, 120000)
        emojiArray.forEach (ele => {
            messageDeduce.addReaction(ele)
        })
        const filter = (msg, emj, usr) => usr != client.user.id;
        const collector = new reactionCollector (client, messageDeduce, filter, {time: 155000});
        collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
            if (!emojiArray.includes(emoji.name)) messageDeduce.removeReactionEmoji (emoji.name);
            else if (!userIDArray.includes(userID)) messageDeduce.removeReaction (emoji.name, userID);
        })
        let tieBroken = false;
        let removalIndex = 0;
        setTimeout (async () => {
            messageDeduce = await startMessage.channel.getMessage(messageDeduce.id)
            let messageReaction = messageDeduce.reactions;
            let reactionArray = []
            Object.keys(messageReaction).forEach ((ele, i) => {
                if (!emojiArray.includes(ele)) return;
                reactionArray.push ({name: ele, count: messageReaction[ele].count})
            })
            reactionArray.sort((a, b) => b.count - a.count);
            if (reactionArray[1] && reactionArray[0].count == reactionArray[1].count) {
                tieBroken = true
                reactionArray[0] = reactionArray[Math.floor(Math.random() * reactionArray.length)]
            }
            removalIndex = startPlayers.findIndex((ele) => ele.color == reactionArray[0].name);
            startPlayers[removalIndex].alive = false;
            let embedResults = {
                title: 'Fun - Deception',
                color: randomColor ((startPlayers[removalIndex].spy || emojiArray.length <= 3) ? 'white' : 'orange'),
                timestamp: new Date().toISOString(),
                description: 'The player **' + startPlayers[removalIndex].username + '** was ' + (tieBroken ? 'randomly voted off due to indecisive results' : 'voted off') + ', they were ' + (startPlayers[removalIndex].spy ? '' : 'not') + 'the spy. ' + (emojiArray <= 3 ? 'The spy wins due to low amount of innocents left. ' : '') + ((startPlayers[removalIndex].spy || emojiArray.length <= 3) ? 'React to this message to play deception again with another randomly chosen spy.' : ''),
                fields: [
                    {name: 'Players', value: '3-8 players', inline: true},
                    {name: 'Length', value: '8 Minutes', inline: true},
                    {name: 'Options', value: 'None', inline: true}
                ]
            }
            const messageResults = await startMessage.channel.createMessage ({content: playerMentions + ',', embed: embedResults});
            if (startPlayers[removalIndex].spy || emojiArray.length <= 3) {
                if (wager > 0) {
                    startPlayers.forEach (async ele => {
                        let userInfo = await getUserInfo(ele.id, startMessage.channel.guild.id);
                        if (startPlayers[removalIndex].spy && ele.alive) userInfo.money = userInfo.money + wager * ((startPlayers.length / currentPlayers) - 1);
                        else if (!startPlayers[removalIndex].spy && ele.spy) userInfo.money = userInfo.money + wager * (currentPlayers - 1);
                        else userInfo.money = userInfo.money - wager;
                        userInfo.save();
                    })
                }   
                return gameLobby (messageResults, embedResults, 'Deception', playerMentions, 3, 8, deceptionStarter)
            }
            else return deceptionRound (startMessage.channel, startPlayers, wager)
        }, 150000)
    }, 60000)
}

async function chessStarter (startMessage, startPlayers) {
    let board = ['CDEFGEDC', 'BBBBBBBB', 'aAaAaAaA', 'AaAaAaAa', 'aAaAaAaA', 'AaAaAaAa', 'bbbbbbbb', 'cdefgedc'];
    let playerMentions = startPlayers[0].mention + ' ' + startPlayers[1].mention;
    let turn = Math.floor(Math.random() * 2);
    if (turn == 1) startPlayers = [startPlayers[1], startPlayers[0]];
    let embedGame = {
        title: 'Fun - Chess',
        color: randomColor ('blue'),
        timestamp: new Date().toISOString(),
        fields: [
            {name: 'How to Move:', value: 'Use algebraic notation to interact with the chess board through text commands.', inline: false},
            {name: 'Notation Resources:', value: '[FIDE Handbook](https://handbook.fide.com/chapter/E012018)', inline: true},
            {name: '\u200b', value: '[Notation Cheat Sheet](https://cheatography.com/davechild/cheat-sheets/chess-algebraic-notation/)', inline: true},
            {name: '\u200b', value: '[Notation Trainer](https://mattjliu.github.io/Notation-Trainer/#/practice)', inline: true},
            {name: 'Turn:', value: 'It is ' + startPlayers[0].mention + '\'s turn to move. Use `move <notation>` to move.', inline: false},
            {name: 'Chess Board:', value: lettersToChess(board.join('\n')), inline: false},
        ]
    }
    let message = await startMessage.channel.createMessage ({content: playerMentions + ',', embed: embedGame});
    chessRound (message, startPlayers, board, 0)
}

function chessRound (startMessage, startPlayers, chessBoard, playerTurn) {
    playerTurn = playerTurn * -1 + 1;
    const turnOffset = playerTurn * -32;
    let filter = (msg) => msg.content.startsWith('move ') && msg.author.id == startPlayers[playerTurn].id && msg.content.length < 20;
    const collector = new messageCollector (client, startMessage.channel, filter, {time: 60000});
    collector.on ('collect', (msgReceived) => {
        const notation = msgReceived.content.substring(4);
        const notationObject = {};
        const pieceNotation = ['R', 'N', 'B', 'Q', 'K']
        for (let i = notation.length; i < 0; i--) {
            if (!notationObject.y && notation[i].charCodeAt(0) >= 49 && notation[i].charCodeAt(0) <= 56 && notation[i + 1].charCodeAt(0) >= 97 && notation[i + 1].charCodeAt(0) <= 104) {
                notationObject.y = parseFloat(notation[i])-1;
                notationObject.x = notation[i+1].charCodeAt(0)-97;
                let stringIndex = i;
                if (notation[stringIndex] == '=' && pieceNotation.includes(notation[stringIndex + 1]) && !notation[stringIndex + 1] == 'K') {
                    notationObject.promote = notation[stringIndex + 1];
                    stringIndex += 2;
                }
                if (notation[stringIndex] == '#') {
                    notationObject.threat = 'chessmate';
                    stringIndex++;
                }
                else if (notation[stringIndex] == '+') {
                    notationObject.threat = 'check';
                    stringIndex++;
                }
                const annotation = notation.substring(stringIndex, notation.length);
                const annotationList = {'!': 'a good move', '!!': 'a brilliant move', '!?': 'an interesting move', '?!': 'a dubious move', '??': 'a blunder', '?': 'a mistake'};
                if (Object.keys(annotationList).includes(annotation)) notationObject.move = annotationList[annotation]
                else if (!annotation) {
                    notationObject.error = 'suffix'
                    break;
                }
                stringIndex = i - 1;
                if (notation[stringIndex] == 'x') {
                    notationObject.capture = true;
                    stringIndex -= 1;
                }
                if (notation[stringIndex].charCodeAt(0) >= 49 && notation[stringIndex].charCodeAt(0) <= 56) {
                    notationObject.extraY = parseFloat(notation[i])-1;
                    stringIndex -= 1; 
                }
                if (notation[stringIndex].charCodeAt(0) >= 97 && notation[stringIndex].charCodeAt(0) <= 104) {
                    notationObject.extraX = notation[i+1].charCodeAt(0)-97;
                    stringIndex -= 1; 
                }
                if (pieceNotation.includes(notation[stringIndex])) notationObject.piece = notation[stringIndex];
                break;
            }
        }
        if (notationObject.error = 'suffix') return chessErrors ('Invalid Annotation', 'Your move had extra trailing notation marks that weren\'t accepted, you might be confused with: #, +, =R, =N, =B, =Q, !, !!, !?, ?!, ??, ?', startMessage.channel, startPlayers[playerTurn].mention);
        else if (notationObject.piece == '0' && (!notationObject.x || !notationObject.y || !notationObject.piece)) {
            let missingArray = [];
            if (!notationObject.x) missingArray.push ('X Coordinate')
            if (!notationObject.y) missingArray.push ('Y Coordinate')
            if (!notationObject.piece) missingArray.push ('Moving Piece')
            return chessErrors ('Missing values', 'Your notation did not include the following information: ' + missingArray.join(', '), startMessage.channel, startPlayers[playerTurn].mention);
        }
        else if (notation[notationY][notationX].charCodeAt(0) > turnOffset + 97 && notation[notationY][notationX].charCodeAt(0) <= turnOffset + 122) return chessErrors ('Stalling or Overlap', 'The destination square is already occupied by another of your pieces', startMessage.channel, startPlayers[playerTurn].mention);
        let originCoordinates = [];
        switch (notationObject.piece) {
            case 'R': {
                let foundPiece, foundCoordinate;
                for (let i = 0; i < 16; i++) {
                    if (i == 0 || i == 8) foundPiece = foundCoordinate = false;
                    let holdingPiece = i < 8 ? chessBoard[notationY][i] : chessBoard[i-8][notationX];
                    if (!holdingPiece) return;
                    if ((notationX == i && i <= 7) || (notationY == i - 8 && i > 7)) foundCoordinate = true;
                    else if (holdingPiece.charCodeAt(0) == turnOffset + 99) {
                        if (!foundCoordinate && foundPiece) originCoordinates = originCoordinates.slice(0, originCoordinates.length - 2);
                        if (!foundCoordinate || !foundPiece) {
                            originCoordinates.push (i < 8 ? i : notationX , i < 8 ? notationY : i - 8);
                            foundPiece = true;
                        }
                    }
                    else if (holdingPiece.toUpperCase() != 'A' && !foundCoordinate && foundPiece) {
                        originCoordinates = originCoordinates.slice(0, originCoordinates.length - 2);
                        foundPiece = false;
                    }
                }
                break;
            }
            case 'N': {
                const fromYArray = [-2,-1,-2,-1,2,1,2,1];
                const fromXArray = [-1,-2,1,2,-1,-2,1,2];
                for (let i = 0; i < 8; i++) {
                    let holdingPiece = chessBoard[fromYArray[i] + notationY][fromXArray[i] + notationX]
                    if (holdingPiece.charCodeAt(0) == turnOffset + 100) originCoordinates.push (fromXArray[i] + notationY, fromYArray[i] + notationX);
                }
                break;
            }
            case 'B': {
                let foundPiece, foundCoordinate;
                const coordinateOffset = notationX + notationY;
                for (let i = 0; i < 16; i++) {
                    if (i == 0 || i == 8) foundPiece = foundCoordinate = false;
                    let holdingPiece = i < 8 ? chessBoard[coordinateOffset-i][i] : chessBoard[coordinateOffset+i-16][i - 8];
                    if (!holdingPiece) return;
                    if ((notationX == i && i <= 7) || (notationX == i - 8 && i > 7)) return foundCoordinate = true;
                    else if (holdingPiece.charCodeAt(0) == turnOffset + 101) {
                        if (!foundCoordinate && foundPiece) originCoordinates = originCoordinates.slice(0, originCoordinates.length - 2);
                        if (!foundCoordinate || !foundPiece) {
                            originCoordinates.push (i < 8 ? coordinateOffset-i : coordinateOffset+i-16, i % 8);
                            foundPiece = true;
                        }
                    }
                    else if (holdingPiece.toUpperCase() != 'A' && !foundCoordinate && foundPiece) {
                        originCoordinates = originCoordinates.slice(0, originCoordinates.length - 2);
                        foundPiece = false;
                    }
                }
                break;
            }
            case 'Q': {
                let foundPiece, foundCoordinate;
                const coordinateOffset = notationX + notationY;
                for (let i = 0; i < 32; i++) {
                    if (i == 0 || i == 8 || i == 16 || i == 24) foundPiece = foundCoordinate = false;
                    let fromX = i < 8 ? i : notationX;
                    let fromY = i < 16 ? (i < 8 ? notationY : i-8) : (i < 24 ? coordinateOffset-i-16 : coordinateOffset+i-32);
                    let holdingPiece = chessBoard[fromY][fromX];
                    if (!holdingPiece) return;
                    if ((notationX == i && i < 8) || (notationY == i - 8 && i < 16 && i >= 8) || (notationX == i && i < 24 && i >= 16) || (notationX == i && i >= 24)) return foundCoordinate = true;
                    else if (holdingPiece.charCodeAt(0) == turnOffset + 102) {
                        if (!foundCoordinate && foundPiece) originCoordinates = originCoordinates.slice(0, originCoordinates.length - 2);
                        if (!foundCoordinate || !foundPiece) {
                            originCoordinates.push (fromX, fromY);
                            foundPiece = true;
                        }
                    }
                    else if (holdingPiece.toUpperCase() != 'A' && !foundCoordinate && foundPiece) {
                        originCoordinates = originCoordinates.slice(0, originCoordinates.length - 2);
                        foundPiece = false;
                    }
                }
                break;
            }
            case 'K': {
                for (let i = 0; i < 8; i++) {
                    let fromY = Math.round(Math.sin(i*Math.PI/4));
                    let fromX = Math.round(Math.cos(i*Math.PI/4));
                    let holdingPiece = chessBoard[fromY][fromX];
                    if (holdingPiece.charCodeAt(0) == turnOffset + 103) originCoordinates.push (fromX, fromY)
                }
                break;
            }
            case '0': {
                const yOffset = playerTurn * 14;
                let checkStart, checkEnd;
                if (chessBoard[yOffset][4].charCodeAt(0) != turnOffset + 103) return;
                if (notation == '0-0') {
                    if (chessBoard[yOffset][7].charCodeAt(0) == turnOffset + 99) originCoordinates = 'castleL';
                    checkStart = 5;
                    checkEnd = 6;
                }
                else if (notation == '0-0-0') {
                    if (chessBoard[yOffset][0].charCodeAt(0) == turnOffset + 99) originCoordinates = 'castleR';
                    checkStart = 1;
                    checkEnd = 3
                }
                for (let i = checkStart; i < checkEnd + 1; i++) {
                    if (holdingPiece.toUpperCase() != 'A') originCoordinates = [];
                }
                break;
            }
            case 'P': {
                if (notation.length != 2 && (notation.length != 3 || notation[0] != 'x')) return;
                const yOffset = playerTurn * 12 + 1;
                if (notation[0] == 'x') {
                    for (let i = -1; i < 2; i += 2) {
                        if (chessBoard[playerTurn * 2 - 1 + notationY][notationX + i].charCodeAt(0) == turnOffset + 98)
                        originCoordinates.push (notationX + i, playerTurn * 2 - 1 + notationY);
                    }
                }
                else {
                    if (chessBoard[notationY][notationX].toUpperCase() != 'A');
                    else if (chessBoard[playerTurn * 2 - 1 + notationY][notationX].charCodeAt(0) == turnOffset + 98) originCoordinates.push (i, notationY);
                    else if (holdingPiece.toUpperCase() != 'A' && yOffset == playerTurn * 4 - 2 + notationY && chessBoard[playerTurn * 4 - 2 + notationY][notationX].charCodeAt(0) == turnOffset + 98) originCoordinates.push (i, notationY);
                }
                break;
            }
        }
        if (originCoordinates.length > 2) chessErrors ('Rank or File not specified', 'The destination square is already occupied by your piece.', startMessage, startPlayers[playerTurn].mention)
    })
    collector.on ('end', (collected, reason) => {
        if (reason == 'stopped') return;
    })
}

function chessErrors (reasonName, reasonValue, sendMessage, sendMention) {
    sendMessage.delete();
    let embed = {
        title: 'Error - Chess',
        description: 'The requested chess play provided is an illegal move. Consult with an official chess notation website to inscribe the correct notation.',
        color: randomColor ('orange'),
        timestamp: new Date().toISOString(),
        fields: [
            {name: reasonName, value: reasonValue, inline: false}
        ]
    }
    sendMessage.channel.createMessage ({content: sendMention + ',', embed: embed});
}

function lettersToChess (board) {
    let replace = [['a','◻️'],['A','◼️'],['b','🧑🏻‍🌾'],['B','🧑🏿‍🌾'],['c','👮🏻'],['C','👮🏿'],['d','🧑🏻‍✈️'],['D','🧑🏿‍✈️'],['e','🧙🏻'],['E','🧙🏿'],['f','🦸🏻'],['F','🦸🏿'],['g','🤵🏻'],['G','🤵🏿']]
    for (let i = 0; i < replace.length; i++) {
        let regexV = new RegExp(replace[i][0], 'g');
    	board = board.replace(regexV, replace[i][1])
    }
    return board;
}

/*
White space = a
Black space = A
White pawn = b
Black pawn = B
White rook = c
Black rook = C
White knight = d
Black knight = D
White bishop = e
Black bishop = E
White queen = f
Black queen = F
White king = g
Black king = G
*/