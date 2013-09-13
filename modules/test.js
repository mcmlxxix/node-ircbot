var botCommand={};
var serverCommand={};
var serverCTCP={};

/* standard bot commands */
botCommand["TEST"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	usage:			"test [arg1, [arg2] ..]",
	help:			"test command",
	execute:		function(srv,target,user,args) {
		srv.privmsg(target,util.inspect(args));
	}
};

/* special server command intercepts */
//serverCommand["PRIVMSG"] = function(srv,cmd,onick,ouh) {
//	srv.notice(onick,"testes");
//}

/* special ctcp request intercepts */
//serverCTCP["PING"] = function(srv,user,cmd) {
//	srv.notice(user.nick,"testes");
//}

module.exports.command = botCommand;
//module.exports.server = serverCommand;
//module.exports.ctcp = serverCTCP;

module.exports.help = 
"This is a sample bot module to demonstrate the module api. Enter a description here (512 chars max)."

