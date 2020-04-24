const express = require("express");
const router = express.Router();
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});
const Select_All_Games = 'Select idGames,GameTitle,GameDescription,GameImage,CategoryName '+
'from GAMES JOIN Category ON(GAMES.CategoryID=Category.ID)';
connection.connect(function(err) {
    if (err) {
        console.log("Error " + err);
    }
    console.log("Connected Games API!");
});
router.get('/',(req,res)=>{
    res.send("Hello Apı Go to Games for /getGames");
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
    module.exports = router;
