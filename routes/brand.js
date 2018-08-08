const Express = require('express');
const router = Express.Router();
const DB = require('../database/init.js');

router.get('/index/:id', (req, res, next) => {
    if (req.params.id === 'all') {
        DB.query("SELECT marque.id AS id, image.url AS image, marque.nom AS name FROM marque INNER JOIN image ON image.id_marque = marque.id", [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    } else {
        DB.query("SELECT marque.id AS id, image.url AS image, marque.nom AS name FROM marque INNER JOIN image ON image.id_marque = marque.id WHERE marque.id = ?", [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    }
});

router.get('/accueil', (req, res, next) => {
    DB.query("SELECT marque.id AS id, marque.description AS texte, image.url AS image, marque.nom AS titre FROM marque INNER JOIN image ON image.id_marque = marque.id WHERE image.main = 1 AND marque.accueil = 1", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/:id', (req, res, next) => {
    DB.query("SELECT nom, site, description FROM marque WHERE id = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/image/:id', (req, res, next) => {
    DB.query("SELECT url FROM image WHERE id_marque = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

module.exports.router = router;
