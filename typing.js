var typingGame;

function TypingGame(boardContainerId, gameStatsContainerId){
	this.textElement = document.getElementById("text");

	this.correctedAccuracyElement = document.getElementById("type-corrected-accuracy");
	this.accuracyElement = document.getElementById("type-accuracy");
	this.steadinessElement = document.getElementById("type-steadiness");
	this.speedElement = document.getElementById("type-speed");

	this.correctedAccuracyGradingElement = document.getElementById("type-corrected-accuracy-grading");
	this.accuracyGradingElement = document.getElementById("type-accuracy-grading");
	this.steadinessGradingElement = document.getElementById("type-steadiness-grading");
	this.speedGradingElement = document.getElementById("type-speed-grading");

	this.typeStatsElement = document.getElementById("type-stats");
	this.analysisElement = document.getElementById("analysis");
	this.typeEventLogger = new TypeEventLogger();

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
	this.repairs = 0;
	this.textStack = textStack;
	this.resetDOM();
	this.typeEventLogger.reset();
};

TypingGame.prototype.resetDOM = function() {
	this.correctedAccuracyElement.innerHTML = "0%";
	this.accuracyElement.innerHTML = "0%";
	this.steadinessElement.innerHTML = "0%";
	this.speedElement.innerHTML = "0 letters/s";


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
			this.repairs++;
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

	const correctedAccuracy = (completed - typos) / completed;
	const accuracy = corrects / completed;
	const steadiness = analysis.steadiness;
	const lettersPerSecond = completedElements.length / (this.typeEventLogger.lastEvent().t / 1000);

	this.correctedAccuracyElement.innerHTML = Math.floor(100 * correctedAccuracy) + "%";
	this.accuracyElement.innerHTML = Math.floor(100 * accuracy) + "%";
	this.steadinessElement.innerHTML = Math.floor(100*analysis.steadiness) + '%';
	this.speedElement.innerHTML = lettersPerSecond.toFixed(1) + " letters/s";

	const incompleted = document.getElementsByClassName('incomplete').length;

	if (!currentElement.nextSibling) {
		this.correctedAccuracyGradingElement.innerHTML = gradingFromThresholds([1.0, .99, .98, .97, .96, .95], correctedAccuracy)
		this.accuracyGradingElement.innerHTML = gradingFromThresholds([1.0, .97, .93, .88, .80, .70], accuracy)
		this.steadinessGradingElement.innerHTML = gradingFromThresholds([1, .9, .8, .7, .6, .5], steadiness)
		this.speedGradingElement.innerHTML = gradingFromThresholds([10, 8, 6, 4, 2, 1], lettersPerSecond)

		let html = "<h3>Want to improve?</h3>";
		html += "<p>Here is what keys took the longest:</p>";
		html += "<ol>";
		for (slow of analysis.extraSlow) {
			html += `<li>It took ${slow.dt} ms to type "${slow.key}" in "${slow.context}"</li>`;
		}
		html += "</ol>"
		this.analysisElement.innerHTML = html;
	}
};

function gradingFromThresholds(threshold, value) {
	const grades = [
		"⭐⭐⭐⭐⭐",
		"⭐⭐⭐⭐",
		"⭐⭐⭐",
		"⭐⭐",
		"⭐",
		"😞"
	]
	var i = 0;
	for (; i<threshold.length && i<grades.length; i++) {
		if (threshold[i] <= value) {
			break;
		}
	}
	return grades[i];
}

TypingGame.prototype.store = function(key, value) {
	window.localStorage.setItem('TypingGame_' + key, value);
};

TypingGame.prototype.read = function(key) {
	return window.localStorage.getItem('TypingGame_' + key);
};

typingGame = new TypingGame();