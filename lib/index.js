
var request = require('request'),
    readline = require('readline'),
    uuid = require('node-uuid'),
    FileCookieStore = require('tough-cookie-filestore'),
    wol = require('wake_on_lan'),
    fs = require('fs');
    //arpTable = require('./arp_table.js');

// Now accepts a PSKKey. No longer requires authentication cookies, so allows for a permanent connection.
// Cookie method left in for completeness
var Bravia = function(ip, macAddress, pskkey, callback) {

  var that = this;

  this.ip = ip;
  this.macAddress = macAddress;
  this.device = ip;
  this.nickname = 'Pi';
  this.pskKey = pskkey;
  this.uuid = uuid.v1();
  this.cookieJar = request.jar(new FileCookieStore('cookies.json'));
  this.commands = {};

  if(callback !== undefined) {
    this.auth(function() {
      callback(that);
    });
  }

};

Bravia.prototype.execCommand = function(command) {

  var that = this;

  this.auth(function() {
    that.makeCommandRequest(command);
  });

};

Bravia.prototype.exec = function(command) {

  var that = this;

  if(command === 'PowerOn') {
    return this.wake();
  }

  this.auth(function() {
    that.getCommandCode(command, function(code) {
      that.makeCommandRequest(code);
    });
  });

};

Bravia.prototype.wake = function() {

  var that = this;

  wol.wake(that.macAddress, {port: 0, address: that.ip});
};

Bravia.prototype.getCommandList = function(callback) {

  var that = this;

  if(Object.keys(this.commands).length > 0) {
    if(callback !== undefined) {
      callback(this.commands);
    }
    return;
  }

  this.request({
    path: '/sony/system',
    json: {
      'id': 20,
      'method': 'getRemoteControllerInfo',
      'version': '1.0',
      'params': []
    }
  }, function(response) {

    if(response && response.result !== undefined && Object.keys(response.result).length === 2) {

      var list = response.result[1].map(function(item) {
        var i = {};
        i[item.name] = item.value;
        return i;
      });

      var commands = {};
      commands.PowerOn = '';

      for(var i in list) {
        for(var key in list[i]) {
          commands[key] = list[i][key];
        }
      }

      that.commands = commands;

      if(callback !== undefined) {
        callback(commands);
      }
    }

  });

};

Bravia.prototype.getCommandNames = function(callback) {

  this.getCommandList(function(list) {
    callback(Object.keys(list).join(', '));
  });

};

Bravia.prototype.makeCommandRequest = function(code, callback) {

  var body = '<?xml version="1.0"?>' +
    '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
      '<s:Body>' +
        '<u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">' +
          '<IRCCCode>' + code +'</IRCCCode>' +
        '</u:X_SendIRCC>' +
      '</s:Body>' +
    '</s:Envelope>';

  this.request({
    path: '/sony/IRCC',
    body: body,
    headers: {
      'Content-Type': 'text/xml; charset=UTF-8',
      'X-Auth-PSK' : this.pskKey,
      'SOAPACTION': '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"'
    }
  });

};

Bravia.prototype.getPowerStatus = function(callback) {

  this.request({
    path: '/sony/system',
    method: 'POST',
    json: true,
    headers: {
      "content-type": "application/json",
    },
    timeout: 4000,
    body: {"id":3,"method":"getPowerStatus","version":"1.0","params":["1.0"]}
  }, function(response) {
    if (response.error) {
      console.log('lib > getPowerStatus > response.error: ' + JSON.stringify(response));
    }

    if(callback !== undefined) {
      callback(response);
    }
  });

};

Bravia.prototype.getPlayingContentInfo = function(callback) {

  this.request({
    path: '/sony/avContent',
    body: {"id":1,"method":"getPlayingContentInfo","version":"1.0", "params": []},
    method: 'POST',
    json: true,
    headers: {
      "content-type": "application/json",
    },
    timeout: 4000
  }, function(response) {
    if (response.error) {
      console.log('lib > getPlayingContentInfo > response.error: ' + JSON.stringify(response));
    }

    if(callback !== undefined) {
      callback(response);
    }
  });

};

Bravia.prototype.genericRequest = function(path, method, parameters, callback) {
  this.request({
    path: path,
    body: {"id": 1, "method": method, "version": "1.0", "params": [parameters]},
    //body: {"id":1,"method":"getMethodTypes","version":"1.0", "params": [""]},
    method: 'POST',
    json: true,
    headers: {
      "content-type": "application/json",
    },
    timeout: 4000
  }, function(response) {
    if (response.error) {
      console.log('lib > genericRequest > ' + path + '?' + method + ' > response.error: ' + JSON.stringify(response));
    }

    if(callback !== undefined) {
      callback(response);
    }
  });
};

Bravia.prototype.makeAuthRequest = function(callback, headers) {

  this.request({
    path: '/sony/accessControl',
    json: {
      method: 'actRegister',
      id: 8,
      version: '1.0',
      params: [
        {
          clientid: this.device + ':' + this.uuid,
          nickname: this.nickname + ' (' + this.device + ')',
          //clientid: 'domopi3',
          //nickname: 'domopi3',
          level: 'private'
        },
        [{
          value: 'yes',
          function: 'WOL'
        }]
      ]
    },
    headers: headers
  }, function(response) {
    if(callback !== undefined) {
      callback(response);
    }
  });

};

Bravia.prototype.hasCookie = function() {
  return this.cookieJar.getCookies('http://' + this.ip + '/sony').length > 0;
};

Bravia.prototype.auth = function(callback) {

  var that = this;

  //if(false) {
  if(!this.hasCookie() && this.pskKey == "") {
    
    this.makeAuthRequest();

    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Please enter the 4-digit code shown on your TV: ', function(challenge) {

      that.makeAuthRequest(function(response) {

        that.updateCookieJar(function() {
          callback();
        });

      }, {
        Authorization: 'Basic ' + new Buffer(':' + challenge).toString('base64'),
        Connection: 'keep-alive'
      });

      rl.close();
    });
  } else {
    if(callback !== undefined) {
      callback();
    }
  }

};

Bravia.prototype.getCommandCode = function(command, callback) {

  this.getCommandList(function(list) {
    if(list[command] !== undefined && callback !== undefined) {
      callback(list[command]);
    }
  });

};

Bravia.prototype.request = function(options, callback) {

  options.url = 'http://' + this.ip + options.path;
  options.jar = this.cookieJar;

  request.post(options, function(error, response, body) {
    if(error) {
      console.error('lib > request > is error:');
      console.error(error);
      callback({"id":3,"result":[{"status":"standby"}]});
    } else if(callback !== undefined) {
      callback(body);
    }
  });

};


/*
  The tough-cookie-filestore has a bug in which it replaces the tailing slash
  only on lookup and not on save. This means it's not able to find a cookie
  that's saved as /sony/, because it will always look it up as /sony.
  This function removes that slash in the saved cookie jar.
*/
Bravia.prototype.updateCookieJar = function(callback) {
  fs.readFile('cookies.json', 'utf8', function (err,data) {
    if (err) {
      console.log(err);
    }
    var result = data.replace(/\/sony\//g, '\/sony');

    fs.writeFile('cookies.json', result, 'utf8', function (err) {
       if (err) console.log(err);
    });

    this.cookieJar = request.jar(new FileCookieStore('cookies.json'));
    callback();
  });
}

module.exports = function(ip, tvMac, pskkey, callback) {
  return new Bravia(ip, tvMac, pskkey, callback);
};
