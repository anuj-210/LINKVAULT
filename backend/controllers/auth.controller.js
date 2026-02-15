import { Session, User } from '../models/index.js';
import { createSession, hashPassword, userResponse, verifyPassword } from '../services/auth.service.js';

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const { salt, hash } = hashPassword(password);
    const user = await User.create({
      email: normalizedEmail,
      name: name ? String(name).trim() : undefined,
      passwordSalt: salt,
      passwordHash: hash
    });

    const session = await createSession(user._id);
    return res.status(201).json({
      token: session.token,
      tokenExpiresAt: session.expiresAt,
      user: userResponse(user)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const session = await createSession(user._id);
    return res.json({
      token: session.token,
      tokenExpiresAt: session.expiresAt,
      user: userResponse(user)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed' });
  }
};

export const me = async (req, res) => {
  return res.json({ user: userResponse(req.user) });
};

export const logout = async (req, res) => {
  try {
    await Session.deleteOne({ _id: req.session._id });
    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Logout failed' });
  }
};
