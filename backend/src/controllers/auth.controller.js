/**
 * SCHEME FINDER — Auth Controller
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function sanitize(user) {
  const { password, __v, ...rest } = user.toObject ? user.toObject() : user;
  return rest;
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name!=='string' || typeof email!=='string' || typeof password!=='string' || !name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length<8 || password.length>72) {
      return res.status(400).json({ error: 'Provide a name, valid email and a password of 8–72 characters' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'An account with this email already exists' });

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    res.status(201).json({ token, data: sanitize(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email!=='string' || typeof password!=='string' || !email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken(user._id);
    res.json({ token, data: sanitize(user) });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.json({ data: sanitize(req.user) });
  } catch (err) {
    next(err);
  }
};
