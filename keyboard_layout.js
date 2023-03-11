
function rowOf() {
	var row = [];
	for (var i = 0; i < arguments.length; i++) {
		if (typeof arguments[i] === 'string') {
			// console.log(arguments[i]);
			const keys = arguments[i].split('');
			// console.log(keys);
			row.push.apply(row, arguments[i].split(''));
		}
		else if (typeof arguments[i] === 'object') {
			// array
			row.push.apply(row, arguments[i]);
		} else {
			row.push(arguments[i]);
		}
		// console.log(row);
	}
	return row;
}

function AmericanKeyboardLayout() {
	this.map = {};
	this.initMapping();
}

AmericanKeyboardLayout.prototype.positionOf = function(key) {
	return this.map[key];
};

AmericanKeyboardLayout.prototype.addRow = function(row, keysFromLeftToRight) {
	this.map = keysFromLeftToRight.reduce((M, key, col) => {
		M[key] = {row: row, col: col};
		return M;
	}, this.map);
};

AmericanKeyboardLayout.prototype.initMapping = function() {
	this.addRow(4, rowOf('!@#$%^*()_+'));
	this.addRow(4, rowOf('§1234567890-=', ["Backspace"]));

	this.addRow(3, rowOf(undefined, 'QWERTYUIOP{}'));
	this.addRow(3, rowOf('\t', 'qwertyuiop[]'));

	this.addRow(2, rowOf(undefined, 'ASDFGHJKL:"|'));
	this.addRow(2, rowOf(undefined, 'asdfghjkl;','\'','\\'));

	this.addRow(1, rowOf(undefined,'~ZXCVBNM<>?'));
	this.addRow(1, rowOf(undefined,'`zxcvbnm,./'));

	this.addRow(0, rowOf(undefined, undefined, undefined, undefined, undefined,' '));
};
