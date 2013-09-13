/* user object */
function User(nick,realname,userhost) {
	this.nick=		nick?nick:			["Unknown"];
	this.realname = realname?realname:	"Unknown";
	this.userhost = userhost?userhost:	"unknown@unknown";
	this.lastspoke = false;
	
	/* TODO: fix this shit */
	this.ident = true;
	this.level = 99;
	this.channels={};
}

/* class definition export */
module.exports = User;