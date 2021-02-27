const jobConfig = config.commands.job;
const commandConfig = jobConfig.arguments.command.inputs;
const {randomColor, getUserInfo} = require ('./functions');
const userInfoDB = require ('../database/userinfo.js');
const workInfoDB = require ('../database/workinfo.js');
const companyInfoDB = require ('../database/companyinfo.js');

module.exports = {
    name: 'job',
    summoner: jobConfig.alias,
    async execute (message, args) {
        let member = message.member;
        let guild = message.channel.guild;
        guild.id = '800012084787544124';
        let userInfo = await getUserInfo (member, guild);
        if (commandConfig.wrk.includes (args[1])) {
            if (args[2]) return errorLog (message, args, 'job', 'invalidUsage', ['command']);
            let workInfo;
            if (userInfo.occupation.unused <= 0 && userInfo.occupation.refresh >= Date.now) return errorLog (message, args, 'Job', 'cooldown', [Date.now() - userInfo.occupation.refresh])
            if (userInfo.occupation && userInfo.occupation.name) workInfo = await getWorkInfo (userInfo.occupation.ticker, userInfo.occupation.name, guild.id);
            if (!workInfo) return errorLog (message, args, 'Job', 'employment', []);
            let embed = {
                title: 'Job - Work',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                image: {url: 'attachment://image.png'},
                fields: [
                    {name: 'Company', value: workInfo.ticker, inline: true},
                    {name: 'Occupation', value: workInfo.name, inline: true},
                    {name: 'Operations', value: workInfo.work.charAt(0).toUpperCase() + workInfo.work.slice(1), inline: true}
                ]
            };
            let attachment;
            workInfo.work = 'inspect'
            if (workInfo.work == 'math') {
                const mathSigns = ['*', '/', '+', '-'];
                let equation = mathSigns [Math.floor(Math.random() * 4)]
                let numberOne; let numberTwo; let answer;
                switch (equation) {
                    case '+':
                        numberOne = Math.floor(Math.random() * 500000) / 10;
                        numberTwo = Math.floor(Math.random() * 500000) / 10;
                        answer = numberOne + numberTwo;
                        break;
                    case '-':
                        numberOne = Math.floor(Math.random() * 100000) / 10;
                        numberTwo = Math.floor(Math.random() * numberOne * 10) / 10;
                        answer = numberOne - numberTwo;
                        break;
                    case '*':
                        numberOne = Math.floor(Math.random() * 100000) / 100;
                        numberTwo = Math.floor(Math.random() * 9) + 1;
                        answer = numberOne * numberTwo;
                        break;
                    case '/':
                        numberTwo = Math.floor(Math.random() * 10) + 2;
                        numberOne = Math.floor(Math.random() * 100000);
                        answer = numberOne / numberTwo;
                        break;
                }
                try {
                    attachment = mathImage (numberOne, numberTwo, equation);
                    embed.image = {url: 'attachment://image.png'};
                }
                catch {
                    embed.description = 'Solve the following equation: `' + numberOne.toFixed(2) + '` ( ' + equation + ' ) `' + numberTwo.toFixed(2) + '`';
                }
                embed.fields.push ({name: 'Format', value: 'The answer is a number rounded to two decimal places, `65432.10`'})
                let sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed}, ((attachment) ? {file: attachment.toBuffer(), name: 'image.png'} : null));
                return answerCollector (member, userInfo, workInfo, sentMessage, embed, answer.toFixed(2), 5.95);
            }
            else if (workInfo.work == 'speed') {
                const letters = 'abcdefghiklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXTZ';
                let randomString = '';
                for (let i = 0; i < 8; i++) {
                    let random = Math.floor(Math.random() * 52);
                    randomString += letters.substring(random,random + 1);
                }
                try {
                    attachment = speedImage (randomString);
                    embed.image = {url: 'attachment://image.png'};
                }
                catch {
                    embed.description = 'Type the bolded letters: `' + randomString.charAt(0) + '`|`' + randomString.charAt(1) + '`|`' + randomString.charAt(2) + '`|`' + randomString.charAt(3) + '`|`' + randomString.charAt(4) + '`|`' + randomString.charAt(5) + '`|`' + randomString.charAt(6) + '`|`' + randomString.charAt(7) + '`';
                }
                embed.fields.push ({name: 'Format', value: 'The answer is a sequence of mixed case letters, `AbCdEfGh`'})
                let sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed}, ((attachment) ? {file: attachment.toBuffer(), name: 'image.png'} : null));
                return answerCollector (member, userInfo, workInfo, sentMessage, embed, randomString, 3.22);
            }
            else if (workInfo.work == 'precision') {
                let randomX = Math.floor(Math.random() * 23) + 1;
                let randomY = Math.floor(Math.random() * 23) + 1;
                try {
                    attachment = precisionImage (randomX, randomY);
                    embed.image = {url: 'attachment://image.png'};
                }
                catch {
                    let transformX = Math.floor(Math.random() * 4);
                    let transformY = Math.floor(Math.random() * 4);
                    if (randomX - transformX <= 0) transfromX = 0;
                    else if (randomX - transformX + 3 >= 25) transfromX = 25 - randomX;
                    if (randomY - transformY <= 0) transfromY = 0;
                    else if (randomY - transformY + 3 >= 25) transfromY = 25 - randomY;
                    embed.description = 'Pick a number between: (`' + (randomX - transformX) + ' - ' + (randomX - transformX + 3) + '`,`' + (randomY - transformY) +  ' - ' + (randomY - transformY + 3) + '`)';
                }
                embed.fields.push ({name: 'Format', value: 'The answer is an X and Y coordinate point, `(01,24)`'})
                let sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed}, ((attachment) ? {file: attachment.toBuffer(), name: 'image.png'} : null));
                return answerCollector (member, userInfo, workInfo, sentMessage, embed, '(' + randomX + ',' + randomY + ')', 5.68);
            }
            else if (workInfo.work == 'count') {
                let number = Math.floor(Math.random() * 16) + 10;
                try {
                    attachment = countImage (number);
                    embed.image = {url: 'attachment://image.png'};
                }
                catch {
                    let dots = '';
                    for (i = 0; i < number; i++) {
                        dots = dots + '•';
                    }
                    embed.description = 'Count the amount of dots: `' + dots + '`';
                }
                embed.fields.push ({name: 'Format', value: 'The answer is whole number, `18`'})
                let sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed}, ((attachment) ? {file: attachment.toBuffer(), name: 'image.png'} : null));
                return answerCollector (member, userInfo, workInfo, sentMessage, embed, number, 4.15);
            }
            else if (workInfo.work == 'inspect') {
                let order = [];
                let subAnswer = [];
                let answer = '['
                for (let i = 0; i < 4; i++) {
                    let random = Math.floor(Math.random() * 4);
                    if (random == 0) {
                        order.push ('boolean');
                        let boolean = Math.floor(Math.random() * 2);
                        subAnswer.push (boolean);
                        answer = answer + ((boolean == 0) ? 'off' : 'on');
                    }
                    else if (random == 1) {
                        order.push ('degree');
                        let degree = Math.floor(Math.random() * 8) * 45;
                        subAnswer.push (degree)
                        answer = answer + degree;
                    }
                    else if (random == 2) {
                        order.push ('color');
                        let color = Math.floor(Math.random() * 6);
                        subAnswer.push (color);
                        let colorScheme = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
                        answer = answer + colorScheme[color];
                    }
                    else if (random == 3) {
                        order.push ('count');
                        let count = Math.floor(Math.random() * 8) + 1;
                        subAnswer.push (count)
                        answer = answer + count;
                    }
                    answer = answer + ((i == 3) ? ']' : ',')
                }
                try {
                    attachment = inspectImage (order, subAnswer);
                    embed.image = {url: 'attachment://image.png'};
                }
                catch {
                    let description = 'Transcribe the following information: '
                    order.forEach ((ele, i) => {
                        if (ele == 'boolean') {
                            let boolean = ['╘╛', '╒╕'];
                            description = description + '`[' + boolean[subAnswer[i]] +']` ';
                        }
                        else if (ele == 'degree') {
                            let angles = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
                            description = description + '`(' + angles[subAnswer[i]/45] + ')` ';
                        }
                        else if (ele == 'color') {
                            let colors = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'];
                            description = description + '`' + colors[subAnswer[i]] + '` ';
                        }
                        else if (ele == 'count') {
                            let dots = '';
                            for (let i = 0; i < subAnswer[i]; i++) {
                                dots = dots + '/•';
                            }
                            description = description + '`' + dots + '` ';
                        }
                    })
                    embed.description = description;
                }
                embed.fields.push ({name: 'Format', value: 'The answer is a series of answers, `[on,45,purple,3]`'})
                let sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed}, ((attachment) ? {file: attachment.toBuffer(), name: 'image.png'} : null));
                return answerCollector (member, userInfo, workInfo, sentMessage, embed, answer, 5.04);
            }
        }
        else if (commandConfig.apl.includes (args[1])) {
            let ticker = (args[2]) ? args[2].toUpperCase() : null;
            let index = message.content.toLowerCase().indexOf(args[3]);
            let jobName = message.content.slice(index);
            let workInfo; let companyInfo; let errors = [];
            if (ticker) workInfo = await getWorkInfo (ticker, jobName, guild.id);
            if (index !== -1) companyInfo = await getCompanyInfo (ticker, guild.id);
            if (!ticker || !companyInfo) errors.push ('ticker');
            if (index == -1 || (!workInfo && companyInfo)) errors.push ('title');
            if (errors.length) return errorLog (message, args, 'job', 'invalidUsage', errors)
            let executive = guild.members.find (ele => ele.id == companyInfo.executiveID);
            let embed = {
                title: 'Job - Apply',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                fields: [
                    {name: 'Company', value: companyInfo.name, inline: true},
                    {name: 'Ticker', value: workInfo.ticker, inline: true},
                    {name: 'Manager', value: executive.mention, inline: true},
                    {name: 'Job', value: workInfo.name, inline: true},
                    {name: 'Operations', value: workInfo.work.charAt(0).toUpperCase() + workInfo.work.slice(1), inline: true},
                    {name: 'Schedule', value: workInfo.frequency.toFixed() + 'f ' + workInfo.cooldown.toFixed() + 'h', inline: true}
                ]
            }
            if (workInfo.private == false) {
                embed.description = 'Would you like to become a ' + workInfo.ticker + ' ' + workInfo.name + '? React with 👍 to confirm' + ((userInfo.occupation && userInfo.occupation.name) ? ' (You will quit your job as a ' + userInfo.occupation.name + ')' : '');
                let sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed});
                sentMessage.addReaction ('👍')
                let filter = (mes, emj, usr) => emj.name == '👍' && usr == member.id;
                let collector = new reactionCollector (client, sentMessage, filter, {time: 3600000});
                collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
                    embed.description = 'Your application to become a ' + workInfo.ticker + ' ' + workInfo.name + ' was successful, use `-job work` to start working';
                    embed.color = randomColor ('blue');
                    sentMessage.edit ({content: member.mention + ',', embed: embed});
                    userInfo.occupation = {
                        ticker: workInfo.ticker,
                        name: workInfo.name,
                        unused: workInfo.frequency,
                        refresh: new Date() + workInfo.cooldown
                    }
                    userInfo.save();
                    collector.stop ('Automated');
                })
                collector.on ('end', async (collected, reason) => {
                    sentMessage.removeReactions()
                    if (reason == 'Automated') return;
                    embed.description = 'Your application to become a ' + workInfo.ticker + ' ' + workInfo.name + ' failed due to time constraints';
                    embed.color = randomColor ('orange');
                    sentMessage.edit ({content: member.mention + ',', embed: embed});
                })
            }
            else {
                let member = guild.members.find (ele => ele.id == companyInfo.executiveID);
                embed.fields.push (
                    {name: 'Applicant', value: member.mention, inline: true},
                    {name: 'Approval', value: 'Pending', inline: true},
                    {name: 'Confirmation', value: 'Pending', inline: true}
                )
                embed.description = 'This job is set to private, would you like to request to become a ' + workInfo.ticker + ' ' + workInfo.name + '? You and the manager needs to react with 👍 to confirm' + ((userInfo.occupation && userInfo.occupation.name) ? ' (You will quit your job as a ' + userInfo.occupation.name + ')' : '');
                let sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed});
                sentMessage.addReaction ('👍');
                let filter = (mes, emj, usr) => emj.name == '👍' && (usr == member.id || usr == companyInfo.executiveID);
                let collector = new reactionCollector (client, sentMessage, filter, {time: 3600000});
                let countEmployee; let countManager;
                collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
                    if (!countEmployee && userID == member.id) {
                        countEmployee = true;
                        embed.fields[8].value = 'Confirmed';
                    }
                    if (!countManager && userID == companyInfo.executiveID) {
                        countManager = true;
                        embed.fields[7].value = 'Confirmed';
                    }
                    if (countEmployee && countManager) {
                        embed.color = randomColor ('blue');
                        embed.description = 'Your application to become a ' + workInfo.ticker + ' ' + workInfo.name + ' was successful, use `-job work` to start working';
                        userInfo.occupation = {
                            ticker: workInfo.ticker,
                            name: workInfo.name,
                            unused: workInfo.frequency,
                            refresh: new Date() + workInfo.cooldown
                        }
                        userInfo.save();
                        collector.stop ('automated');
                    }
                    sentMessage.edit ({content: member.mention + ',', embed: embed});
                })
                collector.on ('end', async (collected, reason) => {
                    sentMessage.removeReactions()
                    if (reason == 'automated') return;
                    embed.description = 'Your application to become a ' + workInfo.ticker + ' ' + workInfo.name + ' failed due to time constraints';
                    embed.color = randomColor ('orange');
                    if (embed.fields[4].value == 'Pending') embed.fields[4].value = 'Refused';
                    if (embed.fields[5].value == 'Pending') embed.fields[5].value = 'Refused';
                    sentMessage.edit ({content: member.mention + ',', embed: embed});
                })
            }
        }
        else if (commandConfig.ctg.includes (args[1])) {
            const ticker = (args[2]) ? args[2].toUpperCase() : null;
            let companyInfo = await getCompanyInfo (ticker, guild.id);
            if (!companyInfo || !ticker) return errorLog (message, args, 'job', 'invalidUsage', ['ticker']);
            let leftNames, rightNames;
            leftNames = rightNames = ''
            companyInfo.jobs.sort ();
            companyInfo.jobs.forEach ((ele, idx) => {
                let side = idx % 2;
                if (side == 0) leftNames = leftNames + ((idx > 1) ? '\n' : '') + ele;
                else if (side == 1) rightNames = rightNames + ((idx > 1) ? '\n' : '') + ele;
            })
            let executive = guild.members.find (ele => ele.id == companyInfo.executiveID);
            let embed = {
                title: 'Job - Catalog',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                fields: [
                    {name: 'Company', value: companyInfo.name, inline: true},
                    {name: 'Ticker', value: companyInfo.ticker, inline: true},
                    {name: 'Manager', value: executive.mention, inline: true},
                    {name: 'Employment', value: leftNames, inline: true},
                    {name: '\u200b', value: rightNames, inline: true}
                ]
            }
            message.channel.createMessage ({content: member.mention + ',', embed: embed});
        }
        else if (commandConfig.crt.includes (args[1])) {
            let errors = [];
            const index = message.content.toLowerCase().indexOf(args[3]);
            const jobName = message.content.slice(index);
            const operationConfig = jobConfig.arguments.operation.inputs;
            const operation = (args[2]) ? Object.keys(operationConfig).find (ele => operationConfig[ele].includes (args[2].toLowerCase())) : null;
            if (!args[2] || !operation) errors.push ('operation');
            if (!args[3] || !jobName || jobName.length > 16) errors.push ('title');
            if (errors.length) return errorLog (message, args, 'job', 'invalidUsage', errors);
            let companyInfo = await getCompanyInfoWithName (member.id, "800012084787544124")//member.id, guild.id);
            if (!companyInfo) return errorLog (message, args, 'job', 'employment', []);
            let embed = {
                title: 'Job - Create',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                description: 'React with 👍 to issue a job application',
                fields: [
                    {name: 'Occupation', value: jobName, inline: true},
                    {name: 'Executive', value: member.mention, inline: true},
                    {name: 'Confirmation', value: 'Pending', inline: true}
                ]
            };
            let sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed});
            sentMessage.addReaction ('👍');
            let filter = (mes, emj, usr) => emj.name == '👍' && usr == member.id;
            let collector = new reactionCollector (client, sentMessage, filter, {time: 3600000});
            collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
                embed.description = 'You have successfully issued a job application';
                embed.color = randomColor ('blue');
                embed.fields[2].value = 'Confirmed'
                sentMessage.edit ({content: member.mention + ',', embed: embed});
                const newWorkInfo = await new workInfoDB ({
                    guildID: guild.id,
                    ticker: companyInfo.ticker,
                    name: jobName,
                    private: true,
                    work: operation,
                    frequency: 18,
                    cooldown: 4
                });
                newWorkInfo.save();
                companyInfo.jobs.push (jobName);
                companyInfo.save();
                collector.stop ('automated');
            })
            collector.on ('end', async (collected, reason) => {
                if (reason == 'automated') return;
                embed.description = 'You have failed to issue a job application by the specified date';
                embed.color = randomColor ('orange');
                embed.fields[2].value = 'Refused';
                sentMessage.edit ({content: member.mention + ',', embed: embed});
            })
        }
        else if (commandConfig.upd.includes (args[1])) {
            let errors = [];
            let companyInfo = await getCompanyInfoWithName (member.id, guild.id);
            if (!companyInfo) return errorLog (message, args, 'job', 'employment', []);
            let jobIndex = message.content.toLowerCase().indexOf(args[2]);
            let titleIndex = message.content.indexOf(': `', jobIndex);
            let almostJobName = message.content.substring (jobIndex, (titleIndex == -1) ? message.content.length : titleIndex);
            let jobIndexEnd = almostJobName.lastIndexOf(' ');
            let jobName = almostJobName.slice(0, jobIndexEnd);
            if (titleIndex == -1) jobName = almostJobName;
            let workInfo = await getWorkInfo (companyInfo.ticker, jobName, guild.id);
            if (!workInfo) errors.push ('title');
            if (titleIndex == -1) errors.push ('settings');
            if (errors.length) return errorLog (message, args, 'job', 'invalidUsage', errors);
            let settings = message.content.substring(jobIndexEnd + jobIndex + 1, message.content.length - 1).replace (/\[n]/g, '\n');
            let settingsSplit = settings.split ('`| ');
            let settingsConfig = jobConfig.arguments.settings.inputs;
            let changes = {}; let nameExists;
            settingsSplit.forEach (ele => {
                let eleSplit = ele.split(/: ?`/);
                let backTickNumber = (eleSplit[1].split('`').length - 1);
                if (!eleSplit [1] || eleSplit[2] || 1 == backTickNumber % 2);
                else if (settingsConfig.nam.includes (eleSplit[0]) && !changes.Name && !(eleSplit[1].length > 16)) return changes.Name = eleSplit[1];
                else if (settingsConfig.pvt.includes (eleSplit[0]) && !changes.Private) return changes.Private = Object.keys(config.discordInfo.boolean).find (ele => config.discordInfo.boolean[ele].includes (eleSplit[1].toLowerCase()));
                else if (settingsConfig.opr.includes (eleSplit[0]) && !changes.Operation) return changes.Operation = Object.keys(jobConfig.arguments.operation.inputs).find (ele => jobConfig.arguments.operation.inputs[ele].includes (eleSplit[1].toLowerCase()));
                else if (settingsConfig.frq.includes (eleSplit[0]) && !changes.Frequency && !isNaN(eleSplit[1]) && 3 <= eleSplit <= 48) return changes.Frequency = Math.floor(eleSplit[1], 10);
                else if (settingsConfig.cdn.includes (eleSplit[0]) && !changes.Cooldown && !isNaN(eleSplit[1]) && 1 <= eleSplit <= 8) return changes.Cooldown = Math.floor(eleSplit[1], 10);
                return changes.error = true;
            })
            if (changes.Name) nameExists = await getWorkInfo (companyInfo.ticker, changes.Name, guild.id); 
            if (changes.error || !Object.keys(changes).length || (changes.Name && nameExists)) return errorLog (message, args, 'job', 'invalidUsage', ['settings']);
            let changeToString = JSON.stringify(changes);
            let changeString = changeToString.replace(/[{}"]/g, '').replace(/:/g, ': `').replace (/,/g, '`|\n') + '`';
            if (changeString == '`') changeString = '';
            changeString.replace (/``/g, '`[EMPTY]`');
            try {
                let embed = {
                    title: 'Job - Update',
                    color: randomColor ('white'),
                    timestamp: new Date().toISOString(),
                    fields: [
                        {name: 'Company', value: companyInfo.name, inline: true},
                        {name: 'Ticker', value: companyInfo.ticker, inline: true},
                        {name: 'Job', value: workInfo.name, inline: true},
                        {name: 'Changes', value: changeString, inline: false}
                    ]
                }
                if (changes.Name) {
                    const jobIndex = companyInfo.jobs.indexOf(workInfo.name);
                    companyInfo.jobs.splice(jobIndex, 1, changes.Name);
                    workInfo.name = changes.Name;
                    companyInfo.save();
                }
                if (changes.Private) workInfo.private = changes.Private;
                if (changes.Operation) workInfo.work = changes.Operation;
                if (changes.Frequency) workInfo.frequency = changes.Frequency;
                if (changes.Cooldown) workInfo.cooldown = changes.Cooldown;
                workInfo.save();
                message.channel.createMessage ({content: member.mention + ',', embed: embed})
            }
            catch {return errorLog (message, args, 'job', 'invalidUsage', ['settings'])}
        }
        else if (commandConfig.del.includes (args[1])) {
            let companyInfo = await getCompanyInfoWithName (member.id, guild.id);
            let jobIndex = message.content.toLowerCase().indexOf(args[2]);
            let jobName = message.content.slice(jobIndex);
            let workInfo = await getWorkInfo (companyInfo.ticker, jobName, guild.id);
            if (!companyInfo || !workInfo) return errorLog (message, args, 'job', 'employment', []);
            let embed = {
                title: 'Job - Delete',
                color: randomColor ('orange'),
                timestamp: new Date().toISOString(),
                description: 'React with 👍 to issue the closure of this field',
                fields: [
                    {name: 'Ticker', value: companyInfo.ticker, inline: true},
                    {name: 'Company', value: companyInfo.name, inline: true},
                    {name: 'Executive', value: member.mention, inline: true},
                    {name: 'Job', value: workInfo.name, inline: true},
                    {name: 'Operation', value: workInfo.work, inline: true},
                    {name: 'Confirmation', value: 'Pending', inline: true}
                ]
            };
            let sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed});
            sentMessage.addReaction ('👍');
            let filter = (mes, emj, usr) => emj.name == '👍' && usr == member.id;
            let collector = new reactionCollector (client, sentMessage, filter, {time: 3600000});
            collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
                embed.description = 'You have successfully issued the closure of this field';
                embed.color = randomColor ('blue');
                embed.fields[2].value = 'Confirmed';
                sentMessage.edit ({content: member.mention + ',', embed: embed});
                workInfo.deleteOne();
                const jobIndex = companyInfo.jobs.indexOf(workInfo.name);
                companyInfo.jobs.splice (jobIndex, 1);
                companyInfo.save();
                collector.stop ('automated');
            })
            collector.on ('end', async (collected, reason) => {
                if (reason == 'automated') return;
                embed.description = 'You have failed to issue the closure of this field by the specified date';
                embed.color = randomColor ('white');
                embed.fields[2].value = 'Refused';
                sentMessage.edit ({content: member.mention + ',', embed: embed});
            })
        }
        else if (commandConfig.inf.includes (args[1])) {
            let ticker = (args[2]) ? args[2].toUpperCase() : null;
            let index = message.content.toLowerCase().indexOf(args[3]);
            let jobName = message.content.slice(index);
            let workInfo; let companyInfo; let errors = [];
            if (ticker) workInfo = await getWorkInfo (ticker, jobName, guild.id);
            if (index !== -1) companyInfo = await getCompanyInfo (ticker, guild.id);
            if (!ticker || !companyInfo) errors.push ('ticker');
            if (index == -1 || (!workInfo && companyInfo)) errors.push ('title');
            if (errors.length) return errorLog (message, args, 'job', 'invalidUsage', errors);
            let executive = guild.members.find (ele => ele.id == companyInfo.executiveID);
            let embed = {
                title: 'Job - Info',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                fields: [
                    {name: 'Company', value: companyInfo.ticker + ' - ' + companyInfo.name, inline: true},
                    {name: 'Executive', value: executive.mention, inline: true},
                    {name: 'Job', value: workInfo.name, inline: true},
                    {name: 'Operations', value: workInfo.work.charAt(0).toUpperCase() + workInfo.work.slice(1), inline: true},
                    {name: 'Schedule', value: workInfo.frequency.toFixed() + 'f ' + workInfo.cooldown.toFixed() + 'h', inline: true},
                    {name: 'Private', value: workInfo.private, inline: true}
                ]
            }
            let attachment;
            let everyone = await getUserInfoOccupation (companyInfo.ticker, workInfo.name, guild);
            everyone = []
            try {
                attachment = jobInfoImage (companyInfo.ticker, workInfo.name, everyone.length);
                embed.image = {url: 'attachment://image.png'};
            }
            finally {
                if (everyone.length == 0) embed.description = 'There\'s nobody employed in this job'
                else embed.description = 'There ' + ((everyone.length <= 1) ? 'is' : 'are') + ' ' + everyone.length + ' ' + ((everyone.length <= 1) ? 'person' : 'people') + ' employed in this job'
            }
            message.channel.createMessage ({content: member.mention + ',', embed: embed}, ((attachment) ? {file: attachment.toBuffer(), name: 'image.png'} : null));
        }
        else return errorLog (message, args, 'job', 'invalidUsage', ['command']);
    }
}

async function getUserInfoOccupation (ticker, name, guild) {
    let userInfo = await userInfoDB.find ({
        'occupation.ticker': ticker,
        'occupation.name': name,
        guildID: guild.id
    })
    return userInfo;
}

async function getWorkInfo (ticker, name, guildID) {
    let nameRegex = new RegExp('^' + name + '$', 'i')
    let workInfo = await workInfoDB.findOne ({
        guildID: guildID,
        ticker: ticker,
        name: nameRegex
    })
    return workInfo;
}

async function getCompanyInfo (ticker, guildID) {
    const companyInfo = await companyInfoDB.findOne ({
        guildID: guildID,
        ticker: ticker
    })
    return companyInfo;
}

async function getCompanyInfoWithName (executiveID, guildID) {
    const companyInfo = await companyInfoDB.findOne ({
        guildID: guildID,
        executiveID: executiveID
    })
    return companyInfo;
}

function mathImage (numberOne, numberTwo, equation) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    numberOne = numberOne.toFixed(2);
    numberTwo = numberTwo.toFixed(2);
    ctx.font = '65px Verdana';
    const widthOne = ctx.measureText(numberOne).width / 2;
    const widthTwo = ctx.measureText(numberTwo).width / 2;
    let grd = ctx.createLinearGradient(600, -100, 300, 400);
    grd.addColorStop(0, '#ff8080');
    grd.addColorStop(1, '#ffbfbf');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    grd = ctx.createLinearGradient(450, 52, 450, 248);
    grd.addColorStop(0, 'rgba(255, 32, 32, 0.4)');
    grd.addColorStop(0.25, 'rgba(191, 0, 0, 0.7)');
    grd.addColorStop(0.5, 'rgba(255, 0, 0, 0.5)');
    grd.addColorStop(0.75, 'rgba(191, 0, 0, 0.7)')
    grd.addColorStop(1, 'rgba(255, 32, 32, 0.4)');
    ctx.fillStyle = grd;
    ctx.strokeStyle = '#260000';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc (450, 150, 50, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc (243 - widthOne, 103, 45, 0.5 * Math.PI, 1.5 * Math.PI);
    ctx.arc (203 + widthOne, 103, 45, 1.5 * Math.PI, 0.5 * Math.PI);
    ctx.lineTo (243 - widthOne, 148)
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc (695 - widthTwo, 203, 45, 0.5 * Math.PI, 1.5 * Math.PI);
    ctx.arc (655 + widthTwo, 203, 45, 1.5 * Math.PI, 0.5 * Math.PI);
    ctx.lineTo (695 - widthTwo, 248)
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo (248 - widthOne, 148)
    ctx.lineTo (248 - widthOne, 300)
    ctx.moveTo (223, 148)
    ctx.lineTo (223, 300)
    ctx.moveTo (198 + widthOne, 148)
    ctx.lineTo (198 + widthOne, 300)
    ctx.moveTo (450, 0)
    ctx.lineTo (450, 100)
    ctx.moveTo (450, 200)
    ctx.lineTo (450, 300)
    ctx.moveTo (700 - widthTwo, 158)
    ctx.lineTo (700 - widthTwo, 0)
    ctx.moveTo (675, 158)
    ctx.lineTo (675, 0)
    ctx.moveTo (650 + widthTwo, 158)
    ctx.lineTo (650 + widthTwo, 0)
    ctx.stroke();
    ctx.beginPath();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#260000';
    ctx.font = '100px Verdana';
    if (equation == '+' || equation == '-') ctx.fillText (equation, 450, 143);
    else if (equation == '*') ctx.fillText ('*', 450, 165);
    else if (equation == '/') {
        ctx.font = '80px Verdana';
        ctx.fillText ('/', 450, 140)
    };
    ctx.font = '65px Verdana';
    ctx.fillText (numberOne, 223, 100);
    ctx.fillText (numberTwo, 675, 200);
    return messageImage;
}

function speedImage (randomString) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(600, -100, 300, 400);
    grd.addColorStop(0, '#80ffff');
    grd.addColorStop(1, '#bfffff');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.fillStyle = '#004040';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '100px Verdana';
    ctx.setTransform ((Math.random() * 0.4) + 0.8, (Math.random() * 0.2) - 0.1, (Math.random() * 0.2) - 0.1, (Math.random() * 0.4) + 0.8, (Math.random() * 0.2) - 0.1, (Math.random() * 0.2) - 0.1);
    ctx.fillText (randomString, 450, 150);
    for (let i = -1; i < 5; i++) {
        ctx.moveTo (-300, i * 100);
        ctx.lineTo (1200, i * 100);
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 64, 64, 0.9)';
    ctx.stroke();
    return messageImage;
}

function precisionImage (randomX, randomY) {
    let transformX = (Math.random() * 600) + 15;
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(600, -100, 300, 400);
    grd.addColorStop(0, '#80ff80');
    grd.addColorStop(1, '#bfffbf');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    const messageClipping = canvas.createCanvas(900, 300);
    const ctx2 = messageClipping.getContext('2d');
    ctx2.rect (0, 0, 900, 300)
    ctx2.rect (transformX, 15, 270, 270)
    ctx2.clip('evenodd')
    ctx2.fillStyle = 'rgba(0, 128, 0, 0.5)';
    ctx2.fillRect (0, 0, 900, 300);
    ctx.drawImage (messageClipping, 0, 0);
    ctx.beginPath();
    ctx.strokeStyle = '#004000';
    ctx.lineWidth = 5;
    ctx.moveTo (0, 15);
    ctx.lineTo (900, 15);
    ctx.moveTo (0, 285);
    ctx.lineTo (900, 285);
    ctx.moveTo (transformX, 0);
    ctx.lineTo (transformX, 300);
    ctx.moveTo (transformX + 270, 0);
    ctx.lineTo (transformX + 270, 300);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 64, 0, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 1; i < 5; i++) {
        ctx.moveTo (transformX + (i * 54), 15);
        ctx.lineTo (transformX + (i * 54), 285);
        ctx.moveTo (transformX, 15 + (i * 54));
        ctx.lineTo (transformX + 270, 15 + (i * 54));
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 96, 0, 0.7)';
    ctx.strokeStyle = '#004000';
    ctx.lineWidth = 4;
    ctx.arc (transformX + (randomX * 10.8), 285 + (randomY * -10.8), 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.moveTo (transformX + (randomX * 10.8), 270 + (randomY * -10.8));
    ctx.lineTo (transformX + (randomX * 10.8), 245 + (randomY * -10.8));
    ctx.moveTo (transformX + (randomX * 10.8), 300 + (randomY * -10.8));
    ctx.lineTo (transformX + (randomX * 10.8), 325 + (randomY * -10.8));
    ctx.moveTo (15 + transformX + (randomX * 10.8), 285 + (randomY * -10.8));
    ctx.lineTo (40 + transformX + (randomX * 10.8), 285 + (randomY * -10.8));
    ctx.moveTo (-15 + transformX + (randomX * 10.8), 285 + (randomY * -10.8));
    ctx.lineTo (-40 + transformX + (randomX * 10.8), 285 + (randomY * -10.8));
    ctx.stroke();
    return messageImage;
}

function countImage (number) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(600, -100, 300, 400);
    grd.addColorStop(0, '#ff80ff');
    grd.addColorStop(1, '#ffbfff');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.fillStyle = 'rgba(96, 0, 96, 0.5)';
    ctx.strokeStyle = '#400040';
    ctx.lineWidth = 6;
    for (i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.arc (((i * 850) / 49) + 25, (Math.random() * 250) + 25, 16, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.fillStyle = 'rgba(96, 0, 96, 0.7)';
    for (i = 0; i < number; i ++) {
        ctx.beginPath();
        ctx.arc (((i * 850) / (number - 1)) + 25, (Math.random() * 250) + 25, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
    return messageImage;
}

function inspectImage (order, answer) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(600, 400, 300, -100);
    grd.addColorStop(0, '#333333');
    grd.addColorStop(1, '#666666');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    for (let i = 0; i < 4; i++) {
        let output = answer[i];
        let input = order[i];
        let pivotX = (i * 225) + 15;
        ctx.beginPath();
        if (input == 'boolean') {
            ctx.fillStyle = '#731919';
            ctx.fillRect(pivotX + 5, 20, 185, 260);
            ctx.fillStyle = '#420404';
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#260000';
            ctx.moveTo(pivotX + 35, 30);
            ctx.arc(pivotX + 160, 50, 20, Math.PI * -0.5, Math.PI * 0.5, false);
            ctx.arc(pivotX + 35, 50, 20, Math.PI * 0.5, Math.PI * -0.5, false);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pivotX + 35, 230);
            ctx.arc(pivotX + 160, 250, 20, Math.PI * -0.5, Math.PI * 0.5, false);
            ctx.arc(pivotX + 35, 250, 20, Math.PI * 0.5, Math.PI * -0.5, false);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            let colors = ['#80ff00', '#00ffff', '#8000ff'];
            let colorOrder = [];
            let randomIncorrect;
            if (output == 0) {
                randomIncorrect = Math.floor(Math.random() * 2);
            }
            for (let i = 0; i < 6; i++) {
                if (i == 3) colors = ['#80ff00', '#00ffff', '#8000ff'];
                ctx.beginPath();
                let randomNumber = Math.floor(Math.random() * colors.length);
                ctx.fillStyle = colors[randomNumber];
                colorOrder.push (colors[randomNumber]);
                colors.splice(randomNumber, 1);
                ctx.arc(pivotX + ((i % 3) * 52.5) + 45, ((i < 3) ? 50 : 250), 10, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.beginPath();
            ctx.strokeStyle = '#2b0202';
            ctx.lineWidth = 9;
            ctx.shadowColor = '#690202';
            for (let i = 0; i < 3; i++) {
                let startIndex = i;
                let matchIndex = colorOrder.findIndex((ele, i2) => i2 > 2 && ele == colorOrder[i]);
                if (randomIncorrect != null) {
                    if (randomIncorrect == 0) matchIndex++
                    else matchIndex--
                }
                ctx.moveTo(pivotX + ((startIndex % 3) * 52.5) + 45, 60);
                ctx.bezierCurveTo(pivotX + ((startIndex % 3) * 52.5) + 45, 150, pivotX + ((matchIndex % 3) * 52.5) + 45, 150, pivotX + ((matchIndex % 3) * 52.5) + 45, 240);
            }
            ctx.stroke();
            ctx.shadowColor = 'rgba(0,0,0,0)';
        }
        else if (input == 'degree') {
            ctx.fillStyle = '#0c0d1f';
            ctx.fillRect(pivotX + 5, 20, 185, 260);
            ctx.arc(pivotX + 97.5, 175, 80, 0, Math.PI * 2);
            ctx.lineWidth = 12;
            ctx.strokeStyle = '#0f112b';
            ctx.stroke();
            ctx.fillStyle = '#1d2052';
            ctx.fill();
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#212794';
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(pivotX + 97.5, 175, 72.5, Math.PI * -0.5, Math.PI * 1.25);
            ctx.strokeStyle = '#f0f1ff';
            ctx.shadowColor = '#f0f1ff';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 3;
            ctx.stroke();
            for (let i = 0; i < 57; i++) {
                ctx.beginPath();
                let radius = 60;
                ctx.lineWidth = 0.8;
                if (i % 8 == 0) {
                    radius = 50
                    ctx.lineWidth = 2.5;
                }
                ctx.moveTo (72.5 * Math.cos(Math.PI * ((i / 32) - 0.5)) + pivotX + 97.5, 72.5 * Math.sin(Math.PI * ((i / 32) - 0.5)) + 175);
                ctx.lineTo (radius * Math.cos(Math.PI * ((i / 32) - 0.5)) + pivotX + 97.5, radius * Math.sin(Math.PI * ((i / 32) - 0.5)) + 175);
                ctx.stroke()
            }
            ctx.beginPath();
            ctx.fillStyle = '#2130ff';
            ctx.strokeStyle = '#949cff'
            ctx.shadowColor = '#525dff';
            ctx.moveTo(pivotX + 97.5 + (-13 * Math.cos(Math.PI * (output) / 180)), 175 + (-13 * Math.sin(Math.PI * (output) / 180)));
            ctx.lineTo(pivotX + 97.5 + (-70 * Math.cos(Math.PI * (output + 90) / 180)), 175 + (-70 * Math.sin(Math.PI * (output + 90) / 180)));
            ctx.lineTo(pivotX + 97.5 + (-13 * Math.cos(Math.PI * (output + 180) / 180)), 175 + (-13 * Math.sin(Math.PI * (output + 180) / 180)));
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.shadowColor = '#000005';
            ctx.fillStyle = '#05061a';
            ctx.arc(pivotX + 97.5, 175, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.font = '40px Verdana';
            ctx.fillStyle = '#adb1ff';
            ctx.shadowColor = '#adb1ff';
            ctx.shadowBlur = 6;
            ctx.textBaseline = 'middle';
            ctx.fillText ('0°', pivotX + 85, 60);
            ctx.shadowColor = 'rgba(0,0,0,0)';
        }
        else if (input == 'color') {
            grd = ctx.createLinearGradient(ctx.pivotX + 5, 280, pivotX + 190, 20);
            grd.addColorStop(0, '#1a1a1a');
            grd.addColorStop(1, '#454545');
            ctx.fillStyle = grd;
            ctx.fillRect(pivotX + 5, 20, 185, 260);
            let darkColors = ['maroon', '#805300', 'olive', 'green', 'navy', 'purple'];
            let colors = ['red', 'orange', 'yellow', 'lime', 'blue', 'fuchsia'];
            let lightColors = ['#ff4040', '#ffbc40', '#ffff40', '#40ff40', '#4040ff', '#ff40ff'];
            ctx.beginPath();
            ctx.fillStyle = lightColors[output];
            ctx.lineWidth = 6;
            ctx.shadowColor = colors[output];
            ctx.shadowBlur = 6;
            ctx.arc(pivotX + 97.5, 150, 75, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = colors[output];
            ctx.arc(pivotX + 108.5, 139, 60, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.strokeStyle = darkColors [output];
            ctx.arc(pivotX + 97.5, 150, 75, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowColor = 'rgba(0,0,0,0)'
        }
        else if (input == 'count') {
            ctx.fillStyle = '#040d03';
            ctx.fillRect(pivotX + 5, 20, 185, 260);
            ctx.fillStyle = '#0d8500';
            ctx.shadowColor = '#0d8500';
            ctx.shadowBlur = 3;
            ctx.font = '60px Courier New';
            ctx.textBaseline = 'top';
            ctx.textAlight = 'left';
            let startText = '';
            for (let i = 0; i < output; i++) {
                startText = startText + '*'
            }
            for (let i = 0; i < (20 - output); i++) {
                let indexPoint = Math.floor(Math.random() * (output + i + 1))
                startText = startText.slice(0, indexPoint) + '/' + startText.slice(indexPoint);
            }
            for (let i = 1; i < 4; i++) {
                startText = startText.slice(0, (i * 6) - 1) + '\n' + startText.slice((i * 6) - 1);
            }
            ctx.fillText (startText, pivotX + 10, 20);
            ctx.font = '12px Courier New';
            ctx.fillStyle = '#094f02';
            ctx.shadowColor = '#094f02';
            let backgroundText = ''
            for (let i = 0; i < 17; i++) {
                backgroundText = backgroundText + Math.random().toString(2).substring(2, 27) + '\n'
            }
            ctx.fillText (backgroundText, pivotX + 10, 20)
            ctx.shadowColor = 'rgba(0,0,0,0)'
        }
    }
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
        let pivotX = (i * 225) + 15;
        ctx.moveTo(pivotX + 15, 15);
        ctx.arcTo(pivotX + 195, 15, pivotX + 195, 285, 15);
        ctx.arcTo(pivotX + 195, 285, pivotX, 285, 15);
        ctx.arcTo(pivotX, 285, pivotX, 15, 15);
        ctx.arcTo(pivotX, 15, pivotX + 195, 15, 15);
    }
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    ctx.strokeStyle = '#303030';
    ctx.lineWidth = 4;
    ctx.stroke();
    return messageImage;
}

function jobInfoImage (ticker, name, population) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(600, -100, 300, 400);
    grd.addColorStop(0, '#bfbfbf');
    grd.addColorStop(1, '#808080');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.fillStyle = '#1a1a1a';
    let numbers = [125, 775];
    numbers.forEach (ele => {
        ctx.arc (ele, 275, 100, 0, Math.PI, true);
        ctx.fill();
        ctx.beginPath();
        ctx.arc (ele, 90, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
    })
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#262626';
    ctx.font = 'bold 45px Verdana';
    ctx.fillText ('Employed:', 450, 60);
    ctx.fillStyle = '#0d0d0d';
    ctx.font = '100px Verdana';
    ctx.fillText (population.toFixed(), 450, 130);
    ctx.fillStyle = '#404040';
    ctx.font = 'italic 50px Verdana';
    ctx.fillText (ticker, 450, 200);
    ctx.font = 'italic 30px Verdana';
    ctx.fillText (name, 450, 240);
    return messageImage;
}

async function answerCollector (member, userInfo, workInfo, sentMessage, embed, answer, occupationPay) {
    let timeSince = new Date();
    embed.fields.pop();
    let filter = (msg) => msg.member.id == member.id && msg.content == answer;
    let collector = new messageCollector (client, sentMessage.channel, filter, {time: 600000});
    collector.on ('collect', async () => {
        let timePassed = (new Date() - timeSince) / 1000;
        let effort = (((17 * (occupationPay || 5)) * (workInfo.cooldown + 4)) / ((timePassed + 5) * (workInfo.frequency + 1)));
        let profit = (effort * (userInfo.experience * 0.05)) + 1;
        embed.color = randomColor ('blue');
        embed.fields.push (
            {name: 'Profit', value: profit.toFixed(), inline: true},
            {name: 'Time', value: timePassed.toFixed() + 's', inline: true}
        )
        if (userInfo.occupation.unused <= 1) {
            let cooldownDate = new Date ((new Date()).getTime() + (workInfo.cooldown * 3600000));
            embed.fields.push ({name: 'Refreshing', value: cooldownDate.toLocaleString('en-US'), inline: true});
        }
        else {
            embed.fields.push ({name: 'Unused', value: userInfo.occupation.unused, inline: true});
        }
        userInfo.money += profit
        userInfo.experience += (effort / 50);
        userInfo.save();
        collector.stop ('confirmed');
        sentMessage.edit ({content: member.mention + ',', embed: embed});
    })
    collector.on ('end', (collected, reason) => {
        sentMessage.removeReactions();
        if (reason == 'confirmed') return;
        embed.color = randomColor ('orange');
        embed.fields.push (
            {name: 'Answer', value: answer, inline: true},
            {name: 'Profit', value: 'Failed', inline: true},
        )
        if (userInfo.occupation.unused <= 1) {
            let cooldownDate = new Date (workInfo.cooldown)
            embed.fields.push ({name: 'Refreshing', value: cooldownDate.getUTCFullYear() + '/' + (cooldownDate.getUTCMonth() + 1).toString().padStart(2, '0') + '/' + cooldownDate.getUTCDate().toString().padStart(2, '0') + ' ' + cooldownDate.getUTCHours().toString().padStart(2, '0') + ':' + cooldownDate.getUTCMinutes().toString().padStart(2, '0'), inline: true})
        }
        else {
            embed.fields.push ({name: 'Unused', value: userInfo.occupation.unused, inline: true});
        }
        sentMessage.edit ({content: member.mention + ',', embed: embed});
    })
}