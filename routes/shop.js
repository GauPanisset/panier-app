const Express = require('express');
const router = Express.Router();
const DB = require('../database/init.js');
const Verif = require('../src/verifyToken.js');

router.post('/create', Verif.isAdmin, (req, res, next) => {
    DB.query('INSERT INTO boutique (pays, ville, rue, numero, complement, nom, site, description, accueil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.body.pays, req.body.ville, req.body.rue, req.body.numero, req.body.complement, req.body.nom, req.body.site, req.body.description, req.body.accueil], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    })
});

router.patch('/:prop', Verif.isAdmin, (req, res, next) => {
    DB.query('UPDATE boutique SET ? = ? WHERE id = ?', [req.params.prop, req.body.value, req.body.id_boutique], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
});

router.delete('/', Verif.isAdmin, (req, res, next) => {
    DB.query('DELETE FROM boutique WHERE id = ?', [req.body.id_boutique], (err) => {
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
        DB.query("SELECT boutique.id AS id, image.url AS image, boutique.nom AS name FROM boutique INNER JOIN image ON image.id_boutique = boutique.id " + sort_by, [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    } else {
        DB.query("SELECT boutique.id AS id, image.url AS image, boutique.nom AS name FROM boutique INNER JOIN image ON image.id_boutique = boutique.id WHERE boutique.id = ? " + sort_by, [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    }
});

router.get('/accueil', (req, res, next) => {
    DB.query("SELECT boutique.id AS id, boutique.description AS texte, image.url AS image, boutique.nom AS titre FROM boutique INNER JOIN image ON image.id_boutique = boutique.id WHERE image.main = 1 AND boutique.accueil = 1", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/:id', (req, res, next) => {
    DB.query("SELECT nom, site, description, pays, ville, rue, numero, complement FROM boutique WHERE id = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/image/:id', (req, res, next) => {
    DB.query("SELECT url FROM image WHERE id_boutique = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

module.exports.router = router;
