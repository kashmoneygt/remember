const Clarifai = require('clarifai');
const clarifaiApp = new Clarifai.App({ apiKey: 'e9d45fac5bb4461aaa45a986e947b87b' });

module.exports.getKeywords = function getKeywords(req) {

	// console.log('req', req);

	// console.log('in getKeywords(), data:', data);

	// console.log(readstream._store.filename);
	let conceptDict = {}; // key = concept (str), val = probability (decimal 0-1)

	// clarifai keywords
	clarifaiApp.models.predict(Clarifai.GENERAL_MODEL, {base64: req}).then(
		function(response) {
			let concepts = response.outputs[0].data.concepts;

			for (var i = 0; i < concepts.length; i++) {
				conceptDict[concepts[i].name] = concepts[i].value;
			}
			console.log('conceptDict', conceptDict);
			return conceptDict;

		},
		function(err) {
			console.log('ERROR', err);
		}
	);
	
}