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
			Splash.updateInfo("Loading failed");
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
		Splash.updateInfo("Loading file paths...");

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
		if (!("solutions" in this.paths))
		{
			this.solutions = { "tokens": "" };
			this.legacyDataset = true;
			new NephoToast("warn", "Legacy dataset detected", "No solutions are defined - guessing filenames");
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
				`Something went wrong while fetching <code>${this.type}/solutions.json</code>.`) ? 
					await response.json() : null;
		}

		this.associateSolutionFiles();
	}

	associateSolutionFiles()
	{
		Splash.updateInfo("Associating datasets with files...");

		// If tokens are requested, we need to add all available dimension reduction techniques
		// to the list of files we want to load in
		if (this.requestedFiles.includes("tokens"))
		{
			this.alternatives = Object.keys(this.solutions);

			for (let dimensionReductionSolution in this.solutions) {
				this.requestedFiles.push(dimensionReductionSolution);
			}

			if (this.legacyDataset) {
			}
			else {
				// Remove "tokens" itself from the requested files list
				let toDeleteIndex = this.requestedFiles.indexOf("tokens");
				this.requestedFiles.splice(toDeleteIndex, 1); 
			}
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

			if (this.legacyDataset) {
				this.requestedFiles.push("cws");
			}

			// Remove "focdists" itself from the requested files list
			let toDeleteIndex = this.requestedFiles.indexOf("focdists");
			this.requestedFiles.splice(toDeleteIndex, 1); 
		}
	}

	async retrieveFiles()
	{
		Splash.updateInfo("Retrieving datasets...");

		// For each requested file, check if it's actually present
		// If so, build its full filename
		let filenamesToLoad = this.requestedFiles.map((file) => {
			// If the file we need isn't in the paths object, return the type tsv
			if (!(file in this.paths)) {
				return `${this.typeDir}${this.type}.tsv`;
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

		// This object will hold all promises which we'll be using to load files
		// This will happen in parallel, which should greatly speed things up
		let promiseArray = [];
		let promiseFiles = [];

		// Create promise for each array
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

			// Now, we add the promise to our promise array
			promiseArray.push(d3.tsv(filenamesToLoad[i]));
			promiseFiles.push(key);
		}

		let promiseOutput = await Promise.allSettled(promiseArray);
		promiseOutput.forEach((output, index) => {
			// Name of the dataset associated with this output
			let key = promiseFiles[index];

			// In theory, if paths is set up correctly, this will never cause any errors
			// However, to account for user error, we can also detect if files are not there
			if (output.status == "rejected") {
				this.setUnavailable(key)
			} else {
				loadedDatasets[key] = output.value;
			}
		});

		// Save the datasets in this object
		this.datasets = loadedDatasets;
	}

	setUnavailable(filename) {
		this.unavailableFiles.push(filename);
	}
}