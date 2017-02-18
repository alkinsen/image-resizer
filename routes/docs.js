var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('docsjade');
});

module.exports = router;
/**
 * Created by alkinsen on 17/05/2016.
 */
