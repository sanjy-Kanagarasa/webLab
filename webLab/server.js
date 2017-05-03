var express = require('express');
var bodyparser = require('body-parser');
var passwordHash = require('password-hash');
var MongoClient = require('mongodb').MongoClient;
var nodemailer = require("nodemailer");
var request = require('request');
var objectId = require("mongodb").ObjectId;
var app = express();

var smtpTransport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: "ip.belgium.finland@gmail.com",
        pass: "Ip20162017"
    }
});
var rand, mailOptions, host, link;

// Static file hosting
app.use('/', express.static('test'));

// Connect to database
var db;
var studentsTable;
MongoClient.connect('mongodb://localhost:27017/ipProject', function (err, _db) {
    if (err) throw err; // Let it crash
    console.log("Connected to MongoDB");
    
    db = _db;
    
    db.createCollection("people", { size: 2147483648 } );
    users = db.collection('users'); // Save some keystrokes..
    schools = db.collection('schools');
    userData = db.collection('data');
    testData =  db.collection('testData');
});


// Disconnect after CTRL+C
process.on('SIGINT', function () {
    console.log("Shutting down Mongo connection");
    db.close();
    process.exit(0);
});
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get('/api/users', function (req, res) {
    studentsTable.find().toArray(function (err, students) {
        // TODO Handle error
        res.status(200).json(students);
    });
});

app.use(bodyparser.json());

var url = 'https://thingspeak.com/channels/257227/feeds.json';

app.get('/api/dat', function (req, res) {
 request({
        url: url,
        json: true
    }, function (error, response, body) {

        res.status(200).json(body.feeds.entry_id);
        /*testData.insert(body, function (error, result) {
                if (error) {
                    res.status(400).json({
                        "text": "error",
                        "class": "info_show info_red",
                        "succes": false
                    });
                } else {
                    res.status(201).json({
                        "text": "You have to verify your email. Mail has been send, Please check your mail.",
                        "class": "info_show info_green",
                        "succes": true
                    });
                }
            });*/
    });
});
app.post('/api/createUser', function (req, res) {
    users.findOne({
        "email": req.body.email
    }, function (error, user) {
        if (user) {
            console.log("email in use");
            res.status(201).json({
                "text": "Email already in use",
                "class": "info_show info_red",
                "succes": false
            });
            if (!user.verified) {
                request.get("http://" + req.get('host') +"/send?to="+req.body.email);

            }
        } else {

            var newUser = {
                'name': {
                    'firstname': req.body.firstname,
                    'lastname': req.body.lastname
                },
                'email': req.body.email,
                'password': passwordHash.generate(req.body.password),
                'phone': req.body.phone,
                'address': {
                    'street': req.body.street,
                    'nr': req.body.nr,
                    'zipcode': req.body.zipcode,
                    'place': req.body.place,
                    'country': req.body.country
                },
                'birthday': new Date(req.body.bday),
                'type': req.body.type,
                'school': req.body.school,
                'class': req.body.class,
                'verified': false
            }
            users.insert(newUser, function (error, result) {
                if (error) {
                    res.status(400).json({
                        "text": "error",
                        "class": "info_show info_red",
                        "succes": false
                    });
                } else {
                    res.status(201).json({
                        "text": "You have to verify your email. Mail has been send, Please check your mail.",
                        "class": "info_show info_green",
                        "succes": true
                    });
                }
            });
            request.get("http://" + req.get('host') +"/send?to="+req.body.email);
            
        }
    });


});
app.post('/api/loginUser', function (req, res) {
    users.findOne({
        "email": req.body.email
    }, function (error, user) {
        if (user) {
            if (user.verified) {
                if (passwordHash.verify(req.body.password, user.password)) {
                    var u = user;
                    u.password = null;
                    res.status(200).json({
                        "text": "Login succes",
                        "class": "info_show info_green",
                        "succes": true,
                        "user": u
                    });
                } else {
                    res.status(200).json({
                        "text": "Password incorrect",
                        "class": "info_show info_red",
                        "succes": false
                    });
                }
            } else {
                res.status(200).json({
                    "text": "You have to verify your email first",
                    "class": "info_show info_red",
                    "succes": false
                });
                
                request.get("http://" + req.get('host') +"/send?to="+req.body.email);
            }
        } else {
            res.status(200).json({
                "text": "User not found",
                "class": "info_show info_red",
                "succes": false
            });
        }
    });
});
app.get('/send', function (req, res) {
    rand = Math.floor((Math.random() * 99999) + 54);
    host = req.get('host');
    link = "http://" + req.get('host') + "/verify?id=" + rand;
    mailOptions = {
        to: req.query.to,
        subject: "Please confirm your Email account",

        html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
        //html : index.html
    }
    users.findOne({
        "email": req.query.to
    }, function (error, user) {
        console.log(user.verified);
        if (user.verified) {
            res.status(201).json({
                "text": "You are verified.",
                "class": "info_show info_red"
            });
        } else {
            console.log(mailOptions);
            smtpTransport.sendMail(mailOptions, function (error, response) {
                if (error) {
                    console.log(error);
                    res.end("error");
                } else {
                    console.log("Message sent: " + response.message);
                    res.status(201).json({
                        "text": "Mail has been send, check your mail.",
                        "class": "info_show info_green"
                    });
                }
            });
        }
    });

});

app.get('/verify', function (req, res) {
    console.log(req.protocol + ":/" + req.get('host'));
    if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
        console.log("Domain is matched. Information is from Authentic email");
        if (req.query.id == rand) {
            console.log("email is verified");
            res.end("<h1>Email " + mailOptions.to + " is been Successfully verified");
            users.findOne({
                "email": mailOptions.to
            }, function (error, user) {
                console.log(user.verified);
                if (user.verified) {
                    res.status(201).json({
                        "text": "You are alredy verified.",
                        "class": "info_show info_red"
                    });
                } else {
                    users.update({
                        'email': mailOptions.to
                    }, {
                        $set: {
                            'verified': true
                        }
                    });
                }
            });
        } else {
            console.log("email is not verified");
            res.end("<h1>Bad Request</h1>");
        }
    } else {
        res.end("<h1>Request is from unknown source");
    }
});
app.post('/api/deleteUser', function (req, res) {
    newUser = {
        'name': req.body.name,
        'firstname': req.body.firstname
    };
    studentsTable.deleteOne(newUser, function (err, result) {
        // TODO Handle error 
        studentsTable.find().toArray(function (err, persons) {
            // TODO Handle error
            res.status(200).json(persons);
            console.log('Item deleted ' + req.body.name);
        });
    });
});


app.get('/api/schools', function (req, res) {
   
           schools.find().toArray(function (err, schools) {
            // TODO Handle error
            res.status(200).json(schools);
        });
});
app.get('/api/classes', function (req, res) {

    schools.findOne({
        "_id": objectId(req.query.schoolid)
    }, function (error, school) {

        res.status(201).json(school.classes);
    });
});

app.get('/api/charts/oneUser', function (req, res) {

    userData.find().toArray(function (err, data) {
            // TODO Handle error
            res.status(200).json(data);
        });
});


app.listen(3000);