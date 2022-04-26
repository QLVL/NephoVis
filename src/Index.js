class Index {
	constructor() {
		UserInterface.setLevelUI("index");
		d3.select("body").style("background-color", "#fef9d9");

		d3.tsv(Constants.lemmasRegister).then(lemmas => { this.buildIndex(lemmas, "all"); Splash.hide(); });
	}

	buildIndex(lemmas, pos=null) {
		let partsOfSpeech = Helpers.getValues(lemmas, "part_of_speech");
		partsOfSpeech.unshift("all");

		/*UserInterface.buildDropdown("indexPosSelect",
									partsOfSpeech,
									(chosenPos) => { this.buildIndex(lemmas, chosenPos); });*/

		let indexInfo = "Select a part of speech to get a list of relevant models";

		if (pos == null) {
			/*d3.select("#indexInfo").html(indexInfo);*/
			return;
		} else {
			/*indexInfo += `<br><b>Currently selected: ${pos}</b>`;
			d3.select("#indexInfo").html(indexInfo)*/
		}

		let router = new Router();

		/* Add table */
		this.table = d3.select("#indexContent")
					   .html("")
        			   .append("table")
        			   .attr("class", "hover");

        /* Create columns */
        this.columns = Object.keys(lemmas[0]);
        this.table.append('thead')
        		  .append('tr')
            	  .selectAll('th')
            	  .data(this.columns)
            	  .enter()
            	  .append("th")
           		  .text(d => d);

        this.tableData = lemmas

        /* Add data */
        if (pos != "all") {
			this.tableData = this.tableData.filter(row => row["part_of_speech"] == pos);
		}

		this.rows = this.table.append('tbody')
         					  .selectAll('tr')
            				  .data(this.tableData)
            				  .enter()
            				  .append('tr');

		this.rows.selectAll("td")
				 .data(row => Object.keys(this.tableData[0]).map(key =>
				 				({ "name": key, "value": row[key] })))
				 .enter()
				 .append("td")
				 .attr("data-th", row => row["name"])
				 .html((row, index) => index == 0 ? 
		`<a href="${router.router.generate("model.type", { "type": row.value })}">${row.value}</a>` :
				 row.value);

		let maxTableHeight = d3.select("#indexContent")
							   .style("height");
		maxTableHeight = parseInt(maxTableHeight);

		console.log(`${maxTableHeight - 200}px`);

		$("table").DataTable({
			// 'destroy' : true,
			'order': [[1, 'desc']],
			"scrollY": `${maxTableHeight - 150}px`,
        	"scrollCollapse": true,
        	"pageLength": 50
		});
	}
}