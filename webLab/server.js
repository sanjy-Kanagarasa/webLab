var express = require('express');
var bodyparser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;

var app = express();

// Static file hosting
app.use('/router', express.static('router'));

// Connect to database
var db;
var studentsTable;
MongoClient.connect('mongodb://localhost:27017/myproject2', function (err, _db) {
  if (err) throw err; // Let it crash
  console.log("Connected to MongoDB");
    

  db = _db;
  studentsTable = db.collection('students'); // Save some keystrokes..
   
});

// Disconnect after CTRL+C
process.on('SIGINT', function() {
  console.log("Shutting down Mongo connection");
  db.close();
  process.exit(0);
});

app.get('/api/users', function (req, res) {
  studentsTable.find().toArray(function (err, students) {
    // TODO Handle error
    res.status(200).json(students);
  });
});

app.use(bodyparser.json());

app.post('/api/user', function (req, res) {
  newUser = { 'name': req.body.name, 'firstname': req.body.firstname, 'count': req.body.count, 
            'ex1': req.body.ex1, 
            'ex2': req.body.ex2,
            'ex3': req.body.ex3,
            'ex4': req.body.ex4,
            'ex5': req.body.ex5,
            'ex6': req.body.ex6,
            'ex7': req.body.ex7};
    //console.log(studentsTable); 
  studentsTable.insert(newUser, function (err, result) {
    // TODO Handle error
    studentsTable.find().toArray(function (err, students) {
      // TODO Handle error
      res.status(201).json(students);
        
    });
  });
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

app.post('/api/updateUser', function(req, res) {
  updateUser = { 'name': req.body.name, 'firstname': req.body.firstname, 'count': /*req.body.count*/parseInt(req.body.count), 
                'ex1': req.body.ex1, 
                'ex2': req.body.ex2,
                'ex3': req.body.ex3,
                'ex4': req.body.ex4,
                'ex5': req.body.ex5,
                'ex6': req.body.ex6,
                'ex7': req.body.ex7};
    var id = req.body.id;
    
  studentsTable.updateOne( {'name': req.body.name}, {$set: updateUser}, function (err, result) {
    // TODO Handle error
    studentsTable.find().toArray(function (err, persons) {
      // TODO Handle error
      res.status(200).json(persons);
    });
  });
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(3000);
