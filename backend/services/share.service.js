import fs from 'fs';
import path from 'path';
import { FILE_ACCESS_TOKEN_TTL_MS, UPLOADS_DIR } from '../config/env.js';
import { Share } from '../models/index.js';

export const getExpiryDate = (expiryInput) => {
  if (expiryInput !== undefined && expiryInput !== null && expiryInput !== '') {
    const parsedDate = new Date(expiryInput);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
      return null;
    }
    return parsedDate;
  }

  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
};

export const getValidatedMaxViews = (rawMaxViews) => {
  if (rawMaxViews === undefined || rawMaxViews === null || rawMaxViews === '') return null;
  const parsed = Number(rawMaxViews);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
};

export const removeShareAndFile = async (share) => {
  if (share.type === 'file' && share.filepath) {
    const fullPath = path.join(UPLOADS_DIR, path.basename(share.filepath));
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
  await Share.deleteOne({ _id: share._id });
};

export const deleteTempUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const canAccessOwnerOnlyShare = (share, user) => {
  if (!share.ownerOnly) return true;
  if (!user) return false;
  return share.ownerId && share.ownerId.toString() === user._id.toString();
};

export const makeShareCheckResponse = (share, user) => {
  if (!canAccessOwnerOnlyShare(share, user)) {
    return {
      exists: true,
      accessible: false,
      ownerOnly: true,
      requiresAuth: true,
      requiresPassword: false,
      type: share.type,
      expiresAt: share.expiresAt
    };
  }

  const isExpired = new Date() > share.expiresAt;
  const maxViewsReached = share.maxViews && share.views >= share.maxViews;

  return {
    exists: true,
    accessible: !isExpired && !maxViewsReached,
    ownerOnly: !!share.ownerOnly,
    requiresAuth: false,
    requiresPassword: !!share.password,
    type: share.type,
    expiresAt: share.expiresAt
  };
};

export const assignDownloadToken = async (share, token) => {
  share.fileAccessToken = token;
  share.fileAccessTokenExpiresAt = new Date(Date.now() + FILE_ACCESS_TOKEN_TTL_MS);
  await share.save();
};

export const clearDownloadToken = async (share) => {
  share.fileAccessToken = null;
  share.fileAccessTokenExpiresAt = null;
  await share.save();
};

export const markDeleteAfterDownload = async (share) => {
  share.deleteAfterDownload = true;
  await share.save();
};

export const cleanupExpiredShares = async () => {
  const now = new Date();
  const expiredShares = await Share.find({ expiresAt: { $lt: now } });
  for (const share of expiredShares) {
    await removeShareAndFile(share);
  }
  return expiredShares.length;
};
