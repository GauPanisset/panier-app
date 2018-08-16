const Express = require('express');
const router = Express.Router();
const DB = require('../database/init.js');
const Elastic = require('../elasticsearch/init.js');


router.get('/accueil/:type', (req, res, next) => {
    DB.query("SELECT article.id AS id, article.texte AS texte, image.url AS image, article.titre AS titre FROM article INNER JOIN image ON image.id_article = article.id WHERE image.main = 1 AND article.accueil = 1 AND article.type = ?", [req.params.type], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
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

    DB.query("SELECT article.id AS id, date_format(article.date, '%Y-%m-%d') AS date,  image.url AS image, article.titre AS name, article.texte AS text, article.sous_titre AS subtitle FROM article INNER JOIN image ON image.id_article = article.id WHERE image.main = 1 AND article.type = ? " + sort_by, [req.params.type], (err, data) => {
        if (err) {
            return next(err);
        } else {
            return res.json(data);
        }
    });
});

router.get('/:id', (req, res, next) => {
    DB.query("SELECT article.id AS id, date_format(article.date, '%Y-%m-%d') AS date, article.texte AS texte, article.titre AS titre, article.sous_titre AS sous_titre, GROUP_CONCAT(tag.label) AS tags FROM article LEFT JOIN lien_tag_article ON lien_tag_article.id_article = article.id LEFT JOIN tag ON tag.id = lien_tag_article.id_tag GROUP BY article.id HAVING article.id = ?", [req.params.id], (err, data) => {
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

    console.log(body);
    console.log(body.sort);
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
