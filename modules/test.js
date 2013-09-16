var botCommand={};
var serverCommand={};
var serverCTCP={};

/* The ability to effectively write a bot module requires some basic knowledge
of the objects passed to a standard bot command, as well as some basic knowledge 
of IRC in general.. 

User() object properties:
	nick: [nick1, nick2, ...]
	realname: "realname"
	userhost: "user@host"
	lastspoke: last time user spoke (UTC)
	level: security level (number)
	ident: user identity state (boolean)
	channels: {"#node.js":true, "#test":true, ...}

Channel() object properties:
	name: "#channel name"
	key: "keyword"
	joined: channel join state (boolean)
	lastjoin: last channel join attempt (UTC)
	modules: {"Test":true, ...}

Server() object properties:
	host: "host/IP"
	port: port (number)
	password: "password"
	channels: ["#node.js", "#test", ...]
	user: User() object created from settings.js
	prefix: bot command prefix (e.g. "!")
	socket: Socket() object
	curnick: current bot "nickname"
	lastcon: last connection attempt (UTC)
	registered: server registration state (boolean)
	identified: server identification (boolean)
	users: {"MCMLXXIX":User() object, ...}
	ignore: {"MCMLXXIX":true, "#node.js":true, "user@host":true}

Server() object methods:
	output(string): write a raw string to server socket (e.g. PRIVMSG mcmlxxix :Hello World!)
	input(string): force processing of server socket input (fake a command?)
	ctcp(target,string): send a CTCP command string to "target"
	privmsg(target,string): send a message to "target" (normal message output)
	notice(target,string): send a notice 

Module() object properties:
	name: "Test"
	file: "./modules/test.js"
	channels: ["#node.js", "#test", ...]
	enabled: boolean

Module() object methods:
	init(): load/reload module data

*/

/* standard bot commands */
botCommand["TEST"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	usage:			"test [arg1, [arg2] ..]",
	help:			"test command",
	execute:		function(srv,target,user,args) {
		srv.privmsg(target,"Server: " + srv.host+":"+srv.port);
		srv.privmsg(target,"Target: " + target);
		srv.privmsg(target,"Arguments: " + util.inspect(args).replace(/[\r\n\t]/g,'').replace(/\s+/g,' '));
	}
};

/* special server command intercepts */
//serverCommand["PRIVMSG"] = function(srv,cmd,onick,ouh) {
//	srv.notice(onick,"testes");
//}

/* special ctcp request intercepts */
//serverCTCP["PING"] = function(srv,user,cmd) {
//	srv.notice(user.nick,"PONG");
//}

/* uncomment exports as necessary if creating custom server/CTCP commands */
module.exports.command = botCommand;
//module.exports.server = serverCommand;
//module.exports.ctcp = serverCTCP;

module.exports.description = 
"This is a sample bot module to demonstrate the module api. Enter a description here (500 chars max)."

