const Express = require('express');
const router = Express.Router();
const DB = require('../database/init.js');
const Elastic = require('../elasticsearch/init.js');
const Verif = require('../src/verifyToken.js');

router.options('*', (req, res, next) => {
    res.status(200).end();
});

router.post('/create', Verif.verifyToken('createArticle'), (req, res, next) => {
    DB.data.query('INSERT INTO article (auteur, lien, date, texte, accueil, titre, type, sous_titre, droit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.body.auteur, req.body.lien, req.body.date, req.body.texte, req.body.accueil, req.body.titre, req.body.type, req.body.sous_titre, req.userId], (err) => {
        if (err) {
            return next(err);
        }
        DB.data.query('SELECT id FROM article WHERE titre = ? AND sous_titre = ? AND auteur = ?', [req.body.titre, req.body.sous_titre, req.body.auteur], (err, data) => {
            if (err) {
                return next(err);
            }
            res.json(data);
        })
    })
});

router.patch('/:prop', Verif.verifyToken('patchArticle'), (req, res, next) => {
    DB.data.query('UPDATE article SET ' + req.params.prop + ' = ? WHERE id = ?', [req.body.value, req.body.id], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    });
});

router.delete('/:id', Verif.verifyToken('deleteArticle'), (req, res, next) => {
    DB.data.query('DELETE FROM article WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            return next(err);
        }
        res.status(200).end();
    })
});

router.get('/accueil/:type', (req, res, next) => {
    DB.data.query("SELECT article.id AS id, article.texte AS texte, image.url AS image, article.titre AS titre FROM article INNER JOIN image ON image.id_article = article.id WHERE image.main = 1 AND article.accueil = 1 AND article.type = ?", [req.params.type], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/index/:id', (req, res, next) => {
    if (req.params.id === 'allback') {
        DB.data.query("SELECT id, auteur, lien, date, texte, accueil,titre, type, sous_titre FROM article", (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    } else {
        DB.data.query("SELECT id, auteur, lien, date, texte, accueil,titre, type, sous_titre FROM article WHERE id = ?", [req.params.id], (err, data) => {
            if (err) {
                return next(err);
            } else {
                return res.json(data);
            }
        });
    }
});

router.get('/section/:type', (req, res, next) => {
    let sort_by = "ORDER BY ";
    if (req.query.order !== undefined) {

        const all_sorts = {
            "alphaC": "article.titre ASC",
            "alphaD": "article.titre DESC",
            "dateC": "article.date ASC",
            "dateD": "article.date DESC",
        };
        req.query.order.split(' ').forEach(item => {
            sort_by += all_sorts[item] + ",";
        });
        sort_by = sort_by.slice(0, -1);

    } else {
        sort_by += "''";
    }

    DB.data.query("SELECT article.id AS id, date_format(article.date, '%Y-%m-%d') AS date,  image.url AS image, article.titre AS name, article.texte AS text, article.sous_titre AS subtitle FROM article INNER JOIN image ON image.id_article = article.id WHERE image.main = 1 AND article.type = ? " + sort_by, [req.params.type], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/:id', (req, res, next) => {
    DB.data.query("SELECT article.id AS id, date_format(article.date, '%Y-%m-%d') AS date, article.texte AS texte, article.titre AS titre, article.sous_titre AS sous_titre, GROUP_CONCAT(tag.label) AS tags FROM article LEFT JOIN lien_tag_article ON lien_tag_article.id_article = article.id LEFT JOIN tag ON tag.id = lien_tag_article.id_tag GROUP BY article.id HAVING article.id = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/image/:id', (req, res, next) => {
    DB.data.query("SELECT url FROM image WHERE id_article = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/request/:keywords', (req, res) => {


    let request = req.params.keywords.replace('&', ' ');
    let filter_word = null;

    let body = {                                        //On crée le body de la requête Elasticsearch.
        size: 50,                    //Nombre de produits retourné par la requête.
        from: 0,
        query: {
            bool: {
                must: [
                    {multi_match: {
                            query: request,
                            fields: ['texte', 'titre', 'sous_titre', 'type', 'tags'],
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
            "alphaC": {"titre": {"order": "asc"}},
            "alphaD": {"titre": {"order": "desc"}},
            "dateC": { "date" : {"order" : "asc"}},
            "dateD": { "date" : {"order" : "desc"}},
        };

        req.query.order.split(' ').forEach(item => {
            if (all_sorts[item] !== null) {
                body.sort.unshift(all_sorts[item])
            }
        });
    }
    Elastic.search('article', body)                                           //Promesse de recherche.
        .then(results => {
            if (request === 'all') {
                return res.json([results, ""]);
            }
            return res.json([results, ""]);
        })
        .catch(console.error);
});

module.exports.router = router;
