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
    DB.data.query('SELECT * FROM utilisateurs WHERE pseudo=?',[username],(err,user)=>{
        if(err){//bad request
            return done(err);
        }
        if(!user){//username not found
            return done(null,false,{message: "wrong username"});
        }
        user = user[0];
        if(Bcrypt.compareSync(password, user.mdp)){
            let token = jwt.sign({ id: user.id, admin: user.admin}, Verif.secret, {
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
    req.body.mdp = Bcrypt.hashSync(req.body.mdp, 8);
    DB.data.query('INSERT INTO utilisateurs (pseudo, mail, mdp, id_marque) VALUES (?, ?, ?, ?)', [req.body.pseudo, req.body.mail, req.body.mdp, req.body.marque], (err) => {
        if (err) {
            return next(err);
        }
        DB.data.query('SELECT id FROM utilisateurs WHERE pseudo = ? AND mail = ?', [req.body.pseudo, req.body.mail], (err, data) => {
            if(err) {
                return next(err);
            }
            DB.data.query('INSERT INTO autorisation (id_droit, id_utilisateur, total) VALUES (13, ?, 0)', [data[0].id], (err) => {
                if(err) {
                    return next(err);
                }
                res.status(200).end();
            });
        });
    });
});

router.patch('/:prop', Verif.verifyToken('patchUser'), (req, res, next) => {
    const prop = req.params.prop;
    if (prop === 'mdp') {
        req.body.value = Bcrypt.hashSync(req.body.value, 8);
    }
    DB.data.query('UPDATE utilisateurs SET ' + prop + ' = ? WHERE id = ?', [req.body.value, req.body.id], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
});

router.get('/authorization/:id', (req, res, next) => {
    DB.data.query('SELECT id_droit, total FROM autorisation WHERE id_utilisateur = ?', [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        }
        return res.json(data);
    });
});

router.post('/authorization', Verif.verifyToken('patchAuthorization'), (req, res, next) => {
    DB.data.query('INSERT INTO autorisation (id_droit, id_utilisateur, total) VALUES (?, ?, ?)', [req.body.right, req.body.id, req.body.scope], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
});

router.patch('/account/authorization', Verif.verifyToken('patchAuthorization'), (req, res, next) => {
    DB.data.query('UPDATE autorisation SET total = ? WHERE id_utilisateur = ? AND id_droit = ?', [req.body.scope, req.body.id, req.body.right], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
});

router.delete('/authorization/:id/:right', Verif.verifyToken('patchAuthorization'), (req, res, next) => {
    DB.data.query('DELETE FROM autorisation WHERE id_utilisateur = ? AND id_droit = ?', [req.params.id, req.params.right], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
});

router.delete('/:id', Verif.verifyToken('deleteUser'), (req, res, next) => {
    DB.data.query('DELETE FROM utilisateurs WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    })
});

router.post('/add/:nom/:category/:id', Verif.verifyToken(null), (req, res, next) => {
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
