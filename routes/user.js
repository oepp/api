const express = require("express");
const router = express.Router();

router.post('/register', function(req,res) {
    res.status(200).json({
        status: "success"
    });
});

module.exports = router;