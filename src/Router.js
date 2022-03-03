class Router
{
	constructor()
	{
		this.router = new Navigo("/nephovis/new.html", { hash: true });
		this.routes = { "level/:level": { as: "levels.level",
									uses: (params) => { alert("haaa"); console.log(params); } 
								  },
					  }
		this.router.on(this.routes);
	}
}

let router = new Router();
console.log(router);