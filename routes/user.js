const express = require("express");
const router = express.Router();
const mysql = require('mysql');
const validator = require('validator');
const sgMail = require('@sendgrid/mail');
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

connection.connect(function(err) {
    if (err) {
        console.log("Error " + err);
    }
    console.log("Connected!");
});

router.post('/register', function(req,res) {
    const data = req.body;
    if(data.name !== "" && data.surname !== "" && data.email !== "" && data.username !== "" && data.password !== ""){
        if(!validator.isEmail(data.email)){
            res.status(200).json({ status: 'error', message: "Not correct e-mail." });
        }else{
            connection.query('SELECT * FROM user WHERE username = ? OR email = ?', [data.username, data.email], function(error,result,fields){
                if(result.length>0) {
                    res.status(200).json({ status: 'error', message: "Username/Email already exist!"});
                }else{
                    const sql = "INSERT INTO user (name, surname, email, username, password) VALUES ?";
                    const values = [
                        [data.name, data.surname, data.email, data.username, data.password]
                    ];
                    console.log("Inserting users.");
                    connection.query(sql, [values], async function (err, result) {
                        if (err){
                            console.log(err);
                        }

                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                        console.log("Api key: " + process.env.SENDGRID_API_KEY);
                        const msg = {
                            to: data.email,
                            from: "nedretcelik97@gmail.com",
                            subject: "Thanks for Registering.",
                            text: "Thank you for Registering in OEPP.",
                            html: '<strong>Thank you for Registering in OEPP</strong>',
                        };
                        await sgMail.send(msg);

                        console.log("Number of records inserted: " + result.affectedRows);
                        res.status(200).json({ status: 'success', message: "Inserted Data!"});
                    });
                };
            });
        }
    }else{
        res.status(200).json({
            status: "error"
        });
    }
});



router.post('/login', function(req,res) {
    const data = req.body;
    if(data.username !== "" && data.password !== ""){
        connection.query('SELECT * FROM user WHERE username = ? AND password = ?', [data.username, data.password], function(error,result,fields){
            if(result.length>0) {
                req.session.loggedin = true;
                req.session.username = data.username;
                res.status(200).json({ status: 'success', message: "Checked Data!"});
            }
            else{
                res.status(200).json({ status: 'error', message: "Not Correct" });
            }
        });
    }else{
        res.status(200).json({ status: 'error', message: "Please enter username or password." });
        

    }
});

router.post('/support', async function(req,res) {
    const data = req.body;
    if(data.email !== "" && data.subjectType !== "" && data.message !== ""){
        console.log("Sending email..");

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: "nedretcelik97@gmail.com",
            from: "nedretcelik97@gmail.com",
            subject: data.subjectType,
            text: "This message from " + data.email + ". "  + data.message,
            html: "This message from " + data.email + ". </br> </br> " + data.message ,
        };
        const sendEmail = await sgMail.send(msg); 
        console.log("send email " + sendEmail);
        res.status(200).json({ status: 'success', message: "Email sent." });
    }else{
        res.status(200).json({ status: 'error', message: "Please enter email or message." });
    }
});

module.exports = router;