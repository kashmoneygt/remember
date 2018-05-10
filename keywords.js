const Clarifai = require('clarifai');
const clarifaiApp = new Clarifai.App({ apiKey: 'e9d45fac5bb4461aaa45a986e947b87b' });

const getKeywords = function getKeywords(readstream) {

	return new Promise((resolve, reject) => {

		let conceptDict = {}; // key = concept (str), val = probability (decimal 0-1)
		let conceptStr = '';

		const buffers = [];
		readstream.on('data', (chunk) => {
			buffers.push(chunk);
		});
		readstream.on('end', () => {
			const fileBuffer = Buffer.concat(buffers);
			const imgBase64 = fileBuffer.toString('base64');

			// clarifai keywords
			clarifaiApp.models.predict(Clarifai.GENERAL_MODEL, {base64: imgBase64}).then(
				function(response) {
					let concepts = response.outputs[0].data.concepts;

					for (var i = 0; i < concepts.length; i++) {
						conceptDict[concepts[i].name] = concepts[i].value;
						conceptStr += ` ${concepts[i].name}`;
					}
					resolve(conceptStr);
				},
				function(err) {
					reject(err);
				}
			);
		
		});
			
	});
}

module.exports.getKeywords = getKeywords;