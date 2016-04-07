/* server object */
function Server(host,port,password,ops,channels,prefix,separator,user) {
	this.name = undefined;
	this.host=host;
	this.port=port;
	this.password=password;
	this.ops=ops;
	this.channels=channels;
	this.user=user;
	this.prefix=prefix;
	this.separator=separator;
	this.socket=undefined;
	
	/* dynamic variables (bot state) */
	this.connAttempts = 0;
	this.curnick = undefined;
	this.registered = false;
	this.identified = false;
	this.users = {};			// Store local nicks & uh info.
	this.ignore = {};

	/* send data to server socket */
	this.output=function(str) {
		log('-> ' + str,1);
		this.socket.write(str + "\r\n");
	}

	/* receive data from server socket */
	this.input=function(str) {
		log('<- ' + str,1);
		irc.processData(this,str);
	}
	
	/* ctcp response */
	this.ctcp=function(target,str) {
		this.output("NOTICE " + target + " :\1" + str + "\1");
	}
	
	/* normal privmsg */
	this.privmsg=function(target,str) {
		/*
		for (c in Squelch_List) {
			if (target.toUpperCase() == Squelch_List[c].toUpperCase())
				return;
		}
		*/
		
		/* TODO: buffer output? */
		this.output("PRIVMSG " + target + " :" + str);
	}
	
	/* notice privmsg */
	this.notice=function(target,str) {
		/*
		for (c in Squelch_List) {
			if (target.toUpperCase() == Squelch_List[c].toUpperCase())
				return;
		}
		*/
	
		/* TODO: buffer output? */
		this.output("NOTICE " + target + " :" + str);
	}
	
	/* establish connection (calls onConnect listener) */
	this.connect=function() {
		var srv = this;

		/* abort connection attempt if already connected */
		if(srv.socket && srv.socket.writable) {
			return false;
		}

		log("-- connecting to " + this.host + ":" + this.port);
		srv.connAttempts++;
		net.createConnection(this.port,this.host,function() {
			onConnect(srv,this);
		});
		return true;
	}

	/* registration event listener (joins channels) */
	this.on("Register",function() {
		onRegister(this);
	});
	
	/* disconnection event listener */
	this.on("Disconnect",function() {
		onDisconnect(this);
	});
	
	/* kick event listener */
	this.on("Kick",function(cname, kicked) {
		onKick(this,cname,kicked);
	});
	
	/* part event listener */
	this.on("Part",function(cname, parted) {
		onPart(this,cname,parted)
	});

	/* join event listener */
	this.on("Join",function(cname, joined, userhost) {
		onJoin(this,cname,joined,userhost);
	});

	/* who event listener */
	this.on("Who",function(cname,nick,realname,user,host) {
		onWho(this,cname,nick,realname,user,host);
	});

	/* error issued by irc server */
	this.on("Error",function(err) {
		log(err.join(" "),3);
		this.sock.close();
		this.sock = 0;
	});
	
	/* on duplicate nick */
	this.on("Jupe",function(nick) {
		onJupe(this,nick);
	});

	/* on channel ban */
	this.on("Ban",function(cname) {
		onBan(this,cname);
	});
}

/* event handlers */
function onRegister(srv) {
	log("-- registered");
	srv.registered=true;

	/* TODO: identify? */
	srv.identified=true;

	/* initialize channel list */
	for(var c in srv.channels) {
		var cstr = srv.channels[c].split(" ");
		var cname = cstr[0]; 
		var key = cstr[1];
		srv.channels[cname.toUpperCase()] = new Channel(cname,key);
		srv.output("JOIN " + cname + (key?" " + key:""));
	}
	
	/* initialize channel modules */
	for(var m in modules.list) {
		var module = modules.list[m];
		for(var c in module.channels) {
			var chan = module.channels[c];
			if(chan && srv.channels[chan.toUpperCase()]) {
				srv.channels[chan.toUpperCase()].modules[m] = true;
			}
		}
	}
}
function onConnect(srv,socket) {
	log("-- connected to " + srv.host + ":" + srv.port);
	srv.socket = socket;
	//srv.socket.setMaxListeners(1);
	
	/* initialize client socket */
	srv.socket.setEncoding('utf8');
	srv.socket.ip = srv.socket.remoteAddress;
	srv.socket.rl = rl.createInterface({
		input:srv.socket,
		output:srv.socket
	});
	srv.socket.rl.on('line',function(str) {
		srv.input(str);
	});
	srv.socket.on("close",function() {
		srv.socket.rl.close();
		srv.emit("Disconnect");
	});
	
	/* initialize client user */
	srv.curnick =  srv.user.nick[0];
	if(srv.password !== undefined)
		srv.output("PASS " + srv.password);
	srv.output("NICK " + srv.user.nick[0]);
	srv.output("USER " + srv.user.userhost + " * * :" + srv.user.realname);
}
function onDisconnect(srv) {
	log("-- disconnected from " + this.host + ":" + this.port);
	/* if we have reached the maximum reconnection attempts, exit */
	if(srv.connAttempts >= settings.reconnect_attempts) {
		throw("max connection attempts reached");
	}

	/* reset connection state */
	srv.connAttempts = 0;
	srv.socket = undefined;
	srv.curnick = undefined;
	srv.registered = false;
	srv.identified = false;
	srv.users = {};
	srv.ignore = {};

	/* set a timeout event to re-connect */
	setTimeout(srv.connect, settings.reconnect_timeout);
}
function onJoin(srv,cname,joined,userhost) {
	var channel = srv.channels[cname.toUpperCase()];
	/* TODO: if channel not in server channel list, then what? */
	if(!channel)
		return;
	
	// Me joining.
	if ((joined == srv.curnick) && !channel.joined) {
		channel.joined = true;
		channel.lastJoin = Date.now();
		srv.output("WHO " + channel.name);
	}
	
	// Someone else joining.
	checkUser(srv,channel,joined,joined,userhost);
	
	/* TODO: store channels in user object? or store users in channel object? */
	srv.users[joined.toUpperCase()].channels[cname.toUpperCase()]=true;
	
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
function onKick(srv,cname,kicked) {
	var channel = srv.channels[cname.toUpperCase()];
	
	/* if we were kicked */
	if ((kicked == srv.curnick) && channel && channel.joined) {
		log("-- kicked from " + this.host + " : " + channel.name);
		channel.joined = false;

		/* TODO: track join attempts and abort after n attempts */
		if(settings.rejoin_on_kick) {
			setTimeout(function() {
				srv.output("JOIN " + channel.name + (channel.key?" " + channel.key:""));
			}, settings.rejoin_timeout);
		}
	}

	/* Someone else was kicked */
	else if(srv.users[kicked.toUpperCase()]) {

		/* TODO: store channels in user object? or store users in channel object? */
		delete srv.users[kicked.toUpperCase()].channels[cname.toUpperCase()];
		
		/* TODO: this is fuckedly fucktarded */
		var ccount=0;
		for(var c in srv.users[kicked.toUpperCase()].channels) 
			ccount++;
		if(ccount==0) 
			delete srv.users[kicked.toUpperCase()];
	}	
}
function onPart(srv,cname,parted) {
	var channel = srv.channels[cname.toUpperCase()];

	/* if we are parting */
	if ((parted == srv.curnick) && channel && channel.joined) {
		log("-- parting from " + this.host + " : " + channel.name);
		channel.joined = false;
	}

	/* someone else parting */
	else if(srv.users[parted.toUpperCase()]) {
	
		/* TODO: store channels in user object? or store users in channel object? */
		delete srv.users[parted.toUpperCase()].channels[cname.toUpperCase()];
		
		/* TODO: this is fuckedly fucktarded */
		var ccount=0;
		for(var c in srv.users[parted.toUpperCase()].channels) 
			ccount++;
		if(ccount==0) 
			delete srv.users[parted.toUpperCase()];
	}
}
function onJupe(srv,nick) {
	log("Trying new nick. " + nick + " in use.");

	/* loop until we find the current nick and select the 
	next nick. if we're at the end of the list, add a random number to
	the first nick */
	var newnick = undefined;
	var n = 0;
	for(;n<srv.user.nick.length;n++) {
		/* break when we find the current nick */
		if(srv.user.nick[n].toUpperCase() == nick.toUpperCase())
			break;
	}
	/* if we have exhausted the nick list, get random */
	if(n == srv.user.nick.length-1) {
		newnick = srv.user.nick[0] + Math.floor(Math.random() * 10);
	}
	/* otherwise pick the next available */
	else {
		newnick = srv.user.nick[n+1];
	}
	srv.output("NICK " + newnick);
	srv.curnick = newnick;
}
function onBan(srv,cname) {
	log("Banned from channel: " + cname);
	/* TODO: handle kickban
	<- :echicken!echicken@loveclown.com MODE #coa +b Popeye!*@*
	<- :echicken!echicken@loveclown.com KICK #coa Popeye :cunt cunt cunt cunt cunt
	<- :master.bbs-scene.org 474 Popeye #COA :Cannot join channel (+b)
	*/
}
function onWho(srv,cname,nick,realname,user,host) {
	if(!srv.users[nick.toUpperCase()]) 
		srv.users[nick.toUpperCase()] = new User(nick,realname,user + "@" + host);
	else 
		srv.users[nick.toUpperCase()].userhost = user + "@" + host;
		
	/* TODO: store channels in user object? or store users in channel object? */
	srv.users[nick.toUpperCase()].channels[cname.toUpperCase()]=true;
}

/* helper functions */
function checkUser(srv, channel, nick, realname, userhost) {
	if(!srv.users[nick.toUpperCase()]) {	
		srv.users[nick.toUpperCase()] = new User(nick,realname,userhost);
	}
	else {
		srv.users[nick.toUpperCase()].uh=userhost;
	}
	for(var u=0;u<srv.ops.length;u++) {
		if(nick.toUpperCase() == srv.ops[u].toUpperCase()) {
			giveOps(srv,channel,nick);
			break;
		}
	}
}
function giveOps(srv, channel, nick) {
	srv.output("MODE " + channel.name + " +o " + nick);
}

/* prototype server object */
var Emitter = require('events').EventEmitter;
Server.prototype = new Emitter;

/* class definition export */
module.exports = Server;
