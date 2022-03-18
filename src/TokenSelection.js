class TokenSelection {
	constructor(callback) {
		this.tokens = [];
		// Will be executed every time a new model selection is made
		this.callback = callback;
	}

	add(token, callback=true) {
		this.tokens.push(token);

		if (callback) {
			this.callback();
		}
	}

	addIfNotIn(token, callback=true) {
		if (!this.tokens.includes(token)) {
			this.add(token, callback);
		}
	}

	remove(token, callback=true) {
		let index = this.tokens.indexOf(token);
		if (index !== -1) {
		  this.tokens.splice(index, 1);
		}

		if (callback) {
			this.callback();
		}
	}

	restore(tokens) {
		this.tokens = tokens;
	}

	clear(callback=true) {
		this.tokens = [];

		if (callback) {
			this.callback();
		}
	}

	get count() {
		return this.tokens.length;
	}

	get items() {
		return this.tokens;
	}
}