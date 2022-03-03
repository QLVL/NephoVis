class Router
{
	constructor()
	{
		this.router = new Navigo("/nephovis", true);
		this.routes = { ":level": { as: "level",
									uses: (params) => {	console.log("miep"); } 
								  },
					  }
		this.router.on(this.routes);
	}
}

let router = new Router();