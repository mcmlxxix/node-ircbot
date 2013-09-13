var modules = {};
var servers = {};

/* server object */
servers["test"] = {

	/* server host information */
	"host":			"irc.teksavvy.ca"
	,"port":		6667
	,"password":	undefined
	,"prefix":		"!"
	,"enabled":		true
	
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