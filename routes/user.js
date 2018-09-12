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

router.get('/collection/:id', (req, res, next) => {         //For product valeur1 = nom, valeur2 = prix & for article valeur1 = titre, valeur2 = sous_titre, valeur3 = texte
    DB.data.query("SELECT collection_uti.nom AS nom, IF(collection_uti.id_produit IS NULL, collection_uti.id_article, collection_uti.id_produit) AS id, IF(collection_uti.id_produit IS NULL, image2.url, image.url) AS image, IF(collection_uti.id_produit IS NULL, article.titre, product.nom) AS valeur1, IF(collection_uti.id_produit IS NULL, article.sous_titre, product.prix) AS valeur2, IF(collection_uti.id_produit IS NULL, article.texte, 'product') AS valeur3 FROM collection_uti LEFT JOIN product ON product.id = collection_uti.id_produit LEFT JOIN article ON article.id = collection_uti.id_article LEFT JOIN (SELECT url, id_produit FROM image WHERE main = 1) image ON image.id_produit = collection_uti.id_produit LEFT JOIN (SELECT url, id_article FROM image WHERE main = 1) image2 ON image2.id_article = collection_uti.id_article WHERE id_utilisateur = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        }
        return res.json(data);
    });
});

router.post('/collection', Verif.verifyToken(null), (req, res, next) => {
    DB.data.query('INSERT INTO collection_uti ('+ req.body.item + ', id_utilisateur, nom) VALUES (?, ?, ?)', [req.body.id_item, req.body.id, req.body.nom], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
});

router.delete('/collection/:id/:nom', Verif.verifyToken(null), (req, res, next) => {
    DB.data.query('DELETE FROM collection_uti WHERE id_utilisateur = ? AND nom = ?', [req.params.id, req.params.nom], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
});

router.delete('/collection/:id/:nom', Verif.verifyToken(null), (req, res, next) => {
    DB.data.query('DELETE FROM collection_uti WHERE id_utilisateur = ? AND nom = ? AND id_' + req.query.item + ' = ?', [req.params.id, req.params.nom, req.query.id_item], (err) => {
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

router.get('/login', Passport.authenticate('basic',{session:false}), (req, res) => {
    const json = JSON.stringify(req.user);
    res.end(json);
});

router.get('/logout', function(req, res) {
    res.status(200).send({ auth: false, token: null });
});

module.exports.router = router;
