class UserInterface {
	constructor() {

	}

	static setLevelUI(level) {
		// Find all shared elements that do not belong to the current inspection level
		let unusedElements = d3.selectAll(".shared").nodes().filter((node) => !node.classList.contains(level));

		d3.selectAll(unusedElements).remove();
	}

	static prepareUI(level, type, modelCount)
	{
		// Update the page title
		// Template: Level X (type)
		d3.select("#nephoVisTitle").html(`${level} level (<em>${type}</em>)`);
		d3.select("#numSelected").text(modelCount);
	}

	static setButton(targetElementName, onclickEvent, additionalD3=null) {
		let button = d3.select(`#${targetElementName}`)
		  			   .on("click", () => { onclickEvent(); });

		if (additionalD3 != null) {
			additionalD3(button);
		}
	}

	static createButtons(targetElement, buttons, dataset, variableSelection, changeCallback) {
		d3.select("#" + targetElement).selectAll("div")
		  .data(buttons)
		  .enter()
		  .append("div")
		  .attr("class", "btn-group-toggle")
		  .attr("data-toggle", "buttons")
		  .each( (property, index, buttonDivs) => { 
		  	UserInterface.attachCheckbox(property, index, buttonDivs, dataset, variableSelection,
		  									changeCallback); } );
	}

	static attachCheckbox(property, index, buttonDivs, dataset, variableSelection, changeCallback) {
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
        		   .classed("active", d => variableSelection[property].includes(d))
        		   .text(d => d)
        		   .append("input")
        		   .attr("type", "checkbox")
        		   .attr("autocomplete", "off")
        		   .attr("id", d => `${property}:${d}`)
        		   .each( (propertyValue, labelIndex, labelDivs) => 
        		   		{ labelDivs[labelIndex].onchange = () => { changeCallback(property, propertyValue,
										        		   			labelDivs[labelIndex].checked); }; } );
        		   		// Why is Javascript like this...
	}

	static buildDropdown(targetElementName, dataset, clickCallback, textFunction = d => d) {
		let className = targetElementName.slice(0, 3)

		let valueFunction = d => d;

		d3.select("#" + targetElementName)
          .selectAll("button")
          .data(dataset).enter()
          .append("button")
          .attr("class", `dropdown-item ${className}`)
          .attr("xlink:href", "#")
          .attr("value", valueFunction)
          .html(textFunction).each( (propertyValue, dropdownIndex, dropdownDivs) => 
        		   		{ dropdownDivs[dropdownIndex].onclick = () => 
        		   			{ clickCallback(propertyValue); }; } );
	}

	static resetSelectionButtons() {
		// Reset selection buttons
		d3.selectAll("label[name='selectionByButtons']").classed("active", false);
	}

	/* Level 3 */

	static buildModelSwitcher(targetElementName) {
	}

	// Set up the dropdown for alternative solutions
	static buildSolutionSwitchDropdown(targetElementName, dataset) {
		// Create the button group
		let alternativeSolutionDropdown = d3.select(`#${targetElementName}`)
											.append("div") 
            								.attr("class", "btn-group");
        
        // Create the button itself
        alternativeSolutionDropdown.append("button")
            					   .attr("type", "button")
            					   .attr("class", "btn shadow-sm btn-marigreen dropdown-toggle")
            					   .attr("data-toggle", "dropdown")
            					   .html("<i class='fas fa-list-ul'></i> Switch solution");
        
        // Make it a dropdown
        alternativeSolutionDropdown.append("div")
            					   .attr("class", "dropdown-menu")
            					   .attr("id", "solutions");

        UserInterface.buildDropdown("solutions", dataset, "token", () => { /* todo click callback */ });
	}

	/* General */

	static formatVariableName(variableName) {
		return UserInterface.kebabCase(variableName).replace(/^[f|s]oc-/i, "");
	}

	static kebabCase(input) {
		return input.replace(/([a-z])([A-Z])/g, "$1-$2")
					 .replace(/[\s_]+/g, '-')
					 .toUpperCase();
	}
}