
const mean = A => A.reduce((s, a) => s + a, 0) / A.length;

function TypeEventAnalysis() {
 
}

TypeEventAnalysis.prototype.nGram = function(n, predicate, events) {
	if (!predicate) predicate = () => true;

	const ngrams = [];
	for (var i = n; i < events.length; i++) {
		const es = events.slice(i-n, i);
		if (predicate(es)) {
			ngrams.push(es);
		}
	}
	return ngrams;
};

TypeEventAnalysis.prototype.toSource = function(events) {
	return events.reduce((a, e) => {
		a[e.i] = e.target;
		return a;
	}, []).join("");
};

TypeEventAnalysis.prototype.bigramDurations = function(events) {
	var bigrams = {};
	for (var i = 1; i < events.length; i++) {
		const e = events[i];
		const ePrev = events[i-1];
		// if (e.key !== e.target) {
			const key = JSON.stringify([ePrev.key, e.key]);
			const dt = e.t - ePrev.t;
			if (!bigrams[key]) bigrams[key] = [dt];
			else bigrams[key].push(dt);
		// }
	}

	return Object.keys(bigrams).map(bigram => {

		return [Math.round(mean(bigrams[bigram]))].concat(JSON.parse(bigram));
	}).sort((a,b) => a[0] - b[0]);
};

TypeEventAnalysis.prototype.errorContext = function(events) {
	var source = this.toSource(events);
	var dirty = false;
	var errorContexts = {};

	for (var i = 0; i < events.length; i++) {
		const e = events[i];
		if (e.key !== e.target) {
			const start = source.lastIndexOf(' ', source.lastIndexOf(' ', e.i))+1;
			const end = source.indexOf(' ', e.i+3);
			errorContexts[JSON.stringify(source.slice(start, end))] = 1;
		}
	}

	return Object.keys(errorContexts).map(JSON.parse);
};

const firstError = (events) => {
	var i = 0;
	while (i < events.length-1) {
		if (events[i].key !== events[i].target) {
			return false;
		}
		i++;
	}
	return events[i].key !== events[i].target;
}

const correctKey = e => e.key == e.target;
const allCorrect = events => events.every(correctKey);
const kthIsFirstError = k => events => events.slice(0, k).every(correctKey) && !correctKey(events[k]);

TypeEventAnalysis.prototype._transitions = function(events, biConsumer) {
	var transitions = [];
	for (var i = 1; i < events.length; i++) {
		transitions.push(biConsumer(events[i-1], events[i]));
	}
	return transitions;
};

TypeEventAnalysis.prototype.transitions = function(events) {
	return this._transitions(events, (e1, e2) => {
		return {
			e1: e1,
			e2: e2,
			dt: e2.t - e1.t
		};
	});
};

TypeEventAnalysis.prototype.context = function(source, transition) {

	const posteriorSpace = source.indexOf(" ", transition.e2.i + 1);
	const contextEnd = posteriorSpace >= 0 ? posteriorSpace : source.length;

	var i = transition.e2.i;
	var priorSpaces = 0;
	while (--i > 1) {
		if (source[i] === ' ' && ++priorSpaces === 3) {		
			i++;
			break;
		}
	}
	const contextStart = i;
	const context = source.substr(contextStart, contextEnd - contextStart);
	const contextPos = transition.e2.i - contextStart;

	return context.substr(0, contextPos) + "<b><u>" + transition.e2.target + "</u></b>" + context.substr(contextPos+1);
};

TypeEventAnalysis.prototype.analysis = function(events) {
	const key = k => o => o[k];

	const correctTypeEvents = events.filter(e => e.key === e.target);

	const transitions = this.transitions(events);
	const dtStats = new Stats(transitions.map(key('dt')));
	const extraSlowThreshold = 3 * dtStats.sd();
	const extraSlow = transitions
		.filter(t => t.dt > extraSlowThreshold)
		// .filter(t => t.e2.key !== "Backspace")
		.sort((t1, t2) => t2.dt - t1.dt)
		.slice(0, 5);

	const source = this.toSource(events);
	const extraSlowSummary = extraSlow.map(t => ({dt: t.dt, key: t.e2.key, context: this.context(source, t)}));
	return extraSlowSummary;
};

TypeEventAnalysis.prototype.steadiness = function(es, dt) {
	const meanDt = dt.summary().mean;
	const sumR2 = dt.values.reduce((err, dt) => err + Math.pow(dt - meanDt, 2), 0);
	const error = Math.sqrt(sumR2);
	const last = es[es.length - 1];
	const normalizedError = error / last.t; // in [0, 1]
	const steadiness = 1 - normalizedError; // in [0, 1]
	return steadiness * steadiness;
};


const events = [{"t":1,"key":"E","target":"E","i":0},{"t":368,"key":"i","target":"i","i":1},{"t":526,"key":"n","target":"n","i":2},{"t":748,"key":"s","target":"s","i":3},{"t":869,"key":"t","target":"t","i":4},{"t":1020,"key":"e","target":"e","i":5},{"t":1181,"key":"i","target":"i","i":6},{"t":1241,"key":"n","target":"n","i":7},{"t":1341,"key":" ","target":" ","i":8},{"t":1577,"key":"c","target":"c","i":9},{"t":1620,"key":"o","target":"o","i":10},{"t":1700,"key":"n","target":"n","i":11},{"t":1777,"key":"t","target":"t","i":12},{"t":1863,"key":"r","target":"r","i":13},{"t":1996,"key":"i","target":"i","i":14},{"t":2183,"key":"b","target":"b","i":15},{"t":2266,"key":"u","target":"u","i":16},{"t":2342,"key":"t","target":"t","i":17},{"t":2402,"key":"e","target":"e","i":18},{"t":2538,"key":"d","target":"d","i":19},{"t":2614,"key":" ","target":" ","i":20},{"t":2760,"key":"t","target":"t","i":21},{"t":2848,"key":"o","target":"o","i":22},{"t":2896,"key":" ","target":" ","i":23},{"t":3033,"key":"t","target":"t","i":24},{"t":3113,"key":"h","target":"h","i":25},{"t":3185,"key":"e","target":"e","i":26},{"t":3327,"key":"s","target":"s","i":27},{"t":3431,"key":"e","target":"e","i":28},{"t":3543,"key":" ","target":" ","i":29},{"t":3852,"key":"d","target":"d","i":30},{"t":3992,"key":"e","target":"e","i":31},{"t":4120,"key":"v","target":"v","i":32},{"t":4196,"key":"e","target":"e","i":33},{"t":4240,"key":"l","target":"l","i":34},{"t":4336,"key":"o","target":"o","i":35},{"t":4368,"key":"p","target":"p","i":36},{"t":4488,"key":"m","target":"m","i":37},{"t":4576,"key":"e","target":"e","i":38},{"t":4652,"key":"n","target":"n","i":39},{"t":4700,"key":"t","target":"t","i":40},{"t":4808,"key":"s","target":"s","i":41},{"t":4852,"key":" ","target":" ","i":42},{"t":5017,"key":"b","target":"b","i":43},{"t":5125,"key":"y","target":"y","i":44},{"t":5185,"key":" ","target":" ","i":45},{"t":5317,"key":"l","target":"l","i":46},{"t":5401,"key":"i","target":"i","i":47},{"t":5469,"key":"n","target":"n","i":48},{"t":5565,"key":"k","target":"k","i":49},{"t":5748,"key":"i","target":"i","i":50},{"t":5808,"key":"n","target":"n","i":51},{"t":5916,"key":"g","target":"g","i":52},{"t":6020,"key":" ","target":" ","i":53},{"t":6068,"key":"t","target":"t","i":54},{"t":6137,"key":"h","target":"h","i":55},{"t":6201,"key":"e","target":"e","i":56},{"t":6321,"key":"m","target":"m","i":57},{"t":6393,"key":" ","target":" ","i":58},{"t":6508,"key":"w","target":"w","i":59},{"t":6608,"key":"i","target":"i","i":60},{"t":6651,"key":"t","target":"t","i":61},{"t":6743,"key":"h","target":"h","i":62},{"t":6829,"key":" ","target":" ","i":63},{"t":6872,"key":"t","target":"t","i":64},{"t":6964,"key":"h","target":"h","i":65},{"t":7028,"key":"e","target":"e","i":66},{"t":7136,"key":" ","target":" ","i":67},{"t":7790,"key":"1","target":"1","i":68},{"t":8031,"key":"9","target":"8","i":69},{"t":8210,"key":"8","target":"9","i":70},{"t":8389,"key":"9","target":"8","i":71},{"t":8896,"key":"Backspace","target":" ","i":72},{"t":9036,"key":"Backspace","target":"8","i":71},{"t":9164,"key":"Backspace","target":"9","i":70},{"t":9632,"key":"9","target":"8","i":69},{"t":10099,"key":"Backspace","target":"9","i":70},{"t":10296,"key":"8","target":"8","i":69},{"t":10400,"key":"9","target":"9","i":70},{"t":10496,"key":"8","target":"8","i":71},{"t":10673,"key":" ","target":" ","i":72},{"t":10884,"key":"a","target":"a","i":73},{"t":10936,"key":"r","target":"r","i":74},{"t":11085,"key":"g","target":"g","i":75},{"t":11129,"key":"u","target":"u","i":76},{"t":11289,"key":"m","target":"m","i":77},{"t":11417,"key":"e","target":"e","i":78},{"t":11439,"key":"n","target":"n","i":79},{"t":11504,"key":"t","target":"t","i":80},{"t":11620,"key":"s","target":"s","i":81},{"t":11732,"key":" ","target":" ","i":82},{"t":11992,"key":"W","target":"W","i":83},{"t":12104,"key":"i","target":"i","i":84},{"t":12200,"key":"l","target":"l","i":85},{"t":12412,"key":"h","target":"h","i":86},{"t":12504,"key":"e","target":"e","i":87},{"t":12616,"key":"l","target":"l","i":88},{"t":12684,"key":"m","target":"m","i":89},{"t":12780,"key":" ","target":" ","i":90},{"t":13072,"key":"W","target":"W","i":91},{"t":13244,"key":"e","target":"i","i":92},{"t":13556,"key":"Backspace","target":"e","i":93},{"t":13795,"key":"i","target":"i","i":92},{"t":13875,"key":"e","target":"e","i":93},{"t":13971,"key":"n","target":"n","i":94},{"t":14071,"key":" ","target":" ","i":95},{"t":14238,"key":"h","target":"h","i":96},{"t":14262,"key":"a","target":"a","i":97},{"t":14346,"key":"d","target":"d","i":98},{"t":14426,"key":" ","target":" ","i":99},{"t":14494,"key":"m","target":"m","i":100},{"t":14570,"key":"a","target":"a","i":101},{"t":14646,"key":"d","target":"d","i":102},{"t":14718,"key":"e","target":"e","i":103},{"t":14810,"key":".","target":".","i":104},{"t":14913,"key":" ","target":" ","i":105},{"t":15452,"key":"W","target":"W","i":106},{"t":15584,"key":"i","target":"i","i":107},{"t":15818,"key":"e","target":"e","i":108},{"t":16208,"key":"d","target":"n","i":109},{"t":16280,"key":" ","target":" ","i":110},{"t":16559,"key":"Backspace","target":"h","i":111},{"t":16691,"key":"Backspace","target":" ","i":110},{"t":16823,"key":"n","target":"n","i":109},{"t":16907,"key":" ","target":" ","i":110},{"t":16995,"key":"h","target":"h","i":111},{"t":17043,"key":"a","target":"a","i":112},{"t":17127,"key":"d","target":"d","i":113},{"t":17219,"key":" ","target":" ","i":114},{"t":17606,"key":"s","target":"s","i":115},{"t":17678,"key":"h","target":"h","i":116},{"t":17762,"key":"o","target":"o","i":117},{"t":17830,"key":"w","target":"w","i":118},{"t":17974,"key":"n","target":"n","i":119},{"t":18074,"key":" ","target":" ","i":120},{"t":18193,"key":"t","target":"t","i":121},{"t":18301,"key":"h","target":"h","i":122},{"t":18320,"key":"a","target":"a","i":123},{"t":18417,"key":"t","target":"t","i":124},{"t":18489,"key":" ","target":" ","i":125},{"t":18628,"key":"t","target":"t","i":126},{"t":18681,"key":"h","target":"h","i":127},{"t":18745,"key":"e","target":"e","i":128},{"t":18821,"key":" ","target":" ","i":129},{"t":19022,"key":"h","target":"h","i":130},{"t":19238,"key":"y","target":"y","i":131},{"t":19425,"key":"p","target":"p","i":132},{"t":19776,"key":"i","target":"o","i":133},{"t":20216,"key":"Backspace","target":"t","i":134},{"t":20953,"key":"o","target":"o","i":133},{"t":21116,"key":"t","target":"t","i":134},{"t":21193,"key":"h","target":"h","i":135},{"t":21269,"key":"e","target":"e","i":136},{"t":21449,"key":"s","target":"s","i":137},{"t":21546,"key":"i","target":"i","i":138},{"t":21614,"key":"s","target":"s","i":139},{"t":21742,"key":" ","target":" ","i":140},{"t":21786,"key":"o","target":"o","i":141},{"t":21886,"key":"f","target":"f","i":142},{"t":21950,"key":" ","target":" ","i":143},{"t":22452,"key":"a","target":"a","i":144},{"t":22524,"key":"d","target":"d","i":145},{"t":22697,"key":"i","target":"i","i":146},{"t":23001,"key":"a","target":"a","i":147},{"t":23509,"key":"b","target":"b","i":148},{"t":23853,"key":"a","target":"a","i":149},{"t":24042,"key":"t","target":"t","i":150},{"t":24130,"key":"i","target":"i","i":151},{"t":24268,"key":"c","target":"c","i":152},{"t":24380,"key":" ","target":" ","i":153},{"t":24601,"key":"i","target":"i","i":154},{"t":24772,"key":"n","target":"n","i":155},{"t":24880,"key":"v","target":"v","i":156},{"t":25027,"key":"a","target":"a","i":157},{"t":25083,"key":"r","target":"r","i":158},{"t":25179,"key":"i","target":"i","i":159},{"t":25247,"key":"a","target":"a","i":160},{"t":25318,"key":"n","target":"n","i":161},{"t":25407,"key":"c","target":"c","i":162},{"t":25491,"key":"e","target":"e","i":163},{"t":25550,"key":" ","target":" ","i":164},{"t":25622,"key":"o","target":"o","i":165},{"t":25711,"key":"f","target":"f","i":166},{"t":25807,"key":" ","target":" ","i":167},{"t":26020,"key":"a","target":"a","i":168},{"t":26084,"key":" ","target":" ","i":169},{"t":26251,"key":"t","target":"t","i":170},{"t":26407,"key":"h","target":"h","i":171},{"t":26710,"key":"e","target":"e","i":172},{"t":26773,"key":"r","target":"r","i":173},{"t":26870,"key":"m","target":"m","i":174},{"t":26946,"key":"a","target":"a","i":175},{"t":27038,"key":"l","target":"l","i":176},{"t":27142,"key":" ","target":" ","i":177},{"t":28306,"key":"e","target":"e","i":178},{"t":28759,"key":"Backspace","target":"q","i":179},{"t":28855,"key":"q","target":"e","i":178},{"t":29332,"key":"Backspace","target":"q","i":179},{"t":29407,"key":"e","target":"e","i":178},{"t":29591,"key":"q","target":"q","i":179},{"t":29771,"key":"u","target":"u","i":180},{"t":29953,"key":"i","target":"i","i":181},{"t":30089,"key":"l","target":"l","i":182},{"t":30306,"key":"i","target":"i","i":183},{"t":30443,"key":"l","target":"b","i":184},{"t":30903,"key":"Backspace","target":"r","i":185},{"t":31138,"key":"b","target":"b","i":184},{"t":31279,"key":"r","target":"r","i":185},{"t":31375,"key":"i","target":"i","i":186},{"t":31561,"key":"u","target":"u","i":187},{"t":31741,"key":"m","target":"m","i":188},{"t":31905,"key":" ","target":" ","i":189},{"t":32089,"key":"s","target":"s","i":190},{"t":32169,"key":"t","target":"t","i":191},{"t":32268,"key":"a","target":"a","i":192},{"t":32337,"key":"t","target":"t","i":193},{"t":32405,"key":"e","target":"e","i":194},{"t":32468,"key":" ","target":" ","i":195},{"t":32653,"key":"s","target":"a","i":196},{"t":32978,"key":"Backspace","target":"l","i":197},{"t":33044,"key":"a","target":"a","i":196},{"t":33163,"key":"l","target":"l","i":197},{"t":33293,"key":"l","target":"l","i":198},{"t":33410,"key":"o","target":"o","i":199},{"t":34035,"key":"w","target":"w","i":200},{"t":34281,"key":"s","target":"s","i":201},{"t":34406,"key":" ","target":" ","i":202},{"t":34602,"key":"a","target":"a","i":203},{"t":34690,"key":"l","target":"l","i":204},{"t":34835,"key":"l","target":"l","i":205},{"t":34847,"key":" ","target":" ","i":206},{"t":34943,"key":"t","target":"t","i":207},{"t":35019,"key":"h","target":"h","i":208},{"t":35063,"key":"e","target":"e","i":209},{"t":35155,"key":" ","target":" ","i":210},{"t":35866,"key":"b","target":"b","i":211},{"t":36043,"key":"l","target":"l","i":212},{"t":36112,"key":"a","target":"a","i":213},{"t":36183,"key":"c","target":"c","i":214},{"t":36247,"key":"k","target":"k","i":215},{"t":36412,"key":"b","target":"b","i":216},{"t":36496,"key":"o","target":"o","i":217},{"t":36581,"key":"d","target":"d","i":218},{"t":36680,"key":"y","target":"y","i":219},{"t":36804,"key":" ","target":" ","i":220},{"t":36964,"key":"c","target":"c","i":221},{"t":37056,"key":"o","target":"u","i":222},{"t":37392,"key":"Backspace","target":"r","i":223},{"t":37547,"key":"u","target":"u","i":222},{"t":37643,"key":"r","target":"r","i":223},{"t":38035,"key":"v","target":"v","i":224},{"t":38204,"key":"e","target":"e","i":225},{"t":38257,"key":"s","target":"s","i":226},{"t":38416,"key":" ","target":" ","i":227},{"t":38588,"key":"a","target":"a","i":228},{"t":38731,"key":"t","target":"t","i":229},{"t":39236,"key":" ","target":" ","i":230},{"t":39411,"key":"d","target":"d","i":231},{"t":39507,"key":"i","target":"i","i":232},{"t":39605,"key":"f","target":"f","i":233},{"t":39802,"key":"f","target":"f","i":234},{"t":39893,"key":"e","target":"e","i":235},{"t":39984,"key":"r","target":"r","i":236},{"t":40116,"key":"e","target":"e","i":237},{"t":40128,"key":"n","target":"n","i":238},{"t":40269,"key":"t","target":"t","i":239},{"t":40356,"key":" ","target":" ","i":240},{"t":40580,"key":"t","target":"t","i":241},{"t":40685,"key":"e","target":"e","i":242},{"t":40813,"key":"m","target":"m","i":243},{"t":40925,"key":"e","target":"p","i":244},{"t":41028,"key":"r","target":"e","i":245},{"t":41153,"key":"e","target":"r","i":246},{"t":41483,"key":"Backspace","target":"a","i":247},{"t":41622,"key":"Backspace","target":"r","i":246},{"t":41750,"key":"Backspace","target":"e","i":245},{"t":41823,"key":"p","target":"p","i":244},{"t":42307,"key":"e","target":"e","i":245},{"t":42483,"key":"r","target":"r","i":246},{"t":42584,"key":"a","target":"a","i":247},{"t":42703,"key":"t","target":"t","i":248},{"t":42791,"key":"u","target":"u","i":249},{"t":42881,"key":"r","target":"r","i":250},{"t":42940,"key":"e","target":"e","i":251},{"t":42995,"key":"s","target":" ","i":252},{"t":43446,"key":"Backspace","target":"t","i":253},{"t":43522,"key":" ","target":" ","i":252},{"t":43749,"key":"t","target":"t","i":253},{"t":43829,"key":"o","target":"o","i":254},{"t":43881,"key":" ","target":" ","i":255},{"t":43973,"key":"b","target":"b","i":256},{"t":44045,"key":"e","target":"e","i":257},{"t":44133,"key":" ","target":" ","i":258},{"t":44567,"key":"d","target":"d","i":259},{"t":44643,"key":"e","target":"e","i":260},{"t":44940,"key":"r","target":"r","i":261},{"t":45052,"key":"i","target":"i","i":262},{"t":45206,"key":"v","target":"v","i":263},{"t":45311,"key":"e","target":"e","i":264},{"t":45439,"key":"d","target":"d","i":265},{"t":45522,"key":" ","target":" ","i":266},{"t":45662,"key":"f","target":"f","i":267},{"t":45786,"key":"r","target":"r","i":268},{"t":45849,"key":"o","target":"o","i":269},{"t":45909,"key":"m","target":"m","i":270},{"t":45937,"key":" ","target":" ","i":271},{"t":46044,"key":"o","target":"o","i":272},{"t":46137,"key":"n","target":"n","i":273},{"t":46196,"key":"e","target":"e","i":274},{"t":46292,"key":" ","target":" ","i":275},{"t":46473,"key":"a","target":"a","i":276},{"t":46561,"key":"n","target":"n","i":277},{"t":46633,"key":"o","target":"o","i":278},{"t":46705,"key":"t","target":"t","i":279},{"t":46817,"key":"h","target":"h","i":280},{"t":46897,"key":"e","target":"e","i":281},{"t":46973,"key":"r","target":"r","i":282},{"t":47042,"key":" ","target":" ","i":283},{"t":47389,"key":"b","target":"b","i":284},{"t":47514,"key":"b","target":"y","i":285},{"t":47521,"key":"y","target":" ","i":286},{"t":47639,"key":"a","target":"a","i":287},{"t":47922,"key":"Backspace","target":" ","i":288},{"t":48061,"key":"Backspace","target":"a","i":287},{"t":48264,"key":"Backspace","target":" ","i":286},{"t":48621,"key":"y","target":"y","i":285},{"t":48727,"key":" ","target":" ","i":286},{"t":48905,"key":"a","target":"a","i":287},{"t":48992,"key":" ","target":" ","i":288},{"t":49668,"key":"s","target":"s","i":289},{"t":49827,"key":"i","target":"i","i":290},{"t":49890,"key":"m","target":"m","i":291},{"t":50051,"key":"p","target":"p","i":292},{"t":50115,"key":"l","target":"l","i":293},{"t":50167,"key":"e","target":"e","i":294},{"t":50251,"key":" ","target":" ","i":295},{"t":50441,"key":"s","target":"s","i":296},{"t":50505,"key":"h","target":"h","i":297},{"t":50589,"key":"i","target":"i","i":298},{"t":50685,"key":"f","target":"f","i":299},{"t":50819,"key":"t","target":"t","i":300},{"t":50887,"key":"i","target":"i","i":301},{"t":50951,"key":"n","target":"n","i":302},{"t":51063,"key":"g","target":"g","i":303},{"t":51163,"key":" ","target":" ","i":304},{"t":51792,"key":"p","target":"p","i":305},{"t":51904,"key":"r","target":"r","i":306},{"t":52028,"key":"o","target":"o","i":307},{"t":52138,"key":"c","target":"c","i":308},{"t":52202,"key":"e","target":"e","i":309},{"t":52254,"key":"s","target":"s","i":310},{"t":52407,"key":"s","target":"s","i":311},{"t":52484,"key":".","target":".","i":312},{"t":52583,"key":" ","target":" ","i":313},{"t":52759,"key":"E","target":"E","i":314},{"t":52930,"key":"i","target":"i","i":315},{"t":53142,"key":"n","target":"n","i":316},{"t":53274,"key":"s","target":"s","i":317},{"t":53370,"key":"t","target":"t","i":318},{"t":53546,"key":"e","target":"e","i":319},{"t":53670,"key":"i","target":"i","i":320},{"t":53726,"key":"n","target":"n","i":321},{"t":53810,"key":" ","target":" ","i":322},{"t":53996,"key":"n","target":"n","i":323},{"t":54052,"key":"o","target":"o","i":324},{"t":54124,"key":"t","target":"t","i":325},{"t":54228,"key":"e","target":"e","i":326},{"t":54392,"key":"d","target":"d","i":327},{"t":54512,"key":" ","target":" ","i":328},{"t":54887,"key":"i","target":"i","i":329},{"t":54959,"key":"n","target":"n","i":330},{"t":55015,"key":" ","target":" ","i":331},{"t":55207,"key":"1","target":"1","i":332},{"t":55622,"key":"9","target":"9","i":333},{"t":55898,"key":"1","target":"1","i":334},{"t":56050,"key":"1","target":"1","i":335},{"t":56175,"key":" ","target":" ","i":336},{"t":56310,"key":"t","target":"t","i":337},{"t":56390,"key":"h","target":"h","i":338},{"t":56490,"key":"a","target":"a","i":339},{"t":56566,"key":"t","target":"t","i":340},{"t":56602,"key":" ","target":" ","i":341},{"t":56744,"key":"t","target":"t","i":342},{"t":56840,"key":"h","target":"h","i":343},{"t":56932,"key":"e","target":"e","i":344},{"t":57028,"key":" ","target":" ","i":345},{"t":57174,"key":"s","target":"s","i":346},{"t":57261,"key":"a","target":"a","i":347},{"t":57378,"key":"m","target":"m","i":348},{"t":57466,"key":"e","target":"e","i":349},{"t":57590,"key":" ","target":" ","i":350},{"t":57981,"key":"a","target":"a","i":351},{"t":58231,"key":"d","target":"d","i":352},{"t":58375,"key":"i","target":"i","i":353},{"t":58479,"key":"a","target":"a","i":354},{"t":58942,"key":"b","target":"b","i":355},{"t":59395,"key":"a","target":"a","i":356},{"t":59626,"key":"t","target":"t","i":357},{"t":59728,"key":"i","target":"i","i":358},{"t":59858,"key":"c","target":"c","i":359},{"t":59962,"key":" ","target":" ","i":360},{"t":60497,"key":"p","target":"p","i":361},{"t":60585,"key":"r","target":"r","i":362},{"t":60709,"key":"i","target":"i","i":363},{"t":60821,"key":"n","target":"n","i":364},{"t":60921,"key":"c","target":"c","i":365},{"t":61017,"key":"i","target":"i","i":366},{"t":61197,"key":"p","target":"p","i":367},{"t":61245,"key":"l","target":"l","i":368},{"t":61353,"key":"e","target":"e","i":369},{"t":61481,"key":" ","target":" ","i":370},{"t":61837,"key":"s","target":"s","i":371},{"t":61933,"key":"h","target":"h","i":372},{"t":62009,"key":"o","target":"o","i":373},{"t":62080,"key":"w","target":"w","i":374},{"t":62255,"key":"s","target":"s","i":375},{"t":62303,"key":" ","target":" ","i":376},{"t":62444,"key":"t","target":"t","i":377},{"t":62578,"key":"h","target":"h","i":378},{"t":62606,"key":"a","target":"a","i":379},{"t":62690,"key":"t","target":"t","i":380},{"t":62770,"key":" ","target":" ","i":381},{"t":62868,"key":"t","target":"t","i":382},{"t":62949,"key":"h","target":"h","i":383},{"t":63037,"key":"e","target":"e","i":384},{"t":63133,"key":" ","target":" ","i":385},{"t":63343,"key":"q","target":"q","i":386},{"t":63494,"key":"u","target":"u","i":387},{"t":63620,"key":"a","target":"a","i":388},{"t":63755,"key":"i","target":"n","i":389},{"t":63855,"key":"n","target":"t","i":390},{"t":63996,"key":"t","target":"i","i":391},{"t":64008,"key":"i","target":"t","i":392},{"t":64330,"key":"Backspace","target":"y","i":393},{"t":64482,"key":"Backspace","target":"t","i":392},{"t":64607,"key":"Backspace","target":"i","i":391},{"t":64737,"key":"Backspace","target":"t","i":390},{"t":64889,"key":"n","target":"n","i":389},{"t":65038,"key":"t","target":"t","i":390},{"t":65135,"key":"i","target":"i","i":391},{"t":65207,"key":"t","target":"t","i":392},{"t":65405,"key":"y","target":"y","i":393},{"t":65521,"key":" ","target":" ","i":394},{"t":66041,"key":"w","target":"w","i":395},{"t":66121,"key":"h","target":"h","i":396},{"t":66172,"key":"i","target":"i","i":397},{"t":66229,"key":"c","target":"c","i":398},{"t":66317,"key":"h","target":"h","i":399},{"t":66352,"key":" ","target":" ","i":400},{"t":66453,"key":"i","target":"i","i":401},{"t":66525,"key":"s","target":"s","i":402},{"t":66602,"key":" ","target":" ","i":403},{"t":67350,"key":"q","target":"q","i":404},{"t":67442,"key":"u","target":"u","i":405},{"t":67581,"key":"a","target":"a","i":406},{"t":67903,"key":"i","target":"n","i":407},{"t":68338,"key":"Backspace","target":"t","i":408},{"t":68470,"key":"n","target":"n","i":407},{"t":68612,"key":"t","target":"t","i":408},{"t":68669,"key":"i","target":"i","i":409},{"t":68900,"key":"z","target":"z","i":410},{"t":69020,"key":"e","target":"e","i":411},{"t":69201,"key":"d","target":"d","i":412},{"t":69281,"key":" ","target":" ","i":413},{"t":69361,"key":"i","target":"i","i":414},{"t":69417,"key":"n","target":"n","i":415},{"t":69505,"key":" ","target":" ","i":416},{"t":69717,"key":"a","target":"a","i":417},{"t":69789,"key":"n","target":"n","i":418},{"t":69930,"key":"y","target":"y","i":419},{"t":70007,"key":" ","target":" ","i":420},{"t":70147,"key":"m","target":"m","i":421},{"t":70219,"key":"e","target":"e","i":422},{"t":70339,"key":"c","target":"c","i":423},{"t":70387,"key":"h","target":"h","i":424},{"t":70499,"key":"a","target":"a","i":425},{"t":70611,"key":"n","target":"n","i":426},{"t":70691,"key":"i","target":"i","i":427},{"t":70759,"key":"c","target":"c","i":428},{"t":70843,"key":"a","target":"a","i":429},{"t":70942,"key":"l","target":"l","i":430},{"t":70994,"key":" ","target":" ","i":431},{"t":71297,"key":"m","target":"m","i":432},{"t":71357,"key":"o","target":"o","i":433},{"t":71468,"key":"t","target":"t","i":434},{"t":71548,"key":"i","target":"i","i":435},{"t":71609,"key":"o","target":"o","i":436},{"t":71645,"key":"n","target":"n","i":437},{"t":71704,"key":" ","target":" ","i":438},{"t":71902,"key":"m","target":"m","i":439},{"t":72038,"key":"u","target":"u","i":440},{"t":72193,"key":"s","target":"s","i":441},{"t":72362,"key":"t","target":"t","i":442},{"t":72410,"key":" ","target":" ","i":443},{"t":72583,"key":"b","target":"b","i":444},{"t":72691,"key":"e","target":"e","i":445},{"t":72767,"key":" ","target":" ","i":446},{"t":72974,"key":"a","target":"a","i":447},{"t":73070,"key":"n","target":"n","i":448},{"t":73223,"key":" ","target":" ","i":449},{"t":73387,"key":"a","target":"a","i":450},{"t":73544,"key":"d","target":"d","i":451},{"t":73632,"key":"i","target":"i","i":452},{"t":73716,"key":"a","target":"a","i":453},{"t":74220,"key":"b","target":"b","i":454},{"t":74328,"key":"a","target":"a","i":455},{"t":74488,"key":"t","target":"t","i":456},{"t":74584,"key":"i","target":"i","i":457},{"t":74703,"key":"c","target":"c","i":458},{"t":74783,"key":" ","target":" ","i":459},{"t":75091,"key":"i","target":"i","i":460},{"t":75207,"key":"n","target":"n","i":461},{"t":75358,"key":"v","target":"v","i":462},{"t":75498,"key":"a","target":"a","i":463},{"t":75586,"key":"r","target":"r","i":464},{"t":75658,"key":"i","target":"i","i":465},{"t":75800,"key":"e","target":"a","i":466},{"t":75868,"key":"n","target":"n","i":467},{"t":75988,"key":"t","target":"t","i":468},{"t":76064,"key":".","target":".","i":469},{"t":76397,"key":"Backspace","target":" ","i":470},{"t":76527,"key":"Backspace","target":".","i":469},{"t":76664,"key":"Backspace","target":"t","i":468},{"t":76799,"key":"Backspace","target":"n","i":467},{"t":76879,"key":"a","target":"a","i":466},{"t":76971,"key":"n","target":"n","i":467},{"t":77082,"key":"t","target":"t","i":468},{"t":77645,"key":".","target":".","i":469},{"t":77992,"key":" ","target":" ","i":470},{"t":78288,"key":"A","target":"A","i":471},{"t":78689,"key":"r","target":"r","i":472},{"t":78967,"key":"n","target":"n","i":473},{"t":79121,"key":"o","target":"o","i":474},{"t":79364,"key":"l","target":"l","i":475},{"t":79507,"key":"d","target":"d","i":476},{"t":79627,"key":" ","target":" ","i":477},{"t":80330,"key":"S","target":"S","i":478},{"t":80415,"key":"o","target":"o","i":479},{"t":80467,"key":"m","target":"m","i":480},{"t":80591,"key":"m","target":"m","i":481},{"t":80664,"key":"e","target":"e","i":482},{"t":80724,"key":"r","target":"r","i":483},{"t":80956,"key":"f","target":"f","i":484},{"t":81084,"key":"e","target":"e","i":485},{"t":81208,"key":"l","target":"l","i":486},{"t":81284,"key":"d","target":"d","i":487},{"t":81389,"key":" ","target":" ","i":488},{"t":81601,"key":"i","target":"i","i":489},{"t":81678,"key":"n","target":"d","i":490},{"t":82083,"key":"Backspace","target":"e","i":491},{"t":82223,"key":"d","target":"d","i":490},{"t":82327,"key":"e","target":"e","i":491},{"t":82464,"key":"n","target":"n","i":492},{"t":83126,"key":"t","target":"t","i":493},{"t":83250,"key":"i","target":"i","i":494},{"t":83456,"key":"f","target":"f","i":495},{"t":83545,"key":"i","target":"i","i":496},{"t":83641,"key":"e","target":"e","i":497},{"t":83804,"key":"d","target":"d","i":498},{"t":83916,"key":" ","target":" ","i":499},{"t":84056,"key":"t","target":"t","i":500},{"t":84131,"key":"h","target":"h","i":501},{"t":84160,"key":"i","target":"i","i":502},{"t":84231,"key":"s","target":"s","i":503},{"t":84299,"key":" ","target":" ","i":504},{"t":84610,"key":"a","target":"a","i":505},{"t":84906,"key":"d","target":"d","i":506},{"t":85015,"key":"i","target":"i","i":507},{"t":85113,"key":"a","target":"a","i":508},{"t":85412,"key":"b","target":"b","i":509},{"t":85503,"key":"a","target":"a","i":510},{"t":85706,"key":"t","target":"t","i":511},{"t":85801,"key":"i","target":"i","i":512},{"t":85947,"key":"c","target":"c","i":513},{"t":86059,"key":" ","target":" ","i":514},{"t":86507,"key":"i","target":"i","i":515},{"t":86571,"key":"n","target":"n","i":516},{"t":86667,"key":"v","target":"v","i":517},{"t":86826,"key":"a","target":"a","i":518},{"t":86902,"key":"r","target":"r","i":519},{"t":87006,"key":"i","target":"i","i":520},{"t":87070,"key":"a","target":"a","i":521},{"t":87155,"key":"n","target":"n","i":522},{"t":87259,"key":"t","target":"t","i":523},{"t":87338,"key":" ","target":" ","i":524},{"t":87487,"key":"a","target":"a","i":525},{"t":87582,"key":"s","target":"s","i":526},{"t":87658,"key":" ","target":" ","i":527},{"t":87778,"key":"t","target":"t","i":528},{"t":87890,"key":"h","target":"h","i":529},{"t":87897,"key":"e","target":"e","i":530},{"t":87982,"key":" ","target":" ","i":531},{"t":88110,"key":"a","target":"a","i":532},{"t":88203,"key":"c","target":"c","i":533},{"t":88318,"key":"t","target":"t","i":534},{"t":88398,"key":"i","target":"i","i":535},{"t":88414,"key":"o","target":"o","i":536},{"t":88474,"key":"n","target":"n","i":537},{"t":88523,"key":" ","target":" ","i":538},{"t":88814,"key":"v","target":"v","i":539},{"t":88952,"key":"a","target":"a","i":540},{"t":89000,"key":"r","target":"r","i":541},{"t":89084,"key":"i","target":"i","i":542},{"t":89155,"key":"a","target":"a","i":543},{"t":89224,"key":"b","target":"b","i":544},{"t":89332,"key":"l","target":"l","i":545},{"t":89373,"key":"e","target":"e","i":546},{"t":89436,"key":" ","target":" ","i":547},{"t":89564,"key":"o","target":"o","i":548},{"t":89636,"key":"f","target":"f","i":549},{"t":89688,"key":" ","target":" ","i":550},{"t":90416,"key":"c","target":"c","i":551},{"t":90516,"key":"l","target":"l","i":552},{"t":90600,"key":"a","target":"a","i":553},{"t":90644,"key":"s","target":"s","i":554},{"t":90795,"key":"s","target":"s","i":555},{"t":90879,"key":"i","target":"i","i":556},{"t":90967,"key":"c","target":"c","i":557},{"t":91034,"key":"a","target":"a","i":558},{"t":91132,"key":"l","target":"l","i":559},{"t":91187,"key":" ","target":" ","i":560},{"t":91377,"key":"m","target":"m","i":561},{"t":91549,"key":"e","target":"e","i":562},{"t":91649,"key":"c","target":"c","i":563},{"t":91725,"key":"h","target":"h","i":564},{"t":91821,"key":"a","target":"a","i":565},{"t":91941,"key":"n","target":"n","i":566},{"t":91993,"key":"i","target":"i","i":567},{"t":92073,"key":"c","target":"c","i":568},{"t":92214,"key":"s","target":"s","i":569},{"t":92857,"key":".","target":".","i":570}]
const tea = new TypeEventAnalysis()

const keyboardLayout = new AmericanKeyboardLayout();
const goodHits = events.filter(e => e.key === e.target);
const ts = tea.transitions(goodHits, (e1, e2) => {
	const p1 = keyboardLayout.positionOf(e1.key);
	const p2 = keyboardLayout.positionOf(e2.key);
	return {
		key: e1.key + ' -> ' + e2.key,
		i: e2.i,
		x: p2.col - p1.col,
		y: p2.row - p1.row,
		dt: e2.t - e1.t
	};
})

const o = ts.map(t => ({
	move: t.x + "," + t.y,
	// move: Math.abs(t.x) + Math.abs(t.y),
	dt: t.dt,
}))
.reduce((agg, t) => {
	if (!agg[t.move]){
		agg[t.move] = []
	}
	agg[t.move].push(t.dt);
	return agg;
}, {})
// console.log(ts);
const out = Object.keys(o).map(move => {
	// console.log(ts[move]);
	const s = new Stats(o[move]).summary();
	return [s.length / s.sd, move]
	// return [s.min * Math.max(100, s.sd), move]
}).sort((a,b) => a[0] - b[0]);

// console.log(out);

// console.log(logBucketAggregator(ts, e => e.dt));
// console.log(tea.ddt(events));

// const bigramDuration = tea.bigramDurations(data); 
// bigramDuration.forEach(a => console.log(a));

// tea.nGram(5, allCorrect, events).map(events => {
// 	const duration = events[events.length-1].t - events[0].t;
// 	return[duration, events.map(e => e.key).join("")];
// }).sort((a,b) => a[0]-b[0])
// .forEach(a => console.log(a));

// console.log(tea.errorContext(events));

// console.log(tea.toSource(events));