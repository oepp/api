var express = require('express')
var router = express.Router();
var fs = require('fs')

router.get('/listele',function(req,res){
    fs.readFile('question.json','utf8',function(err,data){ 
    res.end(data)
    })
})
router.get('/ekle',function(req,res){
   var  newGame={
    "description": req.query.description,
    "lines": [
      {
        "items": [
          {
            "text": req.query.txt1,
            "isBlank": req.query.bl1
          }
        ]
      },
      {
        "items": [
          {
            "text": req.query.txt2,
            "isBlank": req.query.bl2
          },
          {
            "text": req.query.txt3,
            "isBlank": req.query.bl3
          }
        ]
      },
      {
        "items": [
          {
            "text": req.query.txt4,
            "isBlank": req.query.bl4
          },
          {
            "text": req.query.txt5,
            "isBlank": req.query.bl5
          },
          {
            "text": req.query.txt6,
            "isBlank": req.query.bl6
          },
          {
            "text": req.query.txt7,
            "isBlank": req.query.bl7
          }
        ]
      }
    ]
   }
   fs.readFile('question.json','utf8',function(err,data){    
    data = JSON.parse(data);
    console.log(data);
    res.end(JSON.stringify(data));
    fs.writeFile('question.json',JSON.stringify(data),function(err){
        console.log("Bir hata var usta."+err);
    });
});
})

module.exports=router;