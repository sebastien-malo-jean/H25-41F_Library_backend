const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { check, validationResult } = require("express-validator");

// validations
const validId = [
  check("id")
    .isLength({ min: 20, max: 20 })
    .withMessage("L'ID doit avoir 20 charactères")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("L'ID ne peut contenir que des lettres et des chiffres"),
];
let validations = [
  check("name").trim().notEmpty().withMessage("Le nom est requis."),
  check("gender")
    .trim()
    .notEmpty()
    .isLowercase()
    .withMessage("Le genre est requis."),
  check("class").trim().notEmpty().withMessage("La classe est requis."),
  check("race").trim().notEmpty().withMessage("La race est requis."),
  check("alignment.ethic")
    .trim()
    .notEmpty()
    .withMessage("L'alignement ethic est requis."),
  check("alignment.moral")
    .trim()
    .notEmpty()
    .withMessage("L'alignement moral est requis."),
  check("traits.personalityTraits")
    .trim()
    .notEmpty()
    .withMessage("Les traits de personalités sont requis."),
  check("description")
    .trim()
    .notEmpty()
    .withMessage("Une description est requise."),
  check("traits.ideals")
    .trim()
    .notEmpty()
    .withMessage("Les ideaux sont requis."),
  check("traits.bonds")
    .trim()
    .notEmpty()
    .withMessage("Les obligations sont requis."),
  check("traits.flaws")
    .trim()
    .notEmpty()
    .withMessage("Les défauts sont requis."),
  check("statistics.strength")
    .trim()
    .notEmpty()
    .withMessage("La force est requise."),
  check("statistics.dexterity")
    .trim()
    .notEmpty()
    .withMessage("La dextérité est requise."),
  check("statistics.constitution")
    .trim()
    .notEmpty()
    .withMessage("La constitution est requise."),
  check("statistics.intelligence")
    .trim()
    .notEmpty()
    .withMessage("L'intelligence est requise."),
  check("statistics.wisdom")
    .trim()
    .notEmpty()
    .withMessage("La sagesse est requise."),
  check("statistics.charisma")
    .trim()
    .notEmpty()
    .withMessage("Le charisme est requis."),
];

/**
 * route GET pour trouver la liste de tous les personnages
 */
router.get(
  "/",
  [
    check("orderBy").escape().trim().optional().isLength({ max: 20 }),
    check("orderDirection").escape().trim().optional().isIn(["asc", "desc"]),
  ],
  async (req, res) => {
    console.log("Requête reçue avec filtres :", req.query);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let {
        limit = 100,
        start = 0,
        orderBy = "name",
        orderDirection = "asc",
        charVoc,
        gender,
        class: characterClass,
        race,
      } = req.query;

      limit = Number(limit);
      start = Number(start);

      let query = db.collection("characters");

      // Validation des filtres
      const validVocations = ["npc", "player", "monster"];
      const validGenders = ["male", "female", "unknown"];
      const validClasses = [
        "Barbare",
        "Barde",
        "Chaman",
        "Druide",
        "Ensorceleur",
        "Guerrier",
        "Magicien",
        "Moine",
        "Paladin",
        "Prêtre",
        "Rôdeur",
        "Roublard",
      ];
      const validRaces = [
        "Humain",
        "Aasimar",
        "Thiefelin",
        "Genasi",
        "Elfe-des-Bois",
        "Elfe-Sauvage",
        "Nain",
        "Duergar",
        "Hobbit",
        "Gnome",
        "Demi-Elfe",
        "Demi-Orque",
        "Orque",
        "Ogre",
        "Gobelin",
        "Kobold",
        "Yuan-ti",
      ];

      if (charVoc) {
        charVoc = charVoc.toLowerCase();
        if (!validVocations.includes(charVoc)) {
          return res.status(400).json({ error: "Vocation invalide." });
        }
        query = query.where("charVoc", "==", charVoc);
      }

      if (gender) {
        if (!validGenders.includes(gender)) {
          return res.status(400).json({ error: "Genre invalide." });
        }
        query = query.where("gender", "==", gender);
      }

      if (characterClass) {
        if (!validClasses.includes(characterClass)) {
          return res.status(400).json({ error: "Classe invalide." });
        }
        query = query.where("class", "==", characterClass);
      }

      if (race) {
        if (!validRaces.includes(race)) {
          return res.status(400).json({ error: "Race invalide." });
        }
        query = query.where("race", "==", race);
      }

      query = query.orderBy(orderBy, orderDirection).offset(start).limit(limit);

      const characters = [];
      const docRefs = await query.get();

      docRefs.forEach((doc) => {
        characters.push({ id: doc.id, ...doc.data() });
      });

      console.log("Personnages trouvés :", characters);
      return res.status(200).json(characters);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des personnages :",
        error.message
      );
      return res
        .status(500)
        .json({ error: "Erreur lors de la récupération des personnages." });
    }
  }
);

/**
 * route pour voir la liste de tous les personnages trier par les statistiques
 */
let statistics = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

statistics.forEach((statistic) => {
  router.get(
    `/statistics/${statistic}`,
    [
      check("orderBy").escape().trim().optional().isIn(statistics),
      check("orderDirection").escape().trim().optional().isIn(["asc", "desc"]),
    ],
    async (req, res) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).json({ msg: "Données invalides" });
      }

      try {
        let {
          limit = 10,
          start = 0,
          orderBy = `statistics.${statistic}`,
          orderDirection = "desc",
        } = req.query;

        limit = Number(limit);
        start = Number(start);

        if (req.query.orderBy && !statistics.includes(req.query.orderBy)) {
          return res.status(400).json({ msg: "Champ orderBy invalide" });
        }
        if (!["asc", "desc"].includes(orderDirection)) {
          return res.status(400).json({ msg: "Direction de tri invalide" });
        }

        console.log(`Tri par : ${orderBy}, ${orderDirection}`);

        const characters = [];
        const docRefs = await db
          .collection("characters")
          .orderBy(orderBy, orderDirection)
          .offset(start)
          .limit(limit)
          .get();

        docRefs.forEach((doc) => {
          const data = doc.data();
          characters.push({ id: doc.id, ...data });
        });

        return res.status(200).json(characters);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des personnages :",
          error
        );
        return res
          .status(500)
          .json({ error: "Erreur lors de la récupération des personnages." });
      }
    }
  );
});

let vocations = ["npc", "player", "monster"];

vocations.forEach((vocation) => {
  router.get(`/vocations/${vocation}`, async (req, res) => {
    try {
      let {
        limit = 10,
        start = 0,
        orderBy = "name",
        orderDirection = "desc",
      } = req.query;

      limit = Number(limit);
      start = Number(start);

      if (!["asc", "desc"].includes(orderDirection)) {
        return res.status(400).json({ msg: "Direction de tri invalide" });
      }

      console.log(
        `Filtre: charVoc = ${vocation}, Tri: ${orderBy}, Limite: ${limit}, Départ: ${start}`
      );

      const characters = [];
      const query = db
        .collection("characters")
        .where("charVoc", "==", vocation);

      let docRefs;
      try {
        docRefs = await query
          .orderBy(orderBy, orderDirection)
          .offset(start)
          .limit(limit)
          .get();
      } catch (error) {
        console.error("🔥 Erreur Firestore : Index manquant ?", error);
        return res.status(500).json({
          error: "Erreur Firestore : index manquant ?",
          details: error.message,
        });
      }

      docRefs.forEach((doc) => {
        characters.push({ id: doc.id, ...doc.data() });
      });

      return res.status(200).json(characters);
    } catch (error) {
      console.error("Erreur serveur :", error);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }
  });
});
/**
 * route pour trouver le personnage avec le id
 */

router.get("/:id", validId, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { id } = req.params;

  try {
    const docRef = await db.collection("characters").doc(id).get();

    if (!docRef.exists) {
      return res.status(404).json({
        error: "L'identifiant du personnage n'est pas dans la base de donnée.",
      });
    }
    const character = { id: docRef.id, ...docRef.data() };
    return res.status(200).json({ character });
  } catch (error) {
    console.error("Erreur lors de la récupération du personnage :", error);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération du personnage." });
  }
});

/**
 * route pour enrengistrer les informations du personnages dans la bdd.
 */

router.post("/", validations, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const body = req.body;
    await db.collection("characters").add(body);
    const response = {
      msg: "le personnage à bien été ajouter à la bibliothèque.",
    };
    res.status(201).json(response);
  } catch (error) {
    console.error("Erreur lors de la création du personnage :", error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la création du personnage." });
  }
});

/**
 * Route pour la page pour initialiser la bdd.
 */
router.post("/dbinit", async (req, res) => {
  try {
    const characters = require("../data/library");

    //TODO: vérifier si le livre est déja dans la bdd.

    for (const character of characters) {
      if (character.name) {
        const existingCharacter = await db
          .collection("characters")
          .where("name", "==", character.name)
          .get();

        if (existingCharacter.empty) {
          await db.collection("characters").add(character);
        } else {
          return res
            .status(409)
            .json({ msg: "Un ou plusieurs personnages existent déjà." });
        }
      }
    }
    return res.status(201).json({
      msg: "base de donnée initialisé.",
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Une erreur est survenue l'ors de l'initialisation de la base de donnée.",
    });
  }
});

/**
 * route pour modifier un personnage
 */
router.put("/:id", validations, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { id } = req.params;
    const { body } = req;
    await db.collection("characters").doc(id).update(body);
    const response = {
      msg: "le personnage à été modifié avec succès!",
      personnage: body,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Erreur lors de la modification du personnage :", error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la modification du personnage." });
  }
});

/**
 * route pour suprimer un personnage
 */
router.delete("/:id", validId, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    await db.collection("characters").doc(id).delete();
    const response = {
      msg: "Le personnage à bien été suprimé. ... :(",
      id: id,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Erreur lors de la supression du personnage :", error);
    return res
      .status(500)
      .json({ error: "Erreur lors de la supression du personnage." });
  }
});

module.exports = router;
