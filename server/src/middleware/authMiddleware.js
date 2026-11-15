const getFirebaseAdmin = require('../config/firebaseAdmin');

async function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'A Firebase ID token is required.' });
  }

  try {
    const admin = getFirebaseAdmin();
    if (!admin) {
      return res.status(503).json({ message: 'Firebase Admin is not configured.' });
    }

    req.user = await admin.auth().verifyIdToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired Firebase ID token.' });
  }
}

module.exports = authMiddleware;
