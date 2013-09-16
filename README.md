#node-ircbot.js


######a modular IRC bot written in node.js

*modular* in this project does not mean *node.js* modules, but rather *bot modules*. 
using the following API and [module](http://github.com/mcmlxxix/node-ircbot/blob/master/modules/test.js) examples,
it is possible to create very flexible "add-ons" for the standard bot. 

---

####bot command object

```js
Command["TEST"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	usage:			"test [arg1, [arg2] ..]",
	help:			"test command",
	execute:		function(srv,target,user,args) {
		srv.privmsg(target,"Server: " + srv.host+":"+srv.port);
		srv.privmsg(target,"Target: " + target);
	}
};
```

The *args* argument is parsed automatically from your text (minus the bot command prefix)
and split into an array at every space. More command examples can be found in [core.js](http://github.com/mcmlxxix/node-ircbot/blob/master/lib/core.js)

####API

The ability to effectively write a bot module requires some basic knowledge
of the objects passed to a standard bot command, as well as some basic knowledge 
of IRC in general.. 

#####User() object properties
	nick: [nick1, nick2, ...]
	realname: "realname"
	userhost: "user@host"
	lastspoke: last time user spoke (UTC)
	level: security level (number)
	ident: user identity state (boolean)
	channels: {"#node.js":true, "#test":true, ...}

#####Channel() object properties
	name: "#channel name"
	key: "keyword"
	joined: channel join state (boolean)
	lastjoin: last channel join attempt (UTC)
	modules: {"Test":true, ...}

#####Server() object properties
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

#####Server() object methods
	output(string): write a raw string to server socket (e.g. PRIVMSG mcmlxxix :Hello World!)
	input(string): force processing of server socket input (fake a command?)
	ctcp(target,string): send a CTCP command string to "target"
	privmsg(target,string): send a message to "target" (normal message output)
	notice(target,string): send a notice 

#####Module() object properties
	name: "Test"
	file: "./modules/test.js"
	channels: ["#node.js", "#test", ...]
	enabled: boolean

#####Module() object methods:
	init(): load/reload module data

