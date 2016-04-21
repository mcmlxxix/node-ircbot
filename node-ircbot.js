/* load a library (and clear its cache) */
loadFile = function(file) {
	delete require.cache[require.resolve(file)];
	return require(file);
}

/* start REPL */
repl = function() {
	var options = {
		prompt: "node> ",
		input: process.stdin,
		output: process.stdout,
		terminal: true,
		useGlobal: true
	};
	repl.start(options);
}

/* global libraries */
net = require('net');
rl = require('readline');
util = require('util');
vm = require('vm');
log = loadFile('log');
log("Node.js IRC bot - running node.js " + process.version,LOG_WARNING);

/* global classes */
Module = loadFile('./lib/Module');
Server = loadFile('./lib/Server');
Channel = loadFile('./lib/Channel');
Handler = loadFile('./lib/Handler');
User = loadFile('./lib/User');

/* protocol libraries */
irc = loadFile('./lib/protocol');

/* core bot commands */
core = loadFile('./lib/core');

/* bot settings */
sFile = process.argv[2]?process.argv[2]:'./settings';
settings = loadFile(sFile);

/* main module list object */
modules = new (function() {
	this.list = {};
	
	/* initialize modules */
	this.init = function() {
		for(var m in settings.modules) {
			var mm = settings.modules[m];
			this.load(mm);
		}	
	}

	/* load a module */
	this.load = function(mm) {
		log("loading module information: " + mm.name,LOG_INFO);
		/* create module */
		var mod = new Module(
			mm.name,
			mm.file,
			mm.channels,
			mm.enabled
		);
		
		/* store module */
		this.list[mm.name.toUpperCase()] = mod;
		
		/* load module data */
		mod.init();		
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
			process.exit();
		});

		process.on('SIGTERM', function () {
			// usually called with kill
			process.exit();
		});
		
		process.on('uncaughtException', function(err) {
		  log('Caught exception: ' + err,LOG_ERROR);
		  this.exit();
		});

		/* initialize servers */
		for(var s in settings.servers) {
			var ss = settings.servers[s];
			log("loading server information: " + ss.host,LOG_INFO);
			
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
				ss.ops,
				ss.channels,
				ss.prefix,
				ss.separator,
				usr
			);
			srv.id = s;
			srv.setMaxListeners(1);
			
			/* store server */
			this.servers[s.toUpperCase()] = srv;
			
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

/* local interface */
local = new (function() {
	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	process.stdin.on('data', function ( key) {
		// ctrl-c ( end of text )
		if ( key === '\u0003' ) {
			process.exit();
		}
		// write the key to stdout all normal like
		//process.stdout.write( "stuff: " + key );
	});	
})();

/* instantiate */
handler = new Handler();
