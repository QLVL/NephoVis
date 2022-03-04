class UserInterface {
	constructor() {

	}

	prepareUI()
	{
		// Update the page title
		// Template: Level X (type)
		d3.select("#nephoVisTitle").html(`${this.level} level (<em>${this.type}</em>)`);
		d3.select("#numSelected").text(this.modelSelection.length);

		// --- Button behaviour ---

		// Clear selection
		document.getElementById("clearSelect").onclick = () => {
			// TODO: clear storage (whatever that means)
			// "reset" variable ?

			// TODO fix this whole thing because it references things which aren't assigned yet
		};
	}

	static createButtons(targetElement, buttons, dataset, variableSelection) {
		d3.select("#" + targetElement).selectAll("div")
		  .data(buttons)
		  .enter()
		  .append("div")
		  .attr("class", "btn-group-toggle")
		  .attr("data-toggle", "buttons")
		  .each( (property, index, buttonDivs) => { 
		  	UserInterface.attachCheckbox(property, index, buttonDivs, dataset, variableSelection); } );
	}

	static attachCheckbox(property, index, buttonDivs, dataset, variableSelection) {
		let buttonGroup = d3.select(buttonDivs[index]);
		let buttonText = UserInterface.formatVariableName(property);

		buttonGroup.append("p")
				   .attr("class", "mb-0 mt-2")
				   .style("font-weight", "bold")
				   .text("Select " + buttonText);

		buttonGroup.selectAll("label")
        		   .data(Helpers.getValues(dataset, property))
        		   .enter()
        		   .append("label")
        		   .attr("class", "btn btn-secondary py-0 m-0")
        		   .attr("parent", property)
        		   .attr("name", "selectionByButtons")
        		   .classed("active", d => variableSelection[property].indexOf(d) > -1)
        		   .text(d => d)
        		   .append("input")
        		   .attr("type", "checkbox")
        		   .attr("autocomplete", "off")
        		   .attr("id", d => `${property}:${d}`);
	}

	static formatVariableName(variableName) {
		return UserInterface.kebabCase(variableName).replace(/^[f|s]oc_/, "");
	}

	static kebabCase(input) {
		return input.replace(/([a-z])([A-Z])/g, "$1-$2")
					 .replace(/[\s_]+/g, '-')
					 .toUpperCase();
	}
}