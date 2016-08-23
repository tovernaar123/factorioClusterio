// Library for create folder if it does not exist
var mkdirp = require("mkdirp");
var nedb = require("nedb")
var fs = require("fs");
// require config.json
var config = require('./config');

var express = require("express");
// Required for express post requests
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set folder to serve static content from (the website)
app.use(express.static('static'));
// Set convenient paths to 3rd party libs like metroUI and jquery from their bower installs
// Use this to make it nice an easy to change without touching the HTML in production
app.use(express.static('bower_components/metro-dist'));
app.use(express.static('bower_components/jquery/dist'));

// set up database
var Datastore = require('nedb');
db = {};
db.items = new Datastore({ filename: 'database/items.db', autoload: true });

db.items.additem = function(object) {
	db.items.findOne({name:object.name}, function (err, doc) {
		// console.dir(doc);
		if (doc) {
			// Update existing items if item name already exists
			object.count = Number(object.count) + Number(doc.count);
			db.items.update(doc, object, {multi:true}, function (err, numReplaced) {
			});
		} else {
			// If command does not match an entry, insert new document
			db.items.insert(object);
			console.log('Item created!');
		}
	})
}
db.items.removeitem = function(object, res) {
	db.items.findOne({name:object.name}, function (err, doc) {
		// console.dir(doc);
		if (err) {
			res.send('failure');
			return false
		} else {
			if (doc) {
				// Update existing items if item name already exists
				if(Number(doc.count) > Number(object.count)) {
					console.log("removed: " + object.name + " " + object.count);
					object.count = Number(doc.count) - Number(object.count);
					db.items.update(doc, object, {multi:true}, function (err, numReplaced) {});
					res.send("success");
					return true;
				} else {
					res.send('failure');
				}
			} else {
				res.send('failure');
			}
		}
	})
}

// endpoint to send items to
app.post("/place", function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	console.log("added: " + req.body.name + " " + req.body.count);
	// save items we get
	db.items.additem(req.body)
	// Attempt confirming
	res.send("success");
});

// endpoint to remove items from DB when client orders items
app.post("/remove", function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	// save items we get
	db.items.removeitem(req.body, res);
});
// endpoint for getting an inventory of what we got
app.get("/inventory", function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	// Check it and send it
	db.items.find({}, function (err, docs) {
		res.send(docs);
	});
});

var server = app.listen(config.masterPort || 8080, function () {
	console.log("Listening on port %s...", server.address().port);
});
