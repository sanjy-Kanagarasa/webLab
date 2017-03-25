var express = require('express');
var bodyparser = require('body-parser');
var passwordHash = require('password-hash');
var MongoClient = require('mongodb').MongoClient;
var nodemailer = require("nodemailer");

var app = express();

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "ip.belgium.finland@gmail.com",
        pass: "Ip20162017"
    }
});
var rand,mailOptions,host,link;

// Static file hosting
app.use('/', express.static('test'));

// Connect to database
var db;
var studentsTable;
MongoClient.connect('mongodb://192.168.0.172:27017/ipProject', function (err, _db) {
  if (err) throw err; // Let it crash
  console.log("Connected to MongoDB");
    

  db = _db;
  users = db.collection('users'); // Save some keystrokes..
});
   

// Disconnect after CTRL+C
process.on('SIGINT', function() {
  console.log("Shutting down Mongo connection");
  db.close();
  process.exit(0);
});
app.use(function(req, res, next) {
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

app.post('/api/createUser', function (req, res) {

    users.findOne({
        "email": req.body.email
    }, function (error, user) {
        if (user) {
            res.status(201).json({
                "text": "Email already in use",
                "class": "info_show info_red"
            });
        } else {
            app.get('/send', function (reqe, resp) {
                rand = Math.floor((Math.random() * 99999) + 54);
                host = reqe.get('host');
                link = "http://" + reqe.get('host') + "/verify?id=" + rand;
                mailOptions = {
                    to: req.body.email,
                    subject: "Please confirm your Email account",

                    html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
                    //html : index.html
                }
                console.log(mailOptions);
                smtpTransport.sendMail(mailOptions, function (error, response) {
                    if (error) {
                        console.log(error);
                        resp.end("error");
                    } else {
                        console.log("Message sent: " + response.message);
                        resp.end("sent");
                    }
                });
            });
            /*
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
                'class': req.body.class
            }
            users.insert(newUser, function (error, result) {
                if (error) {
                    res.status(400).json({
                        "text": "error",
                        "class": "info_show info_red"
                    });
                } else {
                    res.status(201).json({
                        "text": "user created",
                        "class": "info_show info_green"
                    });
                }
            });*/
        }
    });

});
app.post('/api/loginUser', function(req, res){
    users.findOne({"email" : req.body.email}, function(error, user){
        if(user){
            if(passwordHash.verify(req.body.password, user.password)){
                var u = user;
                u.password = null;
                res.status(200).json({"text" : "Login succes", "class" : "info_show info_green", "succes" : true, "user" : u });
            }else{
                res.status(200).json({"text" : "Password incorrect", "class" : "info_show info_red", "succes" : false });
            }
        }
        else{
            res.status(200).json({"text" : "User not found", "class" : "info_show info_red", "succes" : false });
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
    console.log(mailOptions);
    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
            res.end("error");
        } else {
            console.log("Message sent: " + response.message);
            res.end("sent");
        }
    });
});

app.get('/verify',function(req,res){
console.log(req.protocol+":/"+req.get('host'));
if((req.protocol+"://"+req.get('host'))==("http://"+host))
{
	console.log("Domain is matched. Information is from Authentic email");
	if(req.query.id==rand)
	{
		console.log("email is verified");
		res.end("<h1>Email "+mailOptions.to+" is been Successfully verified");
	}
	else
	{
		console.log("email is not verified");
		res.end("<h1>Bad Request</h1>");
	}
}
else
{
	res.end("<h1>Request is from unknown source");
}
});
app.post('/api/deleteUser', function(req, res) {
  newUser = { 'name': req.body.name, 'firstname': req.body.firstname};
  studentsTable.deleteOne(newUser, function (err, result) {
    // TODO Handle error 
    studentsTable.find().toArray(function (err, persons) {
      // TODO Handle error
      res.status(200).json(persons);
        console.log('Item deleted ' + req.body.name);
    });
  });
});


app.listen(3000);
