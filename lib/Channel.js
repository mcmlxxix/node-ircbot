function Channel(name,key) {
	// Statics.
	this.name = name;
	this.key = key;
	
	// Dynamics.
	this.joined = false;
	this.lastjoin = 0;
	
	// Modules active in this channel (associative)
	this.modules = {};
}

/* class definition export */
module.exports = Channel;

