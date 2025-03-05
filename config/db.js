const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

const accessKey = require("../db-config.json");

admin.initializeApp({
  credential: admin.credential.cert(accessKey),
});

const db = getFirestore();

module.exports = db;
