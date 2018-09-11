const Express = require('express');
const router = Express.Router();
const DB = require('../database/init.js');
const Verif = require('../src/verifyToken.js');

router.options('*', (req, res, next) => {
    res.status(200).end();
});

router.post('/create', (req, res, next) => {;
    DB.data.query('INSERT INTO boutique (pays, ville, rue, numero, complement, nom, site, description, accueil, droit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.body.pays, req.body.ville, req.body.rue, req.body.numero, req.body.complement, req.body.nom, req.body.site, req.body.description, req.body.accueil, req.userId], (err) => {
        if (err) {
            return next(err);
        }
        DB.data.query('SELECT id FROM boutique WHERE nom = ? AND ville = ? AND rue = ?', [req.body.nom, req.body.ville, req.body.rue], (err, data) => {
            if (err) {
                return next(err);
            }
            res.json(data);
        })
    })
});

router.patch('/:prop', Verif.verifyToken('patchShop'), (req, res, next) => {
    DB.data.query('UPDATE boutique SET ' + req.params.prop + ' = ? WHERE id = ?', [req.body.value, req.body.id], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
});

router.delete('/:id', Verif.verifyToken('patchShop'), (req, res, next) => {
    DB.data.query('DELETE FROM boutique WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    })
});

router.get('/index/:id', (req, res, next) => {
    let sort_by = "ORDER BY ";
    if (req.query.order !== undefined) {
        const all_sorts = {
            "alphaC": "boutique.nom ASC",
            "alphaD": "boutique.nom DESC",
            "dateC": "''",
            "dateD": "''",
        };
        sort_by += all_sorts[req.query.order];
    } else {
        sort_by += "''";
    }

    if (req.params.id === 'all') {
        DB.data.query("SELECT boutique.id AS id, image.url AS image, boutique.nom AS name FROM boutique INNER JOIN image ON image.id_boutique = boutique.id " + sort_by, [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    } else if (req.params.id === 'allback') {
        DB.data.query("SELECT id, nom, site, description, accueil, pays, ville, rue, numero, complement FROM boutique", (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    } else {
        DB.data.query("SELECT boutique.id AS id, image.url AS image, boutique.nom AS name FROM boutique INNER JOIN image ON image.id_boutique = boutique.id WHERE boutique.id = ? " + sort_by, [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    }
});

router.get('/accueil', (req, res, next) => {
    DB.data.query("SELECT boutique.id AS id, boutique.description AS texte, image.url AS image, boutique.nom AS titre FROM boutique INNER JOIN image ON image.id_boutique = boutique.id WHERE image.main = 1 AND boutique.accueil = 1", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/:id', (req, res, next) => {
    DB.data.query("SELECT nom, site, description, pays, ville, rue, numero, complement FROM boutique WHERE id = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/image/:id', (req, res, next) => {
    DB.data.query("SELECT url FROM image WHERE id_boutique = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

module.exports.router = router;
