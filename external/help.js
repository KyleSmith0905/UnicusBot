module.exports = {
    name: 'help', // Name referred to execute
    description: 'For help', // Description of file
    summoner: ['help', '?', 'helps', 'helped'], // Things that activate this
    cooldown: 5,
    execute (message, args) {
        try {
            let colors = ['d4002c', '004dc9', 'fefefe']; // American colors
            let color = colors [Math.floor(Math.random() * colors.length)]; // Random color
// TRAVEL ----------------------------------------------------------------------------------------------------------------------------------------------------------------
            if (config.help.travel.standard.includes (args[1])) { // If first argument was travel
                if (!args[2]) {
                    const embed = new discord.MessageEmbed() // Creating embed because everything works
                    .setAuthor (message.author.username, message.author.displayAvatarURL({format: "png", dynamic: true}))
                    .setColor (`0x${color}`)
                    .setTitle ('Help Command - Travel')
                    .setDescription ('The **travel command** allows you to travel to one state to another through various modes of transportation. These have their respective advantages and disadvantages with each.')
                    .addField ('Usage', 'The travel command is only to be used in their respective locations: `-<method> <location> <location> [additional]` or try `-drv tx ca`.')
                    .addField ('<method>', '**drv**: Car\n**fly**: Plane\n**rde**: Train\n**sal**: Boat', true)
                    .addField ('<location>', '`-help transport places`\n**??**: 2-letter acronym\n**rn**: random location', true)
                    .setTimestamp ()
                    message.channel.send ({embed}).then (sentMessage => { // Sends the embed message
                        sentMessage.delete({timeout: config.autodelete.help});
                    });
                    return message.delete ();
                }
                else if (config.help.travel.location.includes (args[2]) && !args[3]) { // For places argument only (lists all states)
                    const embed = new discord.MessageEmbed() // Creating embed because everything works
                    .setAuthor (message.author.username, message.author.displayAvatarURL({format: "png", dynamic: true}))
                    .setColor (`0x${color}`)
                    .setTitle ('Help Command - Travel - Location')
                    .setDescription ('The location argument of the **travel command** states the place where you are coming from and where you will be going, it could either be the 50 states or other selected places.')
                    .addField ('Usage', 'The location argument of the travel command is used with the travel command: `-<method> <location> <location> [additional]` or try `-drv tx ca`.')
                    .addField ('<location>', '**al**: Alabama\n**ak**: Alaska\n**az**: Arizona\n**ar**: Arkansas\n**ca**: California\n**co**: Colorado\n**ct**: Connecticut\n**de**: Delaware\n**fl**: Florida\n**ga**: Georgia\n**hi**: Hawaii\n**id**: Idaho\n**il**: Illinois\n**in**: Indiana\n**ia**: Iowa\n**ks**: Kansas\n**ky**: Kentucky\n**la**: Louisiana', true)
                    .addField ('** **', '**me**: Maine\n**md**: Maryland\n**ma**: Massachusetts\n**mi**: Michigan\n**mn**: Minnesota\n**ms**: Mississippi\n**mo**: Missouri\n**mt**: Montana\n**ne**: Nebraska\n**nv**: Nevada\n**nh**: New Hampshire\n**nj**: New Jersey\n**nm**: New Mexico\n**ny**: New York\n**nc**: North Carolina\n**nd**: North Dakota\n**oh**: Ohio\n**ok**: Oklahoma\n', true)
                    .addField ('** **', '**or**: Oregon\n**pa**: Pennsylvania\n**ri**: Rhode Island\n**sc**: South Carolina\n**sd**: South Dakota\n**tn**: Tennessee\n**tx**: Texas\n**ut**: Utah\n**vt**: Vermont\n**va**: Virginia\n**wa**: Washington\n**wv**: West Virginia\n**wi**: Wisconsin\n**wy**: Wyoming\n**dc**: District of Columbia\n**pr**: Puerto Rico\n**mx**: Mexico\n**cn**: Canada', true)
                    .setTimestamp ()
                    message.channel.send ({embed}).then (sentMessage => { // Sends the embed message
                        sentMessage.delete({timeout: config.autodelete.help});
                    });
                    return message.delete ();
                }
                else if (config.help.travel.method.includes (args[2]) && !args[3]) {
                    const embed = new discord.MessageEmbed() // Creating embed because everything works
                    .setAuthor (message.author.username, message.author.displayAvatarURL({format: "png", dynamic: true}))
                    .setColor (`0x${color}`)
                    .setTitle ('Help Command - Travel - Method')
                    .setDescription ('The method argument of the **travel command** states how you will be traveling, some methods may not be able to travel to certain locations.')
                    .addField ('Usage', 'The method argument of the travel command is used with the travel command: `-<method> <location> <location> [additional]` or try `-drv tx ca`.')
                    .addField ('<method>', '**drv**: Drive in a car to a nearby state\n**fly**: Fly in a plane to a distant state\n**rde**: Ride in a HSR train to a select state\n**sal**: Sail in a boat to a coastal state')
                    .setTimestamp ()
                    message.channel.send ({embed}).then (sentMessage => { // Sends the embed message
                        sentMessage.delete({timeout: config.autodelete.help});
                    });
                    return message.delete ();
                }
                else {
                    message.channel.send (`${message.author} Try typing just \`-help travel\``).then (sentMessage => { //extra arguments included
                        sentMessage.delete({timeout: config.autodelete.sent});
                        message.delete ({timeout: config.autodelete.received})
                    });
                }
            }
// HELP ------------------------------------------------------------------------------------------------------------------------------------------------------------------
            else if (!args[2] && (config.help.help.includes (args[1]) || !args[1])) {
                const embed = new discord.MessageEmbed() // Creating embed because everything works
                .setAuthor (message.author.username, message.author.displayAvatarURL({format: "png", dynamic: true}))
                .setColor (`0x${color}`)
                .setTitle ('Help Command - Help')
                .setDescription ('The **help command** helps you understand the various commands and their subcommands. It describes a description of the command, how to use it, and the arguments for it.')
                .addField ('Usage', 'The help command could be used in most channels: `-help <command> [subcommand]` or try `-help travel`.')
                .addField ('<command>', '**Help**: Help with how to use the bot, try `-help`\n**Travel**: Allows you to travel to new places `-help travel`', false) // Help command
                .setTimestamp ()
                message.channel.send ({embed}).then (sentMessage => { // Sends the embed message
                    sentMessage.delete({timeout: config.autodelete.help});
                });
                return message.delete ();
            }
            else {
                message.channel.send (`${message.author} Try typing just \`-help\``).then (sentMessage => { //extra arguments included
                    sentMessage.delete({timeout: config.autodelete.sent});
                    message.delete ({timeout: config.autodelete.received})
                });
            }
        }
        catch {
            message.channel.send (`${message.author} There was an error, try using just \`-help\``).then (sentMessage => { // Something didn't work
                sentMessage.delete({timeout: config.autodelete.sent});
                message.delete ({timeout: config.autodelete.received})
            });
        }
    }
}