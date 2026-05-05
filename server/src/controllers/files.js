import File from '../models/File.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'File is required');
  const fakeLocalUrl = `/uploads/${Date.now()}-${req.file.originalname}`;
  const file = await File.create({ url: fakeLocalUrl, mimeType: req.file.mimetype, size: req.file.size, name: req.file.originalname, uploadedBy: req.user._id });
  res.status(201).json({ success: true, file, warning: 'Cloudinary/S3 streaming not configured yet' });
});

export const getFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.fileId);
  if (!file) throw new ApiError(404, 'File not found');
  res.json({ success: true, file });
});

export const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.fileId);
  if (!file) throw new ApiError(404, 'File not found');
  if (req.user.role !== 'admin' && !file.uploadedBy.equals(req.user._id)) throw new ApiError(403, 'Permission denied');
  await file.deleteOne();
  res.json({ success: true });
});
