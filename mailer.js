// ######## CRISIS EMAILER #############
var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
    host: 'in-v3.mailjet.com',
    port: 587,
    auth: {
        user: '3063e3533c5f069bd448f40680e67cf4',
        pass: '48e36b3a101d2be34dc5221b71d14fe3'
    }
});

// setup e-mail data with unicode symbols
var mailOptions = {
    from: 'LIVEBETTING MANAGER <manager@alphabetters.com>', // sender address
    to: 'elirankon@gmail.com, fishondor@gmail.com, adi.millis@gmail.com, lior.blacky@gmail.com', // list of receivers
    subject: 'LIVEBETTING HAS CRASHED', // Subject line
    text: 'Unknown Error' // plaintext body
};

// ###########################################

function setErrorMessage(text) {
    mailOptions.text = text;
};

exports.sendErrorEmail = function(text, callback) {
    setErrorMessage(text);
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error(error);
            callback();
        }
        else {
            console.log('Message sent: ' + info.response);
            callback();
        }
    });
};
