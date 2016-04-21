/* user object */
function User(nick,realname,userhost) {
	this.nick=		nick?nick:			["Unknown"];
	this.realname = realname?realname:	"Unknown";
	this.userhost = userhost?userhost:	"unknown@unknown";
	this.lastspoke = false;
	
	this.ident = false;
	this.level = 0;
	this.channels={};
}

/* class definition export */
module.exports = User;