const travelConfig = config.commands.travel;
const placesConfig = config.places;
const methodConfig = travelConfig.arguments.method.inputs;
const {randomColor} = require ('./functions');
const userInfoDB = require ('../database/userinfo.js');
const stateInfoDB = require ('../database/stateinfo.js');

module.exports = {
    name: 'travel',
    summoner: travelConfig.alias,
    async execute (message, args) {
        const guild = message.channel.guild;
        const member = message.member;
        const method = Object.keys(methodConfig).find (key => methodConfig[key].alias.includes (args[1]))
        let end = Object.keys (placesConfig).find (key => placesConfig[key].alias.includes (args.slice(2).join('')));
        const userInfo = await getUserInfo (member, guild);
        if (userInfo.money == null) userInfo.money = 0;
        const start = userInfo.state;
        if (end && placesConfig[end].state == false) end = notLocation (end, method, start);
        if (userInfo.arrival && userInfo.arrival.timestamp >= Date.now()) return endTravelPrompt (userInfo, message, method, guild, member, start)
        errors = (method == null) ? ['method'] : []
        if (end == null) errors.push ('location')
        if (errors.length) return errorLog (message, args, 'Travel', 'invalidUsage', errors);
        const distance = calDistance (start, end);
        if (distance > methodConfig[method].distance) return errorLog (message, args, 'Travel', 'movement', [start, end, await forEachTwice (method, start), await forEachTwice (method, end)])
        const startArray = Object.keys (methodConfig[method].connections).filter (con => methodConfig[method].connections[con].includes (start));
        const endArray = Object.keys (methodConfig[method].connections).filter (con => methodConfig[method].connections[con].includes (end));
        const intersectGroups = startArray.filter (ele => endArray.includes (ele));
        if (!intersectGroups.length || start == end) {
            return errorLog (message, args, 'travel', 'movement', [start, end, await forEachTwice (method, start), await forEachTwice (method, end)])
        }
        const waitingTime = calTime (distance, method, userInfo);
        const cost = calCost (distance, method, userInfo)
        if (cost.toFixed(0) > userInfo.money.toFixed(0)) return errorLog (message, args, 'Travel', 'money', ['Travel', cost, userInfo.money])
        let sendChannel = (methodConfig[method].channel !== message.channel.id) ? guild.channels.find (ele => ele.id == methodConfig[method].channel) : message.channel
        let mapImage = await getMap ('./images/worldMap.png', start, end);
        let embed = {
            title: `Travel - ${methodConfig[method].name}`,
            color: randomColor ('white'),
            timestamp: new Date().toISOString(),
            image: {url: 'attachment://image.png'},
            fields: [
                {name: 'Travel:', value: member.mention + ' ' + randomResponse (method, 'leavings') + ' ' + placesConfig[start].name + ' ' + randomResponse (method, 'leavingEmojis') + ' *' + randomResponse (method, 'sounds') + '*, it will take ' + waitingTime.toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' minutes to ' + randomResponse (method, 'come') + ' ' + placesConfig[end].name + ' ' + randomResponse (method, 'comingEmojis'), inline: false},
                {name: 'Username:', value: member.nick || member.username, inline: true},
                {name: 'Departure:', value: placesConfig[start].name, inline: true},
                {name: 'Arrival:', value: placesConfig[end].name, inline: true},
                {name: 'Distance', value: distance.toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' miles', inline: true},
                {name: 'Time:', value: waitingTime.toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' minutes', inline: true},
                {name: 'Cost', value: '$' + cost.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','), inline: true}
            ]
        }
        let travelMessage = await sendChannel.createMessage ({content: member.mention + ',', embed: embed}, {file: mapImage.toBuffer(), name: 'image.png'})
        let fromState = guild.roles.filter (ele => member.roles.includes (ele.id) && Object.keys(placesConfig).find (ele2 => ele.name == placesConfig[ele2].name));
        let travelRole = guild.roles.find (ele => ele.id == process.env.ROLE_TRAVELING)
        fromState.forEach (ele => {
            member.removeRole (ele.id, 'Automated');
        });
        member.addRole (travelRole.id, 'Automated');
        setUserInfo (userInfo, {arrival: {from: start, timestamp: Date.now() + (waitingTime * 60000), cost: cost}, state: end, money: (userInfo.money || 0) - cost});
        setTimeout (async function () {
            let userInfo2 = await getUserInfo (member, guild)
            if (userInfo2.state != end || !(Date.now() - 5000 < userInfo.arrival.timestamp < Date.now() + 5000)) return
            const toState = guild.roles.find (ele => ele.name == placesConfig[end].name);
            member.removeRole (travelRole.id, 'automated');
            member.addRole (toState.id, 'Automated');
            embed.color = randomColor ('blue');
            embed.fields[0].value = member.mention + ' ' + randomResponse(method, 'comings') + ' ' + placesConfig[end].name + ' ' + randomResponse (method, 'comingEmojis') + ' *' + randomResponse (method, 'sounds') + '*, it took **' + waitingTime.toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'minutes** to ' + randomResponse (method, 'leave') + ' ' + placesConfig[start].name + ' ' + randomResponse (method, 'comingEmojis') + '.' 
            travelMessage.edit ({embed: embed});
            let stateInfo = await getStateInfo (guild, end)
            if (stateInfo.welcomeMessage) {
                let governor = guild.members.find (ele => ele.id == stateInfo.governorID)
                embed = {
                    title: 'Travel - Arrival',
                    description: stateInfo.welcomeMessage,
                    timestamp: new Date().toISOString(),
                    fields: [
                        {name: 'State:', value: placesConfig[end].name, inline: true},
                        {name: 'From:', value: placesConfig[start].name, inline: true},
                        {name: 'Governor:', value: governor.mention, inline: true}
                    ]
                }
            }
        }, waitingTime * 60000);
    }
}

async function getUserInfo (member, guild) {
    let userInfo = await userInfoDB.findOne ({
        userID: member.id,
        guildID: guild.id
    })
    if (userInfo && !userInfo.state){
        userInfo.state = ''
    }
    else if (!userInfo) {
        const newUserInfo = await new userInfoDB ({
            userID: member.id,
            guildID: guild.id,
            money: 0,
            state: 'ny'
        });
        newUserInfo.save();
        userInfo = newUserInfo
    }
    return userInfo;
}

async function getStateInfo (guild, state) {
    let stateInfo = await stateInfoDB.findOne ({
        guildID: guild.id,
        postalCode: state
    })
    if (!stateInfo) {
        const newStateInfo = await new stateInfoDB ({
            guildID: guild.id,
            postalCode: state
        });
        newStateInfo.save();
        stateInfo = newStateInfo
    }
    return stateInfo;
}

function setUserInfo (userInfo, field) {
    userInfo.set (field)
    return userInfo.save ();
}

async function forEachTwice (method, state) {
    let name = Object.keys (methodConfig[method].connections).filter (con => methodConfig[method].connections[con].includes (state));
    let array = [];
    name.forEach (grp => methodConfig[method].connections[grp].forEach (ele => array.push (ele.toUpperCase())))
    array = array.sort().filter(ele => ele.toLowerCase() != state);
    array = array.filter (ele => methodConfig[method].distance > calDistance (state, ele.toLowerCase()));
    array = array.filter((ele, index) => array.indexOf(ele) == index);
    if (!array.length) array = 'You can\'t travel anywhere from ' + placesConfig[state].name + ', try another method of transport.'; 
    return array;
}

function randomResponse (key, response) {
    if (key == 'random') key = Object.keys(methodConfig) [Math.floor(Math.random() * Object.keys(methodConfig).length)];
    let stateObject = methodConfig[key];
    if (typeof stateObject[response] == 'string') return stateObject[response]
    return stateObject[response] [Math.floor(Math.random() * stateObject[response].length)];
}

function calDistance (start, end) {
    var radlat1 = Math.PI * placesConfig[start].y/180;
    var radlat2 = Math.PI * placesConfig[end].y/180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(Math.PI * (placesConfig[start].x - placesConfig[end].x)/180);
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    return dist * 60 * 1.1515;
}

function calTime (distance, method, userInfo) {
    let time;
    if (userInfo.items && userInfo.items.includes(methodConfig[method].privateTransport)) time = (methodConfig[method].constantSpeed * distance / 550) + (methodConfig[method].initialSpeed * 0.7);
    else time = (methodConfig[method].constantSpeed * distance / 500) + methodConfig[method].initialSpeed;
    return time;
}

function calCost (distance, method, userInfo) {
    let cost;
    if (userInfo.items && userInfo.items.includes(methodConfig[method].privateTransport)) cost = (methodConfig[method].constantCost * distance / 600) + (methodConfig[method].initialCost * 0.4);
    else cost = (methodConfig[method].constantCost * distance / 500) + methodConfig[method].initialCost;
    return cost;
}

function notLocation (end, method, start) {
    if (end == 'rn') {
        const startArray = Object.keys (methodConfig[method].connections).filter (con => methodConfig[method].connections[con].includes (start));
        let array = [];
        startArray.forEach (grp => methodConfig[method].connections[grp].forEach (ele => array.push (ele)))
        array = array.sort().filter(ele => ele !== start);
        array = array.filter((ele, index) => array.indexOf(ele) == index);
        let randomState = array [Math.floor(Math.random() * array.length)];
        return randomState;
    }
}

async function getMap (map, start, end) {
    let startX = placesConfig[start].x; let startY = placesConfig[start].y;
    let endX = placesConfig[end].x; let endY = placesConfig[end].y;
    let centerX = (((startX + endX) / 2) * 8.2) + 1400;
    let centerY = (((((startY + endY) / -2) ** 2) * -0.134) + 900);
    let leftSide = Math.abs((((startX < endX) ? startX : endX) * 8.2) + 1400);
    let upSide = Math.abs(((((startY > endY) ? startY : endY) ** 2) * -0.134) + 900);
    let largerSide = ((centerX - leftSide) / 3 > centerY - upSide) ? 'hori' : 'vert';
    let width = (largerSide == 'hori') ? (centerX - leftSide) : (centerY - upSide) * 3;
    let height = (largerSide == 'vert') ? (centerY - upSide) : (centerX - leftSide) / 3;
    let xSide = (largerSide == 'hori') ? leftSide : leftSide - (width / 1.333);
    let ySide = (largerSide == 'vert') ? upSide : upSide - (height / 1.333);
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    const lineImage = canvas.createCanvas(3000, 1686);
    const ctx2 = lineImage.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 900, 300);
    const mapLoaded = await canvas.loadImage (map);
    ctx2.drawImage (mapLoaded, 0, 0);
    ctx2.moveTo(((startX * 8.2) + 1400), (((startY) ** 2) * -0.134) + 900);
    ctx2.lineTo(((endX * 8.2) + 1400), (((endY) ** 2) * -0.134) + 900);
    ctx2.lineWidth = 4;
    ctx2.shadowBlur = 4;
    ctx2.shadowColor = 'red';
    ctx2.strokeStyle = 'red';
    ctx2.stroke();
    ctx2.beginPath();
    ctx2.arc(((startX * 8.2) + 1400), (((startY) ** 2) * -0.134) + 900, 5, 0, 2 * Math.PI);
    ctx2.arc(((endX * 8.2) + 1400), (((endY) ** 2) * -0.134) + 900, 5, 0, 2 * Math.PI);
    ctx2.fillStyle = 'red';
    ctx2.fill();
    ctx2.beginPath();
    ctx2.arc(centerX * 3, centerY * 3, 7, 0, 2 * Math.PI)
    ctx2.fill();
    ctx.drawImage (lineImage, (xSide) - 75, (ySide) - 25, ((width) * 2) + 150, ((height) * 2) + 50, 0, 0, 900, 300);
    return messageImage;
}

async function endTravelPrompt (userInfo, message, method, guild, member, destination) {
    embed = {
        title: 'Travel - In Progress',
        color: randomColor ('white'),
        timestamp: new Date().toISOString(),
        fields: [
            {name: 'Travel', value: 'You are currently traveling to ' + placesConfig[destination].name + ', **' + ((userInfo.arrival.timestamp - Date.now()) / 60000).toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' minutes** till you arrive.'},
            {name: 'Prompt', value: 'If you would like to instantly travel back to ' + placesConfig[userInfo.arrival.from].name + ', click on the 👎 emoji.'}
        ]
    }
    let sendChannel = (method && methodConfig[method].channel !== message.channel.id) ? guild.channels.find (ele => ele.id == methodConfig[method].channel) : message.channel
    let sentMessage = await sendChannel.createMessage ({content: `${member.mention},`, embed: embed})
    sentMessage.addReaction ('👎')
    let filter = (mes, emj, usr) => (emj.name == '👎') && usr == member.id;
    let collector = new reactionCollector (client, sentMessage, filter, {time: 60000});
    collector.on('collect', async (Message2nd, emoji, userID) => {
        const userInfo2 = await getUserInfo (member, guild);
        if (userInfo2.arrival && userInfo2.arrival.timestamp <= Date.now()) return;
        setUserInfo (userInfo2, {arrival: {from: null, timestamp: null, cost: null}, state: userInfo.arrival.from, money: userInfo2.money + userInfo.arrival.cost});
        embed.fields = [{name: 'Travel', value:' You\'re back at ' + placesConfig[userInfo.arrival.from].name + ', you were going to ' + placesConfig[destination].name + '.'}];
        embed.color = randomColor ('blue');
        let toRole = guild.roles.find (ele => ele.name == placesConfig[userInfo2.state].name);
        let travelRole = guild.roles.find (ele => ele.id == process.env.ROLE_TRAVELING)
        member.addRole (toRole.id, 'Automated');
        member.removeRole (travelRole.id, 'Automated');
        sentMessage.edit ({embed: embed});
        collector.stop ('approved');
    })
    collector.on('end', async (collected, reason) => {
        if (reason == 'approved') return;
        embed.fields = [{name: 'Travel', value: 'You are still heading towards ' + placesConfig[destination].name + ', the cancellation request had failed.'}];
        embed.color = randomColor ('orange');
        sentMessage.edit ({embed: embed});
    })
}