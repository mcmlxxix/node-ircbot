var botCommand={};
var serverCommand={};
var serverCTCP={};

/* core bot commands */
botCommand["RELOAD"] = {
	minSecurity:	50,
	argsNeeded:		false,
	identNeeded:	true,
	usage:			"reload",
	help:			"reload the internal bot command and function structure.",
	execute:		function(srv,target,user,args) {
		for(var m in modules.list) {
			if(modules[m]) {
				modules[m].init();
			}
		}
		irc = require('./protocol');
		core = require('./core');
		//settings = require('../settings');

		srv.privmsg(target,"mmkay.");
	}
};
botCommand["LOAD"] = {
	minSecurity:	50,
	argsNeeded:		true,
	identNeeded:	true,
	usage:			"load <filename>",
	help:			"evaluate a script in the global context.",
	execute:		function(srv,target,user,args) {
		if(!user.sandbox)
			user.sandbox = {};
		var sb = user.sandbox;
		sb[args.shift()] = require(args.shift());
		srv.privmsg(target,"mmkay.");
	}
};
botCommand["JOIN"] = {
	minSecurity:	50,
	argsNeeded:		false,
	identNeeded:	true,
	usage:			"join <channel>",
	help:			"join the bot to a channel.",
	execute:		function(srv,target,user,args) {
		args.shift();
		if(args[0][0]!="#" && args[0][0]!="&") {
			srv.notice(target,"Invalid channel name");
			return;
		}
		var cname=args.shift().toUpperCase();
		var key=args.shift();
		
		/* if we are already in this channel */
		if(srv.channels[cname] && srv.channels[cname].joined) {
			srv.notice(target,"I am already in that channel");
			return;
		}
		
		srv.output("JOIN " + cname + (key?" " + key:""));
		srv.notice(target,"mmkay.");	
	}
};
botCommand["PART"] = {
	minSecurity:	50,
	argsNeeded:		false,
	identNeeded:	true,
	usage:			"part [channel]",
	help:			"remove the bot from a channel.",
	execute:		function(srv,target,user,args) {
		args.shift();
		if(args[0][0]!="#" && args[0][0]!="&") {
			srv.notice(target,"Invalid channel name");
			return;
		}
		var cname=args.shift().toUpperCase();
		
		/* if we are not in this channel */
		if(!srv.channels[cname] || !srv.channels[cname].joined) {
			srv.notice(target,"I am not in that channel");
			return;
		}
		
		srv.notice(target,"mmkay.");	
		srv.output("PART " + cname);
	}
};
botCommand["EVAL"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	usage:			"eval [code]",
	help:			"evaluate code in a secure sandbox.",
	execute:		function(srv,target,user,args) {
		args.shift();
		
		if(!user.sandbox)
			user.sandbox = {};
		var sb = user.sandbox;
		var options = {
			colors:false,
			depth:null
		};

		/* if user supplied no arguments, show sandbox */
		if(!args.length) {
			srv.privmsg(target,
				util.inspect(sb,options).replace(/[\r\n\t]/g,'').replace(/\s+/g,' '));	
			return;
		}
		
		/* if the user requests a new sandbox */
		if(args[0].toUpperCase() == "NEW") {
			user.sandbox = {};
			srv.privmsg(target,"Sandbox for " + user.nick + " cleared");	
			return;
		}
			
		var code=args.join(" ");
		try {
			var result = vm.runInNewContext(code, sb);
			srv.privmsg(target,
				util.inspect(result,options).replace(/[\r\n\t]/g,'').replace(/\s+/g,' '));	
		} 
		catch(e) {
			srv.privmsg(target,e);
		}
	}
};
botCommand["SEVAL"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	usage:			"seval <code>",
	help:			"evaluate code in global context.",
	execute:		function(srv,target,user,args) {
		args.shift();
		
		var options = {
			colors:false,
			depth:2
		};

			/* if user supplied no arguments, show sandbox */
		if(!args.length) {
			srv.notice(target,"Nothing to evaluate");
			return;
		}
			
		var code=args.join(" ");
		try {
			var result = eval(code);
			srv.privmsg(target,
				util.inspect(result,options).replace(/[\r\n\t]/g,'').replace(/\s+/g,' '));	
		} 
		catch(e) {
			srv.privmsg(target,e);
		}
	}
};
botCommand["DIE"] = {
	minSecurity:	90,
	argsNeeded:		false,
	identNeeded:	true,
	usage:			"die [reason]",
	help:			"die for any reason.",
	execute:		function(srv,target,user,args) {
		process.exit();
	}
};
botCommand["IGNORE"] = {
	minSecurity:	90,
	argsNeeded:		1,
	identNeeded:	true,
	usage:			"ignore <chan|nick|user@host>",
	help:			"cause bot to ignore specified person or channel",
	execute:		function(srv,target,user,args) {
		args.shift();
		var t = args.shift().toUpperCase();
		if(srv.ignore[t]) {
			delete srv.ignore[t];
			srv.notice(target,'no longer ignoring ' + t.toLowerCase());
		}
		else {
			srv.ignore[t] = Date.now();
			srv.notice(target,'ignoring ' + t.toLowerCase());
		}
	}
};
botCommand["PREFIX"] = {
	minSecurity:	90,
	argsNeeded:		false,
	identNeeded:	true,
	usage:			"prefix [prefix]",
	help:			"set or clear bot command prefix",
	execute:		function(srv,target,user,args) {
		args.shift();
		var p = args.shift();
		
		if(p == undefined) {
			srv.prefix = undefined;
			srv.notice(target,'command prefix cleared');
		}
		else {
			srv.prefix = p.toUpperCase();
			srv.notice(target,'command prefix set: ' + p.toUpperCase());
		}
	}
};
botCommand["COMMANDS"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	usage:			"commands [module]",
	help:			"show a list of bot commands",
	execute:		function(srv,target,user,args) {
		args.shift();
		var m = args.shift();
		/* list core commands */
		if(m == undefined) {
			var str="";
			for(var c in botCommand) 
				str+=","+c;
			srv.notice(target,"core commands: " + str.substr(1));
		}
		/* list module commands */
		else {
		/* TODO: finish this cmd */
		}
	}
};
botCommand["USAGE"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	usage:			"usage [module] [command]",
	help:			"show usage of bot commands",
	execute:		function(srv,target,user,args) {
		args.shift();
		var m = args.shift();
		
		/* list core command usage */
		if(m == undefined) {
			for(var c in botCommand) {
				srv.notice(target,botCommand[c].usage);
			}
		}
		/* list module commands */
		else {
		/* TODO: finish this cmd */
		}
	}
};
botCommand["HELP"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	usage:			"help [module] [command]",
	help:			"show help information for a module or command",
	execute:		function(srv,target,user,args) {
		args.shift();
		var m = args.shift();
		
		/* list core command help */
		if(m == undefined) {
			for(var c in botCommand) {
				var cname = c;
				var clen = cname.length;
				while(cname.length < 10)
					cname += " ";
				var str = util.format("%s: %s",cname.toLowerCase(),botCommand[c].help);
				srv.notice(target,str);
			}
		}
		/* list module commands */
		else {
		/* TODO: finish this cmd */
		}
	}
};
botCommand["NICK"] = {
	minSecurity:	90,
	argsNeeded:		1,
	identNeeded:	true,
	usage:			"nick <nick>",
	help:			"change bot nickname",
	execute:		function(srv,target,user,args) {
		args.shift();
		var n = args.shift();
		srv.notice(target,"mmkay.");
		srv.curnick = n;
		srv.output("NICK " + n);
	}
};
botCommand["MODULES"] = botCommand["MODULE"] = {
	minSecurity:	90,
	argsNeeded:		true,
	identNeeded:	true,
	usage:			"module(s) [channel] [+|-all|module] [enable|disable all|module]",
	help:			"enable/disable modules in a given channel, list modules in a given channel",
	execute:		function(srv,target,user,args) {
		args.shift();
		
		var chan=target.toUpperCase();
		if(args.length == 0) {
			args.push("L");
		}
		
		while(args.length > 0) {
			var c=args.shift().toUpperCase();
	
			switch(c[0]) {
			case "+":
			case "-":
				if(chan[0] !== "#" && chan[0] !== "&") 
					continue;
				toggleActive(srv,target,c[0],c.substr(1),chan);
				break;
			case "E":
			case "D":
				var m = args.shift();
				if(!m)
					break;
				toggleEnabled(srv,target,c,m.toUpperCase());
				break;
			case "#":
			case "&":
				chan = c;
				break;
			case "L":
			default:
				listModules(srv,target,chan);
				break;
			}
		}
	}
};

/* class definition export */
module.exports.command = botCommand;
module.exports.server = serverCommand;
module.exports.ctcp = serverCTCP;

/* helper functions */
function toggleEnabled(srv,target,action,mname) {
	/* are we enabling or disabling */
	var module = modules.list[mname];
	var toggle = (action == "ENABLE"?true:false);
	var changes = [];
	
	/* toggle one module */
	if(module) {
		if(module.enabled !== toggle) {
			module.enabled = toggle;
			changes.push(module.name);
		}
	}
	/* toggle all modules */
	else if(mname == "ALL") {
		for(var m in modules.list) {
			var module = modules.list[m];
			if(module.enabled !== toggle) {
				module.enabled = toggle;
				changes.push(module.name);
			}
		}
	}
	
	if(changes.length == 0) {
		srv.notice(target,"No changes made");
	}
	else {
		var str = (action == "ENABLE"?"enabled ":"disabled ");
		while(changes.length > 0) {
			str += changes.shift();
		}
		srv.notice(target,str);
	}
}
function toggleActive(srv,target,action,mname,chan) {
	var module = modules.list[mname];
	var channel = srv.channels[chan];
	
	/* TODO: add some grace */
	if(!channel)
		return;
		
	/* are we enabling or disabling */
	var toggle = (action == "+"?true:false);
	var changes = [];
	
	/* toggle one module */
	if(module) {
		if(module.enabled && channel.modules[mname] !== toggle) {
			channel.modules[mname] = toggle;
			changes.push(module.name);
		}
	}
	/* toggle all modules */
	else if(mname == "ALL") {
		for(var m in modules.list) {
			var module = modules.list[m];
			if(module.enabled && channel.modules[mname] !== toggle) {
				channel.modules[mname] = toggle;
				changes.push(module.name);
			}
		}
	}
	
	if(changes.length == 0) {
		srv.notice(target,"No changes made");
	}
	else {
		var str = chan + " modules set: ";
		while(changes.length > 0) {
			str += action + changes.shift() + " ";
		}
		srv.notice(target,str);
	}
}
function listModules(srv,target,chan) {
	var str=chan + ": ";
	var channel = srv.channels[chan];
	
	for(var m in modules.list) {
		var module = modules.list[m];
		if(!module.enabled) {
			str += "!" + module.name + " ";
		}
		else if(channel.modules[m]) {
			str += "+" + module.name + " ";
		}
		else {
			str += "-" + module.name + " ";
		}
	}
	srv.notice(target,str);
}

/* TODO: ident! */

// botCommand["IDENT"] = new Command(0,true,false);
// botCommand["IDENT"].usage =
	// "/MSG %s IDENT <nick> <pass>";
// botCommand["IDENT"].help =
	// "Identifies a user by alias and password. Use via private message only.";
// botCommand["IDENT"].command = function (target,onick,ouh,srv,lvl,cmd) {
	// var usr = new User(system.matchuser(onick));
	// if (cmd[2]) { /* Username passed */
		// usr = new User(system.matchuser(cmd[1]));
		// cmd[1] = cmd[2];
	// }
	// if (!usr.number) {
		// srv.o(target,"No such user.","NOTICE");
		// return;
	// }
	// if ((target[0] == "#") || (target[0] == "&")) {
		// if (lvl >= 50) {
			// srv.o(target,"Fool!  You've just broadcasted your password to "
				// + "a public channel!  Because of this, I've reset your "
				// + "password.  Pick a new password, then /MSG " + srv.nick + " "
				// + "PASS <newpass>","NOTICE");
			// usr.security.password = "";
		// } else {
			// srv.o(target,"Is broadcasting a password to a public channel "
				// + "really a smart idea?","NOTICE");
		// }
		// return;
	// }
	// if (usr.security.password == "") {
		// srv.o(target,"Your password is blank.  Please set one with /MSG "
			// + srv.nick + " PASS <newpass>, and then use IDENT.","NOTICE");
		// return;
	// }
	// if (cmd[1].toUpperCase() == usr.security.password) {
		// srv.o(target,"You are now recognized as user '" + usr.alias + "'","NOTICE");
		// srv.users[onick.toUpperCase()].ident = usr.number;
		// login_user(usr);
		// return;
	// }
	// srv.o(target,"Incorrect password","NOTICE");
	// return;
// }

// botCommand["SAVE"] = new Command(80,false,true);
// botCommand["SAVE"].command = function (target,onick,ouh,srv,lvl,cmd) {
	// if (save_everything()) {
		// srv.o(target,"Data successfully written.  Congratulations.");
	// } else {
		// srv.o(target,"Oops, couldn't write to disk.  Sorry, bud.");
	// }
	// return;
// }

/* TODO: implement message piping */

// if (srv.pipe && srv.pipe[target]) {
// 	var thispipe = srv.pipe[target];
// 	thispipe.srv.o(thispipe.target, "<" + user.nick + "> " 
// 		+ irc.getString(args.join(" "), 1));
// }

