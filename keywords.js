const Clarifai = require('clarifai');
const clarifaiApp = new Clarifai.App({ apiKey: 'e9d45fac5bb4461aaa45a986e947b87b' });

const blacklist = ['man', 'woman', 'facial expression', 'two', 'no person'];

module.exports.getKeywords = function getKeywords(readstream) {

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

			// clarifai keywords - general v1.3 (https://clarifai.com/models/general-image-recognition-model-aaa03c23b3724a16a56b629203edc62c#documentation)
			clarifaiApp.models.predict("aaa03c23b3724a16a56b629203edc62c", {base64: imgBase64}).then(
				function(response) {
					let concepts = response.outputs[0].data.concepts; // need to worry about length of concepts < 5?
					let maxConcepts = 5; // subject to change
					let numConcepts = 0;

					for (let i = 0; numConcepts < maxConcepts; i++) {
						if (blacklist.indexOf(concepts[i].name) === -1) {
							conceptDict[concepts[i].name] = concepts[i].value;
							conceptStr += `${concepts[i].name} `;
							numConcepts++;
						}
					}

					resolve(conceptStr.trim());
				},
				function(err) {
					reject(err);
				}
			);
		
		});
			
	});
}