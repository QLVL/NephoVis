class Constants {
	static get sourceDir () { return "tokenclouds/data/"; }
	static get sourceDirBert () { return "tokenclouds_nn/data/"; }
	static get lemmasRegister () { return Constants.sourceDir + "euclidean_register.tsv"; }
	static get dataPointStyles () { return [ "colour", "shape", "size" ] }
	static get colourPalette () { return [ "#E69F00",
    									   "#56B4E9",
    									   "#009E73",
    									   "#F0E442",
    									   "#0072B2",
    									   "#D55E00",
    									   "#CC79A7",
    									   "#999999"] }
    static get naColour() { return "#EEE9E9"; }
    static get naString() { return "NA"; }
    static get cwsInfoOptions() {
    	return [ { "name" : "Selected and non selected",
        	  	   "value" : "both", 
        	       "suffix" : "-"},
        		 { "name" : "Cue validity",
        	  	   "value" :"cue",
        	   	   "suffix" : "-cv"},
        		 { "name" : "Log Fisher Exact p-value",
        		   "value" : "fisher", 
        		   "suffix" : "-F"},
        		 { "name" : "(Smoothed) odds ratio",
        		   "value" : "odds", 
        		   "suffix" : "-OR"},
        		 { "name" : "&Delta;P",
        		   "value" : "dp", 
        		   "suffix" : "-dp"},
        		 { "name" : "Absolute frequency", 
        		   "value" : "raw", 
        		   "suffix" : "raw"}
    		   ];
    }
}