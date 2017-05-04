const http = require('http')
var express = require('express');
var bravia = require('./lib');

var app = express();

const port = 5006;
const tvIP = process.env.SONY_TV_IP;
const pskKey = process.env.SONY_TV_PSKKEY;

// Set up the server
app.get('/command/:command', function (req, res) {
	// Get the command
	var command = req.params.command;

	// Confirm the command
	console.log('Running command ' + command);

	// Call the Bravia function. 
	bravia(tvIP, pskKey, function(client) {
		// Call a command
		client.execCommand(command);

		// Send back the ok status.
		res.sendStatus(200);
  	});
});

// Set up the server
app.get('/getPowerStatus', function (req, res) {
	// Confirm the command
	console.log('Getting power status');

	// Call the Bravia function. 
	bravia(tvIP, pskKey, function(client) {
		// Call a command
		console.log(client);
		client.getPowerStatus(function (response) {
			res.setHeader('Content-Type', 'application/json');
			if(response && response.error) {
				res.send(500, response);
			} else {
				res.send(200, response);
			}
		});
  	});
});

app.get('/:intent', function (req, res) {
	// Get the intent 
	var intent = req.params.intent;
 	
	// Confirm the intent
	console.log('Running ' + intent);

	// Call the Bravia function. 
	bravia(tvIP, pskKey, function(client) {
		// Call a command
		client.exec(intent);

		// Send back the ok status.
		res.sendStatus(200);
  	});
});

// Set up the port listener
app.listen(port, function () {
	console.log('Bravia service running on ' + port + ', for sony tv ' + tvIP + '.');
});
