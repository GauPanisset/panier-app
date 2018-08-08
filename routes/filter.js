const Express = require('express');
const router = Express.Router();
const DB = require('../database/init.js');

router.get('/color/:pourc', (req, res, next) => {
    DB.query("SELECT couleur FROM product GROUP BY couleur HAVING count(*)/(SELECT count(*) FROM product) > ?", [req.params.pourc/100], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/material/:pourc', (req, res, next) => {
    DB.query("SELECT matiere FROM product GROUP BY matiere HAVING count(*)/(SELECT count(*) FROM product) > ?", [req.params.pourc/100], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/brand', (req, res, next) => {
    DB.query("SELECT nom FROM marque", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

module.exports.router = router;
