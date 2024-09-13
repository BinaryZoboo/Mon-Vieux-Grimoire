const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
require("dotenv").config();
const validator = require("validator");

console.log(process.env.JWT_SECRET);

exports.signup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "L'adresse email n'est pas valide" });
  }

  if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 2,
      minUppercase: 2,
      minNumbers: 2,
      minSymbols: 1,
    })
  ) {
    return res.status(400).json({
      error:
        "Le mot de passe doit contenir au moins 8 caractères, 2 majuscules, 2 minuscules, 2 chiffres et 1 symbole",
    });
  }

  bcrypt
    .hash(password, 10)
    .then((hashed) => {
      const user = new User({
        email: email,
        password: hashed,
      });

      user
        .save()
        .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé !" });
      }
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({ error: "Mot de passe incorrect !" });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, "RANDOM_TOKEN_SECRET", {
              expiresIn: "24h",
            }),
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
