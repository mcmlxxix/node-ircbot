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
	"host":			"irc.teksavvy.ca"
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
		"#mcmlxxix"
		,"#node.js"
		,"#trivia"
	]
	
	/* alias,mo information */
	,"nick": [
		"Popeye"
		,"Pop3ye"
	]
	,"realname":	"popeye"
	,"userhost":	"popeye@github.com"
};

servers["freenode"] = {

	/* server host information */
	"host":			"irc.freenode.net"
	,"port":		6667
	,"password":	undefined

	/* server options */
	,"enabled":		true
	,"prefix":		","
	,"ops": 	[
	]
	
	/* channels to join on connection */
	,"channels": [
		"#mcmlxxix"
		,"##trivia"
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
modules["f_thief"] = {
	"name":			"Freenode Thief"
	,"file":		"./modules/f_thief"
	,"enabled":		true
	,"channels":	[
		"#mcmlxxix"
	]
};

/* dont fuck with me */
module.exports.servers = servers;
module.exports.modules = modules;