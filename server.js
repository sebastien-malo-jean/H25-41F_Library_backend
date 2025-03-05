// Importation des librairies
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const { check, validationResult } = require("express-validator");
const cors = require("cors");

// Initialisation
dotenv.config();
const server = express();
const PORT = process.env.PORT || 3000;

server.use(cors());

// Middleware pour parser le JSON et le x-www-form-urlencoded
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Routes
server.use(express.static(path.join(__dirname, "public")));
server.use("/characters", require("./routes/characters"));
server.use("/users", require("./routes/users"));

// Ressource 404
server.use("*", (req, res) => {
  res
    .status(404)
    .json({ msg: "Erreur 404. Ce que vous cherchez n'existe pas." });
});

// Gestion des erreurs et fermeture propre
process.on("SIGTERM", () => {
  console.log("Fermeture du serveur...");
  server.close(() => {
    console.log("Serveur arrêté proprement");
    process.exit(0);
  });
});

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port : ${PORT}`);
});
