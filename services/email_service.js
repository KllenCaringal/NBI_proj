const nodemailer = require('nodemailer');

// Configure your email transport options
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'nbiaminuser@gmail.com', 
        pass: 'vnju hbck ukum ylmr' 
    }
});

const sendVerificationEmail = (email, verificationToken) => {
    const verificationLink = `http://localhost:8090/verify/${verificationToken}`;

    const mailOptions = {
        from: '"Furni" <your_email@gmail.com>', 
        to: email,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the link: ${verificationLink}`,
        html: `<p>Please verify your email by clicking the link: <a href="${verificationLink}">Verify Email</a></p>`
    };

    return transporter.sendMail(mailOptions);
};


module.exports = { sendVerificationEmail };
