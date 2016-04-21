var modules = {};
var servers = {};
var users = {};

/* global settings */
module.exports.reconnect_timeout = 10000;
module.exports.reconnect_attempts = 100;
module.exports.rejoin_on_kick = true;
module.exports.rejoin_timeout = 1000;

/* user list */
users["admin"] = {
	level:99,
	pass:"admin"
};

/* server object */
servers["synchronet"] = {

	/* server host information */
	"host":		"vert.synchro.net"
	,"port":	6667
	,"password":	undefined

	/* server options */
	,"enabled":	true
	,"prefix":	";"
	,"separator": 	";;"
	,"ops": 	[
		"mcmlxxix"
	]
	
	/* channels to join on connection */
	,"channels": [
		"#node.js"
	]
	
	/* alias,mo information */
	,"nick": [
		"botface"
	]
	,"realname":	"botface"
	,"userhost":	"botface@github.com"
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
module.exports.users = users;
