const electionConfig = config.commands.election;
const commandConfig = electionConfig.arguments.command.inputs;
const {randomColor, getUserInfo, timeout} = require ('./functions');
const stateInfoDB = require ('../database/stateinfo.js');

client.on ('ready', async () => {
    let guild = client.guilds.find (ele => true)
    let schedule = cron.schedule ('0 0 0 * * *', async () => {
        let timeline = [0, 3, 6];
        timeline.forEach (async ele => {
            let dayState = stateDay (Date.now(), ele);
            let shortHand = Object.keys(config.places)[dayState];
            let stateConfig = config.places[shortHand];
            let stateInfo = await getStateInfo (guild, stateConfig.postalCode);
            let stateRole = guild.roles.find (ele => ele.name.toLowerCase() == stateConfig.name.toLowerCase());
            let people = guild.members.filter (ele => ele.roles.includes(stateRole.id)).length;
            let votingProcess;
            if (ele == 0 && 5 > people) votingProcess = 'cancelled';
            else if (ele == 0) votingProcess = 'application';
            else if (ele == 3 && stateInfo.votingProcess == 'application' && stateInfo.candidates.length) votingProcess = 'voting';
            else if (ele == 3 && stateInfo.votingProcess == 'application') votingProcess = 'cancelled';
            else if (ele == 6 && stateInfo.votingProcess == 'voting') votingProcess = 'result';
            else if (ele == 6 && stateInfo.votingProcess == 'cancelled') votingProcess = 'empty';
            else return;
            let candidates = stateInfo.candidates; let governorID = stateInfo.governorID; let welcomeMessage = stateInfo.welcomeMessage;
            let stateCategory = guild.channels.find (ele => ele.name == stateConfig.name.toLowerCase() && ele.type == 4);
            let stateChannel = stateCategory.channels.find (ele => ele.name.startsWith('╙'));
            let governorRole = guild.roles.find (ele => ele.name.toLowerCase() == ((stateConfig.postalCode.toUpperCase() + ' Governor').toLowerCase()));
            let governor = (governorRole) ? guild.members.find (ele => ele.roles.includes(governorRole.id)) : null;
            let processConfig = electionConfig.event[votingProcess];
            if (governorRole) governorRole.delete ()
            let statesChannelArray = guild.channels.find (ele => ele.parentID == stateCategory.id && !ele.name.startsWith('╙')) || [];
            statesChannelArray.forEach (ele => ele.delete);
            let embed = {
                title: 'Election - ' + processConfig.title,
                description: processConfig.description,
                color: randomColor (processConfig.color),
                timestamp: new Date().toISOString(),
                fields: [
                    {name: 'State:', value: stateConfig.name, inline: true},
                    {name: 'Population:', value: people, inline: true},
                    {name: 'Governor:', value: (governor) ? governor.mention : 'No current governor of ' + stateConfig.name, inline: true}
                ]
            }
            if (votingProcess == 'cancelled') {
                if (stateInfo.candidates.length) embed.fields.push ({name: 'Reason:', value: 'There are no running candidates for governor', inline: false});
                else embed.fields.push ({name: 'Reason:', value: 'The population is ' + (5 - people) + ' less than the minimum population required', inline: false})
            }
            else if (votingProcess == 'voting') {
                let nameArray = [];
                stateInfo.candidates.forEach (ele => {
                    let candidate = guild.members.find (ele2 => ele2.id == ele.candidateID);
                    nameArray.push (candidate.nick || candidate.username);
                })
                nameString = '`' + nameArray.join ('`| `') + '`';
                embed.fields.push (
                    {name: 'Candidates:', value: nameString, inline: true},
                    {name: 'Candidate Count:', value: stateInfo.candidates.length, inline: true},
                    {name: 'Time Left:', value: '3 days', inline: true}
                )
            }
            else if (votingProcess == 'result') {
                let totalVotes = 0; candidates = [];
                stateInfo.candidates.forEach ((ele) => {
                    if (ele.votes == null) ele.votes = 0;
                    totalVotes += ele.votes;
                })
                if (totalVotes == 0) totalVotes = 1;
                stateInfo.candidates.sort ((a, b) => a.votes - b.votes)
                let array = ['First', 'Second', 'Third']
                array.forEach ((ele, index) => {
                    let candidateInfo = stateInfo.candidates[index]
                    if (index == 0) governorID = candidateInfo.candidateID
                    if (candidateInfo == null) return embed.fields.push ({name: ele + ':', value: 'Nobody', inline: true})
                    let memberObject = guild.members.find (ele2 => ele2.id == candidateInfo.candidateID);
                    if (ele.votes == null) ele.votes = 0;
                    return embed.fields.push ({name: ele + ':', value: (memberObject.nick || memberObject.username) + ': `' + Math.floor(((candidateInfo.votes)/(totalVotes)) * 100) + '%`', inline: true})
                })
                if (governorRole) governorRole.delete ()
                try {
                    attachment = votePercentageImage (stateInfo.candidates, totalVotes, guild);
                    embed.image = {url: 'attachment://image.png'};
                }
                catch {};
                let citizenRole = guild.roles.find (ele => ele.id == process.env.ROLE_CITIZEN);
                let newGovernorRole = await guild.createRole ({name: stateConfig.postalCode.toUpperCase() + ' Governor', color: 16711680});
                stateCategory.editPermission (newGovernorRole.id, 603454785, 0, 'role');
                newGovernorRole.editPosition (citizenRole.position);
                let newGovernorMember = guild.members.find (ele => ele.id = candidates[0].candidateID);
                newGovernorMember.addRole(newGovernorRole.id);
                let userInfo = getUserInfo(newGovernorMember, guild);
                userInfo.experience += 1.5;
                let timing = userInfo.timing.find (ele => ele.event == 'application');
                if (timing) {
                    let voterIndex;
                    timing.timestamp = new Date (Date.now() + 3888000000);
                    userInfo.timing.forEach ((ele, index) => {if (ele.event == 'application') voterIndex = index});
                    userInfo.timing.set (voterIndex, timing);
                }
                else userInfo.timing.push ({event: 'application', timestamp: new Date(Date.now() + time)});
                userInfo.save()
            }
            else if (votingProcess == 'empty') {
                if (governorRole) governorRole.delete ()
                let statesChannelArray = stateCategory.channels.filter (ele => ele.parentID == stateCategory.id && !ele.name.startsWith('╙')) || [];
                statesChannelArray.forEach (ele => ele.delete);
                governorID = '';
                welcomeMessage = '';
            }
            else if (votingProcess == 'application') candidates = [];
            await timeout ((333 * ele) + 1000);
            setStateInfo (stateInfo, {votingProcess: votingProcess, candidates: candidates, governorID: governorID, welcomeMessage: welcomeMessage});
            if (votingProcess) {
                stateChannel.createMessage ({content: stateRole.mention + ',', embed: embed})
                let bannedArray = stateCategory.permissionOverwrites.filter (ele => ele.type == 'member' && ele.deny == '1024');
                bannedArray.forEach (async (ele, index) => {
                    let bannedObject = guild.members.find (mem => mem.id == ele.id);
                    let stateRole = guild.roles.find (ele => ele.name.toLowerCase() == stateConfig.name.toLowerCase());
                    if (!bannedObject.roles.includes (stateRole.id)) return;
                    await timeout (1000 * index)
                    let bannedChannel = await bannedObject.user.getDMChannel();
                    bannedChannel.createMessage({content: stateRole.mention + ',', embed: embed})
                })
            }
        })
    })
    setTimeout (() => {
        schedule.stop()
    }, 86400000)
})

module.exports = {
    name: 'election',
    summoner: electionConfig.alias,
    async execute (message, args) {
        let member = message.member;
        let guild = message.channel.guild;
        let userInfo = await getUserInfo (member, guild)
        let stateConfig = config.places[userInfo.state];
        let stateInfo = await getStateInfo (guild, stateConfig.postalCode);
        embed = {timestamp: new Date().toISOString()}
        let attachment;
        if (commandConfig.run.includes (args[1])) {
            if (stateInfo.votingProcess != 'application') return errorLog (message, args, 'Election', 'timing', [stateConfig.name + ' governor applications', 'Every 50 days'])
            let cooldown = userTiming (message, args, userInfo, 'application', 864000000)
            if (cooldown != true) return;
            if (!args[2]) return errorLog (message, args, 'Election', 'invalidUsage', ['speech']);
            let stateRole = guild.roles.find (ele => ele.name.toLowerCase() == stateConfig.name.toLowerCase());
            let people = guild.members.filter (ele => ele.roles.includes(stateRole.id)).length;
            let index = message.content.toLowerCase().indexOf(args[2]);
            let content = message.content.slice(index).replace(/[\r\n]+/gm,' ');
            if (content.length >= 256) content = content.slice(0, 255) + '...';
            embed.title = 'Election - Running';
            embed.color = randomColor ('white');
            embed.description = member.mention + ' is now running for the title of governor of ' + stateConfig.name + '.';
            embed.fields = [
                {name: 'State:', value: stateConfig.name, inline: true},
                {name: 'Population:', value: people, inline: true},
                {name: 'Total Candidates:', value: Object.keys(stateInfo.candidates).length + 1, inline: true},
                {name: 'Speech:', value: content, inline: false}
            ]
            stateInfo.candidates.push ({candidateID: member.id, message: content})
        }
        else if (commandConfig.vot.includes (args[1])) {
            if (stateInfo.votingProcess != 'voting') return errorLog (message, args, 'Election', 'timing', ['Voting in ' + stateConfig.name, 'Every 50 days']);
            let cooldown = userTiming (message, args, userInfo, 'voting', 432000000)
            if (cooldown != true) return;
            let votedID = args[2].match(/^<@!?(\d+)>$/) || args[2];
            if (Array.isArray (votedID)) votedID = votedID[1];
            let voted = (args[2]) ? guild.members.find (ele => ele.id == votedID) : null;
            if (!voted || args[3]) return errorLog (message, args, 'Election', 'invalidUsage', ['target'])
            let votedInfo; let totalVotes = 0; let votedIndex;
            stateInfo.candidates.forEach ((ele, index) => {
                totalVotes = totalVotes + (ele.votes || 0);
                if (ele.candidateID == voted.id) {votedInfo = ele; votedIndex = index};
            })
            if (votedInfo == null) return errorLog (message, args, 'Election', 'invalidUsage', ['target']);
            if (votedInfo.votes == null) votedInfo.votes = 0;
            votedInfo.votes = votedInfo.votes + 1
            embed.title = 'Election - Voting';
            embed.color = randomColor ('white');
            embed.description = member.mention + ' had just voted for ' + voted.mention + ' for the title of governor of ' + stateConfig.name + '.';
            embed.fields = [
                {name: 'Candidate:', value: voted.mention, inline: true},
                {name: 'Votes:', value: votedInfo.votes, inline: true},
                {name: 'Percentage:', value: Math.floor(((votedInfo.votes)/(totalVotes + 1)) * 100) + '%', inline: true},
                {name: 'Speech:', value: votedInfo.message, inline: false}
            ]
            userInfo.money = userInfo.money + 15;
            userInfo.save()
            stateInfo.candidates.set (votedIndex, votedInfo)
        }
        else if (commandConfig.dta.includes (args[1])) {
            if (args[2]) return errorLog (message, args, 'Election', 'invalidUsage', ['command'])
            stateInfo.votingProcess = 'empty'
            let stateRole = guild.roles.find (ele => ele.name.toLowerCase() == stateConfig.name.toLowerCase());
            let people = guild.members.filter (ele => ele.roles.includes(stateRole.id)).length;
            let governorRole = guild.roles.find (ele => ele.name.toLowerCase() == ((stateConfig.postalCode.toUpperCase() + ' Governor').toLowerCase()));
            let governor = (governorRole) ? guild.members.find (ele => ele.roles.includes(governorRole.id)) : null;
            if (stateInfo.votingProcess == null) stateInfo.votingProcess = 'empty'
            embed.title = 'Election - Data';
            embed.color = randomColor ('blue');
            embed.description = 'Here is some data about ' + stateConfig.name + '\'s election.';
            embed.fields = [
                {name: 'State:', value: stateConfig.name, inline: true},
                {name: 'Process:', value: stateInfo.votingProcess.charAt(0).toUpperCase() + stateInfo.votingProcess.slice(1).toLowerCase(), inline: true},
                {name: 'Population:', value: people, inline: true},
                {name: 'Governor:', value: (governor) ? governor.mention : 'No current governor of ' + stateConfig.name, inline: true}
            ]
            if (stateInfo.votingProcess == 'empty' || stateInfo.votingProcess == 'cancelled') {
                if (stateInfo.votingProcess == 'cancelled') embed.fields.push ({name: 'Cancellation:', value: 'Election cancelled for not matching requirements', inline: true})
                embed.fields.push ({name: 'Requirements:', value: 'Population: `5+`|\nCandidates: `1+`', inline: true})
            }
            if (stateInfo.votingProcess == 'result' || stateInfo.votingProcess == 'empty') {
                let currentStateDay;
                Object.keys (config.places).forEach ((ele, index) => {if (config.places[ele].name == stateConfig.name) currentStateDay = index});
                let dayState = stateDay (Date.now(), 0);
                let day = Math.abs((currentStateDay - dayState) % 50);
                if (stateInfo.votingProcess == 'result') embed.fields.push ({name: 'Governor Role:', value: (governorRole) ? governorRole.mention : 'No governor role', inline: true});
                embed.fields.push ({name: 'Next Election:', value: ((day == 0) ? 50 : day) + ' day' + ((day == 1) ? '' : 's'), inline: true})
                try {
                    attachment = timeLeftImage (day);
                    embed.image = {url: 'attachment://image.png'};
                }
                catch {};
            }
            if (stateInfo.votingProcess == 'voting' || stateInfo.votingProcess == 'application') {
                let nameArray = [];
                stateInfo.candidates.forEach (ele => {
                    let candidate = guild.members.find (ele2 => ele2.id == ele.candidateID);
                    nameArray.push (candidate.nick || candidate.username);
                })
                if (nameArray == []) nameString = 'No running candidates';
                else nameString = '`' + nameArray.join ('`| `') + '`';
                embed.fields.push ({name: 'Candidates:', value: nameString, inline: true})
                if (stateInfo.votingProcess == 'voting') {
                    stateInfo.candidates.sort ((a, b) => a.votes - b.votes)
                    let totalVotes = 0; let memberObject; let totalString = '';
                    stateInfo.candidates.forEach ((ele) => {
                        if (ele.votes == null) ele.votes = 0;
                        totalVotes = totalVotes + ele.votes;
                    })
                    if (totalVotes == 0) totalVotes = 1;
                    stateInfo.candidates.forEach ((ele, index) => {
                        if (index <= 2) {
                            if (ele.votes == null) ele.votes = 0
                            memberObject = guild.members.find (ele2 => ele2.id == ele.candidateID);
                            totalString = totalString + (memberObject.nick || memberObject.username) + ': `' + Math.floor(((ele.votes)/(totalVotes)) * 100) + '%' + '`|\n'
                        }
                    })
                    try {
                        attachment = votePercentageImage (stateInfo.candidates, totalVotes, guild);
                        embed.image = {url: 'attachment://image.png'};
                    }
                    catch {};
                    embed.fields.push ({name: 'Succeeders:', value: totalString.slice(0, -2), inline: true})
                }
                else embed.fields.push ({name: 'Total Candidates:', value: nameArray.length, inline: true})
            }
        }
        else if (commandConfig.cnd.includes (args[1])) {
            if (stateInfo.votingProcess != 'voting' && stateInfo.votingProcess != 'application') return errorLog (message, args, 'Election', 'timing', ['Election cycle of ' + stateConfig.name, 'Every 50 days']);
            let votedID = args[2].match(/^<@!?(\d+)>$/) || args[2];
            if (Array.isArray (votedID)) votedID = votedID[1];
            let voted = (args[2]) ? guild.members.find (ele => ele.id == votedID) : null;
            if (!voted || args[3]) return errorLog (message, args, 'Election', 'invalidUsage', ['target']);
            let votedInfo; let totalVotes = 0;
            stateInfo.candidates.forEach (ele => {
                totalVotes = totalVotes + (ele.votes || 0);
                if (ele.candidateID == voted.id) votedInfo = ele;
            })
            if (votedInfo == null) return errorLog (message, args, 'Election', 'invalidUsage', ['target']);
            if (votedInfo.votes == null) votedInfo.votes = 0;
            votedInfo.votes = votedInfo.votes + 1
            embed.title = 'Election - Candidate';
            embed.color = randomColor ('blue');
            embed.description = 'Here is some data about ' + voted.mention + '\'s candidacy in ' + stateConfig.name + '\'s election.';
            embed.fields = [
                {name: 'Candidate:', value: voted.mention, inline: true},
                {name: 'Votes:', value: votedInfo.votes, inline: true},
                {name: 'Percentage:', value: Math.floor(((votedInfo.votes)/(totalVotes + 1)) * 100) + '%', inline: true},
                {name: 'Speech:', value: votedInfo.message, inline: false}
            ]
        }
        else return errorLog (message, args, 'Election', 'invalidUsage', ['command']);
        message.channel.createMessage ({content: member.mention + ',', embed: embed}, ((attachment) ? {file: attachment.toBuffer(), name: 'image.png'} : null));
        await timeout (50)
        return stateInfo.save();
    }
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

function setStateInfo (stateInfo, field) {
    stateInfo.set (field)
    return stateInfo.save ();
}

function stateDay (day, daysSince) {
    let J2000 = new Date('01/01/2000');
    let differenceDay = Math.floor((day - J2000.getTime()) / 86400000);
    if (daysSince) differenceDay = differenceDay - daysSince;
    return (differenceDay % 50);
}

function userTiming (message, args, userInfo, event, time) {
    let timing = userInfo.timing.find (ele => ele.event == event)
    if (timing && timing.timestamp >= Date.now()) return errorLog (message, args, 'Election', 'cooldown', [((timing.timestamp - Date.now())/1000).toFixed(1), event.charAt(0).toUpperCase() + event.slice(1)])
    if (timing) {
        let voterIndex;
        timing.timestamp = new Date(Date.now() + time)
        userInfo.timing.forEach ((ele, index) => {if (ele.event == event) voterIndex = index})
        userInfo.timing.set (voterIndex, timing);
    }
    else userInfo.timing.push ({event: event, timestamp: new Date(Date.now() + time)});
    userInfo.save();
    return true;
}

function votePercentageImage (candidates, totalVotes, guild) {
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(300, -100, 600, 400);
    grd.addColorStop(0, '#000026');
    grd.addColorStop(1, '#000040');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.beginPath();
    ctx.arc (150, 150, 125, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(32, 32, 64, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#0d0d0d';
    ctx.lineWidth = 5;
    let grayChange = 140 / ((candidates.length > 3) ? 3 : (candidates.length - 1));
    let radiusChange = 40 / ((candidates.length > 3) ? 3 : (candidates.length - 1));
    let nameChange = 250 / ((candidates.length > 3) ? 4 : (candidates.length))
    let index; let percentage = 0; let gray = 40; let radius = 100; let name = 25 + (nameChange / 2);
    ctx.textBaseline = 'middle';
    for (index = 0; index < 2; index++) {
        if (candidates[index]) {
            percentage += (candidates[index].votes / totalVotes);
            ctx.beginPath();
            if (percentage < 0.95) {
                ctx.moveTo (150, 150);
                ctx.lineTo (150, 150 - radius);
            }
            ctx.arc (150, 150, radius, Math.PI * 1.5, ((2 * Math.PI) * -percentage) + (Math.PI * 1.5), true);
            if (percentage < 0.95) ctx.lineTo (150, 150)
            ctx.fillStyle = 'rgb(' + gray + ', ' + gray + ', ' + gray + ')';
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.font = 'bold 25px Verdana';
            ctx.textAlign = 'right';
            let percentText = ((candidates[index].votes / totalVotes) * 100).toFixed(0) + '%'
            let percentTextWidth = ctx.measureText(percentText).width;
            ctx.moveTo (395 - percentTextWidth, name);
            ctx.arcTo (395 - percentTextWidth, name + 20, 415 - percentTextWidth, name + 20, 20);
            ctx.lineTo (390, name + 20)
            ctx.arcTo (410, name + 20, 410, name, 20)
            ctx.arcTo (410, name - 20, 390, name - 20, 20)
            ctx.lineTo (415 - percentTextWidth, name - 20)
            ctx.arcTo (395 - percentTextWidth, name - 20, 395 - percentTextWidth, name, 20);
            ctx.stroke();
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = ((gray <= 128) ? '#f2f2f2' : '#0d0d0d');
            ctx.fillText (percentText, 405, name);
            let member = guild.members.find (ele => ele.id == candidates[index].candidateID);
            ctx.beginPath();
            ctx.fillStyle = '#cccccc';
            ctx.font = 'bold 38px Verdana';
            ctx.textAlign = 'left';
            let memberName = (member.nick || member.username) + '.';
            do {memberName = memberName.slice(0, -1)}
            while (ctx.measureText(memberName).width > 375);
            if (memberName != member.nick && memberName != member.username) memberName += '...'
            ctx.fillText (memberName, 440, name);
            radius -= radiusChange;
            gray += grayChange;
            name += nameChange;
        }
    }
    if (candidates[3] && candidates[3].votes > 0) {
        ctx.arc (150, 150, radius, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgb(' + gray + ', ' + gray + ', ' + gray + ')';
        ctx.fill();
        ctx.stroke();
    }
    return messageImage;
}

function timeLeftImage (daysLeft) {
    if (daysLeft == 0) daysLeft = 50
    const messageImage = canvas.createCanvas(900, 300);
    const ctx = messageImage.getContext('2d');
    let grd = ctx.createLinearGradient(300, -100, 600, 400);
    grd.addColorStop(0, '#ffd9d9');
    grd.addColorStop(1, '#ffb3b3');
    ctx.fillStyle = grd;
    ctx.fillRect (0, 0, 900, 300);
    ctx.beginPath();
    ctx.arc (750, 150, 125, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(128, 96, 96, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#0d0d0d';
    ctx.lineWidth = 5;
    let index = 0; let gray = 200;
    for (index = 0; index <= ((daysLeft - 1) / 5); index++) {
        ctx.beginPath();
        let radius = 100;
        let curve = 4;
        let rotation = index;
        let rotationEnd = index;
        if (index >= (daysLeft / 5) - 1) {
            let remainder = daysLeft % 5;
            if (remainder == 0) remainder = 5;
            radius -= (5 - remainder) * 15;
            curve -= (5 - remainder) * 0.8;
            rotation += (5 - remainder) * 0.027;
            rotationEnd -= (5 - remainder) * 0.027;
        }
        ctx.fillStyle = 'rgb(' + gray + ', ' + gray + ', ' + gray + ')';
        let startX = 750 + (Math.sin((-(index + 0.45)/5) * Math.PI) * 10);
        let startY = 150 + (Math.cos(((index + 0.45)/5) * Math.PI) * -10);
        let nextX = 750 + (Math.sin((-rotation/5) * Math.PI) * (radius - 5));
        let nextY = 150 + (Math.cos((rotation/5) * Math.PI) * -(radius - 5));
        ctx.moveTo (startX, startY);
        ctx.lineTo (nextX, nextY);
        ctx.arcTo (750 + (Math.sin((-rotation/5) * Math.PI) * radius), 150 + (Math.cos((rotation/5) * Math.PI) * -radius), 750 + (Math.sin((-(rotation + 0.1)/5) * Math.PI) * radius), 150 + (Math.cos(((rotation + 0.1)/5) * Math.PI) * -radius), curve)
        ctx.lineTo (750 + (Math.sin((-(rotationEnd + 0.8)/5) * Math.PI) * radius), 150 + (Math.cos(((rotationEnd + 0.8)/5) * Math.PI) * -radius))
        ctx.arcTo (750 + (Math.sin((-(rotationEnd + 0.9)/5) * Math.PI) * radius), 150 + (Math.cos(((rotationEnd + 0.9)/5) * Math.PI) * -radius), 750 + (Math.sin((-(rotationEnd + 0.9)/5) * Math.PI) * (radius - 5)), 150 + (Math.cos(((rotationEnd + 0.9)/5) * Math.PI) * -(radius - 5)), curve)
        ctx.lineTo (startX, startY);
        ctx.lineTo (nextX, nextY);
        ctx.stroke();
        ctx.fill();
        gray -= 12;
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    let additionalInfo = [
        {
            description: 'Applications',
            value: ((daysLeft - 6 <= 0) ? ((daysLeft - 6) + 50) : (daysLeft - 6))
        },
        {
            description: 'Voting',
            value: ((daysLeft - 3 <= 0) ? ((daysLeft - 3) + 50) : (daysLeft - 3))
        },
        {
            description: 'Results',
            value: parseInt(daysLeft)
        }
    ]
    for (index = 0; index <= 2; index++) {
        let textY = 50 + (index * 100)
        ctx.fillStyle = '#261f1f';
        ctx.beginPath();
        ctx.font = 'bold 25px Verdana';
        let dayText = additionalInfo[index].value.toFixed(0) + ' D'
        let dayTextWidth = ctx.measureText(dayText).width;
        ctx.moveTo (485 - dayTextWidth, textY);
        ctx.arcTo (485 - dayTextWidth, textY + 20, 505 - dayTextWidth, textY + 20, 20);
        ctx.lineTo (490, textY + 20)
        ctx.arcTo (510, textY + 20, 510, textY, 20)
        ctx.arcTo (510, textY - 20, 490, textY - 20, 20)
        ctx.lineTo (505 - dayTextWidth, textY - 20)
        ctx.arcTo (485 - dayTextWidth, textY - 20, 485 - dayTextWidth, textY, 20);
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = '#d9bdbd';
        ctx.fillText (dayText, 497, textY);
        let description = additionalInfo[index].description ;
        ctx.beginPath();
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 38px Verdana';
        ctx.fillText (description, 400, textY);
    }
    return messageImage;
}