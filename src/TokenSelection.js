class TokenSelection {
	constructor(callback) {
		this.tokens = [];
		// Will be executed every time a new model selection is made
		this.callback = callback;
	}

	add(token) {
		this.tokens.push(token);
		this.callback();
	}

	addIfNotIn(token) {
		if (!this.tokens.includes(token)) {
			this.add(token);
		}
	}

	remove(token) {
		let index = this.tokens.indexOf(token);
		if (index !== -1) {
		  this.tokens.splice(index, 1);
		}
		this.callback();
	}

	restore(tokens) {
		this.tokens = tokens;
	}

	clear() {
		this.models = [];
		this.callback();
	}

	get count() {
		return this.tokens.length;
	}

	get items() {
		return this.tokens;
	}
}