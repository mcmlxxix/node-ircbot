clientCommand={};
serverCommand={};
emitter=new Emitter();

/* client commands */
clientCommand["NICK"] = function(srv,nick) {
	/* send nick preference */
	srv.output("NICK " + nick);
	/* TODO: wait on server confirmation before setting srv.curnick */
	srv.curnick = nick;
}
clientCommand["PASS"] = function(srv,password) {
	/* if there is a server password, send it */
	if(password !== undefined)
		srv.output("PASS " + password);
}
clientCommand["USER"] = function(srv,username,realname) {
	/* send user name */
	srv.output("USER " + username + " * * :" + realname);
}
clientCommand["JOIN"] = function(srv,target,key) {
	/* send user name */
	srv.channels[target.toUpperCase()] = new Channel(target,key);
	srv.output("JOIN " + target + (key?" " + key:""));
}
clientCommand["PART"] = function(srv,target) {
	/* send user name */
	delete srv.channels[target];
	srv.output("PART " + target);
}

/* server commands */
serverCommand["JOIN"] = function(srv,args,onick,ouh) {
	if (args[0][0] == ":")
		args[0] = args[0].slice(1);
		
	var chan = srv.channels[args[0].toUpperCase()];
	/* TODO: if channel not in server channel list, then what? */
	if(!chan)
		return;
	
	// Me joining.
	if ((onick == srv.curnick) && !chan.joined) {
		srv.emit("Join",chan);
		return;
	}
	
	// Someone else joining.
	if(!srv.users[onick.toUpperCase()])	
		srv.users[onick.toUpperCase()] = new User(onick,onick,ouh);
	else 
		srv.users[onick.toUpperCase()].uh=ouh;
	
	/* TODO: store channels in user object? or store users in channel object? */
	srv.users[onick.toUpperCase()].channels[args[0].toUpperCase()]=true;
	
	/* TODO: some sort of user recognition  */
	/*
	var lvl = srv.bot_access(onick,ouh);
	if (lvl >= 50) {
		var usr = new User(system.matchuser(onick));
		if (lvl >= 60)
			srv.output("MODE " + args[0] + " +o " + onick);
		if (usr.number > 0) {
			if (usr.comment)
				srv.o(args[0],"[" + onick + "] " + usr.comment);
			login_user(usr);
		}
	}
	*/
}
serverCommand["001"] = function(srv,args,onick,ouh)	{ // Welcome
	srv.emit("Register");
}
serverCommand["352"] = function(srv,args,onick,ouh)	{ // WHO reply  
	var nick = args[5];
	if(!srv.users[nick.toUpperCase()]) 
		srv.users[nick.toUpperCase()] = new User(nick,nick,args[2] + "@" + args[3]);
	else 
		srv.users[nick.toUpperCase()].userhost = args[2] + "@" + args[3];
		
	/* TODO: store channels in user object? or store users in channel object? */
	srv.users[nick.toUpperCase()].channels[args[1].toUpperCase()]=true;
}
serverCommand["433"] = function(srv,args,onick,ouh)	{ // Nick already in use.
	srv.emit("Jupe",args[1]);
}
serverCommand["PART"] = function(srv,args,onick,ouh) {
	if (	args[0][0] == ":")
		args[0] = args[0].slice(1);
	var chan = srv.channels[args[0].toUpperCase()];
	if ((onick == srv.curnick) && chan && chan.joined) {
		srv.emit("Part",chan);
		return;
	}
	/* Someone else parting */
	if(srv.users[onick.toUpperCase()]) {
	
		/* TODO: store channels in user object? or store users in channel object? */
		delete srv.users[onick.toUpperCase()].channels[args[0].toUpperCase()];
		
		/* TODO: this is fuckedly fucktarded */
		var chan_count=0;
		for(var c in srv.users[onick.toUpperCase()].channels) 
			chan_count++;
		if(chan_count==0) 
			delete srv.users[onick.toUpperCase()];
	}
}
serverCommand["QUIT"] = serverCommand["PART"];
serverCommand["KICK"] = function(srv,args,onick,ouh)	{
	if (args[0][0] == ":")
		args[0] = args[0].slice(1);
		
	var chan_name=args.shift();
	var kicked=args.shift();
	var chan = srv.channels[chan_name.toUpperCase()];
	
	if ((kicked == srv.curnick) && chan && chan.joined) {
		srv.emit("Kick",chan);
		return;
	}
	// Someone else parting.
	if(srv.users[kicked.toUpperCase()]) {
		/* TODO: store channels in user object? or store users in channel object? */
		delete srv.users[kicked.toUpperCase()].channels[chan_name.toUpperCase()];
		
		/* TODO: this is fuckedly fucktarded */
		var chan_count=0;
		for(var c in srv.users[kicked.toUpperCase()].channels) 
			chan_count++;
		if(chan_count==0) 
			delete srv.users[kicked.toUpperCase()];
	}
}
serverCommand["PRIVMSG"] = function(srv,args,onick,ouh)	{
	/* create a server user object for the sender of this message */
	if(!srv.users[onick.toUpperCase()])	
		srv.users[onick.toUpperCase()] = new User(onick,onick,ouh);
	var user = srv.users[onick.toUpperCase()];
	user.lastspoke=Date.now();
	
	/* if this is a public channel message */
	if (args[0][0] == "#" || args[0][0] == "&") {
		processPrivmsg(srv,user,args);
	} 
	/* if this is a private channel message */
	else if (args[0].toUpperCase() == srv.curnick.toUpperCase()) { 
		processQuery(srv,user,args);
	}
}
serverCommand["PING"] = function(srv,args,onick,ouh)	{ // "Ping."
	srv.output("PONG :" + args.join(" ").substr(1).toLowerCase());
}
serverCommand["ERROR"] = function(srv,args,onick,ouh)	{ 
	srv.emit("Error",args);
}

/* CTCP commands */
serverCTCP={};
serverCTCP["DCC"] = function(srv,user,args) {
	/*
	var usr = new User(system.matchuser(onick));
	if (!usr.number) {
		this.o(onick, "I don't talk to strangers.", "NOTICE");
		return;
	}
	if (args[4]) {
		if ((args[1].toUpperCase() == "CHAT")
			&& (args[2].toUpperCase() == "CHAT")
			&& (parseInt(args[3]) == args[3])
			&& (parseInt(args[4]) == args[4])) {
				var ip = int_to_ip(args[3]);
				var port = parseInt(args[4]);
				var sock = new Socket();
				sock.connect(ip, port, 3);
				if (sock.is_connected) {
					sock.write("Enter your password.\r\n");
					dcc_chats.push(new DCC_Chat(sock,onick));
				}
		}
	}
	*/
}
serverCTCP["PING"] = function(srv,user,args) {
	var reply = "PING ";
	if (parseInt(args[1]) == args[1]) {
		reply += args[1];
		if (args[2] && (parseInt(args[2]) == args[2]))
			reply += " " + args[2];
		srv.ctcp(user.nick,reply);
	}
}
serverCTCP["VERSION"] = function(srv,user,args) {
	srv.ctcp(user.nick, "VERSION Node.js IRC Bot by mcmlxxix");
}
serverCTCP["FINGER"] = function(srv,user,args) {
	srv.ctcp(user.nick, "FINGER Finger message goes here.");
}

/* handle privmsg */
function processQuery(srv,user,args) {
	args[1] = args[1].slice(1).toUpperCase();
	args.shift();
	
	/* process ctcp commands */
	if (args[0][0] == "\1") {
		args[0] = args[0].slice(1);
		args[args.length-1] = args[args.length-1].slice(0,-1);
		
		/* emit ctcp events */
		emitter.emit("CTCP",srv,user,args);
		return;
	}
	
	/* emit command events */
	emitter.emit("Command",srv,user.nick,user,args);
}
/* handle privmsg */
function processPrivmsg(srv,user,args) {
	var target=args[0].toUpperCase();
	
	/* TODO: implement message piping */
	if (srv.pipe && srv.pipe[target]) {
		var thispipe = srv.pipe[target];
		thispipe.srv.o(thispipe.target, "<" + user.nick + "> " 
			+ irc.getString(args.join(" "), 1));
	}
	
	/* match command string against this server's prefix */
	args=matchPrefix(srv,args);
	if(!args) 
		return false;
	
	/* if there's no command to process, bugger off, mate */
	if(args[0].length == 0) {
		/* TODO: possibly show some basic bot information if prefix is sent
		with no command attached? */
		return false;
	}

	/* emit command events */
	emitter.emit("Command",srv,target,user,args);
}
/* handle inbound socket data */
function processData(srv,str) {
	var onick;
	var ouh;
	var outline;
	var sorigin = str.split(" ")[0].slice(1);
	
	/* do fancy magic */
	if((str[0] == ":") && sorigin.match(/[@]/)) {
		onick = sorigin.split("!")[0];
		ouh = sorigin.split("!")[1];
	} 
	else {
		onick = "";
		ouh = "";
	}
	
	/* TODO: fix ignore feature (see ignore command) */
	if(srv.ignore[onick.toUpperCase()]) {
		return;
	}

	var args=irc.splitCmd(str);
	//var chan=irc.getChannel(srv,args);
	
	/* emit server events */
	emitter.emit("Server",srv,args,onick,ouh);
}
/* match a command string to a server's bot prefix */
function matchPrefix(srv,args) {
	args.shift();
	args[0] = args[0].substr(1);
	var p = srv.prefix;
	if(args[0][0] == p) {
		args[0] = args[0].substr(1);
		return args;
	}
	else if(args[0].toUpperCase() == p.toUpperCase()) {
		return args.slice(1);
	}
	return false;
}
/* 	Takes a string in and strips off the IRC originator, if applicable.
	RETURNS: an array containing the command arguments, args[0] is the command,
	uppercased. */
function splitCmd(str) {
	var args;
	if (str[0] == ":")
		str = str.slice(str.indexOf(" ")+1);
	if (!str)
		return undefined; // nothing in the string!
	args = str.split(' ');
	args[0] = args[0].toUpperCase();
	return args;
}
/* Takes a string and returns the proper "IRC string".  Starts scanning on
   the "arg"th word.
   EXAMPLES:
      irc.getString("PRIVMSG Cyan Hello World",2); returns "Hello"
      irc.getString("PRIVMSG Cyan :Hello World",2); returns "Hello World"
   RETURNS:
      The entire string from the "arg"th word and beyond, if the "arg"th word
      begins with a ":".  If it does not, it returns the "arg"th word only.
      If it cannot scan to the "arg"th word, an empty string is returned. */
function getString(str,arg) {
	var cindex;
	var sindex;

	for(var sw_counter=0;sw_counter<arg;sw_counter++) {
		var my_index = str.indexOf(" ");
		if (my_index == -1)
			return ""; /* If we can't get to it, then the str is empty. */
		str = str.slice(my_index+1);
	}

	if (str[0] == ":")
		return(str.slice(1));

	sindex = str.indexOf(" ");
	if (sindex != -1)
		return(str.slice(0,sindex));

	return(str);
}
/* Splits a "nick!user@host" string into its three distinct parts.
	RETURNS: An array containing nick in [0], user in [1], and host in [2]. */
function splitNuh(str) {
	var tmp = new Array;

	if (str[0] == ":")
		str = str.slice(1);

	if (str.search(/[!]/) != -1) {
		tmp[0] = str.split("!")[0];
		tmp[1] = str.split("!")[1].split("@")[0];
	} else {
		tmp[0] = undefined;
		tmp[1] = str.split("@")[0];
	}
	tmp[2] = str.split("@")[1];
	return tmp;
}
/* Convert a dotted-quad IP address to an integer, i.e. for use in CTCP */
function ipToInt(ip) {
	if (!ip)
		return 0;
	var quads = ip.split(".");
	var addr = (quads[0]&0xff)<<24;
	addr|=(quads[1]&0xff)<<16;
	addr|=(quads[2]&0xff)<<8;
	addr|=(quads[3]&0xff);
	return addr;
}
/* Convert an integer to an IP address, i.e. for receiving CTCP's */
function intToIp(ip) {
	return(format("%u.%u.%u.%u"
		,(ip>>24)&0xff
		,(ip>>16)&0xff
		,(ip>>8)&0xff
		,ip&0xff
		));
}
/* Extract channel name from command */
function getChannel(srv,args) {
	switch(args[0]) {
	case "PRIVMSG":
		break;
	case "PART":
	case "QUIT":
	case "KICK":
	case "JOIN":
		if (args[1][0] == ":")
			args[1] = args[1].substr(1);
		break;
	default:
		return false;
	}
	var chan_str = args[1].toUpperCase();
	var chan = srv.channels[chan_str];
	if (!chan)
		return undefined;
	return chan;
}

/* export our protocol command lists into your filthy anus */
module.exports.server = serverCommand;
module.exports.client = clientCommand;
module.exports.ctcp = serverCTCP;
module.exports.emitter = emitter;

/* export protocol methods */
module.exports.processData = processData;
module.exports.splitCmd = splitCmd;
module.exports.getString = getString;
module.exports.splitNuh = splitNuh;
module.exports.getChannel = getChannel;
//module.exports.ipToInt = ipToInt;
//module.exports.intToIp = intToIp;