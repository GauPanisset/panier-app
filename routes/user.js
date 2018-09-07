const jwt = require('jsonwebtoken');
const Express = require('express');
const Bcrypt = require('bcrypt');
const Passport 	= require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const router = Express.Router();
const DB = require('../database/init.js');
const Verif = require('../src/verifyToken.js');

router.options('*', (req, res, next) => {
    res.status(200).end();
});

Passport.use(new BasicStrategy((username,password,done)=>{
    DB.checkConnection();
    DB.data.query('SELECT * FROM utilisateurs WHERE pseudo=?',[username],(err,user)=>{
        if(err){//bad request
            return done(err);
        }
        if(!user){//username not found
            return done(null,false,{message: "wrong username"});
        }
        user = user[0];
        if(Bcrypt.compareSync(password, user.mdp)){
            let token = jwt.sign({ id: user.id, admin: user.admin, id_marque: user.id_marque}, Verif.secret, {
                expiresIn: 86400 //expires in 24 hours
            });
            const json = {
                token: token,
                auth: true,
                id: user.id,
            };
            return done(null,json);
        }
        return done(null,false,{message: "wrong password"});
    });

}));

router.get('/index/:id', (req, res, next) => {
    DB.checkConnection();
    if (req.params.id == 'allback') {
        DB.data.query('SELECT * FROM utilisateurs', [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            }
            return res.json(data);
        });
    } else {
        DB.data.query('SELECT * FROM utilisateurs WHERE id = ?', [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            }
            return res.json(data);
        });
    }
});

router.post('/create', (req, res, next) => {
    DB.checkConnection();
    req.body.mdp = Bcrypt.hashSync(req.body.mdp, 8);
    DB.data.query('INSERT INTO utilisateurs (pseudo, mail, mdp, id_marque) VALUES (?, ?, ?, ?)', [req.body.pseudo, req.body.mail, req.body.mdp, req.body.marque], (err) => {
        if (err) {
            return next(err);
        }
        res.status(201).end();
    });
});

router.patch('/:prop', Verif.verifyToken, (req, res, next) => {
    DB.checkConnection();
    const prop = req.params.prop;
    if (req.body.id_utilisateur != req.userId || req.params.prop === "confirme") {
        router.use(Verif.isAdmin);
    }
    if (prop === 'mdp') {
        req.body.value = Bcrypt.hashSync(req.body.value, 8);
    }
    DB.data.query('UPDATE utilisateurs SET ' + req.params.prop + ' = ? WHERE id = ?', [req.body.value, req.body.id], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
});

router.delete('/account', Verif.isAdmin, (req, res, next) => {
    DB.checkConnection();
    DB.data.query('DELETE FROM utilisateurs WHERE id = ?', [req.body.id_utilisateur], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    })
});

router.post('/add/:nom/:category/:id', Verif.verifyToken, (req, res, next) => {
    DB.checkConnection();
    const category = 'id_' + req.params.category;
    DB.data.query('INSERT INTO collection_uti (id_utilisateur, ?, nom) VALUES (?, ?, ?)', [category, req.userId, req.params.id, req.params.nom], (err) => {
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
