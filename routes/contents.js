const express = require("express");
const router = express.Router();
const mysql = require('mysql');
const connection = mysql.createPool({
    connectionLimit: 100,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});
// connection.connect(function(err) {
//     if (err) {
//         console.log("Error " + err);
//     }
//     console.log("Connected Contents API!");
// });
router.get('/',(req,res)=>{
    res.send("Hello Apı Go to Games for /getContents");
    });
router.get('/getContents/:id',(req, res) => {
    let sql = 'Select ReleaseTime,Income,GameImage,GameDescription,username,email from Contents JOIN GAMES ON(Contents.Gameid=GAMES.idGames)JOIN user ON(Contents.usr_id=user.UserID)WHERE Gameid ='+req.params.id;
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
