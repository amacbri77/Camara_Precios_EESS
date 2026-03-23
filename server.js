const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const { saveCapture, databasePath } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const uploadsDir = path.join(__dirname, 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExtension = /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(extension) ? extension : '.jpg';
    cb(null, `${Date.now()}-${crypto.randomUUID()}${safeExtension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(new Error('Solo se permiten archivos de imagen.'));
  },
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (_req, res) => {
  res.json({ ok: true, databasePath });
});

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ ok: false, error: 'No se recibió ninguna imagen.' });
    return;
  }

  const createdAt = req.body.timestamp || new Date().toISOString();
  const latitude = req.body.latitude ? Number(req.body.latitude) : null;
  const longitude = req.body.longitude ? Number(req.body.longitude) : null;
  const accuracy = req.body.accuracy ? Number(req.body.accuracy) : null;

  const captureId = saveCapture({
    created_at: createdAt,
    capture_date: req.body.captureDate || createdAt.slice(0, 10),
    capture_time: req.body.captureTime || createdAt.slice(11, 19),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    accuracy: Number.isFinite(accuracy) ? accuracy : null,
    user_name: req.body.userName || null,
    user_email: req.body.userEmail || null,
    image_path: path.join('uploads', req.file.filename),
    status: 'received',
  });

  res.json({
    ok: true,
    message: 'Captura recibida.',
    captureId,
    imagePath: path.join('uploads', req.file.filename),
  });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ ok: false, error: err.message });
    return;
  }

  if (err) {
    res.status(400).json({ ok: false, error: err.message || 'Error inesperado.' });
    return;
  }

  res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor disponible en http://localhost:${PORT}`);
});
