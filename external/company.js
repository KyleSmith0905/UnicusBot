const companyConfig = config.commands.company;
const commandConfig = companyConfig.arguments.command.inputs;
const {randomColor, getUserInfo} = require ('./functions');
const companyInfoDB = require ('../database/companyinfo.js');

module.exports = {
    name: 'company',
    summoner: companyConfig.alias,
    async execute (message, args) {
        const member = message.member;
        const guild = message.channel.guild;
        let userInfo = await getUserInfo (member, guild);
        if (commandConfig.crt.includes (args[1])) {
            const index = message.content.toLowerCase().indexOf (args[3]);
            const title = message.content.slice(index);
            const ticker = (args[2]) ? args[2].toUpperCase() : null;
            let errors = (!args[2] || args[2].length > 5 || await existsCompanyTickerInfo (ticker, guild.id)) ? ['ticker'] : [];
            if (!args[3] || !title || title.length > 16) errors.push ('title');
            if (errors.length) return errorLog (message, args, 'company', 'invalidUsage', errors);
            if (existsCompanyExecutiveInfo(member.id, guild.id)) return errorLog (message, args, 'company', 'employment', []);
            else if (!userInfo.money || userInfo.money < 500) return errorLog (message, args, 'company', 'money', ['Startup Costs', 500, userInfo.money]);
            let embed = {
                title: 'Company - Create',
                color: randomColor ('white'),
                timestamp: new Date().toISOString(),
                description: 'React with 👍 to file an Articles of Incorporation. There is a $500 fee attached',
                fields: [
                    {name: 'Ticker', value: ticker, inline: true},
                    {name: 'Executive', value: member.mention, inline: true},
                    {name: 'Confirmation', value: 'Pending', inline: true}
                ]
            };
            const sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed});
            sentMessage.addReaction ('👍');
            const filter = (mes, emj, usr) => emj.name == '👍' && usr == member.id;
            const collector = new reactionCollector (client, sentMessage, filter, {time: 3600000});
            collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
                embed.description = 'You have successfully filed an Articles of Incorporation';
                embed.color = randomColor ('blue');
                embed.fields[2].value = 'Confirmed';
                sentMessage.edit ({content: member.mention + ',', embed: embed});
                const newCompanyInfo = await new companyInfoDB ({
                    guildID: guild.id,
                    ticker: ticker,
                    name: title,
                    executiveID: member.id
                });
                newCompanyInfo.save();
                userInfo = await getUserInfo (member, guild);
                userInfo.money -= 500;
                userInfo.experience += 2.5;
                userInfo.save();
                collector.stop ('automated');
            })
            collector.on ('end', async (collected, reason) => {
                if (reason == 'automated') return;
                embed.description = 'You have failed to file an Articles of Incorporation by the specified date';
                embed.color = randomColor ('orange');
                embed.fields[2].value = 'Refused';
                sentMessage.edit ({content: member.mention + ',', embed: embed});
            })
        }
        else if (commandConfig.upd.includes (args[1])) {
            if (!args[2]) return errorLog (message, args, 'company', 'invalidUsage', ['settings']);
            let companyInfo = await getCompanyInfo (member.id, guild.id);
            if (!companyInfo) return errorLog (message, args, 'company', 'employment', []);
            const index = message.content.toLowerCase().indexOf(args[2]);
            const settings = message.content.substring(0, message.content.length - 1).slice(index).replace (/\[n]/g, '\n');
            const settingsSplit = settings.split ('`| ');
            const settingsConfig = companyConfig.arguments.settings.inputs;
            let changes = {}; let tickerExists;
            settingsSplit.forEach (ele => {
                let eleSplit = ele.split(/: ?`/);
                let backTickNumber = (eleSplit[1].split('`').length - 1);
                if (!eleSplit [1] || eleSplit[2] || 1 == backTickNumber % 2);
                else if (settingsConfig.tkr.includes (eleSplit[0]) && !changes.Ticker && !(eleSplit[1].length > 5) && !eleSplit[1].includes(' ')) return changes.Ticker = eleSplit[1].toUpperCase();
                else if (settingsConfig.ttl.includes (eleSplit[0]) && !changes.Title && !(eleSplit[1].length > 16)) return changes.Title = eleSplit[1];
                return changes.error = true;
            })
            if (changes.Ticker) tickerExists = await existsCompanyTickerInfo (changes.Ticker, guild.id);
            if (changes.error || !Object.keys(changes).length || (changes.Ticker && tickerExists)) return errorLog (message, args, 'company', 'invalidUsage', ['settings']);
            const changeToString = JSON.stringify(changes);
            let changeString = changeToString.replace(/[{}"]/g, '').replace(/:/g, ': `').replace (/,/g, '`|\n') + '`';
            if (changeString == '`') changeString = '';
            changeString.replace (/``/g, '`[EMPTY]`');
            try {
                let embed = {
                    title: 'Company - Update',
                    color: randomColor ('white'),
                    timestamp: new Date().toISOString(),
                    fields: [
                        {name: 'Company', value: companyInfo.name, inline: true},
                        {name: 'Ticker', value: companyInfo.ticker, inline: true},
                        {name: 'Executive', value: member.mention, inline: true},
                        {name: 'Changes', value: changeString, inline: false}
                    ]
                }
                if (changes.Ticker) companyInfo.ticker = changes.Ticker;
                if (changes.Title) companyInfo.name = changes.Title;
                companyInfo.save()
                message.channel.createMessage ({content: member.mention + ',', embed: embed})
            }
            catch {return errorLog (message, args, 'compant', 'invalidUsage', ['settings'])}
        }
        else if (commandConfig.del.includes (args[1])) {
            if (args[2]) return errorLog (message, args, 'company', 'invalidUsage', ['command']);
            let companyInfo = await getCompanyInfo (member.id, guild.id);
            if (!companyInfo) return errorLog (message, args, 'company', 'employment', []);
            let embed = {
                title: 'Company - Delete',
                color: randomColor ('orange'),
                timestamp: new Date().toISOString(),
                description: 'React with 👍 to file an Articles of Dissolution',
                fields: [
                    {name: 'Ticker', value: companyInfo.ticker, inline: true},
                    {name: 'Executive', value: member.mention, inline: true},
                    {name: 'Confirmation', value: 'Pending', inline: true}
                ]
            };
            const sentMessage = await message.channel.createMessage ({content: member.mention + ',', embed: embed});
            sentMessage.addReaction ('👍');
            const filter = (mes, emj, usr) => emj.name == '👍' && usr == member.id;
            const collector = new reactionCollector (client, sentMessage, filter, {time: 3600000});
            collector.on ('collect', async (sentMessage2nd, emoji, userID) => {
                embed.description = 'You have successfully filed an Articles of Dissolution';
                embed.color = randomColor ('blue');
                embed.fields[2].value = 'Confirmed';
                sentMessage.edit ({content: member.mention + ',', embed: embed});
                companyInfo.deleteOne();
                userInfo.experience -= 2;
                if (userInfo.experience < 2) userInfo.experience = 2;
                userInfo.save ();
                collector.stop ('automated');
            })
            collector.on ('end', async (collected, reason) => {
                if (reason == 'automated') return;
                embed.description = 'You have failed to file an Articles of Dissolution by the specified date';
                embed.color = randomColor ('white');
                embed.fields[2].value = 'Refused';
                sentMessage.edit ({content: member.mention + ',', embed: embed});
            })
        }
        else return errorLog (message, args, 'company', 'invalidUsage', ['command']);
    }
}

async function getCompanyInfo (executiveID, guildID) {
    const companyInfo = await companyInfoDB.findOne ({
        guildID: guildID,
        executiveID: executiveID
    })
    return companyInfo;
}

async function existsCompanyTickerInfo (ticker, guildID) {
    const exists = await companyInfoDB.exists ({
        guildID: guildID,
        ticker: ticker
    })
    return exists;
}

async function existsCompanyExecutiveInfo (executive, guildID) {
    const exists = await companyInfoDB.exists ({
        guildID: guildID,
        executiveID: executive
    })
    return exists;
}