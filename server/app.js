const express = require('express')
const http = require('http');

const fs = require('fs');
// Temporary for faking Bridge

class FeatureServer {
	
	constructor() {
		this.insecure_server_opts = {
			name: "insecure_server",
			port: 3050,
			set_routes: this.set_insecure_routes.bind(this),
		}

        this.start_server(this.insecure_server_opts);
	}

	start_server(server_opts) {
		var app = express();
		app.use(express.json());
		app.set('port', server_opts.port);
		server_opts.set_routes(app);


        this.servers[server_opts.name] = http.createServer(app);
		this.servers[server_opts.name].on('error', (e)=> {console.error(e)});
		this.servers[server_opts.name].listen(server_opts.port, (e)=>{console.log(e)});
	}

	set_insecure_routes(app) {
		app.get('/', (req, res) => {
			res.send('Hello World!');
		  })
	}
}


const server = new FeatureServer();

