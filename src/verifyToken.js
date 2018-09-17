const jwt = require('jsonwebtoken');
const DB = require('../database/init.js');

const secret = 'pzeflEJFGPJZE'; //Security key for tokens generation
const authorizations = {
    'createProduct': 0,
    'patchProduct': 1,
    'deleteProduct': 2,
    'createArticle': 3,
    'patchArticle': 4,
    'deleteArticle': 5,
    'createShop': 6,
    'patchShop': 7,
    'deleteShop': 8,
    'createBrand': 9,
    'patchBrand': 10,
    'deleteBrand': 11,
    'createUser': 12,
    'patchUser': 13,
    'deleteUser': 14,
    'patchAuthorization': 15,
};


function verifyToken (required_autho) {
    return function (req, res, next) {
        let token = req.headers['x-access-token'];
        if (!token){
            return res.status(403).send({ auth: false, message: 'No token provided. User'});
        }
        jwt.verify(token, secret, function(err, decoded) {
            if (err){
                console.log(err);
                return res.status(500).send({ auth: false, message: 'Failed to authenticate token. User' });
            }
            // if everything good, save to request for use in other routes
            if (decoded.admin === 1 || required_autho === null) {
                req.userId = decoded.id;
                return next();
            }

            DB.data.query('SELECT total FROM autorisation WHERE id_utilisateur = ? AND id_droit = ?', [decoded.id, authorizations[required_autho]], (err, autho) => {
                if (err) {
                    return done(err);
                }
                if (autho.length === 0) {
                    return res.status(500).send({ auth: false, message: 'Unauthorized.' });
                } else if (autho.total === 0 && decoded.id !== req.body.droit) {
                    return res.status(500).send({ auth: false, message: 'Unauthorized.' });
                } else {
                    req.userId = decoded.id;
                    next();
                }
            });
        });
    }
}


function verifyTokenAsAdmin(req, res, next) {
    let token = req.headers['x-access-token'];
    if (!token){
        return res.status(403).send({ auth: false, message: 'No token provided. Admin'});
    }
    jwt.verify(token, secret, function(err, decoded) {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token. Admin' });
        }
        // if everything good, check if the account is admin.
        if(decoded.admin!==1){
            return res.status(500).send({ auth: false, message: 'Unauthorized.' });
        }
        req.userId = decoded.id;
        next();
    });
}

function verifyTokenAsBrand(req, res, next) {
    let token = req.headers['x-access-token'];
    if (!token){
        return res.status(403).send({ auth: false, message: 'No token provided. Brand' });
    }
    jwt.verify(token, secret, function(err, decoded) {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token. Brand' });
        }
        // if everything good, check if a brand is linked to the account.
        if(decoded["id_marque"] === 0 && decoded.admin === 0){
            return res.status(500).send({ auth: false, message: 'Unauthorized.' });
        }
        req.userId = decoded.id;
        req.brandId = decoded["id_marque"];
        next();
    });
}

module.exports = {
    'secret': secret,
    'authorizations': authorizations,
    'verifyToken': verifyToken,
    'isAdmin': verifyTokenAsAdmin,
    'isBrand': verifyTokenAsBrand,
};
