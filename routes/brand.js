const Express = require('express');
const router = Express.Router();
const DB = require('../database/init.js');
const Verif = require('../src/verifyToken.js');

router.options('*', (req, res, next) => {
    res.status(200).end();
});

router.post('/create', Verif.isAdmin, (req, res, next) => {
    DB.checkConnection();
    DB.data.query('INSERT INTO marque (nom, site, description, accueil) VALUES (?, ?, ?, ?)', [req.body.nom, req.body.site, req.body.description, req.body.accueil], (err) => {
        if (err) {
            return next(err);
        }
        DB.data.query('SELECT id FROM marque WHERE nom = ?', [req.body.nom], (err, data) => {
            if (err) {
                return next(err);
            }
            res.json(data);
        })
    })
});

router.patch('/:prop', Verif.isBrand, (req, res, next) => {
    DB.checkConnection();
    if (req.body.id_marque !== req.brandId) {
        router.use(Verif.isAdmin);
    }
    DB.data.query('UPDATE marque SET ' + req.params.prop + ' = ? WHERE id = ?', [req.body.value, req.body.id], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
});

router.delete('/:id', Verif.isBrand, (req, res, next) => {
    DB.checkConnection();
    if(req.body.id_marque !== req.brandId) {
        router.use(Verif.isAdmin);
    }
    DB.data.query('DELETE FROM marque WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
    DB.data.query('UPDATE utilisateurs SET id_marque = 0 WHERE id_marque = ?', [req.body.id_marque])
});

router.get('/index/:id', (req, res, next) => {
    DB.checkConnection();
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
        DB.data.query("SELECT marque.id AS id, image.url AS image, marque.nom AS name FROM marque INNER JOIN image ON image.id_marque = marque.id " + sort_by, [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    } else if (req.params.id === 'allback') {
        DB.data.query("SELECT id, nom, site, description, accueil FROM marque", (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    } else {
        DB.data.query("SELECT marque.id AS id, image.url AS image, marque.nom AS name FROM marque INNER JOIN image ON image.id_marque = marque.id WHERE marque.id = ? " + sort_by, [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    }
});

router.get('/accueil', (req, res, next) => {
    DB.checkConnection();
    DB.data.query("SELECT marque.id AS id, marque.description AS texte, image.url AS image, marque.nom AS titre FROM marque INNER JOIN image ON image.id_marque = marque.id WHERE image.main = 1 AND marque.accueil = 1", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/:id', (req, res, next) => {
    DB.checkConnection();
    DB.data.query("SELECT nom, site, description FROM marque WHERE id = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/image/:id', (req, res, next) => {
    DB.checkConnection();
    DB.data.query("SELECT url FROM image WHERE id_marque = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/id/:name', (req, res, next) => {
    DB.checkConnection();
    DB.data.query("SELECT id FROM marque WHERE nom = ?", [req.params.name], (err, data) => {
       if (err) {
           return next(err);
       } else {
           return res.json(data);
       }
    });
});

module.exports.router = router;
