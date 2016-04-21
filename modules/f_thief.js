var fs = require('fs');
var botCommand={};
var serverCommand={};
var serverCTCP={};

/* are we thieving? */
var thieving={};

/* local stuff */
var echo = false;
var category;
var lines = [];
var end_of_question = false;
var question = {};
var qFile = './f_pool.json';

/* standard bot commands */
botCommand["F_THIEF"] = {
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

		if(category && lines.length > 0) {
			log("parsing answer for question: " + category + "-" + lines.join(" "),LOG_ERROR);

			/* strip colors and extra chars */
			var str = cmd.join(" ").substr(1);
			str = str.replace(/\x02*/g,'');
			str = str.replace(/\x03\d*/g,'');
			str = str.replace(/\s+/g,' ');
			log(str,LOG_WARNING);

			var result = parseAnswer(str);
			if(result) {
				log("answer: " + result.a,LOG_WARNING);
			}
			if(result && question) {

				question.n = result.n;
				question.a = result.a;
				if(echo) {
					srv.notice(thieving[target].target,"number: " + question.n);
					srv.notice(thieving[target].target,"answer: " + question.a);
				}
			}
		}
		else {
			/* strip colors and extra chars */
			var str = cmd.join(" ").substr(1);
			str = str.replace(/\x02*/g,'');
			str = str.replace(/\x03\d*/g,'');
			str = str.replace(/\s+/g,' ');

			var result = parseQuestion(str);
			if(result) {
				question = {
					c:category,
					q:lines.join("").replace(/^\s*|\s+|\s*$/g,''),
					p:-1
				};
				if(echo) {
					srv.notice(thieving[target].target,"question: " + question.c);
					srv.notice(thieving[target].target,"question: " + question.q);
					srv.notice(thieving[target].target,"points: " + question.p);
				}
				category = undefined;
				lines = [];
				end_of_question = true;
				return;
			}
		}


		if(!question)
			return;

		if(question.n && question.a && question.q && question.p) {
			saveQuestion(srv,thieving[target].target,question);
			question = undefined;
			end_of_question = false;
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

	/* parse category */
	var cmatch = str.match(/category\:\s(.*)\]$/);
	if(!category && cmatch && cmatch[1]) {
		category = cmatch[1];
		return false;
	}

	/* parse question */
	else if(category && !end_of_question) {
		var qmatch = str.match(/\s*Hint:.*/g);
		if(qmatch) {
			return true;
		}
		else {
			lines.push(str);
			return false;
		}
	}
	
	return false;
}
function parseAnswer(str) {
// <- :Triviette!haunteduni@about/trivia/bot/triviette PRIVMSG ##trivia :Congratula
// tions ♥6David♥! The answer was♥6 VENTING♥.
// <- :Triviette!haunteduni@about/trivia/bot/triviette PRIVMSG ##trivia :Time's up!
//  Nobody got it right. The answer was♥6 CARUSO
	
	return false;
	var ans;

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

// :♥4--== Trivia ==--♥ [category: ☻General☻]
// :♥3 In what Australian state w☻☻ould
// :♥3 you ☻☻find Canberra
// :Hint: _ _ _
// :♥4--== Trivia ==--♥ [category: ☻General☻]
// :♥3 I☻☻n what Australian
// :♥3 state would you ☻☻find Canberra
// :Hint [1 of 3]: A _ _