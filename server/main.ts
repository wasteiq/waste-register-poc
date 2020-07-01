// Serious module trouble when using two tsconfigs.  One 
const ex = require('express')
import Express from 'express'
import {join} from 'path' 
import * as bodyParser from 'body-parser'

const bodyParserLimit = process.env.BODY_PARSER_LIMIT || "50mb"

export default () => {
	const app: Express.Application = ex()
	app.use(ex.static(join(__dirname, '../build')));
	app.use(bodyParser.json({limit: bodyParserLimit}));
	app.use(bodyParser.urlencoded({limit: bodyParserLimit, extended: true, parameterLimit: 50000}));


	app.get('/*', function (req, res) {
		res.sendFile(join(__dirname, '../build', 'index.html'));
	});

	app.post("/json", async (req, res) => {
		console.log(`got it`, req.body);
		try {
			res.json({res: "hello world"})
		} catch (err) {
			console.error(`Terrible accident`, err)
			res.status(500).json({Issue: err.message})
		}
	})

	const port = parseInt(process.env["port"] || "3888")

	app.listen(port, (err) => {
		if (err) {
			return console.log(err);
		}

		console.log(`Listening at http://*:${port}/.`);
	});
}

