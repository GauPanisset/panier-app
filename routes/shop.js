const Express = require('express');
const router = Express.Router();
const DB = require('../database/init.js');

router.get('/index/:id', (req, res, next) => {
    if (req.params.id === 'all') {
        DB.query("SELECT boutique.id AS id, image.url AS image, boutique.nom AS name FROM boutique INNER JOIN image ON image.id_boutique = boutique.id", [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    } else {
        DB.query("SELECT boutique.id AS id, image.url AS image, boutique.nom AS name FROM boutique INNER JOIN image ON image.id_boutique = boutique.id WHERE boutique.id = ?", [req.params.id], (err, data) => {
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
