var botCommand={};
var serverCommand={};
var serverCTCP={};
//var pako = require('pako');
var crypto = require('crypto');

const READ = 		0;
const WRITE = 		1;
const LOCK = 		2;
const UNLOCK = 		3;
const SUBSCRIBE = 	4;
const UNSUBSCRIBE = 5;
const AUTH = 		6;

/* The ability to effectively write a bot module requires some basic knowledge
of the objects passed to a standard bot command, as well as some basic knowledge 
of IRC in general.. 

User() object properties:
	nick: [nick1, nick2, ...]
	realname: "realname"
	userhost: "user@host"
	lastspoke: last time user spoke (UTC)
	level: security level (number)
	ident: user identity state (boolean)
	channels: {"#node.js":true, "#test":true, ...}

Channel() object properties:
	name: "#channel name"
	key: "keyword"
	joined: channel join state (boolean)
	lastjoin: last channel join attempt (UTC)
	modules: {"Test":true, ...}

Server() object properties:
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

Server() object methods:
	output(string): write a raw string to server socket (e.g. PRIVMSG mcmlxxix :Hello World!)
	input(string): force processing of server socket input (fake a command?)
	ctcp(target,string): send a CTCP command string to "target"
	privmsg(target,string): send a message to "target" (normal message output)
	notice(target,string): send a notice 

Module() object properties:
	name: "Test"
	file: "./modules/test.js"
	channels: ["#node.js", "#test", ...]
	enabled: boolean

Module() object methods:
	init(): load/reload module data

*/

var socket;
var host = "localhost";
var port = "10089";

/* standard bot commands */
botCommand["CONN"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	usage:			"conn host port",
	help:			"connect to json-db",
	execute:		function(srv,target,user,args) {
		if(args[1] && args[2]) {
			host = args[1];
			port = args[2];
		}
		connect(srv,target,user,host,port);
	}
};

botCommand["READ"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	execute:		function(srv,target,user,args) {
		args.shift();
		var q = Q(READ,user.sandbox.query?user.sandbox.query:[]);
		sendQuery(q);
	}
};

botCommand["AUTH"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	execute:		function(srv,target,user,args) {
		args.shift();
		var name = args.shift();
		var hash = crypto.createHash('md5').update(args.shift()).digest('hex');
		var q = Q(AUTH,{name:name,pass:hash});
		sendQuery(q);
	}
};

botCommand["WRITE"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	execute:		function(srv,target,user,args) {
		args.shift();
		var q = Q(WRITE,user.sandbox.selection?user.sandbox.selection.data:[]);
		sendQuery(q);
	}
};

botCommand["SUB"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	execute:		function(srv,target,user,args) {
		args.shift();
		var q = Q(SUBSCRIBE,user.sandbox.query?user.sandbox.query:[]);
		sendQuery(q);
	}
};

botCommand["UNSUB"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	execute:		function(srv,target,user,args) {
		args.shift();
		var q = Q(UNSUBSCRIBE,user.sandbox.query?user.sandbox.query:[]);
		sendQuery(q);
	}
};

botCommand["LOCK"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	execute:		function(srv,target,user,args) {
		args.shift();
		var q = Q(LOCK,user.sandbox.query?user.sandbox.query:[]);
		q.lock = args.shift();
		sendQuery(q);
	}
};

botCommand["UNLOCK"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	execute:		function(srv,target,user,args) {
		args.shift();
		var q = Q(UNLOCK,user.sandbox.query?user.sandbox.query:[]);
		sendQuery(q);
	}
};

// <database_query>:{
	// db 		: <database_name>,
	// oper		: <operation>,
	// data		: <record_data>
// }

function encodeRequest(obj) {
	var array = [];
	array[0] = obj.oper;
	array[1] = obj.id;
	array[2] = obj.db;
	array[3] = obj.status;
	switch(obj.oper){
	case READ:
	case WRITE:
	case UNLOCK:
		array[4] = encodeData(obj.data);
		break;
	case LOCK:
		array[4] = encodeData(obj.data);
		array[5] = obj.lock;
		break;
	case SUBSCRIBE:
	case UNSUBSCRIBE:
		break;
	case AUTH:
	array[4] = obj.data;
		//array[3] = obj.user;
		//array[4] = obj.pass;
		break;
	default:
		/* what to do here? */
		break;
	}
	return array;
}

function decodeRequest(array) {
	var obj = {};
	obj.oper = array[0];
	obj.id = array[1];
	obj.db = array[2];
	obj.status = array[3];
	switch(obj.oper){
	case READ:
	case WRITE:
	case UNLOCK:
		obj.data = decodeData(array[4]);
		break;
	case LOCK:
		obj.data = decodeData(array[4]);
		obj.lock = array[5];
		break;
	case SUBSCRIBE:
	case UNSUBSCRIBE:
		break;
	case AUTH:
		obj.data = array[4];
		//obj.user = array[3];
		//obj.pass = array[4];
		break;
	default:
		/* what to do here? */
		break;
	}
	return obj;
}

function encodeData(array) {
	var data = [];
	for(var i=0;i<array.length;i++) {
		data.push([array[i].path,array[i].key,array[i].value,array[i].status]);
	}
	return data;
}

function decodeData(array) {
	var data = [];
	for(var i=0;i<array.length;i++) {
		data.push({path:array[i][0],key:array[i][1],value:array[i][2],status:array[i][3]});
	}
	return data;
}

function Q(oper,data) {
	return {
		"db":"test",
		"oper":oper,
		"data":data
	};
}

function sendQuery(q) {
	var response = JSON.stringify(encodeRequest(q));
	//response = pako.deflate(response,{to:'string'});
	output(null,null,response);
}

function connect(srv,target,user,host,port) {
	srv.privmsg(target,"connecting to " + host + ":" + port);
	net.createConnection(port,host,function() {
		onConnect(srv,target,user,this);
	}).on('error',function(e) {
		srv.privmsg(target, e);
	});
}

function input(srv,target,user,str) {
	if(!user.sandbox)
		user.sandbox = {};
	//str = pako.inflate(str,{to:'string'});
	user.sandbox.selection = decodeRequest(JSON.parse(str));
	srv.privmsg(target,str);
}

function output(srv,target,str) {
	socket.write(str + "\r\n");
}

function onConnect(srv,target,user,sock) {
	srv.privmsg(target,"socket connected");
	socket = sock;
	socket.setEncoding('utf8');
	socket.ip = socket.remoteAddress;
	socket.rl = rl.createInterface({
		input:socket,
		output:socket
	});
	socket.rl.on('line',function(str) {
		input(srv,target,user,str);
	});
	socket.on("close",function() {
		socket.rl.close();
		srv.privmsg(target,"socket disconnected");
	});		
}

/* special server command intercepts */
//serverCommand["PRIVMSG"] = function(srv,cmd,onick,ouh) {
//	srv.notice(onick,"testes");
//}

/* special ctcp request intercepts */
//serverCTCP["PING"] = function(srv,user,cmd) {
//	srv.notice(user.nick,"PONG");
//}

/* uncomment exports as necessary if creating custom server/CTCP commands */
module.exports.command = botCommand;
//module.exports.server = serverCommand;
//module.exports.ctcp = serverCTCP;

module.exports.description = 
"This is a sample bot module to demonstrate the module api. Enter a description here (500 chars max)."

