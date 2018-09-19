const Express = require('express');
const router = Express.Router();
const DB = require('../database/init.js');
const Elastic = require('../elasticsearch/init.js');
const Verif = require('../src/verifyToken.js');

router.options('*', (req, res, next) => {
    res.status(200).end();
});

router.post('/create', Verif.verifyToken('createProduct'), (req, res, next) => {
    DB.data.query('INSERT INTO product (categorie, sous_categorie, couleur, couleur_type, matiere, forme, prix, id_marque, collection, numero, description, nom, droit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.body.categorie, req.body.sous_categorie, req.body.couleur, req.body.couleur_type, req.body.matiere, req.body.forme, req.body.prix, req.body.id_marque, req.body.collection, req.body.numero, req.body.description, req.body.nom, req.userId], (err) => {
        if (err) {
            return next(err);
        }
        DB.data.query('SELECT id FROM product WHERE nom = ? AND id_marque = ? AND couleur = ?', [req.body.nom, req.body.id_marque, req.body.couleur], (err, data) => {
            if (err) {
                return next(err);
            }
            res.json(data);
        })
    })
});

router.post('/jsoncreate', Verif.verifyToken('createProduct'), (req, res, next) => {
    req.body.content.forEach(item => {
        DB.data.query('INSERT INTO product (categorie, sous_categorie, couleur, couleur_type, matiere, forme, prix, id_marque, collection, numero, description, nom, droit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [item.categorie, item.sous_categorie, item.couleur, item.couleur_type, item.matiere, item.forme, item.prix, item.marque, item.collection, item.numero, item.description, item.nom, req.userId], (err) => {
            if (err) {
                return next(err);
            }
            console.log("add");
            res.status(200).end();
        })
    })
});

router.patch('/:prop', Verif.verifyToken('patchProduct'), (req, res, next) => {
    DB.data.query('UPDATE product SET ' + req.params.prop + ' = ? WHERE id = ?', [req.body.value, req.body.id], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
});



router.delete('/:id', Verif.verifyToken('deleteProduct'), (req, res, next) => {
    DB.data.query('DELETE FROM product WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    })
});

router.get('/index/:id', (req, res, next) => {
    if (req.params.id === 'allback') {
        DB.data.query("SELECT product.id AS id, product.nom AS nom, product.prix AS prix, product.categorie AS categorie, product.sous_categorie AS sous_categorie, product.couleur AS couleur, product.couleur_type AS couleur_type, product.matiere AS matiere, product.forme AS forme, marque.nom AS marque, product.collection AS collection, product.numero AS numero, product.description AS description FROM product INNER JOIN marque ON marque.id = product.id_marque", [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    } else {
        DB.data.query("SELECT product.id AS id, product.nom AS nom, product.categorie AS categorie, product.sous_categorie AS sous_categorie, product.couleur AS couleur, product.couleur_type AS couleur_type, product.matiere AS matiere, product.forme AS forme, marque.nom AS marque, product.collection AS collection, product.numero AS numero, product.description AS description FROM product INNER JOIN marque ON marque.id = product.id_marque WHERE product.id = ?", [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    }
});

router.get('/accueil/random', (req, res, next) => {
    DB.data.query("SELECT product2.categorie AS categorie, image.url AS image FROM (SELECT id, categorie FROM product ORDER BY RAND()) product2 RIGHT JOIN image ON image.id_produit = product2.id GROUP BY categorie", (err, data) => {
        if (err) {
            return next(err);
        }
        return res.json(data);
    }) ;
});

router.get('/:id', (req, res, next) => {
    DB.data.query("SELECT product.nom AS nom, product.matiere AS matiere, product.couleur AS couleur, product.prix AS prix, product.numero AS numero, product.description AS description, marque.nom AS marque FROM product INNER JOIN marque ON marque.id = product.id_marque WHERE product.id = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/image/:id', (req, res, next) => {
    DB.data.query("SELECT url FROM image WHERE id_produit = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/collection/:id', (req, res, next) => {
    DB.data.query("SELECT product.collection AS collection, product.id AS id, product.nom AS nom, image.url AS image, product.prix AS prix FROM product LEFT JOIN image ON image.id_produit = product.id WHERE product.id_marque = ? AND product.collection IS NOT NULL", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            console.log(data);
            return res.json(data);
        }
    });
});

router.get('/request/:keywords', (req, res) => {            // /request/:keywords/?marque=brand1+brand2&couleur=color1+color2&matiere=material1+material2&prix=price1+price2&order=type

    let request = req.params.keywords.replace('&', ' ');
    let filter_word = null;
    if (req.query.marque !== undefined || req.query.couleur !== undefined || req.query.matiere !== undefined || req.query.prix !== undefined) {
        filter_word = {
            "marque": req.query.marque,
            "couleur": req.query.couleur,
            "matiere": req.query.matiere,
            "prix": req.query.prix
        };
    }

    let body = {                                        //On crée le body de la requête Elasticsearch.
        size: 50,                    //Nombre de produits retourné par la requête.
        from: 0,
        query: {
            bool: {
                must: [
                    {multi_match: {
                            query: request,
                            fields: ['nom', 'categorie', 'sous_categorie', 'couleur', 'couleur_type', 'matiere', 'forme', 'marque', 'collection', 'description'],
                            minimum_should_match: 1,
                            fuzziness: 0
                        }
                    },
                ],
            },
        },
        sort: ["_score"],
        explain: 'true'
    };

    if (request === "all") {
        body.query = {
            match_all: {}
        }
    }

    if (filter_word !== null) {
        let query = "%1";


        body.query.bool.must.push({
            bool: {
                must: []
            }
        });
        for (let prop in filter_word) {
            if (filter_word[prop] !== undefined) {
                query = query.replace("%1", "(%0) AND %1");
                let arrayTmp = filter_word[prop].split(' ');
                arrayTmp.forEach(item => {
                    query = query.replace("%0", prop.toString() + ":" + item.replace('_', ' ') + " OR %0");
                });
                query = query.replace(" OR %0", "");
            }
        }
        query = query.replace(" AND %1", "");

        body.query.bool.must[1].bool.must.push({"query_string" : {"query": query}});
    }

    if (req.query.order !== undefined) {
        const all_sorts = {
            "alphaC": {"nom": {"order": "asc"}},
            "alphaD": {"nom": {"order": "desc"}},
            "dateC": null,
            "dateD": null,
        };

        req.query.order.split(' ').forEach(item => {
            if (all_sorts[item] !== null) {
                body.sort.unshift(all_sorts[item])
            }
        });
    }

    Elastic.search('product', body)                                           //Promesse de recherche.
        .then(results => {
            if (request === 'all') {
                return res.json([results, ""]);
            }
            return res.json([results, Elastic.defFilter(results)]);
        })
        .catch(console.error);
});

router.get('/indices/indices', (req, res) => {
    //Permet d'affichager le debug d'Elasticsearch.
    Elastic.indices();
    res.end();
});

module.exports.router = router;
