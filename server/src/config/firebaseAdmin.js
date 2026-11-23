const { getApps, initializeApp, cert } = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");

function getFirebaseAdmin() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    return null;
  }

  // Check whether the default Firebase app already exists
  let app = getApps().find((existingApp) => existingApp.name === "[DEFAULT]");

  // Initialize Firebase only when it hasn't been initialized
  if (!app) {
    app = initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }

  return {
    app,
    auth: getAuth(app),
  };
}

module.exports = getFirebaseAdmin;
