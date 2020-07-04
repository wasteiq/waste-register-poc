require('dotenv').config()

try {
	const main = require("./server_build/main")
	try {
		main.default()
	} catch (err) {
		console.error(err)
	}
} catch (err) {
	console.error("Failed to load main module, please run `yarn run build:server`")
}
