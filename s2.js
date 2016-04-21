var modules = {};
var servers = {};

/* global settings */
module.exports.reconnect_timeout = 10000;
module.exports.reconnect_attempts = 100;
module.exports.rejoin_on_kick = true;
module.exports.rejoin_timeout = 1000;

/* server object */
servers["efnet"] = {

	/* server host information */
	"host":			"irc.servercentral.net"
	,"port":		6667
	,"password":	undefined

	/* server options */
	,"enabled":		true
	,"separator": 	";;"
	,"prefix":		","
	,"ops": 	[
	]
	
	/* channels to join on connection */
	,"channels": [
		"#mcmlxxix"
		,"#node.js"
	]
	
	/* alias,mo information */
	,"nick": [
		"Popeye"
		,"Pop3ye"
	]
	,"realname":	"popeye"
	,"userhost":	"popeye@github.com"
};

servers["bbs-scene"] = {

	/* server host information */
	"host":			"master.bbs-scene.org"
	,"port":		6667
	,"password":	undefined

	/* server options */
	,"enabled":		false
	,"prefix":		","
	,"separator": 	";;"
	,"ops": 	[
	]
	
	/* channels to join on connection */
	,"channels": [
		"#coa-admin cocksauce"
		,"#coa"
		,"#funbbs wordem"
	]
	
	/* alias,mo information */
	,"nick": [
		"Popeye"
		,"Pop3ye"
	]
	,"realname":	"popeye"
	,"userhost":	"popeye@github.com"
};

/* module object */
modules["thief"] = {
	"name":			"Thief"
	,"file":		"./modules/thief"
	,"enabled":		true
	,"channels":	[
	]
};

/* module object */
modules["test"] = {
	"name":			"Test"
	,"file":		"./modules/test"
	,"enabled":		true
	,"channels":	[
	]
};

/* dont fuck with me */
module.exports.servers = servers;
module.exports.modules = modules;