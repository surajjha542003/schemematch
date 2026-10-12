/**
 * SCHEME FINDER — Chat Controller
 * POST /api/v1/chat — free-text student question → grounded AI reply.
 */

const { generateChatReply } = require('../services/chatReply.service');

const MAX_MESSAGE_LEN = 800;

exports.chat = async (req, res, next) => {
  try {
    const { message, profile } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Provide a non-empty "message" field.' });
    }
    if (message.length > MAX_MESSAGE_LEN) {
      return res.status(400).json({ error: `Message too long — keep it under ${MAX_MESSAGE_LEN} characters.` });
    }
    const result = await generateChatReply(message, profile);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};
