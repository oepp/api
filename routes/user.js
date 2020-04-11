const express = require("express");
const router = express.Router();
const mysql = require('mysql');
const validator = require('validator');
const sgMail = require('@sendgrid/mail');
const mailgun = require("mailgun-js");
const DOMAIN = process.env.DOMAIN_KEY;
const mg = mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN});
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

                        const emailMsg = {
                            from: "OEPP <postmaster@sandboxb035355204c840d887be78db5f2d0bc2.mailgun.org>",
                            to: data.email,
                            subject: "Thanks for Registering.",
                            text: "Thank you for Registering in OEPP."
                    };
                        mg.messages().send(emailMsg, function (error, body) {
                            console.log(body);
                        });
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

        const emailMsg = {
            from: "OEPP <postmaster@sandboxb035355204c840d887be78db5f2d0bc2.mailgun.org>",
            to: data.email,
            subject: data.subjectType,
            text: "This message from " + data.email + ". "  + data.message,
    };
        mg.messages().send(emailMsg, function (error, body) {
            console.log(body);
        });
        res.status(200).json({ status: 'success', message: "Email sent." });
    }else{
        res.status(200).json({ status: 'error', message: "Please enter email or message." });
    }
});

router.post('/forgot/password', function(req,res) {
    const data = req.body;
    if(data.email !== ""){
        if(!validator.isEmail(data.email)){
            res.status(200).json({ status: 'error', message: "Not correct e-mail." });
        }else{
            connection.query('SELECT * FROM user WHERE email = ?', [data.email], function(error,result,fields){
                if(result.length>0) {
                    const sql = "UPDATE user SET passwordResetCode = ? WHERE email = ?";
                    console.log("Updating users.");
                    const resetCode = Math.random().toString().slice(2);
                    connection.query(sql, [resetCode,data.email], async function (err, result) {
                        if (err){
                            console.log(err);
                        }

                        const emailMsg = {
                            from: "OEPP <postmaster@sandboxb035355204c840d887be78db5f2d0bc2.mailgun.org>",
                            to: data.email,
                            subject: "OEPP Password Reset",
                            text: "Your Password Reset Code is: " + resetCode
                        };
                        mg.messages().send(emailMsg, function (error, body) {
                            console.log(body);
                        });
                        
                        res.status(200).json({ status: 'success', message: "Updated Data!"});
                    });
                }else{
                    res.status(200).json({ status: 'error', message: "Email does not exist!"});

                };
            });
        }
    }else{
        res.status(200).json({
            status: "error"
        });
    }
});

router.post('/forgot/confirm/password', function(req,res) {
    const data = req.body;
    if(data.passwordResetCode !== "" && data.password !== "" && data.confirmpassword !== "")  {
        if(data.password !== data.confirmpassword){
            res.status(200).json({ status: 'error', message: "Password not matching." });
        }else{
            connection.query('SELECT * FROM user WHERE passwordResetCode = ?', [data.passwordResetCode], function(error,result,fields){
                if(result.length>0) {
                    const sql = "UPDATE user SET password = ? WHERE passwordResetCode = ?";
                    console.log("Updating password.");
                    connection.query(sql, [data.password,data.passwordResetCode], async function (err, result) {
                        if (err){
                            console.log(err);
                        }                        
                        res.status(200).json({ status: 'success', message: "Updated Password!"});
                    });
                }else{
                    res.status(200).json({ status: 'error', message: "Reset Code does not exist!"});

                };
            });
        }
    }else{
        res.status(200).json({
            status: "error"
        });
    }
});

module.exports = router;