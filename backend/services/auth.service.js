import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { SESSION_DURATION_MS } from '../config/env.js';
import { Session, User } from '../models/index.js';

export const makeHash = (value) => crypto.createHash('sha256').update(value).digest('hex');

export const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
};

export const verifyPassword = (password, salt, expectedHash) => {
  const computed = crypto.scryptSync(password, salt, 64).toString('hex');
  return computed === expectedHash;
};

export const getBearerToken = (authHeader = '') => {
  const [prefix, token] = authHeader.split(' ');
  if (prefix !== 'Bearer' || !token) return null;
  return token;
};

export const createSession = async (userId) => {
  const token = nanoid(48);
  const tokenHash = makeHash(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await Session.create({ userId, tokenHash, expiresAt });
  return { token, expiresAt };
};

export const getUserFromAuthHeader = async (authorizationHeader) => {
  const token = getBearerToken(authorizationHeader);
  if (!token) return { user: null, session: null, token: null };

  const tokenHash = makeHash(token);
  const session = await Session.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
  if (!session) return { user: null, session: null, token: null };

  const user = await User.findById(session.userId);
  if (!user) return { user: null, session: null, token: null };

  return { user, session, token };
};

export const clearExpiredSessions = async () => {
  await Session.deleteMany({ expiresAt: { $lt: new Date() } });
};

export const userResponse = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name || null,
  createdAt: user.createdAt
});
