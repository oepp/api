const express = require("express");
const router = express.Router();
const mysql = require('mysql');
const validator = require('validator');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'oepp',
    database: 'oepp'
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

router.post('/register', function(req,res) {
    const data = req.body;
    if(data.name !== "" && data.surname !== "" && data.email !== "" && data.username !== "" && data.password !== ""){
        if(!validator.isEmail(data.email)){
            res.status(200).json({ status: 'error', message: "Not correct e-mail." });
        }else{
                const sql = "INSERT INTO user (name, surname, email, username, password) VALUES ?";
                const values = [
                    [data.name, data.surname, data.email, data.username, data.password]
                ];
                console.log("Inserting users.");
                connection.query(sql, [values], function (err, result) {
                    if (err) throw err;
                    console.log("Number of records inserted: " + result.affectedRows);
                    res.status(200).json({ status: 'success', message: "Inserted Data!"});
                });
        }
    }else{
        res.status(200).json({
            status: "error"
        });
    }
});

module.exports = router;