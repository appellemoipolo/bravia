Bravia Remote Control
============

Go https://github.com/alanreid/bravia for Node implementation details.

Most changes made from the original repo are
* Dockerfile to run a http service to query your tv
* works with normal (cookie) & pre-shared key (pskKey), but some services need a normal authentication and does not work with pre-shared key (like getPlayingContentInfo)
* a generic service to call all tv services

To run that container
* docker build -t appellemoipolo/bravia-node-service .
* touch cookies.json
* to run with pskkey: docker run -d -p 5006:5006 --net host --env SONY_TV_IP=sony-ip-or-dhcp-name --env SONY_TV_MAC=sony-mac-address-for-wake-on-lan --env SONY_TV_PSKKEY=sony-psk-key-define-on-your-tv -v $(pwd)/cookies.json:/node-bravia/cookies.json --name bravia-service appellemoipolo/bravia-node-service (--net host is for wake on lan)
* to run with normal authentication: docker run -d -p 5006:5006 --net host --env SONY_TV_IP=sony-ip-cannot-use-dhcp-name-because-of-wake-on-lan --env SONY_TV_MAC=sony-mac-address-for-wake-on-lan -v $(pwd)/cookies.json:/node-bravia/cookies.json --name bravia-service appellemoipolo/bravia-node-service

At first run, you need to authenticate - create your cookie - for your next requests.
* docker exec -it bravia-service bash
* nodejs auth.js then enter the pass asked by your tv

Functions easily accessible:
* http://yourmachine:5006/getPowerStatus
* http://yourmachine:5006/getPlayingContentInfo
* http://yourmachine:5006/getCommandList (commands that can be use with two nexts functions)
* http://yourmachine:5006/sendNamedIRCCCommand/Home
* http://yourmachine:5006/sendNamedIRCCCommand/PowerOn
* http://yourmachine:5006/sendIRCCCommand/AAAAAQAAAAEAAABgAw== (Home on my tv)

The generic function:
* pattern: http://yourmachine:5006/genericRequest?path=tv-service-path&method=tv-method-in-path-asked[&parameters[param1]=value1&parameters[param2]=value2]
* to find tv-service-path: you can check http://yourmachine:52323/dmr.xml in node av:X_ScalarWebAPI_ServiceList combined with av:X_ScalarWebAPI_BaseURL path
* to find tv-method-in-path-asked: you can ask the getMethodTypes from all services http://yourmachine:5006/genericRequest?path=/sony/system&method=getMethodTypes&parameters
* example without parameters
  * http://yourmachine:5006/genericRequest?path=/sony/system&method=getPowerStatus&parameters
  * http://yourmachine:5006/genericRequest?path=/sony/avContent&method=getPlayingContentInfo&parameters
* example with parameters
  * http://yourmachine:5006/genericRequest?path=/sony/avContent&method=getSchemeList&parameters[scheme]=tv
