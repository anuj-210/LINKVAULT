import { getUserFromAuthHeader } from '../services/auth.service.js';

export const optionalAuth = async (req, _res, next) => {
  try {
    const { user, session, token } = await getUserFromAuthHeader(req.header('authorization'));
    if (user) {
      req.user = user;
      req.session = session;
      req.authToken = token;
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAuth = async (req, res, next) => {
  try {
    const { user, session, token } = await getUserFromAuthHeader(req.header('authorization'));
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    req.user = user;
    req.session = session;
    req.authToken = token;
    return next();
  } catch (err) {
    return next(err);
  }
};
