global.LOG_INFO  = 0;
global.LOG_DEBUG  = 1;
global.LOG_WARNING  = 2;
global.LOG_ERROR  = 3;
var ansi = require('./ansi');

function log(str,lvl) {
	var color = "";
	if(lvl == undefined)
		lvl = LOG_INFO;
	switch(lvl) {
	case LOG_INFO:
		color = Color.fg.lightgray;
		break;
	case LOG_DEBUG:
		color = Color.fg.darkgray;
		break;
	case LOG_WARNING:
		color = Color.fg.lightmagenta;
		break;
	case LOG_ERROR:
		color = Color.fg.lightred;
		break;
	}
	console.log(color+str);
}

module.exports = log;
