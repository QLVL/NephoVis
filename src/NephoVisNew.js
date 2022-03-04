class NephoVis {
	constructor(level, type) {
		this.level = level;
		this.type = type;
		this.requestedFiles = RequestedFilesMapper[level];

		// Define the data loader and load the CSV files for this type
		this.dataLoader = new DataLoader(this.type, this.requestedFiles);
		this.dataLoader.loadData();
	}
}