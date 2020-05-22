module.exports = {
    name: 'refresh', // Name referred to execute
    description: 'To update the sqlite folder', // Description of file
    summoner: ['refresh'], // Things that activate this
    cooldown: 1,
    execute (message, args) {
        if (message.author.id !== '311258277365284866') {
            message.reply ('Only the bot owner can activate this command').then (sentMessage => replymessage(sentMessage));
        }
        else {
            message.author.send ('I\'m emailing you the results');
            const nodemailer = require('nodemailer');

            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'finsflexina@gmail.com',
                pass: 'Happyn06'
              }
            });
            
            var moment = require('moment');
            Subjectd = moment().format('YYYY-MM-DD');
            Textd = moment().format('YYYY-MM-DD || hh:mm:ss');

            const mailOptions = {
                from: 'finsflexina@gmail.com',
                to: 'ceohitman0905@live.com',
                subject: Subjectd + ' Database',
                text: 'Database as of: ' + Textd,
                attachments: [
                    { filename: 'json.sqlite', path: './json.sqlite' }
                ],
            };
            
            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent: ' + info.response);
              }
            });
        }
        function replymessage (sentMessage) {
            sentMessage.delete({timeout: config.autodelete.sent});
			message.delete ({timeout: config.autodelete.received});
		}
    }
}