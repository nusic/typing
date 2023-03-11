function Stats(values) {
	this.values = values;

	this._min = Math.min.apply(null, this.values);
	this._max = Math.max.apply(null, this.values);
	this._sum = this.sum();
	this._mean = this.mean();
}

Stats.prototype.range = function(a, b) {
	const n = b - a;
	if (!n || Math.abs(n) === Infinity) {
		return [];
	}
	return [...Array(b - a).keys()].map(x => a + x)
};

Stats.prototype.min = function() { return this._min };
Stats.prototype.max = function() { return this._max };

Stats.prototype.sorted = function() {
	if (!this._sorted) {
		this._sorted = this.values.sort((a,b) => a - b);
	}
	return this._sorted;
};

Stats.prototype.sum = function() {
	if (this._sum === undefined) {
		this._sum = 0;
		for (var i = this.values.length - 1; i >= 0; i--) {
			this._sum += this.values[i];
		}
	}
	return this._sum;
};

Stats.prototype.mean = function() {
	if (!this._mean){
		this._mean = this.sum() / this.values.length;
	}
	return this._mean;
};

Stats.prototype.median = function() {
	const i = Math.floor(this.values.length / 2);
	const s = this.sorted();
	if (s.length % 2 === 1) {
		return s[i];
	}
	else {
		return (s[i] + s[i+1]) / 2;
	}
};

Stats.prototype.variance = function() {
	const m = this.mean();
	var variance = 0;
	for (var i = this.values.length - 1; i >= 0; i--) {
		const x = (m - this.values[i]);
		variance += x * x;
	}
	return variance / this.values.length;
};

Stats.prototype.sd = function() {
	return Math.sqrt(this.variance());
};

Stats.prototype.buckets = function(n) {
	const bsize = (this.max() - this.min() + 1e-10) / n;
	const s = 1 / bsize;

	var buckets = [];
	for (var i = 0; i < n; i++) {
		buckets.push(0);
	}

	for (var i = 0; i < this.values.length; i++) {
		const bucket = Math.floor(s * (this.values[i] - this.min()));
		buckets[bucket]++;
	}
	return buckets;
};

const okNum = x => +x === x && Math.abs(x) !== Infinity;

Stats.prototype.log_buckets = function(n) {
	const signPow2 = x => ((x)) * Math.pow(2, x);
	const toBucket = x => (Math.sign(x) || 1) * Math.floor(Math.log2(Math.abs(x) + 1));
	const toBucketName = b => Math.sign(b) * Math.pow(2, Math.abs(b)) + " - " + Math.sign(b) * Math.pow(2, Math.abs(b) + 1);

	var buckets = {};
	var bMin = Infinity;
	var bMax = -Infinity;
	for (var i = 0; i < this.values.length; i++) {
		const b = toBucket(this.values[i]);
		bMin = Math.min(bMin, b);
		bMax = Math.max(bMax, b);
		
		// if (!okNum(b) || !okNum(bMin) || !okNum(bMax)) {
		// 	console.error(i, this.values[i], b, bMin, bMin);
		// }

		if (!buckets[b]) buckets[b] = 0;
		buckets[b]++;
	}

	return this.range(bMin, bMax).map(b => toBucketName(b) + ": " + (buckets[b] || 0))
};

function logBucketAggregator(entries, keyFun) {
	const toBucket = x => Math.floor(Math.log2(x));
	const toBucketName = b => Math.pow(2, b) + "-" + Math.pow(2, b+1);

	var buckets = {};
	var max = 0;
	for (var i = 0; i < entries.length; i++) {
		const b = toBucket(keyFun(entries[i]));
		if (!buckets[b]) buckets[b] = [];
		buckets[b].push(entries[i]);
		max = Math.max(b, max);
	}
	return buckets;

	var namedBuckets = {};
	for (var b = 0; b < max; i++) {
		namedBuckets[toBucketName(b)] = buckets[i] || [];
	}
	return namedBuckets;
}

Stats.prototype.summary = function() {
	return {
		min: this.min(),
		max: this.max(),
		mean: this.mean(),
		median: this.median(),
		variance: this.variance(),
		sd: this.sd(),
		// buckets: this.buckets(10),
		log_buckets: this.log_buckets(),
		length: this.values.length
	};
};

// console.log(new Stats([1,5,2,3,5,8,4,6,2,2]).summary());