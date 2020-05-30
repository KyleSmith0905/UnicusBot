module.exports = {
    name: 'travel', // Name referred to execute
    description: 'The transportation commands', // Description of file
    summoner: ['drv', 'fly', 'rde', 'sal', 'drive', 'car', 'automobile', 'plane', 'airplane', 'pilot', 'ride', 'train', 'railway', 'cruise', 'sail', 'boat'], // Things that activate this
    cooldown: 1,
    execute (message, args) {
        try {
            let activerole = message.member.roles.cache.find (rol => JSON.stringify(Object.values(config.places)).includes(rol.name)); // Gets player's state role
            if (activerole == null) { // If player doesn't have a role
                activerole = message.guild.roles.cache.get (config.roles.newyork); // Get New York role
                message.member.roles.add (activerole); // Add New York role to person
            }
            const uri = 'mongodb+srv://FiNSFlexin:happyn06@amediscord-j3h3c.mongodb.net/discord?retryWrites=true&w=majority';
            let locationdb = '';
            mongo.connect (uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            userinfodb.findOne ({ // Finds something in Mongoose with this info
                userID: message.author.id,
                serverID: message.guild.id
            },
            (err, userinfo) => { // Gets error and output
                if (userinfo) {
                    locationdb = userinfo.state; // Sets what state they "are at"
                }
                else {
                    const newuserinfo = new userinfodb ({
                        userID: message.author.id,
                        serverID: message.guild.id,
                        money: 0,
                        state: 'ny'
                    });
                    newuserinfo.save();
                    locationdb = userinfo.state; // Sets what state they "are at"
                }
            })
            let statearray = [];
            Object.values(config.places).forEach (placeval => statearray.push (placeval.name));
            message.member.roles.cache // Gets all roles
            .filter (rol => statearray.includes(rol.name)) // Only state roles
            .filter (rol => activerole.id == rol.id) // All except one's state
            .each (rol => message.member.roles.remove(rol)); // Remove player's state role
            let method = config.transport[args[0]]; // Gets mode of transportation
            activeroleid = Object.keys(config.places).find(key => config.places[key] == activerole.name); // Get the key of this... "Florida" to "fl"
            if (activeroleid !== locationdb) { // If database has different info than player
                locationdb = activeroleid; // Set database to player
                userinfodb.findOne ({ // Finds something in Mongoose with this info
                    userID: message.author.id,
                    serverID: message.guild.id
                }, 
                (err, userinfo) => { // Gets error and output
                    userinfo.state = activeroleid; // Update state on database
                    userinfo.save
                })
                message.member.roles.cache // Gets all roles
                .filter (rol => JSON.stringify(Object.values(config.places)).includes(rol.name)) // Only state roles
                .filter (rol => !activerole == rol) // All except one's state
                .each (rol => message.member.roles.remove(rol)); // Remove player's state role
            }
            let location1 = config.places[locationdb] // Gets primary location
            let location2 = config.places[args[1]]; // Gets secondary location
            if (location2 == 'Random') { // If going to random location
                const places = Object.values(config.places) // turns list into array
                if (method == 'Drive') {
                    let nplaces = places.filter(pl => !config.rdrv.includes(pl) && pl !== location1); // Random is not restricted and isn't starting location
                    location2 = nplaces[parseInt(Math.random() * nplaces.length)] // Random place
                }
                else if (method == 'Fly') {
                    let nplaces = places.filter(pl => !config.rfly.includes(pl) && pl !== location1); // Random is not restricted and isn't starting location
                    location2 = nplaces[parseInt(Math.random() * nplaces.length)] // Random place
                }
                else if (method == 'Ride') {
                    let nplaces = places.filter(pl => !config.rrde.includes(pl) && pl !== location1); // Random is not restricted and isn't starting location
                    location2 = nplaces[parseInt(Math.random() * nplaces.length)] // Random place
                }
                else if (method == 'Cruise') {
                    if (config.ocrsw.includes (location1)) {
                        let nplaces = places.filter(pl => config.ocrsw.includes(pl) && pl !== location1); // Random is not restricted and isn't starting location
                        location2 = nplaces[parseInt(Math.random() * nplaces.length)] // Random place
                    }
                    else if (config.ocrse.includes (location1)) {
                        let nplaces = places.filter(pl => config.ocrse.includes(pl) && pl !== location1); // Random is not restricted and isn't starting location
                        location2 = nplaces[parseInt(Math.random() * nplaces.length)] // Random place
                    }
                    else { // If starting state is not by an ocean
                        let chlocation1 = location1.replace(/\s+/g, '-').toLowerCase(); // Starting state into discord name
                        let flocation1 = message.guild.channels.cache.find (channel => channel.name === chlocation1); // Discord name into discord channel
                        return message.reply (`There is not a path connecting ${flocation1} to anywhere else`).then (sentMessage => { // If can't travel anywhere
                            sentMessage.delete({timeout: config.autodelete.sent});
                            message.delete ({timeout: config.autodelete.received})
                        });
                    }
                }
                args[1] = Object.keys(config.places).find(key => config.places[key] === location2); // Get the key of this... "Florida" to "fl"
            }
            let chlocation1 = location1.replace(/\s+/g, '-').toLowerCase(); // Starting state into discord name
            let chlocation2 = location2.replace(/\s+/g, '-').toLowerCase(); // Starting state into discord name
            let flocation1 = message.guild.channels.cache.find (channel => channel.name === chlocation1); // Discord name into discord channel
            let flocation2 = message.guild.channels.cache.find (channel => channel.name === chlocation2); // Discord name into discord channel
            let color = config.embedcolors.all [Math.floor(Math.random() * config.embedcolors.all.length)]; // Random color
            if (flocation1 == flocation2) { // Primary and secondary location are the same
                return message.reply ('You can\'t travel to somewhere you are already at!').then (sentMessage => {
                    sentMessage.delete({timeout: config.autodelete.sent});
                    message.delete ({timeout: config.autodelete.receive})
                });
            }
            let additional = '' // Additional information for footer
            if (args[2]) {
                additional = message.content.substring(message.content.indexOf(args[2])); // Everything after agument 2
            }
// DRIVE -----------------------------------------------------------------------------------------------------------------------------------------------------------------
            if (method == 'Drive' && flocation1 && flocation2) {
                const tchannel = message.guild.channels.cache.get (config.channels.drive);
                if (config.rdrv.includes(location1) || config.rdrv.includes(location2)) { // Checks for invalid travel
                    if (message.channel == tchannel) { // Right channel
                        return message.reply (`There are no roads connecting ${flocation1} to ${flocation2}!`).then (sentMessage => { // If can't travel anywhere
                            sentMessage.delete({timeout: config.autodelete.sent});
                            message.delete ({timeout: config.autodelete.receive})
                        });
                    }
                    else { // Not right channel
                        return message.reply (`There are no roads connecting ${flocation1} to ${flocation2}!\nIn addition, you should use ${tchannel} to drive!`).then (sentMessage => { // If can't travel anywhere
                            sentMessage.delete({timeout: config.autodelete.sent});
                            message.delete ({timeout: config.autodelete.receive})
                        });
                    }                    
                }
                else {
                    const cars = [':red_car:', ':blue_car:', ':minibus:']; // Gets emojis
                    const sounds = ['vrroooooom', 'skrrrrtttt', 'vrum-vroom']; // Gets car noises
                    const comings = ['arriving in', 'stopping at', 'visiting']; // Arrival phrasing
                    const leavings = ['is driving from', 'has exited', 'is traveling from']; // Leaving phrasing
                    let car1 = cars [Math.floor(Math.random() * cars.length)]; // Randomizer
                    let car2 = cars [Math.floor(Math.random() * cars.length)]; // Randomizer
                    let sound = sounds [Math.floor(Math.random() * sounds.length)]; // Randomizer
                    let coming = comings [Math.floor(Math.random() * comings.length)]; // Randomizer
                    let leaving = leavings [Math.floor(Math.random() * leavings.length)]; // Randomizer
                    let location1role = message.guild.roles.cache.find (role => role.name == location1); // Find the role of location1
                    let location2role = message.guild.roles.cache.find (role => role.name == location2); // Find the role of location2
                    message.member.roles.remove (location1role); // Remove location1 role
                    message.member.roles.add (location2role); // Add location2 role
                    const embed = new discord.MessageEmbed() // Creating embed because everything works
                    .setAuthor (message.author.username, message.author.displayAvatarURL({format: "png", dynamic: true}))
                    .setColor (`0x${color}`)
                    .setDescription (`${message.author} ${leaving} ${flocation1} ${car1} *${sound}*, ${coming} ${flocation2} ${car2}`)
                    .setTimestamp ()
                    .setFooter (additional)
                    if (message.channel == tchannel) { // Right channel
                        tchannel.send ({embed}); // Sends the embed message
                    }
                    else { // Not right channel
                        tchannel.send (`${message.author}, Use this channel to drive!`, {embed}) ; // Sends the embed message
                    }
                    return message.delete ();
                }
            }
// FLY -------------------------------------------------------------------------------------------------------------------------------------------------------------------
            else if (method == 'Fly') {
                const tchannel = message.guild.channels.cache.get (config.channels.fly);
                const planes1 = [':airplane:', ':airplane_departure:', ':seat:']; // Gets arrival emojis
                const planes2 = [':airplane:', ':airplane_arriving:', ':seat:']; // Gets leaving emojis
                const sounds = ['nyeeeerrmm', 'whoooosssh', 'pweeeeeew']; // Gets plane noises
                const comings = ['deplaning in', 'landing at', 'docking at']; // Arrival phrasing
                const leavings = ['is departuring from', 'is taking off from', 'is fleeing']; // Leaving phrasing
                let plane1 = planes1 [Math.floor(Math.random() * planes1.length)]; // Randomizer
                let plane2 = planes2 [Math.floor(Math.random() * planes2.length)]; // Randomizer
                let sound = sounds [Math.floor(Math.random() * sounds.length)]; // Randomizer
                let coming = comings [Math.floor(Math.random() * comings.length)]; // Randomizer
                let leaving = leavings [Math.floor(Math.random() * leavings.length)]; // Randomizer
                let location1role = message.guild.roles.cache.find (role => role.name == location1); // Find the role of location1
                let location2role = message.guild.roles.cache.find (role => role.name == location2); // Find the role of location2
                message.member.roles.remove (location1role); // Remove location1 role
                message.member.roles.add (location2role); // Add location2 role
                const embed = new discord.MessageEmbed() // Creating embed because everything works
                .setAuthor (message.author.username, message.author.displayAvatarURL({format: "png", dynamic: true}))
                .setColor (`0x${color}`)
                .setDescription (`${message.author} ${leaving} ${flocation1} ${plane1} *${sound}*, ${coming} ${flocation2} ${plane2}`)
                .setTimestamp ()
                .setFooter (additional)
                if (message.channel == tchannel) { // Right channel
                    tchannel.send ({embed}); // Sends the embed message
                }
                else { // Not right channel
                    tchannel.send (`${message.author}, Use this channel to ride on an airplane!`, {embed}); // Sends the embed message
                };
                return message.delete ();
            }
// RIDE ------------------------------------------------------------------------------------------------------------------------------------------------------------------
            else if (method == 'Ride') {
                const tchannel = message.guild.channels.cache.get (config.channels.ride);
                if (config.rrde.includes(location1) || config.rrde.includes(location2)){ // Checks for invalid travel
                    return message.reply (`There are no rails connecting ${flocation1} to ${flocation2}!`).then (sentMessage => { // If can't travel anywhere
                        sentMessage.delete({timeout: config.autodelete.sent});
                        message.delete ({timeout: config.autodelete.receive})
                    });
                }
                else {
                const train = [':bullettrain_side:', ':light_rail:', ':monorail:']; // Gets emojis
                const sounds = ['clieeketee', 'choo-chooo', 'chugachuga']; // Gets train noises
                const comings = ['riding to', 'alighting in', 'getting off at']; // Arrival phrasing
                const leavings = ['is riding from', 'is boarding in', 'has traveled from']; // Leaving phrasing
                let train1 = train [Math.floor(Math.random() * train.length)]; // Randomizer
                let train2 = train [Math.floor(Math.random() * train.length)]; // Randomizer
                let sound = sounds [Math.floor(Math.random() * sounds.length)]; // Randomizer
                let coming = comings [Math.floor(Math.random() * comings.length)]; // Randomizer
                let leaving = leavings [Math.floor(Math.random() * leavings.length)]; // Randomizer
                let location1role = message.guild.roles.cache.find (role => role.name == location1); // Find the role of location1
                let location2role = message.guild.roles.cache.find (role => role.name == location2); // Find the role of location2
                message.member.roles.remove (location1role); // Remove location1 role
                message.member.roles.add (location2role); // Add location2 role
                const embed = new discord.MessageEmbed() // Creating embed because everything works
                .setAuthor (message.author.username, message.author.displayAvatarURL({format: "png", dynamic: true}))
                .setColor (`0x${color}`)
                .setDescription (`${message.author} ${leaving} ${flocation1} ${train1} *${sound}*, ${coming} ${flocation2} ${train2}`)
                .setTimestamp ()
                .setFooter (additional)
                if (message.channel == tchannel) { // Right channel
                    tchannel.send ({embed}); // Sends the embed message
                }
                else { // Not right channel
                    tchannel.send (`${message.author}, Use this channel to take the train!`, {embed}); // Sends the embed message
                }
                return message.delete ();
                }
            }
// SAIL ------------------------------------------------------------------------------------------------------------------------------------------------------------------
            else if (method == 'Sail') {
                const tchannel = message.guild.channels.cache.get (config.channels.sail);
                const locationarray = [location1, location2];
                if (locationarray.every(l => config.osalw.includes(l)) || locationarray.every(l => config.osale.includes(l))) { // Checks for invalid travel
                    const boat = [':cruise_ship:', ':ferry:', ':ship:']; // Gets emojis
                    const sounds = ['vrreeeeeee', 'buuurrrrrr', 'vmmmmmmmmm']; // Gets boat noises
                    const comings = ['cruising to', 'voyaging to', 'just navigated to']; // Arrival phrasing
                    const leavings = ['had left', 'is boating from', 'has parted from']; // Leaving phrasing
                    let boat1 = boat [Math.floor(Math.random() * boat.length)]; // Randomizer
                    let boat2 = boat [Math.floor(Math.random() * boat.length)]; // Randomizer
                    let sound = sounds [Math.floor(Math.random() * sounds.length)]; // Randomizer
                    let coming = comings [Math.floor(Math.random() * comings.length)]; // Randomizer
                    let leaving = leavings [Math.floor(Math.random() * leavings.length)]; // Randomizer
                    let location1role = message.guild.roles.cache.find (role => role.name == location1); // Find the role of location1
                    let location2role = message.guild.roles.cache.find (role => role.name == location2); // Find the role of location2
                    message.member.roles.remove (location1role); // Remove location1 role
                    message.member.roles.add (location2role); // Add location2 role
                    const embed = new discord.MessageEmbed() // Creating embed because everything works
                    .setAuthor (message.author.username, message.author.displayAvatarURL({format: "png", dynamic: true}))
                    .setColor (`0x${color}`)
                    .setDescription (`${message.author} ${leaving} ${flocation1} ${boat1} *${sound}*, ${coming} ${flocation2} ${boat2}`)
                    .setTimestamp ()
                    .setFooter (additional)
                    if (message.channel == tchannel) { // Right channel
                        tchannel.send ({embed}); // Sends the embed message
                    }
                    else { // Not right channel
                        tchannel.send (`${message.author}, Use this channel to sail on a boat!`, {embed}); // Sends the embed message
                    }
                    return message.delete ();     
                }
                else { // If can't travel
                    return message.reply (`There is not a path connecting ${flocation1} to ${flocation2}!`).then (sentMessage => { // If can't travel anywhere
                        sentMessage.delete({timeout: config.autodelete.sent});
                        message.delete ({timeout: config.autodelete.receive})
                    }); 
                }
            }
        }
        catch { // Wrong syntax usage
            message.reply ('There was an error using the transport command, the correct syntax usage is `-<method> <location> [additional]`!\nYou could also type `-help travel`').then (sentMessage => { // If can't travel anywhere
                sentMessage.delete({timeout: config.autodelete.sent});
                message.delete ({timeout: config.autodelete.receive})
            });
        }
    }
}