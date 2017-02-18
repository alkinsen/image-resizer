var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');
var gm1 = new require('gm');
var gm = gm1.subClass({ imageMagick: true });
var accessKeyId = "********************************";
var secretAccessKey = "***************************";
var AWS = require('aws-sdk');
var ce = require('colour-extractor');

var s3 = new AWS.S3({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
        region: 'us-east-1'
    }
);
var color;

//Just the name is given: return the image if found at s3 bucket.
router.get('/image/upload/:name', function (req, res, next) {
    var name = req.params.name;
    var path = 'your/image/upload/path/';
    var options = {
        Bucket: 'yourbucketname',
        Key: path + name
    };

    s3.headObject(options, function (err, metadata) {
        if (!err) {
            var fileStream = s3.getObject(options).createReadStream();
            fileStream.pipe(res);
        }
    });
});


//Args and name is given: If the given manipulation of the image exists in s3 bucket, return it.
//If it does not exists in s3, do the given manipulation, return it to user and upload to s3 bucket.

//Name is given and metadata is asked: If the image with the given name exists, return its metadata.
router.get('/image/upload/:args/:name', function (req, res, next) {
    var args = req.params.args;
    var name = req.params.name;
    var path = 'your/image/upload/path/';
    var options = {
        Bucket: 'yourbucketname',
        Key: path + args + '/' + name
    };

    if (name === 'metadata') {
        console.log('Metadata is asked');
        name = args;
        args = 'metadata';
        options = {
            Bucket: 'yourbucketname',
            Key: path + name
        };
    }
    console.log("Args: " + args);
    console.log("Name: " + name);
    console.log("Key: " + options.Key);

    s3.headObject(options, function (err, metadata) {
        if (err && err.code === 'NotFound') {
            options = {
                Bucket: 'yourbucketname',
                Key: path + name
            };
            console.log("Not Found... New Key: " + options.Key);
            s3.headObject(options, function (err, metadata) {
                if (!err) {
                    var fileStream = s3.getObject(options).createReadStream();
                    var argsArray = args.split(',');
                    console.log(argsArray);

                    for (var i = 0; i < argsArray.length; i++) {
                        var arg1 = argsArray[i].split('_')[0];
                        var arg2 = argsArray[i].split('_')[1];
                        if (arg1 == 'c') {
                            var method = arg2;
                        } else if (arg1 == 'w') {
                            var width = arg2;
                        } else if (arg1 == 'h') {
                            var height = arg2;
                        } else if (arg1 == 'x') {
                            var x = arg2;
                        } else if (arg1 == 'y') {
                            var y = arg2;
                        } else if (arg1 == 'g') {
                            var arg3 = argsArray[i].split('_')[2];
                            var g = arg2.charAt(0).toUpperCase() + arg2.slice(1).toLowerCase()
                            if (typeof arg3 != 'undefined') {
                                g += arg3.charAt(0).toUpperCase() + arg3.slice(1).toLowerCase()
                            }
                            ;
                        } else if (arg1 == 'ar') {
                            var ar = arg2;
                        } else if (arg1 == 'metadata') {
                            method = 'metadata';
                        } else if(arg1 == 'a'){
                            var a = arg2;
                            if(name.split('.')[1] == 'png'){
                                color = '#00ffffff'
                            }else{
                                color = '#ffffff'
                            }
                        }
                    }

                    if (typeof method === 'undefined') {
                        method = 'resize';
                    }

                    console.log('method: ' + method);
                    switch (method) {
                        case 'resize':
                            resize(width, height, a, fileStream, res, path, args, name);
                            break;
                        case 'crop':
                            crop(width, height, x, y, g, ar, a, fileStream, res, path, args, name);
                            break;
                        default:
                            console.log("default: " + method);
                    }
                } else {
                    console.log('File not found');
                }
            });
        } else {
            //File exists in s3, return the image, if metadata is asked return info.
            var fileStream = s3.getObject(options).createReadStream();
            if (args == 'metadata') {
                getMetaData(fileStream, res);
            } else {
                var fileStream = s3.getObject(options).createReadStream();
                fileStream.pipe(res);
            }

        }
    });
});

function getMetaData(fileStream, res) {
    //metadata will return {width, height, colors[frequency, [r,g,b]]}
    console.log('MetaData method is called');
    gm(fileStream).size({bufferStream: true}, function (err, size) {
        var width = size.width;
        var height = size.height;
        this.write('temp.jpg', function (err) {
            ce.colourKey('temp.jpg', function (colours) {
                var json = JSON.stringify({width: width, height: height, colors_frequency_rgb: colours});
                res.send(json);
            });
        });
    });


}

function crop(width, height, x, y, g, ar, a, fileStream, res, path, args, name) {
    console.log('In the crop');
    if (typeof width === 'undefined' && typeof  height === 'undefined' && typeof ar != 'undefined') {
        //Aspect ratio is given, if aspect ratio is greater than 1, crop height, if it is between 0 and 1, crop width
        gm(fileStream)
            .size({bufferStream: true}, function (err, size) {
                if(ar>1) {
                    height = size.width / ar;
                    width = size.width;
                }else if(ar>0){
                    height = size.width;
                    width = size.width*ar;
                };

                this.crop(width, height).rotate(color,a).stream(function (err, stdout, stderr) {
                    var buf = new Buffer(0);
                    stdout.pipe(res);
                    stdout.on('data', function (d) {
                        buf = Buffer.concat([buf, d]);
                    });
                    stdout.on('end', function () {
                        var data = {
                            Bucket: 'yourbucketname',
                            Key: path + args + '/' + name,
                            Body: buf
                        };
                        s3.putObject(data, function (err, resp) {
                            console.log("Done\n");
                        });
                    });

                });
            });
    } else if (typeof  x === 'undefined' && typeof y === 'undefined') {
        console.log('crop and gravity ' + g);
        //crop with the given width, height and gravity
        gm(fileStream)
            .gravity(g)
            .crop(width, height)
            .rotate(color,a)
            .stream(function (err, stdout, stderr) {
                var buf = new Buffer(0);
                stdout.pipe(res);
                stdout.on('data', function (d) {
                    buf = Buffer.concat([buf, d]);
                });
                stdout.on('end', function () {
                    var data = {
                        Bucket: 'yourbucketname',
                        Key: path + args + '/' + name,
                        Body: buf
                    };
                    s3.putObject(data, function (err, resp) {
                        console.log("Done\n");
                    });
                });
            });
    } else {
        //crop with the given width, height, x and y values
        gm(fileStream)
            .crop(width, height, x, y)
            .rotate(color,a)
            .stream(function (err, stdout, stderr) {
                var buf = new Buffer(0);
                stdout.pipe(res);
                stdout.on('data', function (d) {
                    buf = Buffer.concat([buf, d]);
                });
                stdout.on('end', function () {
                    var data = {
                        Bucket: 'yourbucketname',
                        Key: path + args + '/' + name,
                        Body: buf
                    };
                    s3.putObject(data, function (err, resp) {
                        console.log("Done\n");
                    });
                });
            });
    }
}

function resize(width, height, a, fileStream, res, path, args, name) {
    console.log('In the resize');
    if (typeof height === 'undefined') {
        if (width > 0 && width <= 1) {
            //Only width is given and it is between 0 and 1 so image width will be scaled with the given value,
            // height will be adjusted to preserve the aspect ratio
            gm(fileStream)
                .size({bufferStream: true}, function (err, size) {
                    width *= size.width;
                    console.log(width);
                    this.resize(width).rotate(color,a).stream(function (err, stdout, stderr) {

                        var buf = new Buffer(0);
                        stdout.pipe(res);
                        stdout.on('data', function (d) {
                            buf = Buffer.concat([buf, d]);
                        });
                        stdout.on('end', function () {
                            var data = {
                                Bucket: 'yourbucketname',
                                Key: path + args + '/' + name,
                                Body: buf
                            };
                            s3.putObject(data, function (err, resp) {
                                console.log("Done\n");
                            });
                        });

                    });
                });
        } else {
            //Only width is given that is greater than 0,
            //Resize image width to given value, height is adjusted to preserve the aspect ratio
            gm(fileStream)
                .resize(width)
                .rotate(color,a)
                .stream(function (err, stdout, stderr) {
                    var buf = new Buffer(0);
                    stdout.pipe(res);
                    stdout.on('data', function (d) {
                        buf = Buffer.concat([buf, d]);
                    });
                    stdout.on('end', function () {
                        var data = {
                            Bucket: 'yourbucketname',
                            Key: path + args + '/' + name,
                            Body: buf
                        };
                        s3.putObject(data, function (err, resp) {
                            console.log("Done\n");
                        });
                    });
                });
        }
    } else if (typeof width === 'undefined') {
        if (height > 0 && height <= 1) {
            //Only height is given and it is between 0 and 1, image height will be scaled with the given value,
            //Width will be adjusted to preserve the aspect ratio
            gm(fileStream)
                .size({bufferStream: true}, function (err, size) {
                    height *= size.height;
                    console.log("New height: " + height);
                    this.resize(null, height).rotate(color,a).stream(function (err, stdout, stderr) {

                        var buf = new Buffer(0);
                        stdout.pipe(res);
                        stdout.on('data', function (d) {
                            buf = Buffer.concat([buf, d]);
                        });
                        stdout.on('end', function () {
                            var data = {
                                Bucket: 'yourbucketname',
                                Key: path + args + '/' + name,
                                Body: buf
                            };
                            s3.putObject(data, function (err, resp) {
                                console.log("Done\n");
                            });
                        });

                    });
                });
        } else {
            //Only height is given that is greater than 0,
            //Resize image height to given value, width is adjusted to preserve the aspect ratio
            gm(fileStream)
                .resize(null, height)
                .rotate(color,a)
                .stream(function (err, stdout, stderr) {
                    var buf = new Buffer(0);
                    stdout.pipe(res);
                    stdout.on('data', function (d) {
                        buf = Buffer.concat([buf, d]);
                    });
                    stdout.on('end', function () {
                        var data = {
                            Bucket: 'yourbucketname',
                            Key: path + args + '/' + name,
                            Body: buf
                        };
                        s3.putObject(data, function (err, resp) {
                            console.log("Done\n");
                        });
                    });
                });

        }
    } else if ((height > 0 && height <= 1) || (width > 0 && width <= 1)) {
        //Both width and height is given and one or both of them are between 0 and 1
        //If one of them is between 0 and 1, scale it with the given image size, if not resize the image according to the given input
        gm(fileStream)
            .size({bufferStream: true}, function (err, size) {
                if (height > 0 && height <= 1) {
                    height *= size.height;
                };
                if (width > 0 && width <= 1) {
                    width *= size.width;
                };
                console.log("New Width: " + width + " New Height: " + height);
                this.resize(width, height, '!').rotate(color,a).stream(function (err, stdout, stderr) {

                    var buf = new Buffer(0);
                    stdout.pipe(res);
                    stdout.on('data', function (d) {
                        buf = Buffer.concat([buf, d]);
                    });
                    stdout.on('end', function () {
                        var data = {
                            Bucket: 'yourbucketname',
                            Key: path + args + '/' + name,
                            Body: buf
                        };
                        s3.putObject(data, function (err, resp) {
                            console.log("Done\n");
                        });
                    });

                });
            });
    } else {
        //Both width and height is given and they are greater than 1
        //resize to given width and height - aspect ratio is not preserved
        gm(fileStream)
            .resize(width, height, '!')
            .rotate(color,a)
            .stream(function (err, stdout, stderr) {
                var buf = new Buffer(0);
                stdout.pipe(res);
                stdout.on('data', function (d) {
                    buf = Buffer.concat([buf, d]);
                });
                stdout.on('end', function () {
                    var data = {
                        Bucket: 'yourbucketname',
                        Key: path + args + '/' + name,
                        Body: buf
                    };
                    s3.putObject(data, function (err, resp) {
                        console.log("Done\n");
                    });
                });
            });
    }
}

module.exports = router;
