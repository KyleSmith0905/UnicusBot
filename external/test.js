module.exports = {
    name: 'test', // Name referred to execute
    description: 'To test new updates', // Description of file
    summoner: ['test'], // Things that activate this
    cooldown: 1,
    execute (message, args) {
        if (message.author.id == config.owner) {
            if (args[1] == '2') {
                let activerole = message.member.roles.cache
                .each (rol => console.log (rol.name))
                .filter (rol => JSON.stringify(Object.values(config.places)).includes(rol.name))
                .each (rol => message.member.roles.remove(rol)); // Gets player's state role
            }
            else if (args[1] == '3') {
                const uri = 'mongodb+srv://FiNSFlexin:happyn06@amediscord-j3h3c.mongodb.net/discord?retryWrites=true&w=majority';
                mongo.connect (uri, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                });
                const userinfo = require ('../database/userinfo.js');
                userinfo.findOne ({
                    userID: message.author.id,
                    serverID: message.guild.id
                },
                (err, info) => {
                    if (info) {
                        message.reply (`You have **$${info.money}**!`)
                    }
                    else {
                        message.reply (`You have **$0**!`)
                        const newuserinfo = new userinfo ({
                            userID: message.author.id,
                            serverID: message.guild.id,
                            money: 0,
                            state: 'ny'
                        });
                        newuserinfo.save();
                    }
                })
            }
            else if (args[1] == '4') {
                let newrole = message.guild.roles.cache.find (role => args[2] == role.name.toLowerCase());
                message.member.roles.add (newrole)
            }
            else if (args[1] == '5') {
                Object.values(config.places).forEach (placeval => {
                    console.log (placeval);
                    let roletoadd = message.guild.roles.cache.find (rol => placeval.name == rol.name);
                    message.member.roles.add (roletoadd);
                })
            }
        } 
        else {
            message.reply ('This is purely for testing bot commands, only the bot owner can activate these').then (sentMessage => { // If can't travel anywhere
                sentMessage.delete({timeout: config.autodelete.sent});
                message.delete ({timeout: config.autodelete.receive})
            });
        }
    }
}