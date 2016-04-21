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
	"host":			"vert.synchro.net"
	,"port":		6667
	,"password":	undefined

	/* server options */
	,"enabled":		true
	,"prefix":		";"
	,"separator": 	";;"
	,"ops": 	[
		"mcmlxxix"
	]
	
	/* channels to join on connection */
	,"channels": [
		"#coa-admin cocksauce",
		"#node.js"
	]
	
	/* alias,mo information */
	,"nick": [
		"Phillip"
	]
	,"realname":	"peepants"
	,"userhost":	"peepants@github.com"
};

/* module object */
modules["thief"] = {
	"name":			"Thief"
	,"file":		"./modules/thief"
	,"enabled":		false
	,"channels":	[
		"#node.js"
	]
};

modules["test"] = {
	"name":			"Test"
	,"file":		"./modules/test"
	,"enabled":		true
	,"channels":	[
		"#node.js"
	]
};

modules["thief2"] = {
	"name":			"Thief"
	,"file":		"./modules/thief"
	,"enabled":		false
	,"channels":	[
		"#node.js"
	]
};

modules["db"] = {
	"name":			"JSON Database"
	,"file":		"./modules/db"
	,"enabled":		true
	,"channels":	[
		"#coa-admin",
		"#node.js"
	]
};


/* dont fuck with me */
module.exports.servers = servers;
module.exports.modules = modules;
module.exports.users = users;
