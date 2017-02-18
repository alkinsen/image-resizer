var express = require('express');
var router = express.Router();
var fs = require('fs');
var accessKeyId =  "*****************";
var secretAccessKey = "*******************";
var AWS = require('aws-sdk');

var s3 = new AWS.S3({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
        region: 'us-east-1'
    }
);
/* GET home page. */
router.get('/', function(req, res, next) {


    var options = {
        Bucket    : 'yourbucketname',
        Key    : 'your/image/upload/sample.png',
    };

  var fileStream = s3.getObject(options).createReadStream();
  fileStream.pipe(res);
});

module.exports = router;
