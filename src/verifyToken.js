const jwt = require('jsonwebtoken');

const secret = 'pzeflEJFGPJZE'; //Security key for tokens generation

function verifyToken(req, res, next) {
    let token = req.headers['x-access-token'];
    if (!token){
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    }
    jwt.verify(token, secret, function(err, decoded) {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        }
        // if everything good, save to request for use in other routes
        req.userId = decoded.id;
        next();
    });
}

function verifyTokenAsAdmin(req, res, next) {
    let token = req.headers['x-access-token'];
    if (!token){
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    }
    jwt.verify(token, config.secret, function(err, decoded) {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        }
        // if everything good, check if the account is admin.
        if(decoded.admin!==1){
            console.log(decoded.admin);
            return res.status(500).send({ auth: false, message: 'Unauthorized.' });
        }
        req.userId = decoded.id;
        next();
    });
}

function verifyTokenAsBrand(req, res, next) {
    let token = req.headers['x-access-token'];
    if (!token){
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    }
    jwt.verify(token, config.secret, function(err, decoded) {
        if (err){
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        }
        // if everything good, check if a brand is linked to the account.
        if(decoded["id_marque"] === 0 && decoded.admin === 0){
            console.log(decoded["id_marque"]);
            return res.status(500).send({ auth: false, message: 'Unauthorized.' });
        }
        req.userId = decoded.id;
        req.brandId = decoded["id_marque"];
        next();
    });
}

module.exports = {
    'secret': secret,
    'verifyToken': verifyToken,
    'isAdmin': verifyTokenAsAdmin,
    'isBrand': verifyTokenAsBrand,
};
