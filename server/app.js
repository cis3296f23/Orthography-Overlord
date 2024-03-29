const express = require('express')
const http = require('http');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const jsonfile = require('jsonfile')

class FeatureServer {

	constructor(_audioFolderPath, _defFolderPath) {
		this.start_server({
			name: "insecure_server",
			port: 3050,
			set_routes: this.set_insecure_routes.bind(this),
		});

		if(_audioFolderPath[0] != "~") {
			this.audioFolderPath = path.join(__dirname, _audioFolderPath);
		} else { this.audioFolderPath = _audioFolderPath; }
		console.log(this.audioFolderPath);


		this.defFolderPath = path.join(__dirname, _defFolderPath);
	}

	download(response, path) {
		const writer = fs.createWriteStream(path)
		response.data.pipe(writer);
		return new Promise((resolve, reject) => {
			writer.on('finish', resolve)
			writer.on('error', reject)
		})
	}

	retrieveAudioFileForWord = (word) => {

		return new Promise( async (resolve, reject) => {

			const url = `https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=fa42b88d-7476-4683-8554-836973c63ab2`;
			const filename = path.join(this.audioFolderPath, `${word}.mp3`);

			if(fs.existsSync(filename)) {
				resolve(filename);
				return;
			}

			try {
				const res = await axios.get(url);
				//   console.log(res.data[0].hwi.prs[0]);

				const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${word[0]}/${res.data[0].hwi.prs[0].sound.audio}.mp3`;
				const audioStream = await axios.get(audioUrl, { responseType: 'stream' });

				// await audioStream.data.pipe(fs.createWriteStream(filename));
				await this.download(audioStream, filename)

				resolve(filename);
			} catch(err) {
				console.log("Could not get audio file for word", word);
				console.error(err);
				reject(JSON.stringify(err))
			}
		});
	}

	retrieveDefinitionFileForWord = (word) => {

		return new Promise( async (resolve, reject) => {

			const url = `https://dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=fa42b88d-7476-4683-8554-836973c63ab2`;
			const filename = path.join(this.defFolderPath, `${word}.json`);
			console.log("app.js filename: " + filename)

			//check if the file already exists
			if(fs.existsSync(filename)) {
				resolve(filename);
				return;
			}

			try {
				const res = await axios.get(url);
				// res[0].def[0].sseq[0][0][0]

				var data = res.data;

				console.log(data);
				console.log(filename);
				jsonfile.writeFileSync(filename, data);
				// await this.download(res, filename)

				resolve(filename);
			} catch(err) {
				console.log("Could not get def file for word", word);
				console.error(err);
				reject(JSON.stringify(err))
			}
		});
	}

	start_server(server_opts) {
		var app = express();
		app.use(express.json());
		app.set('port', server_opts.port);
		server_opts.set_routes(app);


		this.server = http.createServer(app);
		this.server.on('error', (e)=> {console.error(e)});
		this.server.listen(server_opts.port, ()=>{console.log("The server is running! Happy Spelling!")});
	}

	set_insecure_routes(app) {
		app.get('/', (req, res) => {
			res.send('Hello World!');
		})

		app.get('/audio/:word', (req, res) => {
			this.retrieveAudioFileForWord(req.params.word)
				.then((filename) => {
					res.sendFile(filename);
				})
				.catch((err) => {
					res.status(404).send(err);
				})
		})
		app.get('/def/:word', (req, res) => {
			this.retrieveDefinitionFileForWord(req.params.word)
				.then((filename) => {
					//open as JSON and send back information
					jsonfile.readFile(filename).then((data) => {
							res.json(data);
					})
				})
				.catch((err) => {
					res.status(404).send(err);
				})
		})
	}
}


const server = new FeatureServer(process.env.AUDIOPATH || "./dev_audio_folder", "./dev_def_folder");
