// IMPORTS des pasckages npm que l'ont va use

let jwt = require('jsonwebtoken')

// initiate variable

const JWT_SIGN_SECRET = "12345afpa6789dev"

// fonctions que l'ont va exporter 
module.exports = {
    // on cree une fonction qui va generer des token pour chaque user 
    generateTokenUser: (userData)=> {
        return jwt.sign({
            userId: userData.id
        },
        JWT_SIGN_SECRET,
        {})
    },

    // on cree une fonction qui va supprimer "Bearer" (norme W3C) pour garder uniquement le token
    parseAuthorization: (authozization) => {

     // si le champ est non null on remplace "Bearer" par "rien" pour avoir le token
        return (authozization!= null)? authozization.replace('Bearer ',''):null;
    },

    // on cree une fonction qui va verifier le token
    getUserId : (authozization) => {

        // on initialise le userId a -1 pour eviter les conflits (ID > 0) donc pas de risque:
        let userId = -1
        let token = module.exports.parseAuthorization(authozization);

        // on test si le token != null
        if(token!=null){

            try{
                // on tcheck le token avec notre base secrete (JWT_SIGN_SECRET)
                let jwtToken = jwt.verify(token,JWT_SIGN_SECRET)
                
                // on verifie si le token genere != null
                if(jwtToken!=null){
                    userId = jwtToken.userId 
                }
                // sinon on renvoi une erreur
            } catch(err){}
        }
        return userId;
    }

}