const Express = require('express');
const router = Express.Router();
const DB = require('../database/init.js');

router.get('/index/:id', (req, res, next) => {

    let sort_by = "ORDER BY ";
    if (req.query.order !== undefined) {
        const all_sorts = {
            "alphaC": "marque.nom ASC",
            "alphaD": "marque.nom DESC",
            "dateC": "''",
            "dateD": "''",
        };
        sort_by += all_sorts[req.query.order];
    } else {
        sort_by += "''";
    }

    if (req.params.id === 'all') {
        DB.query("SELECT marque.id AS id, image.url AS image, marque.nom AS name FROM marque INNER JOIN image ON image.id_marque = marque.id " + sort_by, [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    } else {
        DB.query("SELECT marque.id AS id, image.url AS image, marque.nom AS name FROM marque INNER JOIN image ON image.id_marque = marque.id WHERE marque.id = ? " + sort_by, [req.params.id], (err, data) => {
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
