const jwt = require('jsonwebtoken');
const Express = require('express');
const Bcrypt = require('bcrypt');
const Passport 	= require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const router = Express.Router();
const DB = require('../database/init.js');
const Verif = require('../src/verifyToken.js');


Passport.use(new BasicStrategy((username,password,done)=>{
    console.log(username + " === " + password);
    DB.query('SELECT * FROM utilisateurs WHERE pseudo=?',[username],(err,user)=>{
        if(err){//bad request
            console.log("Error here");
            return done(err);
        }
        if(!user){//username not found
            return done(null,false,{message: "wrong username"});
        }
        user = user[0];
        if(Bcrypt.compareSync(password, user.mdp)){
            let token = jwt.sign({ id: user.pseudo }, Verif.secret, {
                expiresIn: 86400 //expires in 24 hours
            });
            const json = {
                token: token,
                auth: true
            };
            return done(null,json);
        }
        return done(null,false,{message: "wrong password"});
    });

}));

router.post('/create', (req, res, next) => {
    DB.query('INSERT INTO utilisateurs (pseudo, mail, mdp, id_marque) VALUES (?, ?, ?, ?)', [req.body.pseudo, req.body.mail, req.body.mdp, req.body.marque], (err) => {
        if (err) {
            return next(err);
        }
        res.status(201).end();
    });
});

router.patch('/account/:prop', Verif.verifyToken, (req, res, next) => {
    if (req.body.id_utilisateur !== req.userId || req.params.prop === "confirme") {
        Verif.isAdmin();
    }
    DB.query('UPDATE utilisateurs SET ? = ? WHERE id = ?', [req.params.prop, req.body.value, req.body.id_utilisateur], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    })
});

router.delete('/account', Verif.isAdmin, (req, res, next) => {
    DB.query('DELETE FROM utilisateurs WHERE id = ?', [req.body.id_utilisateur], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    })
});

router.patch('/validate', Verif.isAdmin, (req, res, next) => {
    DB.query('UPDATE utilisateurs SET confirme = 1 WHERE id = ?', [req.body.id], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    })
});

router.post('/add/:nom/:category/:id', Verif.verifyToken, (req, res, next) => {
    const category = 'id_' + req.params.category;
    DB.query('INSERT INTO collection_uti (id_utilisateur, ?, nom) VALUES (?, ?, ?)', [category, req.userId, req.params.id, req.params.nom], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    })
});

router.get('/login', Passport.authenticate('basic',{session:false}), (req, res) => {
    const json = JSON.stringify(req.user);
    res.end(json);
});

router.get('/logout', function(req, res) {
    res.status(200).send({ auth: false, token: null });
});

module.exports.router = router;
