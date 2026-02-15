import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { ALLOWED_MIME_TYPES, UPLOADS_DIR } from '../config/env.js';
import { Share } from '../models/index.js';
import {
  assignDownloadToken,
  canAccessOwnerOnlyShare,
  clearDownloadToken,
  deleteTempUploadedFile,
  getExpiryDate,
  getValidatedMaxViews,
  makeShareCheckResponse,
  markDeleteAfterDownload,
  removeShareAndFile
} from '../services/share.service.js';

export const uploadText = async (req, res) => {
  try {
    const { text, password, oneTime, maxViews, expiresAt, ownerOnly } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content required' });
    }

    if (ownerOnly && !req.user) {
      return res.status(401).json({ error: 'Login required for owner-only share' });
    }

    const validatedExpiry = getExpiryDate(expiresAt);
    if (!validatedExpiry) {
      return res.status(400).json({ error: 'Invalid expiry date. Must be a future date/time.' });
    }

    const validatedMaxViews = getValidatedMaxViews(maxViews);
    if (maxViews !== undefined && maxViews !== null && maxViews !== '' && !validatedMaxViews) {
      return res.status(400).json({ error: 'maxViews must be an integer greater than 0' });
    }

    const share = await Share.create({
      shareId: nanoid(10),
      type: 'text',
      content: text,
      password: password || null,
      oneTime: !!oneTime,
      maxViews: validatedMaxViews,
      ownerId: req.user?._id || undefined,
      ownerOnly: req.user ? !!ownerOnly : false,
      deleteToken: nanoid(24),
      expiresAt: validatedExpiry
    });

    return res.json({
      shareId: share.shareId,
      deleteToken: share.deleteToken,
      ownerOnly: share.ownerOnly,
      expiresAt: share.expiresAt
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Upload failed' });
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (ALLOWED_MIME_TYPES.length > 0 && !ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      deleteTempUploadedFile(req.file.path);
      return res.status(400).json({ error: 'File type not allowed' });
    }

    const { password, oneTime, maxViews, expiresAt, ownerOnly } = req.body;
    if (ownerOnly && !req.user) {
      deleteTempUploadedFile(req.file.path);
      return res.status(401).json({ error: 'Login required for owner-only share' });
    }

    const validatedExpiry = getExpiryDate(expiresAt);
    if (!validatedExpiry) {
      deleteTempUploadedFile(req.file.path);
      return res.status(400).json({ error: 'Invalid expiry date. Must be a future date/time.' });
    }

    const validatedMaxViews = getValidatedMaxViews(maxViews);
    if (maxViews !== undefined && maxViews !== null && maxViews !== '' && !validatedMaxViews) {
      deleteTempUploadedFile(req.file.path);
      return res.status(400).json({ error: 'maxViews must be an integer greater than 0' });
    }

    const share = await Share.create({
      shareId: nanoid(10),
      type: 'file',
      filename: req.file.originalname,
      filepath: req.file.filename,
      filesize: req.file.size,
      mimetype: req.file.mimetype,
      password: password || null,
      oneTime: !!oneTime,
      maxViews: validatedMaxViews,
      ownerId: req.user?._id || undefined,
      ownerOnly: req.user ? !!ownerOnly : false,
      deleteToken: nanoid(24),
      expiresAt: validatedExpiry
    });

    return res.json({
      shareId: share.shareId,
      deleteToken: share.deleteToken,
      filename: share.filename,
      filesize: share.filesize,
      ownerOnly: share.ownerOnly,
      expiresAt: share.expiresAt
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Upload failed' });
  }
};

export const checkShare = async (req, res) => {
  try {
    const share = await Share.findOne({ shareId: req.params.shareId });
    if (!share) {
      return res.json({ exists: false });
    }

    return res.json(makeShareCheckResponse(share, req.user));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Check failed' });
  }
};

export const getShare = async (req, res) => {
  try {
    const share = await Share.findOne({ shareId: req.params.shareId });
    if (!share) {
      return res.status(403).json({ error: 'Invalid share link' });
    }

    if (!canAccessOwnerOnlyShare(share, req.user)) {
      return res.status(403).json({ error: 'Authentication required for this share' });
    }

    if (new Date() > share.expiresAt) {
      return res.status(410).json({ error: 'Share expired' });
    }

    if (share.maxViews && share.views >= share.maxViews) {
      return res.status(410).json({ error: 'Max views reached' });
    }

    if (share.password && share.password !== req.body.password) {
      return res.status(403).json({ error: 'Invalid password' });
    }

    share.views += 1;
    await share.save();

    const response = {
      shareId: share.shareId,
      type: share.type,
      ownerOnly: !!share.ownerOnly,
      expiresAt: share.expiresAt,
      views: share.views,
      maxViews: share.maxViews,
      oneTime: share.oneTime,
      createdAt: share.createdAt
    };

    if (share.type === 'text') {
      response.content = share.content;
    } else {
      const fileAccessToken = nanoid(24);
      await assignDownloadToken(share, fileAccessToken);
      response.filename = share.filename;
      response.filesize = share.filesize;
      response.mimetype = share.mimetype;
      response.downloadUrl = `/api/share/${share.shareId}/download?token=${fileAccessToken}`;
    }

    if (share.oneTime) {
      if (share.type === 'file') {
        await markDeleteAfterDownload(share);
      } else {
        await removeShareAndFile(share);
      }
    }

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to retrieve share' });
  }
};

export const downloadShareFile = async (req, res) => {
  try {
    const share = await Share.findOne({ shareId: req.params.shareId });
    if (!share || share.type !== 'file') {
      return res.status(403).json({ error: 'Invalid share link' });
    }

    if (new Date() > share.expiresAt) {
      return res.status(410).json({ error: 'Share expired' });
    }

    const token = req.query.token;
    if (!token || token !== share.fileAccessToken) {
      return res.status(403).json({ error: 'Invalid download token' });
    }

    if (!share.fileAccessTokenExpiresAt || new Date() > share.fileAccessTokenExpiresAt) {
      return res.status(410).json({ error: 'Download token expired' });
    }

    const fullPath = path.join(UPLOADS_DIR, path.basename(share.filepath));
    if (!fs.existsSync(fullPath)) {
      return res.status(410).json({ error: 'File unavailable' });
    }

    return res.download(fullPath, share.filename, async (err) => {
      if (err) {
        console.error('Download error:', err);
        return;
      }

      if (share.deleteAfterDownload) {
        await removeShareAndFile(share);
      } else {
        await clearDownloadToken(share);
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Download failed' });
  }
};

export const deleteShare = async (req, res) => {
  try {
    const share = await Share.findOne({ shareId: req.params.shareId });
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (share.ownerId) {
      if (!req.user || share.ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Only owner can delete this share' });
      }
    } else {
      const deleteToken = req.header('x-delete-token') || req.query.deleteToken;
      if (!deleteToken) {
        return res.status(403).json({ error: 'Delete token required' });
      }
      if (share.deleteToken !== deleteToken) {
        return res.status(403).json({ error: 'Invalid delete token' });
      }
    }

    await removeShareAndFile(share);
    return res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Delete failed' });
  }
};
