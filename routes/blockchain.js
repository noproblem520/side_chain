var express = require('express');
var router = express.Router();
let agent = require("../agent/getTVInfo.js")
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('frontend');
});

router.get('/getAvgTV', async function (req, res, next) {
    let result = await agent.getAvgTV();
    res.send({ "result": result });
});

router.get('/getLatestTVAry', async function (req, res, next) {
    let result = await agent.getLatestTVAry();
    res.send({ "result": result });
});


module.exports = router;
