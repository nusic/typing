function TypeEventLogger() {
	this.reset();
}

TypeEventLogger.prototype.lastEvent = function() {
	return this.events[this.events.length-1]
};

TypeEventLogger.prototype.reset = function() {
	this.events = [];
	this.currentIndex = 0;
	this.startTime = 0;
};

TypeEventLogger.prototype.log = function(key, targetKey) {
	if (this.startTime === 0) {
		this.startTime = Date.now();
	}

	this.events.push({
		t: Date.now() - this.startTime,
		key: key,
		target: targetKey,
		i: this.currentIndex
	});

	this.currentIndex += key === 'Backspace' ? -1 : 1;
};
