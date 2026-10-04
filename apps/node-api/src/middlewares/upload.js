// Upload middleware for product images (Option B).
// Disk storage under <api-root>/uploads, 5MB cap, images only.
// Files are served via express.static('/uploads') in app.js.
// Interview story: local disk now, swap destination for S3 later.
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
// middlewares/ -> src/ -> api-root
const uploadDir = path.resolve(here, '..', '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safe = `product-${req.params.id || 'new'}-${Date.now()}${ext}`;
    cb(null, safe);
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Only image files are allowed'));
};

export const uploadProductImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('image');

export { uploadDir };
