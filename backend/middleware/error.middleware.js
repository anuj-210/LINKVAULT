import multer from 'multer';

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max size is 50MB.' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Server error' });
};
