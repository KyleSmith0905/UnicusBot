const {randomColor, currencyFormat, timeout} = require ('./functions');
const guildInfoDB = require ('../database/guildinfo.js');

client.on ('ready', async () => {
    let guild = client.guilds.find (ele => true)
    let channel = guild.channels.find (ele => ele.id == process.env.CHANNEL_STATISTICS);
    cron.schedule ('0 0 */6 * * *', async () => {
        let guildInfo = await getGuildInfo (guild);
        let memberCountArray = (!guildInfo.memberCount) ? [] : guildInfo.memberCount;
        memberCountArray.push (guild.memberCount);
        guildInfo.save()
    })
    cron.schedule ('0 0 0 * * *', async () => {
        let weekday = new Date().getDay();
        console.log (weekday);
        switch (weekday) {
            case 0: {
                const startDate = Math.floor((Date.now() - 1123200000) / 1000)
                const endDate = Math.floor(Date.now() / 1000);
                let history; let current; let crypto = false;
                let ticker = ['EURUSD%3DX', 'JPYUSD%3DX', 'GBPUSD%3DX', 'AUDUSD%3DX', 'CADUSD%3DX', 'BTC-USD', 'ETH-USD', 'XRP-USD', 'USDT-USD', 'LTC-USD'] [Math.floor(Math.random() * 10)]
                if (!ticker.endsWith ('%3DX')) crypto = true;
                await fetch ('https://yahoo.finance/quote/' + ticker + '/history?period1=' + startDate + '&period2=' + endDate + '&interval=1d&filter=history&frequency=1d', {method: 'get'})
                .then (res => res.text())
                .then (body => history = JSON.parse(body.split('HistoricalPriceStore":{"prices":')[1].split(',"isPending')[0]));
                history.sort ((a, b) => b.date - a.date);
                await fetch ('https://finance.yahoo.com/quote/' + ticker, {method: 'get'})
                .then (res => res.text())
                .then (body => current = body.split ('"' + ticker.replace('%3DX', '') + '=X":{"sourceInterval"')[1].substring (0, 10000))
                const chart = await currencyGraph (history);
                let embed = {
                    title: 'Statistics - Currency',
                    color: randomColor ('all'),
                    timestamp: new Date().toISOString(),
                    image: {url: 'attachment://image.png'},
                    fields: [
                        {name: ((crypto == true) ? 'Cryptocurrency:' : 'Currency:'), value: current.split ('"shortName":"')[1].split('",')[0].replace('USD', ''), inline: true},
                        {name: 'Exchange:', value: current.split ('"symbol":"')[1].split ('",')[0], inline: true},
                        {name: 'Market:', value: current.split ('"fullExchangeName":"')[1].split ('",')[0], inline: true},
                        {name: 'Rate:', value: currencyFormat (parseFloat(current.split ('"regularMarketPrice":{"raw":')[1].split (',')[0])), inline: true},
                        {name: 'Volume:', value: Math.abs(current.split ('"regularMarketVolume":{"raw":')[1].split (',')[0]).toLocaleString(), inline: true},
                    ]
                }
                if (crypto == true) embed.fields.push ({name: 'Capitalization:', value: currencyFormat (parseFloat(current.split ('"marketCap":{"raw":')[1].split (',')[0])), inline: true})
                else {
                    firstPrice = history.shift();
                    lastPrice = history[9] || history.pop();
                    let difference = ((firstPrice.close - lastPrice.close) / lastPrice.close) * 100;
                    embed.fields.push ({name: 'Change:', value: difference.toFixed(2) + '%', inline: true})
                }
                channel.createMessage ({embed: embed}, {file: chart.toBuffer(), name: 'image.png'})        
            }
            case 1: {
                const startDate = Math.floor((Date.now() - 1296000000) / 1000)
                const endDate = Math.floor(Date.now() / 1000);
                let history; let current; let index = false;
                let ticker = ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'FB', '^DJI', '^GSPC', '^IXIC', '^RUT', '^W5000']
                ticker = ticker[Math.floor(Math.random() * 10)]
                if (ticker.startsWith ('^')) index = true;
                await fetch ('https://yahoo.finance/quote/' + ticker + '/history?period1=' + startDate + '&period2=' + endDate + '&interval=1d&filter=history&frequency=1d', {method: 'get'})
                .then (res => res.text())
                .then (body => history = JSON.parse(body.split('HistoricalPriceStore":{"prices":')[1].split(',"isPending')[0]));
                history.sort ((a, b) => b.date - a.date);
                await fetch ('https://finance.yahoo.com/quote/' + ticker, {method: 'get'})
                .then (res => res.text())
                .then (body => current = body.split ('"' + ticker + '":{"sourceInterval"')[1].substring (0, 10000))
                const chart = await financeGraph (history);
                let embed = {
                    title: 'Statistics - Finance',
                    color: randomColor ('all'),
                    timestamp: new Date().toISOString(),
                    image: {url: 'attachment://image.png'},
                    fields: [
                        {name: ((index == true) ? 'Index:' : 'Company:'), value: current.split ('"shortName":"')[1].split ('",')[0], inline: true},
                        {name: 'Ticker:', value: current.split ('"symbol":"')[1].split ('",')[0], inline: true},
                        {name: 'Market:', value: current.split ('"fullExchangeName":"')[1].split ('",')[0], inline: true},
                        {name: 'Stock:', value: currencyFormat (parseFloat(current.split ('"regularMarketPrice":{"raw":')[1].split (',')[0])), inline: true},
                        {name: 'Volume:', value: Math.abs(current.split ('"regularMarketVolume":{"raw":')[1].split (',')[0]).toLocaleString(), inline: true},
                    ]
                }
                if (index == true) {
                    firstPrice = history.shift();
                    lastPrice = history[9] || history.pop();
                    let difference = ((firstPrice.close - lastPrice.close) / lastPrice.close)*100;
                    embed.fields.push ({name: 'Change:', value: (difference).toFixed(2) + '%', inline: true})
                }
                else {embed.fields.push ({name: 'Capitalization:', value: currencyFormat (parseFloat(current.split ('"marketCap":{"raw":')[1].split (',')[0])), inline: true})}
                channel.createMessage ({embed: embed}, {file: chart.toBuffer(), name: 'image.png'})    
            }
            case 2: {
                let randomValue = Math.floor(Math.random() * 10)
                const pollKey = Object.keys (config.discordInfo.polling) [randomValue]
                const pollQuestions = config.discordInfo.polling [pollKey]
                const pollCapital = pollKey.charAt(0).toUpperCase() + pollKey.slice(1)
                let chart = pollingGraph (pollCapital, 'beginning');
                let embed = {
                    title: 'Statistics - Polling',
                    color: randomColor ('all'),
                    timestamp: new Date().toISOString(),
                    image: {url: 'attachment://image.png'},
                    fields: [
                        {name: 'Topic:', value: pollCapital, inline: true},
                        {name: 'Voters:', value: 'No Voters', inline: true},
                        {name: 'Time:', value: '24 hours', inline: true},
                        {name: 'Question:', value: pollQuestions[0], inline: false}
                    ]
                }
                let pollMessage = await channel.createMessage ({embed: embed}, {file: chart.toBuffer(), name: 'image.png'});
                let validReactions = []
                if (pollQuestions[1] == 'flag') {
                    validReactions = config.discordInfo.emoji.flag;
                    for (let i = 0; i < 20; i++) {
                        pollMessage.addReaction (validReactions[i]);
                    }
                }
                else if (pollQuestions[1] == 'face') {
                    let faceEmoji = config.discordInfo.emoji.face;
                    let number = 92;
                    for (let i = 0; i < 20; i++) {
                        let randomNumber = Math.floor(Math.random() * number);
                        pollMessage.addReaction (faceEmoji [randomNumber]);
                        faceEmoji.splice (randomNumber, 1);
                        validReactions.push (faceEmoji [randomNumber]);
                        number = number - 1;
                    }
                }
                else {
                    for (let i = 1; i < pollQuestions.length; i++) {
                        pollMessage.addReaction (pollQuestions[i]);
                        validReactions.push (pollQuestions[i]);
                    }
                }
                const usersMap = new Map();
                const filter = (mes, emj, usr) => usr != client.user.id && validReactions.includes(emj.name);
                const collector = new reactionCollector (client, pollMessage, filter, {time: 86400000});
                collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
                    sentMessage2nd.removeReaction(emoji.name, userID)
                    usersMap.set(userID, emoji.name);
                })
                let hourLeft = 24;
                let minuteLeft = 0;
                const pollInterval = setInterval(() => {
                    if (!pollMessage) return;
                    if (hourLeft == 0 && minuteLeft == 0) {
                        embed.fields[2].value = 'Completed';
                        clearInterval(pollInterval);
                        const totalEmojis = Array.from(usersMap.values());
                        let emojiArray = [];
                        totalEmojis.forEach (ele => {
                            let object = emojiArray.find(ele2 => ele2.name == ele);
                            if (object) {
                                object.votes++
                                const index = emojiArray.findIndex(ele2 => ele2.name == ele);
                                emojiArray[index] = object
                            }
                            else emojiArray.push ({name: ele, votes: 1})
                        })
                        emojiArray.sort ((a, b) => a.votes - b.votes)
                        const mapSize = usersMap.size;
                        let results = ''
                        for (let i = 0; i < 5; i++) {
                            if (!emojiArray[i]) i = 6
                            else results = results + emojiArray[i].name + ' ' + Math.round((emojiArray[i].votes / mapSize) * 100) + '% '
                        }
                        if (results == '') results = 'Nobody voted'
                        chart = pollingGraph (pollCapital, emojiArray, mapSize);
                        let finishedEmbed = {
                            title: 'Statistics - Polling',
                            color: randomColor ('all'),
                            timestamp: new Date().toISOString(),
                            image: { url: 'attachment://image.png' },
                            fields: [
                                { name: 'Topic:', value: pollCapital, inline: true },
                                { name: 'Voters:', value: ((mapSize == 0) ? 'No voters' : mapSize + ((mapSize == 1) ? ' voter' : ' voters')), inline: true },
                                { name: 'Results:', value: results, inline: true },
                                { name: 'Question:', value: pollQuestions[0], inline: false }
                            ]
                        };
                        channel.createMessage({embed: finishedEmbed}, {file: chart.toBuffer(), name: 'image.png'});
                    }
                    else if (hourLeft > 0 || minuteLeft > 0) {
                        embed.fields[2].value = ((hourLeft > 0) ? hourLeft + ((hourLeft == 1) ? ' hour ' : ' hours ') : '') + ((minuteLeft == 0) ? '' : minuteLeft + ' minutes');
                        if (minuteLeft == 0) {
                            hourLeft = hourLeft - 1;
                            minuteLeft = 60;
                        }
                        minuteLeft = minuteLeft - 15;
                    }
                    else return;
                    mapSize = usersMap.size;
                    embed.fields[1].value = (mapSize == 0) ? 'No voters' : mapSize + ((mapSize == 1) ? ' voter' : ' voters');
                    pollMessage.edit({embed: embed});
                }, 900000)
            }
            case 4: {
                let guildDate = new Date (guild.createdAt)
                const chart = await guildGraph (guild);
                let channelsNumber = 0; let rolesNumber = 0;
                guild.channels.forEach (ele => channelsNumber = channelsNumber + 1)
                guild.roles.forEach (ele => rolesNumber = rolesNumber + 1)
                let embed = {
                    title: 'Statistics - Guild',
                    color: randomColor ('all'),
                    timestamp: new Date().toISOString(),
                    image: {url: 'attachment://image.png'},
                    fields: [
                        {name: 'Guild:', value: guild.name, inline: true},
                        {name: 'Region:', value: guild.region, inline: true},
                        {name: 'Created:', value: guildDate.toLocaleString('en-US'), inline: true},
                        {name: 'Members:', value: guild.memberCount + ' members', inline: true},
                        {name: 'Channels:', value: channelsNumber + ' channels', inline: true},
                        {name: 'Roles:', value: rolesNumber + ' roles', inline: true}
                    ]
                }
                channel.createMessage ({embed: embed}, {file: chart.toBuffer(), name: 'image.png'});
            }
            case 5: {
                let day = 1 + (new Date() - Date.UTC(2000, 0, 1)) / (3600 * 24 * 1000);
                let randomPlanet = Object.keys(config.discordInfo.planets)[Math.floor(Math.random()*Object.keys(config.discordInfo.planets).length)];
                let planetObj = config.discordInfo.planets[randomPlanet];
                let coordinate = planetCoordinates (day, planetObj.N1, planetObj.N2, planetObj.i1, planetObj.i2, planetObj.w1, planetObj.w2, planetObj.a1, planetObj.e1, planetObj.e2, planetObj.M1, planetObj.M2)
                const chart = await astronomyGraph (day, randomPlanet);
                let embed = {
                    title: 'Statistics - Astronomy',
                    color: randomColor ('all'),
                    timestamp: new Date().toISOString(),
                    image: {url: 'attachment://image.png'},
                    fields: [
                        {name: 'Planet:', value: randomPlanet.charAt(0).toUpperCase() + randomPlanet.slice(1), inline: true},
                        {name: 'Rotation:', value: planetObj.rotation.toFixed(1) + ' hours', inline: true},
                        {name: 'Revolution:', value: planetObj.revolution.toFixed(1) + ' days', inline: true},
                        {name: 'Gravity:', value: planetObj.gravity.toFixed(2) + ' g', inline: true},
                        {name: 'Distance:', value: coordinate.d.toFixed(2) + ' AU', inline: true},
                        {name: 'Coordinates:', value: '(' + coordinate.x.toFixed(2) + ', ' + coordinate.y.toFixed(2) + ', ' + coordinate.z.toFixed(2) + ')', inline: true}
                    ]
                }
                channel.createMessage ({embed: embed}, {file: chart.toBuffer(), name: 'image.png'});
            }
            case 6: {
                let newsInfo;
                let leaning;
                await fetch ('https://news.google.com/topstories', {method: 'get'})
                .then (res => res.text())
                .then (body => newsInfo = body.split ('>play_arrow</span><')[1].split ('</time></div><menu class="')[0]);
                let publication = newsInfo.split ('</a><time class="')[0].split ('">').slice(-1)[0];
                try {
                    await fetch ('https://www.allsides.com/news-source/' + publication.toLowerCase().replace('the ', '').replace(' ', '-'), {method: 'get'})
                    .then (res => res.text())
                    .then (body => leaning = body.split ('</a></strong></span>')[0].split ('">').slice (-1)[0]);
                }
                catch {
                    await fetch ('https://www.allsides.com/news-source/' + publication.toLowerCase().replace('the ', '').replace(' ', '-') + '-media-bias', {method: 'get'})
                    .then (res => res.text())
                    .then (body => leaning = body.split ('</a></strong></span>')[0].split ('">').slice (-1)[0]);
                }
                if (leaning.length > 16) leaning = null;
                let chart = await mediaGraph (newsInfo.split ('srcset="')[1].split ('-h100-w100')[0], publication);
                let newsTitle = newsInfo.split ('</a></h3>')[0].split ('" >').slice(-1)[0];
                newsTitle = newsTitle.replace (/&#39;/g, '\'')
                let embed = {
                    title: 'Statistics - News',
                    color: randomColor ('all'),
                    timestamp: new Date().toISOString(),
                    image: {url: 'attachment://image.png'},
                    fields: [
                        {name: 'Publication:', value: publication, inline: true},
                        {name: 'Age:', value: (newsInfo.split ('</time>')[0].split ('">').slice(-1)[0]), inline: true},
                        {name: 'Leaning', value: ((leaning) ? leaning : 'Not available'), inline: true},
                        {name: 'Title:', value: '[' + newsTitle + '](https://news.google.com/articles/' + (newsInfo.split ('<a href="./articles/')[1].split ('?hl=en-US')[0]) + ')', inline: false}
                    ]
                }
                channel.createMessage ({embed: embed}, {file: chart.toBuffer(), name: 'image.png'})
            }
        }
    }, {
        timezone: 'America/New_York'
    })
})

function currencyGraph (prices) {
    let priceHighArray = [];
    let priceLowArray = [];
    prices.forEach ((ele, index) => {if (index <= 9) priceHighArray.push (ele.high)});
    prices.forEach ((ele, index) => {if (index <= 9) priceLowArray.push (ele.low)});
    const maxPrice = Math.max (...priceHighArray);
    const minPrice = Math.min (...priceLowArray);
    const slope = -(200/(maxPrice - minPrice));
    const intercept = (((200 * minPrice) / (maxPrice - minPrice)) + 225);
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(600, -100, 300, 400);
    if (0 >= slope) {
        grd.addColorStop(0, '#002600');
        grd.addColorStop(1, '#003300');
    }
    else {
        grd.addColorStop(0, '#330000');
        grd.addColorStop(1, '#400000');
    }
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
        ctx.moveTo (0, 10 * i)
        ctx.lineTo (900, 10 * i)
    }
    for (let i = 0; i <= 90; i++) {
        ctx.moveTo (10 * i, 0)
        ctx.lineTo (10 * i, 300)
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = (0 >= slope) ? '#004000' : '#4d0000';
    ctx.shadowBlur = 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.stroke ();
    ctx.beginPath();
    ctx.moveTo (0, 250);
    ctx.lineTo (900, 250);
    ctx.moveTo (100, 0);
    ctx.lineTo (100, 300);
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = (0 >= slope) ? '#001a00' : '#260000';
    ctx.shadowBlur = 8;
    ctx.stroke ();
    let fontSize = 20.5;
    do ctx.font = 'bold ' + (fontSize -= 0.5) + 'px Verdana';
    while (ctx.measureText(maxPrice.toFixed(0)).width > 95);
    ctx.fillStyle = (0 >= slope) ? '#001a00' : '#260000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(maxPrice.toFixed(0), 50, 25);
    ctx.fillText(((maxPrice + minPrice) / 2).toFixed(0), 50, 125);
    ctx.fillText(minPrice.toFixed(0), 50, 225);
    ctx.font = 'bold 25px Verdana';
    let dateLocation = 150;
    ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].forEach(ele => {
        ctx.fillText(ele, dateLocation, 275);
        dateLocation = dateLocation + 55;
    })
    let line = 865;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#000000';
    prices.forEach (ele => {
        ctx.fillStyle = (ele.close >= ele.open) ? '#003300' : '#400000';
        ctx.shadowColor = (ele.close >= ele.open) ? '#003300' : '#400000';
        ctx.beginPath();
        ctx.moveTo (line, (ele.high * slope) + intercept);
        ctx.lineTo (line, (ele.low * slope) + intercept);
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(line - 20, (((ele.close >= ele.open) ? ele.open: ele.close) * slope) + intercept, 40, (Math.abs(ele.close - ele.open) * slope))
        ctx.fill();
        ctx.stroke()
        line = line - 55;
    })
    return messageImage;
}

function financeGraph (prices) {
    let priceArray = [];
    prices.forEach ((ele, index) => {if (index <= 9) priceArray.push (ele.close)});
    const maxPrice = Math.max (...priceArray);
    const minPrice = Math.min (...priceArray);
    const slope = -(150/(maxPrice - minPrice));
    const intercept = (((150 * minPrice) / (maxPrice - minPrice)) + 200);
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(300, -100, 600, 400);
    grd.addColorStop(0, '#1a1a1a');
    grd.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.beginPath();
    ctx.moveTo (100, 50);
    ctx.lineTo (900, 50);
    ctx.moveTo (100, 125);
    ctx.lineTo (900, 125);
    ctx.moveTo (100, 200);
    ctx.lineTo (900, 200);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#4a4a4a';
    ctx.stroke ();
    ctx.beginPath();
    ctx.moveTo (0, 250);
    ctx.lineTo (900, 250);
    ctx.moveTo (100, 0);
    ctx.lineTo (100, 300);
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#555555';
    ctx.stroke ();
    let fontSize = 20.5;
    do ctx.font = (fontSize -= 0.5) + 'px Verdana';
    while (ctx.measureText(maxPrice.toFixed(0)).width > 95);
    ctx.fillStyle = '#9c9c9c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(maxPrice.toFixed(0), 50, 50);
    ctx.fillText(((maxPrice + minPrice) / 2).toFixed(0), 50, 125);
    ctx.fillText(minPrice.toFixed(0), 50, 200);
    ctx.font = '25px Verdana';
    let dateLocation = 150;
    ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Mo', 'Tu', 'We', 'Th', 'Fr'].forEach(ele => {
        ctx.fillText(ele, dateLocation, 275);
        dateLocation = dateLocation + 75;
    })
    let line = 825; let preValue = priceArray[0];
    priceArray.shift();
    priceArray.forEach (ele => {
        ctx.beginPath();
        ctx.moveTo (line, (preValue * slope) + intercept);
        ctx.lineTo (line - 75, (ele * slope) + intercept);
        ctx.strokeStyle = (preValue >= ele) ? '#008000' : '#ff3333';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc (line, (preValue * slope) + intercept, 4, 0, 2 * Math.PI);
        ctx.fillStyle = (preValue >= ele) ? '#008000' : '#ff3333';
        ctx.fill();
        line = line - 75;
        preValue = ele;
    })
    ctx.beginPath();
    ctx.arc (line, (priceArray.pop() * slope) + intercept, 4, 0, 2 * Math.PI);
    ctx.fillStyle = (priceArray[7] >= priceArray[8]) ? '#ff3333' : '#008000';
    ctx.fill();
    return messageImage;
}

function astronomyGraph (day, selectedPlanet) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(300, -100, 600, 400);
    grd.addColorStop(0, '#3d0073');
    grd.addColorStop(1, '#030c40');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.shadowColor = '#000000';
    for (let step = 0; step <= 100; step++) {
        ctx.beginPath();
        ctx.globalAlpha = 0.1 + Math.random() * 0.9;
        ctx.arc (Math.random() * 900, Math.random() * 300, 1 + Math.random(), 0, 2 * Math.PI);
        ctx.shadowBlur = Math.random() * 2;
        ctx.fillStyle = '#ffd27d';
        ctx.fill();
    }
    let selPixelX; let selPixelY; let selPixelZ; let selCoordinateY;
    Object.keys(config.discordInfo.planets).forEach (ele => {
        let planetObj = config.discordInfo.planets[ele];
        let currentDay = day;
        for (let step = 1; step <= 7; step++) {
            let coordinate = planetCoordinates (currentDay, planetObj.N1, planetObj.N2, planetObj.i1, planetObj.i2, planetObj.w1, planetObj.w2, planetObj.a1, planetObj.e1, planetObj.e2, planetObj.M1, planetObj.M2, 1.5);
            let pixelX = 450 + ((((Math.abs(coordinate.x) + 1) ** 0.7) - 1) * 18 * Math.sign (coordinate.x));
            let pixelY = 150 + ((((Math.abs(coordinate.y) + 1) ** 0.7) - 1) * 18 * Math.sign (coordinate.y));
            ctx.beginPath();
            ctx.globalAlpha = 1 / step;
            ctx.arc (pixelX, pixelY, 3 + (coordinate.z / 2) + (planetObj.diameter), 0, 2 * Math.PI);
            ctx.fillStyle = '#' + planetObj.color;
            ctx.shadowBlur = 15 + planetObj.diameter;
            ctx.fill();
            currentDay = currentDay - 7;
            if (ele == selectedPlanet && step == 1) {
                selPixelX = pixelX;
                selPixelY = pixelY;
                selPixelZ = coordinate.z;
                selCoordinateY = coordinate.y;
            }
        }
    })
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'hard-light'
    grd = ctx.createRadialGradient(450, 150, 0, 450, 150, 600);
    grd.addColorStop(0.02, 'rgba(253, 184, 19, 1)');
    grd.addColorStop(0.025, 'rgba(253, 184, 19, 0.5)');
    grd.addColorStop(0.4, 'rgba(253, 184, 19, 0.1)');
    grd.addColorStop(1, 'rgba(253, 184, 19, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.beginPath();
    ctx.moveTo (selPixelX, selPixelY);
    ctx.lineTo (selPixelX, selPixelY + (100 * -Math.sign(selCoordinateY)));
    ctx.strokeStyle = '#fff8e7';
    ctx.lineWidth = 3
    ctx.stroke();
    let planetObj = config.discordInfo.planets[selectedPlanet];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '30px Verdana';
    let planetText = selectedPlanet.toUpperCase();
    ctx.fillStyle = '#140f01';
    ctx.globalCompositeOperation = 'saturation';
    ctx.lineWidth = 2;
    ctx.fillRect (selPixelX - 4 - ctx.measureText(planetText).width/2, ((selCoordinateY < 0) ? 0 : -32.5) + selPixelY + (100 * -Math.sign(selCoordinateY)), 8 + ctx.measureText(planetText).width, 32)
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeRect (selPixelX - 4 - ctx.measureText(planetText).width/2, ((selCoordinateY < 0) ? 0 : -32.5) + selPixelY + (100 * -Math.sign(selCoordinateY)), 8 + ctx.measureText(planetText).width, 32)
    ctx.fillStyle = '#ffd97d';
    ctx.fillText(planetText, selPixelX, selPixelY + (((selCoordinateY < 0) ? 0 : -2.5) + 115 * -Math.sign(selCoordinateY)));
    ctx.beginPath();
    ctx.arc (selPixelX, selPixelY, 3 + (selPixelZ / 2) + (planetObj.diameter), 0, 2 * Math.PI);
    ctx.fillStyle = '#' + planetObj.color;
    ctx.fill();
    ctx.stroke();
    return messageImage;
}

function pollingGraph (randomKey, results, totalVotes) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(300, -100, 600, 400);
    grd.addColorStop(0, '#3d0073');
    grd.addColorStop(1, '#030c40');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#8533ff';
    ctx.strokeStyle = '#8533ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i < 18; i++) {
        ctx.moveTo (0, 150 + ((i**1.5) * 2))
        ctx.lineTo (900, 150 + ((i**1.5) * 2))
    }
    for (let i = 0; i < 72; i++) {
        ctx.moveTo (i * (900 / 71), 150)
        ctx.lineTo (-150 + (i * (1200 / 71)), 300)
    }
    ctx.stroke()
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (results == 'beginning') {
        ctx.beginPath();
        let grd = ctx.createLinearGradient(450, 25, 450, 150);
        grd.addColorStop(0, '#ffb531');
        grd.addColorStop(0.5, '#ff8361')
        grd.addColorStop(1, '#fe84ef');
        ctx.fillStyle = grd;
        ctx.strokeStyle = 'rgba(0,0,0,0)';
        ctx.lineWidth = 3;
        ctx.arc (450, 149, 125, 0, Math.PI, true);
        ctx.stroke();
        ctx.fill();
        ctx.beginPath()
        ctx.shadowColor = '#597dd9'
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = 'rgba(0,0,0,0)'
        ctx.lineWidth = 3;
        ctx.font = 'bold 55px Verdana';
        ctx.fillText('GATHERING VOTES...', 450, 220);
        ctx.shadowBlur = 4;
        ctx.strokeText('GATHERING VOTES...', 450, 220);
    }
    else {
        ctx.beginPath();
        ctx.shadowBlur = 0;
        let startAngle = Math.PI / -2;
        results.forEach ((ele, i) => {
            ctx.beginPath();
            grd = ctx.createRadialGradient(450, 150, 0, 450, 150, 125);
            grd.addColorStop(0, 'hsl(' + ((i * 360) / results.length) + ',100%,23%)');
            grd.addColorStop(1,  'hsl(' + ((i * 360) / results.length) + ',100%,27%)');
            ctx.fillStyle = grd;
            ctx.arc (450, 150, 125, startAngle, (Math.PI * 1.5), false);
            ctx.lineTo (450, 150);
            startAngle = startAngle + (Math.PI * 2 * (ele.votes / totalVotes));
            ctx.fill ();
        })
        ctx.beginPath();
        grd = ctx.createLinearGradient(450, 25, 450, 275);
        grd.addColorStop(0, '#bf8624');
        grd.addColorStop(0.5, '#bf6349');
        grd.addColorStop(1, '#bf63b5');
        ctx.arc (450, 150, 125, 0, 2 * Math.PI);
        ctx.lineWidth = 3;
        ctx.shadowBlur = 5;
        ctx.shadowColor = grd;
        ctx.strokeStyle = grd;
        if (results.length == 0) {
            ctx.fillStyle = grd;
            ctx.fill();
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.shadowBlur = 8;
        for (let i = 0; i < 32; i++) {
            ctx.moveTo(450, 150);
            ctx.lineTo((Math.cos(i * 2.8125 * Math.PI) * 124) + 450, (Math.sin(i * 2.8125 * Math.PI) * 124) + 150);
        }
        ctx.stroke();
    }
    ctx.beginPath();
    grd = ctx.createLinearGradient(450, ((results == 'beginning') ? 25 : 15), 450, ((results == 'beginning') ? 140 : 80));
    grd.addColorStop(0, '#cfcfcd');
    grd.addColorStop(0.499, '#a0a0a0');
    grd.addColorStop(0.501, '#000000');
    grd.addColorStop(1, '#9b939d');
    ctx.strokeStyle = '#ffffff'
    ctx.shadowBlur = 6;
    ctx.font = 'bold ' + ((results == 'beginning') ? '90' : '75') + 'px sans-serif';
    ctx.lineWidth = ((results == 'beginning') ? 3 : 2.5);
    const textLocation = (results == 'beginning') ? 80 : 45;
    ctx.shadowOffsetY = -2
    ctx.shadowOffsetX = 5
    ctx.shadowColor = '#9136b3';
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.fillText(randomKey.toUpperCase(), 450, textLocation);
    ctx.shadowOffsetY = 2
    ctx.shadowOffsetX = -5
    ctx.shadowColor = '#368bb3';
    ctx.fillStyle = grd;
    ctx.fillText(randomKey.toUpperCase(), 450, textLocation)
    ctx.shadowColor = 'rgba(0,0,0,0)'
    ctx.strokeText(randomKey.toUpperCase(), 450, textLocation);
    return messageImage;
}

async function guildGraph (guild) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    const messageImage2 = canvas.createCanvas(900, 300);
    const ctx2 = messageImage2.getContext('2d');
    let grd = ctx.createLinearGradient(300, -100, 600, 400);
    grd.addColorStop(0, '#636363');
    grd.addColorStop(1, '#ffffff');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.beginPath ();
    let grd2 = ctx.createLinearGradient(300, -100, 600, 400);
    grd2.addColorStop(0, '#ffffff');
    grd2.addColorStop(1, '#636363');
    ctx.strokeStyle = grd2;
    ctx.lineWidth = 2.5;
    let gridArray = [0, 49, 51, 100, 149, 151, 200, 249, 251, 300]
    gridArray.forEach (ele => {
        ctx.moveTo (100, ele);
        ctx.lineTo (800, ele);
    })
    ctx.stroke ()
    const guildInfo = await getGuildInfo (guild);
    let memberArray = (guildInfo.memberCount) ? guildInfo.memberCount : [];
    memberArray.push (guild.memberCount);
    memberArray.reverse ();
    ctx2.globalCompositeOperation = 'difference';
    let differenceArray = [];
    memberArray.forEach ((ele, index) => {if (index >= 1) differenceArray.push (memberArray[index - 1] - ele)})
    let arrayMemberStats = [differenceArray, memberArray]
    arrayMemberStats.forEach ((ele, index) => {
        let max = Math.max (...ele);
        let min = Math.min (...ele);
        let slope = -(200/(max - min));
        let intercept = (((200 * min) / (max - min)) + 250);
        ctx2.lineWidth = 3.5;
        let lineLength = 700/(ele.length - 1);
        let line = 800;
        ctx2.beginPath();
        ctx2.moveTo (800, (ele[0] * slope) + intercept);
        let lastArrays = ele.slice(1);
        lastArrays.forEach (lastArrays => {
            line = line - lineLength;
            ctx2.lineTo (line, (lastArrays * slope) + intercept);
        })
        ctx2.strokeStyle = (index == 0) ? 'rgba(0, 0, 255, 1)' : 'rgba(255, 0, 0, 1)';
        ctx2.fillStyle = (index == 0) ? 'rgba(0, 0, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)';
        ctx2.stroke ();
        let baseLine = (index == 0) ? -50 : 350
        ctx2.lineTo (100, baseLine);
        ctx2.lineTo (800, baseLine);
        ctx2.fill ();
    
    })
    ctx.drawImage (messageImage2, 0, 0);
    let maxMembers = Math.max (...memberArray);
    let minMembers = Math.min (...memberArray);
    let maxMembersDif = Math.max (...differenceArray)
    let minMembersDif = Math.min (...differenceArray)
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ff0000';
    let r1 = 55; let b1 = 0; let g1 = 0; let r2 = 155; let b2 = 25; let g2 = 25;
    let arrayNumbers = [0, 100, 800, 900]
    arrayNumbers.forEach (ele => {
        ctx.beginPath ();
        if (ele == 800) {
            ctx.strokeStyle = '#0000ff';
            r1 = 50; b1 = 155; g1 = 50; r2 = 75; b2 = 255; g2 = 75;
        }
        ctx.moveTo (ele, 0);
        ctx.lineTo (ele, 300);
        ctx.stroke();
        if (ele == 100 || ele == 900) return;
        let arrayNumbers2 = [300, 200, 100, 0]
        arrayNumbers2.forEach (ele2 => {
            if (ele2 != 300) {
                ctx.beginPath ();
                ctx.moveTo (ele, ele2);
                ctx.lineTo (ele + 100, ele2);
                ctx.lineTo (ele + 100, ele2 + 100);
                ctx.lineTo (ele, ele2 + 100);
                let grd3 = (ele == 0) ? ctx.createLinearGradient (ele + 97, ele2 + 3, ele + 3, ele2 + 97) : ctx.createLinearGradient (ele + 3, ele2 + 97, ele + 97, ele2 + 3);
                grd3.addColorStop (0, 'rgb('+r1+', '+g1+', '+b1+')');
                grd3.addColorStop (1, 'rgb('+r2+', '+g2+', '+b2+')');
                ctx.fillStyle = grd3
                ctx.fill();
                if (ele == 0) {r1 = r1 + 50; r2 = r2 + 50; b1 = b1 + 25; b2 = b2 + 25; g1 = g1 + 25; g2 = g2 + 25}
                else {b1 = b1 - 50; b2 = b2 - 50; r1 = r1 - 25; r2 = r2 - 25; g1 = g1 - 25; g2 = g2 - 25}
            };
            ctx.beginPath ();
            ctx.moveTo (ele, ele2);
            ctx.lineTo (ele + 100, ele2);
            ctx.stroke ()
        })
    })
    let fontSize = 25.5;
    do ctx.font = fontSize -= 0.5 + 'px Verdana'
    while (ctx.measureText(maxMembers).width > 85);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(maxMembers.toFixed(0), 50, 50);
    ctx.fillText(((maxMembers + minMembers) / 2).toFixed(0), 50, 150);
    ctx.fillText(minMembers.toFixed(0), 50, 250);
    let averageMembersDif = ((maxMembersDif + minMembersDif) / 2);
    ctx.fillText(((maxMembersDif > 0) ? '+' : '') + maxMembersDif.toFixed(0), 850, 50);
    ctx.fillText(((averageMembersDif > 0) ? '+' : '') + averageMembersDif.toFixed(0), 850, 150);
    ctx.fillText(((minMembersDif > 0) ? '+' : '') + minMembersDif.toFixed(0), 850, 250);
    ctx.shadowBlur = 15;
    ctx.font = '30px Verdana';
    ctx.fillStyle = 'rgba(128, 0, 0, 0.8)';
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillText ('Member Count Overall', 290, 275)
    ctx.fillStyle = 'rgba(0, 0, 128, 0.8)';
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillText ('Member Count Change', 610, 25)
    ctx.font = '20px Verdana';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillText ('(1 Week Graph)', 705, 275)
    guildInfo.memberArray = [];
    guildInfo.save();
    return messageImage;
}

async function mediaGraph (imageLink, publication) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createRadialGradient(750, 150, 50, 750, 150, 750);
    grd.addColorStop(0, '#ffc414');
    grd.addColorStop(1, '#d68b00');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.beginPath();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 3;
    ctx.strokestyle = '#291a00'
    for (i = 0; i < 51; i++) {
        ctx.moveTo (0, i * 6);
        ctx.lineTo (900, i * 6)
    }
    ctx.stroke()
    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#593e00';
    ctx.shadowColor = '#593e00';
    ctx.shadowBlur = 5;
    ctx.moveTo(625, 15);
    ctx.arcTo(885, 15, 885, 285, 10);
    ctx.arcTo(885, 285, 615, 285, 10);
    ctx.arcTo(615, 285, 615, 15, 10);
    ctx.arcTo(615, 15, 885, 15, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#291a00'
    let fontSize = 153;
    do ctx.font = 'bold ' + (fontSize -= 3) + 'px Verdana';
    while (ctx.measureText(publication).width > 600);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(publication, 300, 150);
    ctx.beginPath();
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.moveTo(635, 25);
    ctx.arcTo(875, 25, 875, 275, 10);
    ctx.arcTo(875, 275, 625, 275, 10);
    ctx.arcTo(625, 275, 625, 25, 10);
    ctx.arcTo(625, 25, 875, 25, 10);
    ctx.clip()
    const avatar = await canvas.loadImage (imageLink);
    ctx.drawImage (avatar, 625, 25, 250, 250);
    return messageImage;
}

function planetCoordinates (d, N1, N2, i1, i2, w1, w2, a1, e1, e2, M1, M2, extend) {
    if (N1 == 'earth') {
        d = d - 1.5;
        let Time = d / 36525.0;
        let anomaly = 357.52910 + (35999.05030 * Time) - (0.0001559 * Time * Time) - (0.00000048 * Time * Time * Time);
        let center = (1.914600 - 0.004817 * Time - 0.000014 * Time * Time) * Math.sin ((Math.PI / 180) * anomaly) + (0.01993 - 0.000101 * Time) * Math.sin ((Math.PI / 180) * 2 * anomaly) + 0.000290 * Math.sin ((Math.PI / 180) * 3 * anomaly);
        let ecliptical = (280.46645 + (36000.76983 * Time) + (0.0003032 * Time * Time)) + center;
        let eccentricity = 0.016708617 - Time * (0.000042037 + (0.0000001236 * Time));
        let distanceInAU = (1.000001018 * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos((Math.PI / 180) * anomaly + center));
        if (extend) distanceInAU = distanceInAU + extend;
        let coordinateX = -distanceInAU * Math.cos ((Math.PI / 180) * ecliptical);
        let coordinateY = -distanceInAU * Math.sin ((Math.PI / 180) * ecliptical);
        let coordinateZ = 0;
        return {x: coordinateX, y: coordinateY, z: coordinateZ, d: distanceInAU}
    }
    let longitude = N1 + (N2 * d);
    let inclination = i1 + (i2 * d);
    let perihelion = w1 + (w2 * d);
    let distance = a1;
    let eccentricity = e1 + (e2 * d);
    let anomaly = M1 + (M2 * d);
    let eccentricA = anomaly + (eccentricity  * (180/Math.PI)) * Math.sin((Math.PI / 180) * anomaly) * ( 1 + eccentricity  * Math.cos((Math.PI / 180) * anomaly) )
    let distanceX = distance * (Math.cos((Math.PI / 180) * eccentricA) - eccentricity);
    let distanceY = distance * (Math.sqrt(1 - (eccentricity  * eccentricity)) * Math.sin((Math.PI / 180) * eccentricA));
    let trueAnomaly = Math.atan2(distanceY, distanceX) * (180 / Math.PI);
    let radius = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY));
    if (extend) radius = radius + extend;
    let coordinateX = radius * ((Math.cos((Math.PI / 180) * longitude) * Math.cos((Math.PI / 180) * (trueAnomaly + perihelion))) - (Math.sin((Math.PI / 180) * longitude) * Math.sin((Math.PI / 180) * (trueAnomaly + perihelion)) * Math.cos((Math.PI / 180) * inclination)))
    let coordinateY = radius * ((Math.sin((Math.PI / 180) * longitude) * Math.cos((Math.PI / 180) * (trueAnomaly + perihelion))) + (Math.cos((Math.PI / 180) * longitude) * Math.sin((Math.PI / 180) * (trueAnomaly + perihelion)) * Math.cos((Math.PI / 180) * inclination)))
    let coordinateZ = radius * (Math.sin((Math.PI / 180) * (trueAnomaly + perihelion)) * Math.sin((Math.PI / 180) * inclination));
    return {x: coordinateX, y: coordinateY, z: coordinateZ, d: radius}
}

async function getGuildInfo (guild) {
    let guildInfo = await guildInfoDB.findOne ({
        guildID: guild.id
    })
    if (!guildInfo) {
        const newGuildInfo = await new guildInfoDB ({
            guildID: guild.id,
            memberCount: [guild.memberCount]
        });
        newGuildInfo.save();
        guildInfo = newGuildInfo
    }
    return guildInfo;
}