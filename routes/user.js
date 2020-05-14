const express = require("express");
const router = express.Router();
const mysql = require('mysql');
const validator = require('validator');
const sgMail = require('@sendgrid/mail');
const mailgun = require("mailgun-js");
const DOMAIN = process.env.DOMAIN_KEY;
const mg = mailgun({apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN});
const connection = mysql.createPool({
    connectionLimit: 100,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

router.post('/register', function(req,res) {
    const data = req.body;
    if(data.name !== "" && data.surname !== "" && data.email !== "" && data.username !== "" && data.password !== ""){
        if(data.password !== data.confirmpassword){
            return res.status(200).json({ status: 'error', message: "Password not matching!"});
        }
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
                req.session.UserID = result[0].UserID;
                req.session.email = result[0].email;
                req.session.name = result[0].name;
                req.session.surname = result[0].surname;
                res.status(200).json({ status: 'success', message: "Checked Data!"});
            }
            else{
                res.status(200).json({ status: 'error', message: "Incorrect username/password" });
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
            to: "nedretcelik97@gmail.com",
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



router.post('/feedback', async function(req,res) {
    const data = req.body;
    if (req.session === undefined || !req.session.loggedin) {
        return res.status(401).send({ status: "error", message: "Not logged in" });
    } else {
        if(data.feedbackmessage !== "" && data.gameId !== undefined && data.rating !== undefined && req.session.UserID){
            await connection.query('SELECT * FROM feedback WHERE feedbackFrom = ? AND gameId = ?', [req.session.UserID, data.gameId], async function(error,result,fields){
                if(result.length>0) {
                    return res.status(200).send({ status: 'error', message: "You can only submit one feedback for each course."});
                }else{
                    const sql = "INSERT INTO feedback (feedbackFrom, feedbackMessage, gameId, rating) VALUES ?";
                    const values = [
                        [req.session.UserID, data.feedbackmessage, data.gameId, data.rating]
                    ];
                    console.log("Inserting feedback.");
                    await connection.query(sql, [values], async function (err, result) {
                        if (err){
                            console.log(err);
                        }
                    });

                    // const emailMsg = {
                    //     from: "OEPP <postmaster@sandboxb035355204c840d887be78db5f2d0bc2.mailgun.org>",
                    //     to: data.email,
                    //     text: "This feedback message from " + data.email + ". "  + data.feedbackmessage,
                    //  };
                    // mg.messages().send(emailMsg, function (error, body) {
                    //     console.log(body);
                    // });
                    res.status(200).json({ status: 'success', message: "Feedback sent." });
                }
            })
        }else{
            res.status(200).json({ status: 'error', message: "Please enter feedback message."});
        }
    }
});


router.post('/forgot/password', async function(req,res) {
    const data = req.body;
    if(data.email !== ""){
        if(!validator.isEmail(data.email)){
            res.status(200).json({ status: 'error', message: "Not correct e-mail." });
        }else{
            await connection.query('SELECT * FROM user WHERE email = ?', [data.email], async function(error,result,fields){
                if(result.length>0) {
                    const sql = "UPDATE user SET passwordResetCode = ? WHERE email = ?";
                    console.log("Updating users.");
                    const resetCode = Math.random().toString().slice(2);
                    await connection.query(sql, [resetCode,data.email], async function (err, result) {
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

router.get('/logout', function(req,res) {
    if(req.session){
        req.session.destroy(function(error){
            const logoutUrl = encodeURI(process.env.APP_URL + "/Login")
            res.redirect(logoutUrl);
        })
    }
});

router.get('/profile', async function(req, res) {
    if (req.session === undefined || !req.session.loggedin) {
        return res.status(401).send({ status: "error", message: "Not logged in" });
    } else {
        connection.query('SELECT * FROM user WHERE UserID = ?', [req.session.UserID], function(error,result,fields){
            if (result.length > 0) {
                const retData = {
                    name: result[0].name,
                    surname: result[0].surname,
                    email: result[0].email,
                    username: result[0].username,
                    password: result[0].password
                };

                return res.status(200).send({ status: "success", data: retData })
            } else {
                return res.status(200).send({ status: "error", message: "User not found" });
            }
        });
    }
})

router.get('/profile/contents', async function(req, res) {
    if (req.session === undefined || !req.session.loggedin) {
        return res.status(401).send({ status: "error", message: "Not logged in" });
    } else {
        const contents = [];
        await connection.query('SELECT c.*, g.* FROM Contents c LEFT JOIN GAMES g ON c.Gameid = g.idGames WHERE c.usr_id = ?', [req.session.UserID], function(error,result,fields){
            if (result && result.length > 0) {
                console.log(result);
                for (let i=0; i < result.length; i++) {
                    const temp = {
                        id: result[i].Gameid,
                        course: result[i].GameTitle,
                        income: result[i].Income
                    }
                    contents.push(temp);
                }
            }

            return res.status(200).send({ status: "success", data: contents })
        });
    }
})

router.post('/profile', async function(req, res) {
    const data = req.body;
    if (req.session === undefined || !req.session.loggedin) {
        return res.status(401).send({ status: "error", message: "Not logged in" });
    } else {
        const params = [
            data.name, data.surname, data.email, data.username, data.email
        ];

        await connection.query('UPDATE user SET name = ?, surname = ?, email = ?, username = ? WHERE email = ?', params, async function(error,result,fields){
            if (result && result.affectedRows && result.affectedRows === 1) {
                let retMsg = "Updated user successfully.";
                if (data.password !== "") {
                    await connection.query('UPDATE user SET password = ? WHERE email = ?', [data.password, data.email], function(error,result,fields){
                        console.log("Updating password");
                        if (result && result.affectedRows && result.affectedRows === 1) {
                            retMsg += " Password updated.";
                        }
                        return res.status(200).send({ status: "success", message: retMsg })
                    });
                } else {
                    return res.status(200).send({ status: "success", message: retMsg })
                }
            }else {
                return res.status(200).send({ status: "error", message: "User data not updated" });
            }
        });
    }
});

router.get('/feedback/list', async function(req, res) {
    if (req.session === undefined || !req.session.loggedin) {
        return res.status(401).send({ status: "error", message: "Not logged in" });
    } else {
        const feedbackList = [];
        await connection.query('SELECT f.*, g.* FROM feedback f LEFT JOIN GAMES g ON f.gameId = g.idGames', [], function(error,result,fields){
            if (result.length > 0) {
                for (let i = 0; i < result.length; i++) {
                    const temp = {
                        id: result[i].id,
                        title: result[i].GameTitle,
                        message: result[i].feedbackMessage,
                        rating: result[i].rating,
                        timestamp: result[i].timestamp
                    }
                    feedbackList.push(temp);
                }
            }

            return res.status(200).send({ status: "success", data: feedbackList })
        });
    }
})

module.exports = router;