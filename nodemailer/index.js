const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.mailtrap.io', // Host Mailtrap
    port: 587, // Port yang digunakan
    auth: {
        user: '36d713725297df', // Ganti dengan username Mailtrap Anda
        pass: '8c191b27354415' // Ganti dengan password Mailtrap Anda
    }
});

module.exports  = {transporter}