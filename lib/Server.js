/* server object */
function Server(host,port,password,channels,prefix,user) {
	this.host=host;
	this.port=port;
	this.password=password;
	this.channels=channels;
	this.user=user;
	this.prefix=prefix;
	this.socket=undefined;
	
	/* dynamic variables (bot state) */
	this.curnick = undefined;
	this.lastcon = 0;			// When it's OK to reconnect.
	this.lastout = 0;			// When it's OK to send the next socket ouput
	this.registered = false;
	this.identified = false;
	this.users = {};			// Store local nicks & uh info.
	this.ignore = {};

	/*
	this.bot_access = Server_bot_access;
	this.bot_command = Server_bot_command;
	this.server_command = Server_command;
	*/
	
	/* send data to server socket */
	this.output=function(str) {
		log('-> ' + str,1);
		this.socket.write(str + "\r\n");
	}

	/* receive data from server socket */
	this.input=function(str) {
		log('<- ' + str,1);
		//irc.processData(this,str.slice(0,-2));
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
		log("-- connecting to " + this.host + ":" + this.port);
		var srv = this;
		net.createConnection(this.port,this.host,function() {
			srv.emit("Connect",this);
		});
	}
	
	/* connection event listener (calls onDisconnect listener) 
	sets up line-mode socket IO (processes received data) */
	this.on("Connect",function(socket) {
		log("-- connected to " + this.host + ":" + this.port);
		this.socket = socket;
		
		/* initialize client socket */
		initSocket(this);
		
		/* initialize client user */
		initUser(this);
	});
	
	/* registration event listener (joins channels) */
	this.on("Register",function() {
		this.registered=true;
		/* TODO: identify? */
		this.identified=true;
		initChannels(this);
	});
	
	/* disconnection event listener */
	this.on("Disconnect",function() {
		log("-- disconnected from " + this.host + ":" + this.port);
	});
	
	/* kick event listener */
	this.on("Kick",function(channel) {
		channel.joined = false;
		irc.client["JOIN"](this,channel.name,channel.key);
	});
	
	/* part event listener */
	this.on("Part",function(channel) {
		channel.joined = false;
	});

	/* join event listener */
	this.on("Join",function(channel) {
		channel.joined = true;
		channel.lastjoin = Date.now();
		this.output("WHO " + channel.name);
	});

	/* error issued by irc server */
	this.on("Error",function(err) {
		log(err.join(" "),3);
		this.sock.close();
		this.sock = 0;
	});
	
	/* on duplicate nick */
	this.on("Jupe",function(nick) {
		log("Trying new nick. " + nick + " in use.");
		/* loop until we find the current nick and select the 
		next nick. if we're at the end of the list, add a random number to
		the first nick */
		var newnick = undefined;
		var n = 0;
		for(;n<this.user.nick.length;n++) {
			/* break when we find the current nick */
			if(this.user.nick[n].toUpperCase() == nick.toUpperCase())
				break;
		}
		/* if we have exhausted the nick list, get random */
		if(n == this.user.nick.length-1) {
			newnick = this.user.nick[0] + Math.floor(Math.random() * 10);
		}
		/* otherwise pick the next available */
		else {
			newnick = this.user.nick[n+1];
		}
		this.output("NICK " + newnick);
		this.curnick = newnick;
	});
}

/* initialize client socket */
function initSocket(srv) {
	srv.socket.setEncoding('utf8');
	srv.socket.ip = srv.socket.remoteAddress;
	srv.socket.rl = rl.createInterface({
		input:srv.socket,
		output:srv.socket
	});
	srv.socket.rl.on('line',function(str) {
		//srv.input(str.slice(0,-2));
		srv.input(str);
	});
	srv.socket.on("close",function() {
		srv.socket.rl.close();
		srv.emit("Disconnect");
	});
}

/* initialize client user */
function initUser(srv) {
	irc.client["PASS"](srv,srv.password);
	irc.client["NICK"](srv,srv.user.nick[0]);
	irc.client["USER"](srv,srv.user.userhost,srv.user.realname);
}

/* initialize channel list */
function initChannels(srv) {

	for(var c in srv.channels) {
		var chan = srv.channels[c].split(" ");
		srv.channels[chan[0].toUpperCase()] = new Channel(chan[0],chan[1]);
		irc.client["JOIN"](srv,chan[0],chan[1]);
	}
	
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

/* prototype server object */
var Emitter = require('events').EventEmitter;
Server.prototype = new Emitter;

/* class definition export */
module.exports = Server;

/* TODO: handle kickban
<- :echicken!echicken@loveclown.com MODE #coa +b Popeye!*@*
<- :echicken!echicken@loveclown.com KICK #coa Popeye :cunt cunt cunt cunt cunt
-> JOIN #COA
<- :master.bbs-scene.org 474 Popeye #COA :Cannot join channel (+b)
*/