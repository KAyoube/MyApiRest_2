// IMPORTS des pasckages npm que l'ont va use

let bcrypt = require("bcrypt");
let asyncLib = require("async");

// IMPORTS des pasckages que l'ont va use via dossier

let models = require("../models");
let jwtUtils = require("../utils/jwt.utils");

// Routes

module.exports = {
  // on cree une FONCTION REGISTER
  register: (request, response) => {
    // recuperer les parametre du user
    let nom = request.body.nom;
    let prenom = request.body.prenom;
    let email = request.body.email;
    let password = request.body.password;

    // verification des champs si vide on renvoie une erreur
    if (nom == null || prenom == null || password == null || email == null) {
      return response
        .status(400)
        .json({ error: "An error occurred,champs vide" });
    }

    // tcheck(email) si le user n'exite pas dans notre BDD
    models.User.findOne({
      attributes: ["email"],
      where: { email: email },
    })
    .then((userFound) => {
      // si le new user nexiste pas dans la BDD
      if (!userFound) {
        // on hache le password pour secure la connexion
        bcrypt.hash(password, 5, (err, bcryptedPassword) => {
          // on implémente un user avec les infos suivantes role=0 (en dur) car tout newuser !=admin
          let newUser = models.User.create({
            nom: nom,
            prenom: prenom,
            email: email,
            password: bcryptedPassword,
            role: 0,
          }) // on renvoi un success avec un objet de ses infos
            .then((newUser) => {
              return response.status(201).json({
                success: "User successfully created",
                userId: newUser.id,
                user_lastname: newUser.nom,
                user_name: newUser.prenom,
                password: bcryptedPassword,
                email: newUser.email,
              });
            })
            .catch((err) => {
              return response.status(400).json({ error: "An error occurred" });
            });
        });

        //Si le user existe deja dans notre BDD alors on renvoi une erreur
      } else {
        return response
          .status(409)
          .json({ error: "An error occured (user exist)" });
      }
    });
  }, // REGISTER OK.

  // on cree une FONCTION LOGIN
  login: (request, response) => {
    // recuperer les info login du user
    let email = request.body.email;
    let password = request.body.password;

    // tcheck si les champs sont vide

    if (email == null || password == null) {
      return response
        .status(400)
        .json({ error: "AN error occurred champs vide" });
    }

    // tcheck si le mail user login = mail user register

    models.User.findOne({
      where: { email: email },
    })
      .then((userFound) => {
        // si email login = email register
        if (userFound) {
          // on compare le mot de passe haché precedemment avec celui rentré
          bcrypt.compare(
            password,
            userFound.password,
            (errBcrypt, resBcrypt) => {
              // si password identique on renvoi un objet avec info user existant
              if (resBcrypt) {
                return response.status(200).json({
                  userId: userFound.id,
                  user_lastname: userFound.nom,
                  user_name: userFound.prenom,
                  TOKEN: jwtUtils.generateTokenUser(userFound),
                });

                // si password login != password register(haché)
              } else {
                return response.status(403).json({ error: "Mauvais password" });
              }
            }
          );
          // si email login != email register
        } else {
          return response
            .status(400)
            .json({ error: "An error occurred user not in DB" });
        }
      })
      .catch((err) => {
        return response
          .status(400)
          .json({ error: "An error occurred user not found" });
      });
  }, // LOGIN OK.

  // on cree une FONCTION READ PROFIL
  getUserProfil: (request, response) => {
    let headerAuth = request.headers["authorization"];

    let userId = jwtUtils.getUserId(headerAuth);
    // unn ID est toujours >0 on verifie que tout est ok
    if (userId < 0) {
      return response
        .status(400)
        .json({ error: "An error occured mauvais token" });
    }
    // on cherche un user selon les attributs mentionné dans attributes
    models.User.findOne({
      attributes: ["id", "nom", "prenom", "email"],
      // et on tcheck si son ID est ok
      where: { id: userId },
    })
    // si c'est le cas on renvoi un message de succes
      .then((user) => {
        if (user) {
          return response.status(201).json(user);
          // sinon on renvoi un message d'erreur
        } else {
          return response.status(400).json({ error: "AN error occured" });
        }
      })
      // si aucun user est trouvé on renvoi un autre message d'erreur
      .catch((err) => {
        return response.status(500).json({ error: "user not fetch" });
      });
  }, // READ PROFIL OK.

  // on cree une FONCTION UPDATE PROFIL
  updateUserProfil: (request, response) => {
    let headerAuth = request.headers["authorization"];
    let userId = jwtUtils.getUserId(headerAuth);

    let nom = request.body.nom;
    let prenom = request.body.prenom;
    let email = request.body.email;

    asyncLib.waterfall(
      [
        (done) => {
          models.User.findOne({
            attributes: ["id", "nom", "prenom", "email"],
            where: { id: userId },
          })
            .then((userFound) => {
              done(null, userFound);
            })
            .catch((err) => {
              return response
                .status(500)
                .json({ error: "unable to verify user" });
            });
        },
        (userFound, done) => {
          if (userFound) {
            userFound
              .update({
                nom: nom ? nom : userFound.nom,
                prenom: prenom ? prenom : userFound.prenom,
                email: email ? email : userFound.email,
              })
              .then(() => {
                done(userFound);
              })
              .catch((err) => {
                response.status(400).json({ error: "An error occurred" });
              });
          } else {
            response.status(400).json({ error: "An error occurred" });
          }
        },
      ],
      (userFound) => {
        if (userFound) {
          return response.status(201).json(userFound);
        } else {
          return response.status(400).json({ error: "An error occurred" });
        }
      }
    );
  }, // UPDATE PROFIL OK.

  // on cree une fonction DELETE PROFIL
  deleteUserProfil: (request, response) => {

    let headerAuth = request.headers['authorization']

    let userId = jwtUtils.getUserId(headerAuth)

    asyncLib.waterfall([
      (done) => {
          models.User.destroy({
              where: { id: userId }
          })
          .then((userFound) => {
              done(userFound)
          })
          .catch((err) => {
              return response.status(400).json({ 'error': 'An error occurred' });
          });
      }],
      (userFound) => {
          if (userFound) {
              return response.status(200).json({'success':`User successfuly deleted`})
          }
          else {
              return response.status(404).json({ 'error': 'User was not found' });
          }
      });
    
  }, // DELETE PROFIL OK.

  // on cree une fonction GET ALL USERS
  getAllUsers: (requqest, response) => {

    //on recherche tt les users via leur attributs mentionné dans "attributes"
    models.User.findAll({
        attributes: [ 'id', 'nom', 'prenom', 'email']
    })
    // une fois trouvé on renvoi un message de succes
    .then((usersFound) => {
        response.status(200).json(usersFound)
    })
    // si erreur on renvoi un message d'erreur
    .catch((err) => {
        response.status(400).json({ 'error': 'An error occurred' });
    });
},// GET ALL USERS OK.
}; //-- exxports end ---
