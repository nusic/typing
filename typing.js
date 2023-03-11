var typingGame;

function TypingGame(boardContainerId, gameStatsContainerId){
	this.textElement = document.getElementById("text");

	this.typeStatsElement = document.getElementById("type-stats");
	this.accuracyElement = document.getElementById("type-accuracy");
	this.steadinessElement = document.getElementById("type-steadiness");
	this.speedElement = document.getElementById("type-speed");
	this.analysisElement = document.getElementById("analysis");
	this.typeEventLogger = new TypeEventLogger();


	// this.highscore = 1;
	this.newGame();

	window.addEventListener('paste', e => {
		const clipboardData = e.clipboardData || window.clipboardData;
    	const pastedData = clipboardData.getData('Text');
    	const textStack = pastedData
    		// .replace(/[^\x00-\x7F]/g, "") // remove non-ascii
    		.replace(/–/g,"-")
    		.replace(/[“”]/g,'"')
    		.replace(/’/g,"'")
    		.split(/[\r\n]+/)
    		.map(text => text.replace(/\s+/g, " ")) // simply white spaces
    		.map(text => text.trim()) // simply white spaces
    		.filter(text => text.length > 0)
    		.reverse();

    	this.newGame(textStack);
	});

	window.onkeydown = e => this.onKeyDown(e);
}

TypingGame.prototype.newGame = function(textStack) {
	this.mistakes = 0;
	this.textStack = textStack;
	this.resetDOM();
	this.typeEventLogger.reset();
};

TypingGame.prototype.resetDOM = function() {
	// this.highscoreElement.innerHTML = 0;;
	this.speedElement.innerHTML = "-";
	this.steadinessElement.innerHTML = "-";

	var e = this.textElement;
	while (e.firstChild) {
		e.removeChild(e.firstChild);
	}

	const text = this.getText();
	for (var i = 0; i < text.length; i++) {
		var span = document.createElement('span');
		span.classList.add("incomplete");
		span.innerHTML = text[i];
		this.textElement.append(span);
	}

	this.textElement.firstChild.classList.add('current-char');
};


TypingGame.prototype.getText = function() {
	if (this.textStack && this.textStack.length > 0) {
		return this.textStack[this.textStack.length - 1];
	}
	const samples = [];
	samples[0] = "A Lisp list is implemented as a singly linked list.[51] Each cell of this list is called a cons (in Scheme, a pair), and is composed of two pointers, called the car and cdr. These are respectively equivalent to the data and next fields discussed in the article linked list.";
	samples[1] = "The path of the righteous man is beset on all sides. By the inequities of the selfish and the tyranny of evil men. Blessed is he who, in the name of charity and good will, shepherds the weak through the valley of darkness. For he is truly his brother's keeper and the finder of lost children. And I will strike down upon thee, with great vengeance and furious anger, those who attempt to poison and destroy my brothers. And you will know my name is the Lord, when I lay my vengeance upon thee"
	samples[2] = "The quick brown fox jumps over the lazy dog"

	return samples[Math.floor(Math.random() * samples.length)];
};

TypingGame.prototype.onKeyDown = function(e) {

	if (e.key.length > 1 && e.key !== "Backspace") {
		return;
	}

	if (e.key === " ") {
		e.preventDefault();
	}

	var currentElements = document.getElementsByClassName('current-char');
	if (currentElements.length === 0) {
		if (this.textStack && this.textStack.length > 0) {
			this.textStack.pop();
			this.newGame(this.textStack);
		}
		else {
			console.error('no current element!');
		}
		
		return;
	}

	var currentElement = currentElements[0];

	// Update text highlighting 
	if (e.key === "Backspace") {
		if (!document.getElementsByClassName('completed').length) {
			return;
		}
		
		currentElement.classList.remove('current-char');
		currentElement.previousSibling.classList.add('current-char');
		currentElement.previousSibling.classList.add('incomplete');
		currentElement.previousSibling.classList.remove('completed');
	}
	else {
		currentElement.classList.remove('current-char');
		currentElement.classList.remove('incomplete');
		currentElement.classList.add('completed');
		if (currentElement.nextSibling) {
			currentElement.nextSibling.classList.add('current-char');
		}

		if (e.key !== currentElement.innerHTML) {
			currentElement.classList.add('typo');
			this.mistakes++;
		} else if (currentElement.classList.contains('typo')) {
			currentElement.classList.remove('typo');
			currentElement.classList.add('repaired');
		}
	}

	this.typeEventLogger.log(e.key, currentElement.innerHTML)

	// Update basic stats
	const tea = new TypeEventAnalysis();
	const analysis = tea.analysis(this.typeEventLogger.events);

	const completedElements = document.getElementsByClassName('completed');
	const completed = completedElements.length;

	const typos = document.getElementsByClassName('typo').length;
	const repairs = document.getElementsByClassName('repaired').length;
	const corrects = completed - typos - repairs;
	if (completed === corrects) {
		this.accuracyElement.innerHTML = "Perfect";
	} else {
		this.accuracyElement.innerHTML = Math.round(100 * corrects / completed) + "%";
		// const errorEvery = completed / (completed - corrects) || Infinity;
		// this.accuracyElement.innerHTML = "Typo every " + Math.floor(errorEvery) + ":th key";
	}
	
	this.steadinessElement.innerHTML = (100*analysis.steadiness).toFixed(1) + '%';
	
	const totalTime = this.typeEventLogger.lastEvent().t / 1000;
	this.speedElement.innerHTML = ratio(completedElements.length, "letters", totalTime, "s");

	const incompleted = document.getElementsByClassName('incomplete').length;

	if (!currentElement.nextSibling) {
		
		let html = '<p>Curious how to improve? Here is where you hestitated:</p>'
			
		for (a of analysis) {
			html += `<p>It took ${a.dt}ms to type "${a.key}" in "${a.context}"`;	
		}
		

		this.analysisElement.innerHTML = html;
	}
};


function ratio(num, num_unit, den, den_unit) {
	const frac = num / den;
	return frac.toFixed(1) + " " +num_unit + "/" + den_unit;//+ " (" + num.toFixed(0) + " " + num_unit + " / " + den.toFixed(0) + " " + den_unit + ")";
}

function percentRatio2(num, num_unit, den, den_unit) {
	const frac = 100 * Math.pow(num / den, 2);
	return frac.toFixed(1) + "% (" + num.toFixed(0) + " " + num_unit + " / " + den.toFixed(0) + " " + den_unit + ")^2";
}

function percentRatio(num, num_unit, den, den_unit) {
	const frac = 100*num / den;
	return frac.toFixed(1) + "% (" + num.toFixed(0) + " " + num_unit + " / " + den.toFixed(0) + " " + den_unit + ")";
}

TypingGame.prototype.store = function(key, value) {
	window.localStorage.setItem('TypingGame_' + key, value);
};

TypingGame.prototype.read = function(key) {
	return window.localStorage.getItem('TypingGame_' + key);
};

typingGame = new TypingGame();