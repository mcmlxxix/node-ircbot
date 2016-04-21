var fs = require('fs');
var botCommand={};
var serverCommand={};
var serverCTCP={};

/* are we thieving? */
var thieving={};
var feihting={};

/* local stuff */
var echo = false;
var question = {};
var qFile = './pool.json';

/* standard bot commands */
botCommand["THIEF"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	usage:			"thief <chan> <user>",
	help:			"steal trivia questions from another asshole",
	execute:		function(srv,target,user,args) {
		args.shift();
		var chan = target.toUpperCase();
		var usr = undefined;
		
		if(args[0][0] == "#" || args[0][0] == "&")
			chan = args.shift().toUpperCase();
			
		if(args[0])
			usr = args.shift().toUpperCase();
		
		if(thieving[chan]) {
			srv.notice(target,"No longer stealing trivia questions from " + 
				(thieving[chan].user?thieving[chan].user:"ALL") + " in " + chan);
			delete thieving[chan];
		}
		else {
			question = {};
			thieving[chan] = { "target": target, "user": usr };
			srv.notice(target,"Now stealing trivia questions from " + 
				(usr?usr:"ALL") + " in " + chan);
		}
	}
};
botCommand["ECHO"] = {
	minSecurity:	0,
	argsNeeded:		false,
	identNeeded:	false,
	usage:			"",
	help:			"",
	execute:		function(srv,target,user,args) {
		echo = !echo;
		srv.notice(target,"trivia echo " + (echo?"on":"off"));
	}
};

/* special server command intercepts */
serverCommand["PRIVMSG"] = function(srv,cmd,onick,ouh) {
	var target = cmd.shift().toUpperCase();
	if(thieving[target] && onick.toUpperCase() == thieving[target].user) {

		/* strip colors and extra chars */
		var str = cmd.join(" ").substr(1);
		str = str.replace(/\x032[^\x03]?/g,'');
		str = str.replace(/\x031[^\x03]?/g,' ');
		str = str.replace(/\x03\d,?\d?/g,'');
		str = str.replace(/\s+/g,' ');

		var result = parseQuestion(str);
		if(result) {
			question = {
				q:result.q,
				p:result.p
			};
			if(echo) {
				srv.notice(thieving[target].target,"question: " + question.q);
				srv.notice(thieving[target].target,"points: " + question.p);
			}
			return;
		}

		/* strip colors and extra chars */
		str = cmd.join(" ").substr(1);
		str = str.replace(/\x031,1[^\x03]?/g,' ');
		str = str.replace(/\x032[^\x03]?/g,'');
		str = str.replace(/\x03\d+,?\d?/g,'');
		str = str.replace(/\s+/g,' ');
		str = str.replace(/-->.*<--/g,'');

		var result = parseAnswer(str);
		if(result && question) {

			question.n = result.n;
			question.a = result.a;
			if(echo) {
				srv.notice(thieving[target].target,"number: " + question.n);
				srv.notice(thieving[target].target,"answer: " + question.a);
			}
		}

		if(!question)
			return;

		if(question.n && question.a && question.q && question.p) {
			saveQuestion(srv,thieving[target].target,question);
			question = undefined;
		}
	}
}

function saveQuestion(srv,target,q) {
	fs.appendFile(qFile, "," + JSON.stringify(q), function (err) {
		if(err) {
			srv.notice(target,"error saving question: " + err);
		}
		else if(echo){
			srv.notice(target,"question #" + q.n + " stored");
		}
	});
}
function parseQuestion(str) {

	/* parse actual question */
	str = str.substring(0,str.lastIndexOf("?"));
	var re = /SECRET\sof\s\d*,\sworth\s(\d*)\spoints:\s(.*)$/;
	var match = re.exec(str);

	if(match && match[1] >= 0) {
		return ({
			q:match[2],
			p:match[1]
		});
	}
	return false;
}
function parseAnswer(str) {
	/* match question number */
	var match = str.match(/QUESTION\((\d*)\)/);

	/* if we couldnt parse a question number, it's not the answer block */
	if(!match || isNaN(match[1])) {
		return false;
	}

	var num = Number(match[1]);
	var ans;

	/*
 :<utonium> ♥11,1  Yes! ♥8,1Intuitiva!♥11,1 googled the answer QUESTION(748426)  ♥0,1 ->♥0,1 ♥0,1 3♥1,1i♥0,1hours ♥11,1♥0,1 <-♥6  ♥11in♥4 12 ♥11seconds♥11,1 and receives♥0,1--> 20 <--♥11,1 points!
	*/

	/* match answer */
	var a = str.match(/:\s(.*)!.*$/);
	if(a) {
		ans = a[1];
	}
	else {
		a = str.match(/->(.*)<-/);
		if(a) {
			ans = a[1].replace(/^\s+|\s+$/g,'');
		}
	}

	if(num && ans) {
		return ({
			n:num,
			a:ans
		});
	}
	return false;
}

module.exports.command = botCommand;
module.exports.server = serverCommand;
module.exports.ctx = this;

//<- :utonium!utonium@suck.it.trebek PRIVMSG #trivia :♥11,1  Yes! ♥8,1zut!♥11,1 googled the answer QUESTION(728953)  ♥0,1 ->♥0,1 ♥0,1 i-formation ♥11,1♥0,1 <-♥6♥11in♥4 12 ♥11seconds♥11,1 and receives♥0,1--> 25 <--♥11,1 points!
