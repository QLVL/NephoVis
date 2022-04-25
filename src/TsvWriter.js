class TsvWriter {
	constructor(data) {
		this.headers = Object.keys(data[0]);
		this.body = data.map(row => Object.values(row));
	}

	serialise() {
		let tsv = this.headers.join("	") + "\n";
		this.body.forEach(data => tsv += data.join("	") + "\n");

		return tsv;
	}
}