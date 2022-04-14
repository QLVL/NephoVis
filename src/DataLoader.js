class DataLoader {
	constructor(type, requestedFiles) {
		this.type = type;
		this.requestedFiles = requestedFiles;
		this.typeDir = `${Constants.sourceDir}${this.type}/`;

		if (LocalStorageInteractor.getValue("bert") != null) {
			this.typeDir = `${Constants.sourceDirBert}${this.type}/`;
		}

		this.includesFOC = false;
		this.alternatives = null;

		// This list holds all files which aren't available
		this.unavailableFiles = [];
	}

	checkResponse(response, message)
	{
		// Is the response defined?
		if (!response.ok)
		{
			new NephoToast("warn", "Fatal data load error", message);
			return false;
		}

		return response;
	}

	async loadData()
	{
		await this.loadPaths();
		await this.loadSolutions();
		await this.retrieveFiles();
	}

	async loadPaths()
	{
		// Load the paths.json file
		// We use "await" to avoid the hell of promises
		let response = await fetch(`${this.typeDir}paths.json`);

		// If the response is defined, parse and save it
		// Else, set it to "null"
		this.paths = this.checkResponse(response,
			`<code>${this.type}/paths.json</code> not found. NephoVis will terminate.`) ? await response.json() : null;
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
			if ("tokens" in this.requestedFiles)
			{
				this.paths["unique"] = `${typeDir}/${type}.tsv`;
				// set as "unique" TODO what does this mean?
				// other_args = [ "unique" ]
			}

			if ("focdists" in this.requestedFiles)
			{
				this.paths["unique"] = `${typeDir}/${type}.cws.tsv`;
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
			this.solutions = this.checkResponse(response,
				`Something went wrong while fetching <code>${this.type}/solutions.tsv</code>.`) ? 
					await response.json() : null;
		
			this.associateSolutionFiles();
		}
	}

	associateSolutionFiles()
	{
		// If tokens are requested, we need to add all available dimension reduction techniques
		// to the list of files we want to load in
		if (this.requestedFiles.includes("tokens"))
		{
			this.alternatives = Object.keys(this.solutions);

			for (let dimensionReductionSolution in this.solutions) {
				this.requestedFiles.push(dimensionReductionSolution);
			}

			// Remove "tokens" itself from the requested files list
			let toDeleteIndex = this.requestedFiles.indexOf("tokens");
			this.requestedFiles.splice(toDeleteIndex, 1); 
		}
		
		// If foc distances are requested, we need to add all context word files 
		// for all available dimension reduction techniques
		if (this.requestedFiles.includes("focdists"))
		{
			this.includesFOC = true;

			for (let dimensionReductionSolution in this.solutions) {
				let contextWordsFilename = `${dimensionReductionSolution}cws`

				// Check if the requested cws file is available in the paths listing
				if (contextWordsFilename in this.paths) {
					this.requestedFiles.push(contextWordsFilename);
				}
				// If not, quit and set includesFOC to false
				else {
					this.includesFOC = false;
					break;
				}
			}

			// Remove "focdists" itself from the requested files list
			let toDeleteIndex = this.requestedFiles.indexOf("focdists");
			this.requestedFiles.splice(toDeleteIndex, 1); 
		}
	}

	async retrieveFiles()
	{
		// For each requested file, check if it's actually present
		// If so, build its full filename
		let filenamesToLoad = this.requestedFiles.map((file) => {
			// If the file we need isn't in the paths object, return undefined
			if (!(file in this.paths)) {
				return undefined;
			}
			// Else, build the full filename
			else {
				let file_filename = this.paths[file];
				// Apparently, every value can also be an object
				// If it is, only use the first value
				if (typeof this.paths[file] == "object") {
					file_filename = this.paths[file][0];
				}
				return `${this.typeDir}${file_filename}`;
			}
		});

		// This object will hold all requested files and their contents
		// file -> content
		let loadedDatasets = {};

		// Retrieve file contents for each requested file
		for (let i = 0; i < this.requestedFiles.length; i++)
		{
			let key = this.requestedFiles[i];

			// If the filename is not in this.paths, it means that the file is unavailable
			// If then has the value "undefined"
			// We cannot load this file, so we set it as unavailable and move on
			if (filenamesToLoad[i] == undefined) {
				this.setUnavailable(key);
				continue;
			}

			// In theory, if paths is set up correctly, this will never cause any errors
			// However, to account for user error, we can also detect if files are not there
			try {
				loadedDatasets[key] = await d3.tsv(filenamesToLoad[i]);
			} catch (error) {
				if (error.message.includes("404")) {
					this.setUnavailable(key);
				}
			}
		}

		// Save the datasets in this object
		this.datasets = loadedDatasets;
	}

	setUnavailable(filename) {
		this.unavailableFiles.push(filename);
	}
}