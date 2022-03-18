class ItemSelection {
	constructor(callback) {
		this.items = []
		// Will be executed every time a new item selection is made
		this.callback = callback;
	}

	add(item, callback=true) {
		this.items.push(item);

		if (callback) {
			this.callback();
		}
	}

	addIfNotIn(item, callback=true) {
		if (!this.items.includes(item)) {
			this.add(item, callback);
		}
	}

	remove(item, callback=true) {
		let index = this.items.indexOf(item);
		if (index !== -1) {
		  this.items.splice(index, 1);
		}

		if (callback) {
			this.callback();
		}
	}

	restore(items) {
		this.items = items;
	}

	clear(callback=true) {
		this.items = [];

		if (callback) {
			this.callback();
		}
	}

	get count() {
		return this.items.length;
	}
}