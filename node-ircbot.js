/* console logging */
log = require('./lib/log');

/* global classes */
Module = require('./lib/Module');
Server = require('./lib/Server');
Channel = require('./lib/Channel');
Handler = require('./lib/Handler');
User = require('./lib/User');
Emitter = require('events').EventEmitter;

/* global libraries */
net = require('net');
rl = require('readline');
util = require('util');
vm = require('vm');

/* custom libraries */
irc = require('./lib/protocol');
core = require('./lib/core');

/* bot settings */
settings = require(process.argv[2]?process.argv[2]:'./settings');

/* main module list object */
modules = new (function() {
	this.list = {};
	
	/* initialize modules */
	this.init = function() {
		for(var m in settings.modules) {
			log("loading module information: " + m,1);
			var mm = settings.modules[m];
			
			/* create module */
			var mod = new Module(
				mm.name,
				mm.file,
				mm.channels,
				mm.enabled
			);
			
			/* store module */
			this.list[m.toUpperCase()] = mod;
			
			/* load module data */
			mod.init();		
		}	
		
	}
	
	/* go! */
	try {
		this.init();
	} catch(e) {
		log(e,LOG_ERROR);
	}
})();

/* main bot object */
ircbot = new (function() {
	this.servers = {};
	
	/* initialize bot */
	this.init = function() {

		process.on('exit', function () {
			this.exit();
		});

		process.on('SIGINT', function () {
			// happens when you press Ctrl+C
			//process.exit();
		});

		process.on('SIGTERM', function () {
			// usually called with kill
			//process.exit();
		});
		
		process.on('uncaughtException', function(err) {
		  log('Caught exception: ' + err,LOG_ERROR);
		  this.exit();
		});

		/* initialize servers */
		for(var s in settings.servers) {
			log("loading server information: " + s,LOG_DEBUG);
			var ss = settings.servers[s];
			
			/* skip disabled servers */
			if(!ss.enabled)
				continue;
				
			/* create server user */
			var usr = new User(
				ss.nick,
				ss.realname,
				ss.userhost
			)

			/* create server */
			var srv = new Server(
				ss.host,
				ss.port,
				ss.password,
				ss.channels,
				ss.prefix,
				usr
			);
			
			/* store server */
			this.servers[s] = srv;
			
			/* create socket */
			srv.connect();
		}

	}
	
	/* save settings and shit */
	this.save=function() {
		/* TODO: all of this shit (this.save) */
	}
	
	/* gracefully exit */
	this.exit=function() {
		log("exiting script",LOG_WARNING)

		/* save all settings */
		this.save();
		
		/* say buh-bye on all servers */
		for(var s in this.servers) {
			// Bot_Servers[s].writeout("QUIT :" + onick + " told me to die. :(");
		}
		
		/* TODO: all of this shit (this.exit) */
		
		/* smear feces on your restroom walls */
		for(var m in this.modules) {
		
		}
	}

	/* go! */
	try {
		this.init();
	} catch(e) {
		log(e,LOG_ERROR);
	}
})();

/* instantiate */
handler = new Handler();

