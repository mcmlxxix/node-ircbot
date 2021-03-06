/* command objects */
var botCommand={};
var serverCommand={};
var serverCTCP={};

/* internal variables */
var pipes={};

/* core bot commands */
botCommand["IDENT"] = {
	minSecurity:	0,
	argsNeeded:		true,
	identNeeded:	false,
	usage:			"AUTH <user> <pass> | AUTH <pass>",
	help:			"identify yourself, stranger",
	execute:		function(srv,target,user,args) {
		args.shift();
		var uname = args.shift();
		var pass = args.shift();
		if(pass == null) {
			pass = uname;
			uname = user.nick;
		}
		var u = settings.users[uname.toLowerCase()];
		if(u == null) {
			srv.privmsg(target,"I dont know you");
		}
		else if(pass == u.pass) {
			if(target[0] == "#" || target[0] == "&") {
				srv.privmsg(target,"fucking retards need to learn the facts of reality");
			}
			else {
				user.ident = true;
				user.level = u.level;
				srv.privmsg(target,"hewwo " + user.nick);
			}
		}
		else {
			srv.privmsg(target,"that is false");
		}
	}
};
botCommand["RELOAD"] = {
	minSecurity:	50,
	argsNeeded:		false,
	identNeeded:	true,
	usage:			"reload",
	help:			"reload the internal bot command and function structure.",
	execute:		function(srv,target,user,args) {
		args.shift();
		var m = args.shift();

		/* reload all commands */
		if(m == undefined) {
			for(var i in modules.list) {
				var module = modules.list[i.toUpperCase()];
				module.init();
			}

			settings = loadFile(sFile);
			core = loadFile('./lib/core');

			confirm(srv,target);
			return;
		}
		/* reload module commands */
		else if(modules.list[m.toUpperCase()] instanceof Module) {
			var module = modules.list[m.toUpperCase()];
			module.init();

			confirm(srv,target);
			return;
		}
		/* invalid module name? */
		srv.notice(target,"module not found: " + m);
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
		sb[args.shift()] = loadFile(args.shift());
		confirm(srv,target);
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
		
		/* create the channel if we dont have it */
		if(!srv.channels[cname]) {
			srv.channels[cname] = new Channel(cname,key);
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
botCommand["PIPE"] = {
	minSecurity:	90,
	argsNeeded:		false,
	identNeeded:	true,
	usage:			"pipe [from_channel[@from_server]] [to_channel[@to_server]]",
	help:			"pipe messages from one channel to another.",
	execute:		function(srv,target,user,args) {
		args.shift();
		var t1 = args.shift();
		var t2 = args.shift();

		/* if we are listing pipes */
		if(!t1) {
			srv.notice,(target,"pipe list:");
			for(var s in pipes) {
				for(var c in pipes[s]) {
					var str = c+"@"+s+" -> "+pipes[s][c].target+"@"+pipes[s][c].srv.id;
					srv.notice(target,str.toLowerCase());
				}
			}
			return;
		}

		var sFrom = srv;
		var sTo = srv;
		var cFrom = undefined;
		var cTo = target;

		/* if a from server/channel is specified */
		if(t1) {
			t1 = t1.split("@");
			if(t1[1] && ircbot.servers[t1[1].toUpperCase()] instanceof Server) {
				sFrom = ircbot.servers[t1[1].toUpperCase()];
			}
			if(t1[0] && sFrom.channels[t1[0].toUpperCase()] instanceof Channel){
				cFrom = t1[0].toUpperCase();
			}
		}
		/* if a to server/channel is specified */
		if(t2) {
			t2 = t2.split("@");
			if(t2[1] && ircbot.servers[t2[1].toUpperCase()] instanceof Server) {
				sTo = ircbot.servers[t2[1].toUpperCase()];
			}
			if(t2[0] && sFrom.channels[t2[0].toUpperCase()] instanceof Channel){
				cTo = t2[0].toUpperCase();
			}
		}

		if(cFrom == cTo) {
			srv.notice(target,"no.");
			return;
		}

		/* if no source channel specified */
		if(cFrom == undefined) {
			srv.notice(target,"usage: " + this.usage);
			return;
		}

		/* find pipe */
		var sName = sFrom.id.toUpperCase();
		if(!pipes[sName])
			pipes[sName] = {};
		var srvpipe = pipes[sName];

		if(!srvpipe[cFrom]) {
			srvpipe[cFrom] = new Pipe(sTo,cTo);
			srv.notice(target,"piping " + 
				sFrom.channels[cFrom].name + "@" + sFrom.id + " -> " + sTo.channels[cTo].name + "@" + sTo.id
			);	
		}
		else {
			delete srvpipe[cFrom];
			srv.notice(target,"no longer piping " + 
				sFrom.channels[cFrom].name + "@" + sFrom.id + " -> " + sTo.channels[cTo].name + "@" + sTo.id
			);	
		}
	}
};
botCommand["EVAL"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	usage:			"eval [code], eval $[user] [code], eval :[ON|OFF|NEW]",
	help:			"evaluate code in a secure sandbox.",
	execute:		function(srv,target,user,args) {
		args.shift();
		
		if(!user.sandbox)
			user.sandbox = {};
		var options = {
			colors:false,
			depth:null
		};

		if(args[0] && args[0][0] == "$") {
			var uname = args.shift().substr(1).toUpperCase();
			user = srv.users[uname];
		}
		var sb = user.sandbox;
			
		/* if user supplied no arguments, show sandbox */
		if(!args.length) {
			srv.privmsg(target,
				util.inspect(sb,options).replace(/[\r\n\t]/g,'').replace(/\s+/g,' '));	
			return;
		}
		
		/* if the user requests a new sandbox */
		if(args[0].toUpperCase() == ":NEW") {
			user.sandbox = {};
			srv.privmsg(target,"Sandbox for " + user.nick + " cleared");	
			return;
		}
		if(args[0].toUpperCase() == ":ON") {
			user.coding = true;
			srv.privmsg(target,"<begin code>");
			return;
		}
		var code=args.join(" ");
		if(args[0].toUpperCase() == ":OFF") {
			user.coding = false;
			//user.code.pop();
			user.code.shift();
			code = user.code.join('');
			user.code = [];
			srv.privmsg(target,"<end code>");
		}
		try {
			var result = vm.runInNewContext(code, sb, {"timeout":5000});
			srv.privmsg(target,
				util.inspect(result,options).replace(/[\r\n\t]/g,'').replace(/\s+/g,' '));	
		} 
		catch(e) {
			srv.privmsg(target,code);
			srv.privmsg(target,e);
		}
	}
};
botCommand["SEVAL"] = {
	minSecurity:	90,
	argsNeeded:		true,
	identNeeded:	true,
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
botCommand["SAY"] = {
	minSecurity:	0,
	argsNeeded:		true,
	identNeeded:	false,
	usage:			"say [#channel] <message>",
	help:			"send a message to a channel.",
	execute:		function(srv,target,user,args) {
		args.shift();
		if(!args[0])
			return;
		var cname = target;
		if(args[0][0] == "#" || args[0][0] == "&") {
			cname = args.shift().toUpperCase();
			if(!srv.channels[cname] || !srv.channels[cname].joined) {
				srv.privmsg(target,"I am not in that channel.");
			}
			else {
				srv.privmsg(cname,args.join(" "));
			}
		}
		else if(args[0][0] == "$") {
			cname = args.shift().toUpperCase().substr(1);
			srv.privmsg(cname,args.join(" "));
		}
		else {
			srv.privmsg(cname,args.join(" "));
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
			listCommands(srv,target,botCommand);
		}
		/* list module commands */
		else if(modules.list[m.toUpperCase()] instanceof Module) {
			var module = modules.list[m.toUpperCase()];
			listCommands(srv,target,module.command);
		}
		/* invalid module name? */
		else {
			srv.notice(target,"module not found: " + m);
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
		var c = args.shift();
		
		/* list core command usage */
		if(m == undefined) {
			for(var a in botCommand) {
				srv.notice(target,botCommand[a].usage);
			}
		}
		/* list module command usage */
		else if(modules.list[m.toUpperCase()] instanceof Module) {
			var module = modules.list[m.toUpperCase()];
			if(c == undefined) {
				for(var a in module.command) {
					srv.notice(target,module.command[a].usage);
				}
			}
			else if(module.command[c.toUpperCase()]) {
				srv.notice(target,module.command[c.toUpperCase()].usage);
			}
			/* invalid command name? */
			else {
				srv.notice(target,module.name + " command not found: " + c);
			}
		}
		/* list core command usage */
		else if(botCommand[m.toUpperCase()]) {
			srv.notice(target,botCommand[m.toUpperCase()].usage);
		}
		/* invalid module name? */
		else {
			srv.notice(target,"module/command not found: " + m);
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
		var c = args.shift();

		/* list core command usage */
		if(m == undefined) {
			listHelp(srv,target,botCommand);
		}
		/* list module command usage */
		else if(modules.list[m.toUpperCase()] instanceof Module) {
			var module = modules.list[m.toUpperCase()];
			if(c == undefined) {
				listHelp(srv,target,module.command);
			}
			else if(module.command[c.toUpperCase()]) {
				srv.notice(target,module.command[c.toUpperCase()].help);
			}
			/* invalid command name? */
			else {
				srv.notice(target,module.name + " command not found: " + c);
			}
		}
		/* list core command usage */
		else if(botCommand[m.toUpperCase()]) {
			srv.notice(target,botCommand[m.toUpperCase()].help);
		}
		/* invalid module name? */
		else {
			srv.notice(target,"module/command not found: " + m);
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
botCommand["MODULES"] = {
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
				var m = args.join(" ");
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

/* server add-ons */
serverCommand["PRIVMSG"] = function(srv,cmd,onick,ouh) {
	var target = cmd.shift().toUpperCase();
	if(pipes[srv.id.toUpperCase()]) {
		var psrv = pipes[srv.id.toUpperCase()];
		if(psrv[target]) {
			var pipe = psrv[target];
			pipe.srv.privmsg(pipe.target,"<" + onick + "> " + cmd.join(" ").substr(1));
		}
	}
	
	/* long form coding */
	if(!srv.users[onick.toUpperCase()])	
		srv.users[onick.toUpperCase()] = new User(onick,onick,ouh);
	var user = srv.users[onick.toUpperCase()];
	
	if(user.coding) {
		if(!user.code)
			user.code = [];
		user.code.push(cmd.join(" ").substr(1));
	}
};

/* class definition export */
module.exports.command = botCommand;
module.exports.server = serverCommand;
module.exports.ctcp = serverCTCP;

/* helper functions */
function confirm(srv,target) {
	var msgs = [
		"awwight",
		"mmkay",
		"i dont know you",
		"hewwo"
	];
	
	srv.privmsg(target,msgs[Math.floor(Math.random()*msgs.length)]);
}
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
function reloadModule(srv,target,mname) {
	confirm(srv,target);
	return;
}
function listHelp(srv,target,list) {
	for(var c in list) {
		var cname = c;
		var clen = cname.length;
		while(cname.length < 10)
			cname += " ";
		var str = util.format("%s: %s",cname.toLowerCase(),list[c].help);
		srv.notice(target,str);
	}
}
function listCommands(srv,target,list) {
	var str="";
	for(var c in list) 
		str+=","+c;
	srv.notice(target,"commands: " + str.substr(1));
}
function listUsage(srv,target,list) {
	var str="";
	for(var c in list) 
		str+=","+c;
	srv.notice(target,"core commands: " + str.substr(1));
}

/* internal classes */
function Pipe(srv,target) {
	this.srv = srv;
	this.target = target;
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
