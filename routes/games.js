const express = require("express");
const router = express.Router();
const mysql = require('mysql');
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
const Select_All_Games = 'Select idGames,GameTitle,GameDescription,GameImage,CategoryName '+
'from GAMES JOIN Category ON(GAMES.CategoryID=Category.ID)';
const Select_GameFile ='Select GameTitle,GameDescription,CategoryID,GameFile,GameType from GAMES JOIN Questions On(GAMES.QuestionID=Questions.IdQuestion) WHERE GAMES.QuestionID IS NOT NULL AND Questions.GameType =';
// connection.connect(function(err) {
//     if (err) {
//         console.log("Error " + err);
//     }
//     console.log("Connected Games API!");
// });

router.get('/',(req,res)=>{
    res.send("Hello Api Go to Games for /getGames");
    });
     router.get('/getGames',(req,res)=>{
        connection.query(Select_All_Games,(err,results)=>{
        if(err){
            return res.send(err)
        }
        else{
            return res.json({
                data:results
            })
        }
        })
        });
        router.get('/getGames/:id',(req, res) => {
            let sql = Select_All_Games+'WHERE GAMES.CategoryID='+req.params.id;
            let query = connection.query(sql, (err, results) => {
             if(err){
                 return res.send(err)
             }
             else{
                 return res.json({
                     data:results
                    })
             }
            });
          });
          router.get('/getGameFile/:id',(req,res)=>{
            let sql = Select_GameFile+req.params.id;
            let query = connection.query(sql, (err, results) => {
                if(err){
                    return res.send(err)
                }
                else{
                    return res.json({
                        data:results
                       })
                }
               });
          })
          router.post('/addGame', function(req,res) {
            const data = req.body;
            if(data.GameTitle !== "" && data.GameDescription !== "" && data.GameImage !== null && data.CategoryID !== 0 ){
                    connection.query('SELECT * FROM GAMES WHERE GameTitle = ? AND GameDescription = ?', [data.GameTitle, data.GameDescription], function(error,result,fields){
                        if(result.length>0) {
                            res.status(200).json({ status: 'error', message: "Same name and description exsist"});
                        }else{
                            const sql = "INSERT INTO GAMES (GameTitle, GameDescription, GameImage, CategoryID) VALUES ?";
                            const values = [
                                [data.GameTitle, data.GameDescription, data.GameImage, data.CategoryID]
                            ];
                            console.log("Inserting games.");
                            connection.query(sql, [values], async function (err, result) {
                                if (err){
                                    console.log(err);
                                }
        
                                const emailMsg = {
                                    from: "OEPP <postmaster@sandboxb035355204c840d887be78db5f2d0bc2.mailgun.org>",
                                    to: data.email,
                                    subject: "Thanks for Adding game in our storage.",
                                    text: "Your game succesfully added."
                            };
                                mg.messages().send(emailMsg, function (error, body) {
                                    console.log(body);
                                });
                                console.log("Number of records inserted: " + result.affectedRows);
                                res.status(200).json({ status: 'success', message: "Inserted Data!"});
                            });
                        };
                    });
                
            }else{
                res.status(200).json({
                    status: "error"
                });
            }
        });
    module.exports = router;
