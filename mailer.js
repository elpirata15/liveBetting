// ######## CRISIS EMAILER #############
var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'eliran.kononowicz@gmail.com',
        pass: 'Elir@nk0n86'
    }
});

// setup e-mail data with unicode symbols
var mailOptions = {
    from: 'LIVEBETTING MANAGER <eliran.kononowicz@gmail.com>', // sender address
    to: 'elirankon@gmail.com, fishondor@gmail.com, adi.millis@gmail.com', // list of receivers
    subject: 'LIVEBETTING HAS CRASHED', // Subject line
    text: 'Unknown Error' // plaintext body
};

// ###########################################

function setErrorMessage(text) {
    mailOptions.text = text;
};

exports.sendErrorEmail = function(text) {
    setErrorMessage(text);
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        }
        else {
            console.log('Message sent: ' + info.response);
        }
    });
};