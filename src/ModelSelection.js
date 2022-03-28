class ModelSelection extends ItemSelection {
	constructor(dataset, callback) {
		super(callback);
		this.dataset = dataset;
	}

	select(variableSelection) {
		let selectedModels = [];
		for (let variable in variableSelection) {
			let filteredDataset = this.dataset.filter(
				(row) => variableSelection[variable].includes(row[variable]));

			let modelNames = filteredDataset.map((row) => row["_model"]);
			selectedModels.push(modelNames);
		}

		// Filter all empty lists
		selectedModels = selectedModels.filter(selectedModel => selectedModel.length > 0);

		if (selectedModels.length == 0) {
			this.items = [];
		} else {
			this.items = Helpers.intersection(selectedModels);
		}

		this.callback();
	}

	set models(models) {
		this.items = models;
	}

	get models() {
		return this.items;
	}

	fromMedoids(medoids) {
		this.models = medoids;
		this.callback();
	}
}