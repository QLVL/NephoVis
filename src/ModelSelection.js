class ModelSelection {
	constructor(dataset, callback) {
		this.models = []
		this.dataset = dataset;
		// Will be executed every time a new model selection is made
		this.callback = callback;
	}

	add(model) {
		this.models.push(model);
	}

	remove(model) {
		let index = this.models.indexOf(model);
		if (index !== -1) {
		  this.models.splice(index, 1);
		}
	}

	restore(models) {
		this.models = models;
	}

	fromMedoids(medoids) {
		this.models = medoids;
		this.callback();
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
			this.models = [];
		} else {
			this.models = Helpers.intersection(selectedModels);
		}

		this.callback();
	}

	clear() {
		this.models = []
		this.callback();
	}

	get count() {
		return this.models.length;
	}
}