function Handler() {
	/* handle and execute bot commands */
	irc.emitter.on("Command",function(srv,target,user,args) {
		var cmd = args[0].toUpperCase();

		/* check for ignore users/channels/hosts */
		if(	srv.ignore[target.toUpperCase()] ||
			srv.ignore[user.nick.toUpperCase()] ||
			srv.ignore[user.userhost.toUpperCase()]) {
			return;
		}

		/* attempt core command execution */
		doCommand(core.command,cmd,srv,target,user,args.slice());

		/* attempt module command execution */
		for(var m in modules.list) {
			var module = modules.list[m];
			if(!module.enabled || !module.command)
				continue;
			if((target[0] == "#" || target[0] == "&") && 
				!srv.channels[target.toUpperCase()].modules[module.name.toUpperCase()])
				continue;
			doCommand(module.command,cmd,srv,target,user,args.slice());
		}
	});
	/* handle and execute server commands */
	irc.emitter.on("Server",function(srv,args,onick,ouh) {
		var cmd = args[0].toUpperCase();

		/* check for ignore users/channels/hosts */
		if(	srv.ignore[onick.toUpperCase()] ||
			srv.ignore[ouh.toUpperCase()]) {
			return;
		}

		/* attempt core command execution */
		doServer(irc.server,cmd,srv,args.slice(1),onick,ouh);
		if(core.server)
			doServer(core.server,cmd,srv,args.slice(1),onick,ouh);

		/* attempt module command execution */
		for(var m in modules.list) {
			var module = modules.list[m];
			if(!module.enabled || !module.server)
				continue;
			doServer(module.server,cmd,srv,args.slice(1),onick,ouh);
		}
	});
	/* handle and execute ctcp commands */
	irc.emitter.on("CTCP",function(srv,user,args) {
		var cmd = args[0].toUpperCase();

		/* check for ignore users/channels/hosts */
		if(	srv.ignore[user.nick.toUpperCase()] ||
			srv.ignore[user.userhost.toUpperCase()]) {
			return;
		}

		/* attempt core command execution */
		doCTCP(irc.ctcp,cmd,srv,user,args.slice());
		if(core.ctcp)
			doCTCP(core.ctcp,cmd,srv,user,args.slice());

		/* attempt module command execution */
		for(var m in modules.list) {
			var module = modules.list[m];
			if(!module.enabled || !module.ctcp)
				continue;
			doCTCP(module.ctcp,cmd,srv,user,args.slice());
		}
	});
}

/* command execution */
function doCommand(list,cmd,srv,target,user,args) {
	var command = list[cmd];
	/* if this module has no such command, do nothing */
	if(!command) 
		return false;
	
	/* if the command requires ident and user does not have it, deny */
	if(command.identNeeded && !user.ident) {
		srv.privmsg(target,"who are you?");
		return false;
	}
	
	/* if the user does not have access, deny */
	if(command.minSecurity > user.level) {
		srv.privmsg(target,"you are too weak for this command.");
		return false;
	}
	
	/* if the required arguments have not been supplied, deny */
	if(command.argsNeeded && command.argsNeeded > command.length) {
		srv.privmsg(target,"need moar arguments.");
		return false;
	}
	
	/* if theyve made it this far, go for it */
	try {
		command.execute(srv,target,user,args);
	}
	catch(e) {
		srv.notice(target,cmd + " (error): " + e);
	}	
}

/* server execution */
function doServer(list,cmd,srv,args,onick,ouh) {
	if(!list[cmd])
		return;
	try {
		list[cmd](srv,args,onick,ouh);
	}
	catch(e) {
		log(cmd + " (error): " + e,3);
	}	
}

/* ctcp execution */
function doCTCP(list,cmd,srv,user,args) {
	if(!list[cmd])
		return;
	try {
		list[cmd](srv,user,args);
	}
	catch(e) {
		srv.notice(user.nick,cmd + " (error): " + e);
	}	
}

/* class definition export */
module.exports = Handler;