var modules = {};
var servers = {};

/* global settings */
module.exports.reconnect_timeout = 10000;
module.exports.reconnect_attempts = 100;
module.exports.rejoin_on_kick = true;
module.exports.rejoin_timeout = 1000;

/* server object */
servers["test"] = {

	/* server host information */
	"host":			"irc.teksavvy.ca"
	,"port":		6667
	,"password":	undefined

	/* server options */
	,"enabled":		true
	,"prefix":		"!"
	,"ops": 	[
		"yournick"
		,"mynick"
	]
	
	/* channels to join on connection */
	,"channels": [
		"#node.js"
	]
	
	/* alias,mo information */
	,"nick": [
		"github"
	]
	,"realname":	"github"
	,"userhost":	"github@github.com"
};

/* module object */
modules["test"] = {
	"name":			"Test"
	,"file":		"./modules/test"
	,"enabled":		true
	,"channels":	[
		"#node.js"
	]
};

/* dont fuck with me */
module.exports.servers = servers;
module.exports.modules = modules;