const jwt = require("jsonwebtoken");

async function auth(req, res, next) {
  const token =
    req.headers["authorization"] && req.headers["authorization"].split(" ")[1];

  // Debugging the request headers
  console.log(req.headers);

  if (!token) {
    return res.status(401).json({ msg: "Accès refusé, jeton manquant." });
  }

  try {
    // Decoding the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res
        .status(401)
        .json({ msg: "Accès refusé. Vous n'avez pas de jeton." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ msg: "Jeton invalide ou expiré." });
  }
}

module.exports = auth;
