const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { fromBuffer } = require('file-type');
const crypto = require('crypto');

const app = express();
const PORT = 5000;
const allowedIps = ['20.218.226.24'];
app.set('trust proxy', 'loopback');
app.set('trust proxy', 1); 

app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
  const ip = req.ip.replace('::ffff:', '');
  if (!allowedIps.includes(ip)) {
    return res.status(403).send('Access denied.');
  }
  next();
});

app.get('/images', (req, res) => {
  fs.readdir('uploads', (err, files) => {
    if (err) return res.status(500).send('Failed to load images');
    res.json(files);
  });
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => {
    const ext = mime.extension(file.mimetype);
    const safeName = crypto.randomBytes(16).toString('hex') + '.' + ext;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed!'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/upload', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large. Max size is 10MB.' });
    }

    if (err && err.message === 'Only image files are allowed!') {
      return res.status(400).json({ error: err.message });
    }

    if (err) {
      return res.status(500).json({ error: 'Upload failed.' });
    }

    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const fileBuffer = fs.readFileSync(filePath);
    const fileType = await fromBuffer(fileBuffer);

    if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Invalid file content' });
    }

    const originalExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const realExt = fileType.ext.toLowerCase();

    if (
      !allowedExtensions.includes(originalExt) ||
      !allowedExtensions.includes(realExt) ||
      originalExt !== realExt
    ) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'File extension mismatch or not allowed' });
    }

    res.status(200).json({ message: 'Uploaded', filename: req.file.filename });
  });
});

app.delete('/delete/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, 'uploads', filename);

  fs.unlink(filePath, err => {
    if (err) return res.status(500).send('Error deleting file');
    res.send('Deleted');
  });
});

app.get('/images/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.download(filePath); 
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
