class FrequencyFunctions {
	constructor(contextWord,
				frequencyColumns,
				contextWordColumns,
				selectedTokens,
				nonSelectedTokens) {
		this.contextWord = contextWord;
		this.frequencyColumns = frequencyColumns;
		this.contextWordColumns = contextWordColumns;
		this.selectedTokens = selectedTokens;
		this.nonSelectedTokens = nonSelectedTokens;

		let contingencyTable = new ContingencyTable(this.contextWord,
													this.selectedTokens,
													this.nonSelectedTokens,
													this.contextWordColumns);

		let output = {
			"raw": {
				"Feature": this.contextWord,
				"total": contingencyTable.selectedTokensContextWordCount
			},
			"both": {
				"Feature": this.contextWord,
				"total+": contingencyTable.selectedTokensContextWordCount,
				"total-": contingencyTable.nonSelectedTokensContextWordCount
			},
			"cue": {
				"Feature": this.contextWord,
				"total+": contingencyTable.selectedTokensContextWordCount,
				"total-cv": this.cueValidity(contingencyTable.selectedTokensContextWordCount,
											 contingencyTable.nonSelectedTokensContextWordCount)
			},
			"dp": {
				"Feature": this.contextWord,
				"total+": contingencyTable.selectedTokensContextWordCount,
				"total-dp": this.deltaP(contingencyTable.selectedTokensContextWordCount,
										contingencyTable.nonSelectedTokensContextWordCount,
										contingencyTable.selectedTokensCountDifference,
										contingencyTable.nonSelectedTokensCountDifference)
			},
			"fisher": {
				"Feature": this.contextWord,
				"total+": contingencyTable.selectedTokensContextWordCount,
				"total-F": this.logFisher(contingencyTable.selectedTokensContextWordCount,
										  contingencyTable.nonSelectedTokensContextWordCount,
										  contingencyTable.selectedTokensCountDifference,
										  contingencyTable.nonSelectedTokensCountDifference,
										  contingencyTable.tokensCount)
			},
			"odds": {
				"Feature": this.contextWord,
				"total+": contingencyTable.selectedTokensContextWordCount,
				"total-OR": this.oddsRatio(contingencyTable.selectedTokensContextWordCount,
										   contingencyTable.nonSelectedTokensContextWordCount,
										   contingencyTable.selectedTokensCountDifference,
										   contingencyTable.nonSelectedTokensCountDifference)
			}
		};

		for (var i = 0; i < this.frequencyColumns.length; i++)
		{
			let modelContingencyTable = new ModelContingencyTable(this.contextWordColumns[i],
																  this.contextWord,
																  this.selectedTokens,
																  this.nonSelectedTokens);

			let columnIndex = this.frequencyColumns[i];

			output["raw"][columnIndex] = output["both"][`${columnIndex}+`]
									   = output["cue"][`${columnIndex}+`] 
									   = output["dp"][`${columnIndex}+`] 
									   = output["fisher"][`${columnIndex}+`] 
									   = output["odds"][`${columnIndex}+`] 
									   = modelContingencyTable.inModelContextWordCount;

			output["both"][`${columnIndex}-`] = modelContingencyTable.outModelContextWordCount;
			output["cue"][`${columnIndex}-cv`] = this.cueValidity(modelContingencyTable.inModelContextWordCount,
																   modelContingencyTable.outModelContextWordCount);

			output["dp"][`${columnIndex}-dp`] = this.deltaP(modelContingencyTable.inModelContextWordCount,
															modelContingencyTable.outModelContextWordCount,
															modelContingencyTable.inModelContextWordCountDifference,
															modelContingencyTable.outModelContextWordCountDifference);

			output["fisher"][`${columnIndex}-F`] = this.logFisher(modelContingencyTable.inModelContextWordCount,
															   modelContingencyTable.outModelContextWordCount,
															   modelContingencyTable.inModelContextWordCountDifference,
															   modelContingencyTable.outModelContextWordCountDifference,
															   modelContingencyTable.contextWordsCount);
			
			output["odds"][`${columnIndex}-OR`] = this.oddsRatio(modelContingencyTable.inModelContextWordCount,
																 modelContingencyTable.outModelContextWordCount,
																 modelContingencyTable.inModelContextWordCountDifference,
																 modelContingencyTable.outModelContextWordCountDifference);
			
		}
		
		this.output = output;
	}

	// I don't know what this is.
	cueValidity(a, b) {
		let result = 0;

		if (a != 0) {
			result = a / (a + b);
		}

		return d3.format(".3r")(result);
	}

	// 🤷‍
	deltaP(a, b, c, d) {
		console.log(a, b, c, d);

		let validity = this.cueValidity(a, b);
		let other = c / (c + d);

		return d3.format(".3r")(validity - other);
	}

	// 🐟
	logFisher(a, b, c, d, n) {
		let fisher = exact22(a, b, c, d);
		let aExp = (a + b) * (a + c) / (n);
		let logF = a < aExp ? Math.log10(fisher) : -Math.log10(fisher);

		return d3.format(".3r")(logF);
	}

	oddsRatio(a, b, c, d) {
   		// smoothed with +0.5 to avoid 0s
   		let first = (a + 0.05) / (c + 0.5);
   		let second = (b + 0.05) / (d + 0.5);

   		return d3.format(".3r")(first / second);
	}
}