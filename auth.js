var bravia = require('./lib');
// Accepts two parameters: IP and PSKKey

// Call the Bravia function. 
bravia(process.env.SONY_TV_IP, process.env.SONY_TV_MAC, "", function(client) {
  console.log('Execute non authenticated command');
  client.getCommandNames(function(list) {
    console.log(list);
  });

  console.log('Execute authenticate command');
  client.getPlayingContentInfo(function (response) {
    console.log(response);
  });
});
