const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Validation des entrées
const validations = [
  check("name")
    .escape()
    .trim()
    .notEmpty()
    .isLength({ min: 5 })
    .withMessage("Le nom doit contenir au moins 5 caractères"),
  check("email").escape().trim().notEmpty().isEmail().normalizeEmail(),
  check("password")
    .trim()
    .notEmpty()
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères"),
];

// Inscription
router.post("/inscription", validations, async (req, res) => {
  try {
    const erreurValidation = validationResult(req);
    if (!erreurValidation.isEmpty()) {
      return res
        .status(400)
        .json({ msg: "Données invalides", erreurs: erreurValidation.array() });
    }

    const { name, email, password } = req.body;
    const userRefs = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!userRefs.empty) {
      return res.status(400).json({ msg: "Utilisateur existant" });
    }

    const hash = await bcrypt.hash(password, 10);
    const userRef = await db
      .collection("users")
      .add({ name, email, password: hash });

    return res
      .status(201)
      .json({ msg: "Utilisateur créé", userId: userRef.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
});

// Connexion
router.post("/connection", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Email et mot de passe requis" });
    }

    const userRefs = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userRefs.empty) {
      return res.status(400).json({ msg: "Email ou mot de passe incorrect" });
    }

    const userDoc = userRefs.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: userId, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ msg: "Connexion réussie", token, userId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
});

module.exports = router;

module.exports = router;
