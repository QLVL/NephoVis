class DataLoader {
	constructor(type) {
		this.type = type;
		this.typeDir = `${Constants.sourceDir}${this.type}/`;
	}

	checkResponse(response, message)
	{
		// Is the response defined?
		if (!response.ok)
		{
			window.alert(message);
			return false;
		}

		return response;
	}

	async loadData()
	{
		await this.loadPaths();
		await this.loadSolutions();
	}

	async loadPaths()
	{
		// Load the paths.json file
		// We use "await" for avoid the hell of promises
		let response = await fetch(`${this.typeDir}paths.json`);

		// If the response is defined, parse and save it
		// Else, set it to "null"
		this.paths = this.checkResponse(response, "Please add a 'paths.json' file listing your available files!") ? await response.json() : null;

		// TODO: use the data
		// I don't understand this yet, maybe this should go elsewhere
	}

	async loadSolutions()
	{
		// If the response was undefined, don't do anything
		if (this.paths == null)
		{
			return null;
		}

		// Are we missing solutions in the path?
		if (!"solutions" in this.paths)
		{
			// "Unique" case
			if ("tokens" in this.paths)
			{
				// "unique" data?
			}

			if ("focdists" in this.paths)
			{
				// context words data?
			}
		}
		// If solutions is defined
		else
		{
			let solutions_filename = this.paths["solutions"];
			// Apparently, "solutions" can also be an object
			// If it is, only use the first value
			if (typeof this.paths["solutions"] == "object") {
				solutions_filename = this.paths["solutions"][0];
			}

			// Load the solutions file
			let response = await fetch(`${this.typeDir}${solutions_filename}`);

			// If the response is defined, parse and save it
			// Else, set it to "null"
			this.solutions = this.checkResponse(response, "Something went wrong while fetching 'solutions.tsv'!") ? await response.json() : null;
		}
	}
}