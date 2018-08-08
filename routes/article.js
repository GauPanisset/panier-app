const Express = require('express');
const router = Express.Router();
const DB = require('../database/init.js');
const Elastic = require('../elasticsearch/init.js');

router.get('/accueil/reportage', (req, res, next) => {
    DB.query("SELECT article.id AS id, article.texte AS texte, image.url AS image, article.titre AS titre FROM article INNER JOIN image ON image.id_article = article.id WHERE image.main = 1 AND article.accueil = 1 AND article.type = 'reportage'", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/section/reportage', (req, res, next) => {
    DB.query("SELECT article.id AS id, image.url AS image, article.titre AS name, article.texte AS text, article.sous_titre AS subtitle FROM article INNER JOIN image ON image.id_article = article.id WHERE image.main = 1 AND article.type = 'reportage'", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/accueil/news', (req, res, next) => {
    DB.query("SELECT article.id AS id, article.texte AS texte, image.url AS image, article.titre AS titre FROM article INNER JOIN image ON image.id_article = article.id WHERE image.main = 1 AND article.accueil = 1 AND article.type = 'news'", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/section/news', (req, res, next) => {
    DB.query("SELECT article.id AS id, image.url AS image, article.titre AS name, article.texte AS text, article.sous_titre AS subtitle FROM article INNER JOIN image ON image.id_article = article.id WHERE image.main = 1 AND article.type = 'news'", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/accueil/dossier', (req, res, next) => {
    DB.query("SELECT article.id AS id, article.texte AS texte, image.url AS image, article.titre AS titre FROM article INNER JOIN image ON image.id_article = article.id WHERE image.main = 1 AND article.accueil = 1 AND article.type = 'dossier'", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/section/dossier', (req, res, next) => {
    DB.query("SELECT article.id AS id, image.url AS image, article.titre AS name, article.texte AS text, article.sous_titre AS subtitle FROM article INNER JOIN image ON image.id_article = article.id WHERE image.main = 1 AND article.type = 'dossier'", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/accueil/maison', (req, res, next) => {
    DB.query("SELECT article.id AS id, article.texte AS texte, image.url AS image, article.titre AS titre FROM article INNER JOIN image ON image.id_article = article.id WHERE image.main = 1 AND article.accueil = 1 AND article.type = 'maison'", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/section/maison', (req, res, next) => {
    DB.query("SELECT article.id AS id, image.url AS image, article.titre AS name, article.texte AS text, article.sous_titre AS subtitle FROM article INNER JOIN image ON image.id_article = article.id WHERE image.main = 1 AND article.type = 'maison'", (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/:id', (req, res, next) => {
    DB.query("SELECT article.id AS id, article.date AS date, article.texte AS texte, article.titre AS titre, article.sous_titre AS sous_titre, GROUP_CONCAT(tag.label) AS tags FROM article LEFT JOIN lien_tag_article ON lien_tag_article.id_article = article.id LEFT JOIN tag ON tag.id = lien_tag_article.id_tag GROUP BY article.id HAVING article.id = ?", [req.params.id], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/image/:id', (req, res, next) => {
    DB.query("SELECT url FROM image WHERE id_article = ?", [req.params.id], (err, data) => {
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

    let sort_by = null;
    if (req.query.order !== undefined) {
        const all_sorts = {
            "alphaC": {"titre": {"order": "asc"}},
            "alphaD": {"titre": {"order": "desc"}},
            "dateC": { "date" : {"order" : "asc"}},
            "dateD": { "date" : {"order" : "desc"}},
        };
        sort_by = all_sorts[req.query.order];
    }


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

    if (sort_by !== null) {

        body.sort.unshift(sort_by);
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
