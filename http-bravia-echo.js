const http = require('http')
var express = require('express');
var bravia = require('./lib');

var app = express();

const port = 5006;
const tvIP = process.env.SONY_TV_IP;
const pskKey = process.env.SONY_TV_PSKKEY;
const tvMac = process.env.SONY_TV_MAC;

// Set up the server
app.get('/sendIRCCCommand/:command', function (req, res) {
	var command = req.params.command;

	console.log('Running IRCC command: ' + command);

	bravia(tvIP, tvMac, pskKey, function(client) {
		// Call a command
		client.execCommand(command);

		// Send back the ok status.
		res.sendStatus(200);
  	});
});

app.get('/sendNamedIRCCCommand/:intent', function (req, res) {
	var intent = req.params.intent;
 	
	console.log('Running named IRCC command: ' + intent);

	bravia(tvIP, tvMac, pskKey, function(client) {
		// Call a command
		client.exec(intent);

		// Send back the ok status.
		res.sendStatus(200);
  	});
});

app.get('/getCommandList', function (req, res) {
	console.log('Getting power status');

	bravia(tvIP, tvMac, pskKey, function(client) {
		client.getCommandList(function (response) {
			res.setHeader('Content-Type', 'application/json');
			if(response.error) {
				res.send(500, response);
			} else {
				res.send(200, response);
			}
		});
  	});
});

app.get('/getPowerStatus', function (req, res) {
	console.log('Getting power status');

	bravia(tvIP, tvMac, pskKey, function(client) {
		client.getPowerStatus(function (response) {
			res.setHeader('Content-Type', 'application/json');
			if(response.error) {
				res.send(500, response);
			} else {
				res.send(200, response);
			}
		});
  	});
});

app.get('/getPlayingContentInfo', function (req, res) {
	console.log('Getting playing content info');

	bravia(tvIP, tvMac, pskKey, function(client) {
		client.getPlayingContentInfo(function (response) {
			res.setHeader('Content-Type', 'application/json');
			if(response.error) {
				res.send(500, response);
			} else {
				res.send(200, response);
			}
		});
  	});
});

app.get('/genericRequest', function (req, res) {
	if (req.query.parameters)
		console.log('Getting genericRequest: ' + req.query.path + ' with method ' + req.query.method + ' with params ' + JSON.stringify(req.query.parameters));
	else
		console.log('Getting genericRequest: ' + req.query.path + ' with method ' + req.query.method);

	bravia(tvIP, tvMac, pskKey, function(client) {
		client.genericRequest(req.query.path, req.query.method, req.query.parameters, function(response) {
			res.setHeader('Content-Type', 'application/json');
			if(response.error) {
				res.send(500, response);
			} else {
				res.send(200, response);
			}
		});
  	});
});


// Set up the port listener
app.listen(port, function () {
	console.log('Bravia service running on ' + port + ', for sony tv ' + tvIP + '.');
});
