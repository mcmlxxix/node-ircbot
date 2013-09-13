global.Color = {
	fg:{
		black:'\033[30m',
		red:'\033[31m',
		green:'\033[32m',
		yellow:'\033[33m',
		blue:'\033[34m',
		magenta:'\033[35m',
		cyan:'\033[36m',
		lightgray:'\033[37m',
		darkgray:'\033[30;1m',
		lightred:'\033[31;1m',
		lightgreen:'\033[32;1m',
		lightyellow:'\033[33;1m',
		lightblue:'\033[34;1m',
		lightmagenta:'\033[35;1m',
		lightcyan:'\033[36;1m',
		white:'\033[37;1m',
	},
	bg:{
		black:'\033[40m',
		red:'\033[41m',
		green:'\033[42m',
		yellow:'\033[43m',
		blue:'\033[44m',
		magenta:'\033[45m',
		cyan:'\033[46m',
		white:'\033[47m',
	},
	ansi_normal:'\033[0m'
}

function bgcolor(color) {
	if(color == undefined) {
		return Color.ansi_normal;
	}
	if(Color.bg[color.toLowerCase()]) {
		return Color.bg[color.toLowerCase()];
	}
	throw("color not found: " + color);
}

function fgcolor(color) {
	if(color == undefined) {
		return colors.ansi_normal;
	}
	if(Color.fg[color.toLowerCase()]) {
		return Color.fg[color.toLowerCase()];
	}
	throw("color not found: " + color);
}

module.exports.fg = fgcolor;
module.exports.bg = bgcolor;
