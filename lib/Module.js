/* module object */
function Module(name,file,channels,enabled) {

	this.name=name;
	this.file=file;
	this.channels=channels;
	this.enabled=enabled;
	
	this.init=function() {
		var data = loadFile(this.file);
		/* load bot data */
		for(var p in data) {
			this[p] = data[p];
		}
	}
}

/* class definition export */
module.exports = Module;