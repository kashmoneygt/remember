const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

// Mongo URI
const mongoURI = 'mongodb://kash:1234@ds117250.mlab.com:17250/remember-uploads';

// Create Mongo connjection
const conn = mongoose.createConnection(mongoURI);

// Init gridfs stream (code from gridfs-stream)
let gfs;

conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('images');
})

// Create storage engine (code from github/multer-gridfs-storage)
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'images'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// @route GET /
// @desc Loads form
app.get('/', (req, res) => {
	gfs.files.find().toArray((err, files) => {
		if (!files || files.length === 0) res.render('index', {files: false});
		else {
			files.map(file => {
				if (file.contentType === 'image/png' || file.contentType === 'image/jpeg') file.isImage = true;
				else file.isImage = false;
			});

			res.render('index', { files: files});
		}
	
	});
});

// @route POST /upload
// @desc Uploads image to db
app.post('/upload', upload.single('image'), (req, res) => {
	res.redirect('/');
});

// @route GET /files
// @desc Displays all files in JSON
app.get('/files', (req, res) => {
	gfs.files.find().toArray((err, files) => {
		if (!files || files.length === 0) return res.status(404).json({ err: 'No files exist' });

		// files exist
		return res.json(files);

	});
});

// @route GET /files/:filename
// @desc Displays requested file in JSON
app.get('/files/:filename', (req, res) => {
	gfs.files.findOne({filename: req.params.filename}, (err, file) => {
		if (!file || file.length === 0) return res.status(404).json({ err: 'No file exists' });

		// file exists
		return res.json(file);
	});
});

// @route GET /image/:filename
// @desc Displays requested file as image
app.get('/image/:filename', (req, res) => {
	gfs.files.findOne({filename: req.params.filename}, (err, file) => {
		if (!file || file.length === 0) return res.status(404).json({ err: 'No file exists' });

		// check if image
		if (file.contentType === 'image/png' || file.contentType === 'image/jpeg') {
			// read output to browser
			const readstream = gfs.createReadStream(file.filename);
			readstream.pipe(res);
		} else {
			res.status(404).json({ err: 'File is not an image' });
		}
		
	});
});

// @route DELETE /files/:id
// @desc Deletes file
app.delete('/files/:id', (req, res) => {
	gfs.remove({_id: req.params.id, root: 'images'}, (err, gridStore) => {
		if (err) return res.status(404).json({ err: err});
		
		res.redirect('/');
	});
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
