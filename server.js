require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
    res.json({
        recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
    });
});

app.post('/api/contact', async (req, res) => {
    const { name, email, company, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({ error: 'Email and message are required.' });
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        await transporter.sendMail({
            from: `"${name || 'Contact Form'}" <${process.env.SMTP_USER}>`,
            to: 'notification@drivingjobs.online',
            replyTo: email,
            subject: `New Inquiry from DrivingJobs Redirect: ${company || name}`,
            text: `Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\nMessage:\n${message}`,
            html: `
                <h3>New Inquiry from DrivingJobs Redirect</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Company:</strong> ${company}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `,
        });

        res.status(200).json({ success: 'Message sent successfully!' });
    } catch (error) {
        console.error('SMTP Error Detailed:', error);
        res.status(500).json({ error: 'Failed to send message. ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
