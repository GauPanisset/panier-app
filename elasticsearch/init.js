const elasticsearch = require('elasticsearch');
const DB = require('../database/init.js');
const axios = require('axios');

const url = process.env.BONSAI_URL;
//const url = "https://utiw9mrv2v:fsqhmxjl59@cherry-8098743.us-east-1.bonsaisearch.net";

let config;

if (url !== undefined) {
    config = {
        host: url,
        log: 'error'
    };
    console.log(config);
} else {
    config = {
        //Initialise le client Elasticsearch.
        host: 'localhost:9200',
        log: 'error'
    };
}

const esClient = new elasticsearch.Client(config);

esClient.ping({
    requestTimeout: 30000,
}, function (error) {
    if (error) {
        console.error('elasticsearch cluster is down!');
    } else {
        console.log('All is well');
    }
});

function indexDoc(index, type, data) {
    data.forEach(item => {
        esClient.index({
            index: index,
            type: type,
            id: item.id,
            body: item
        })
    }, function(err, resp, status) {
        //console.log(resp);
    });
}

function createIndex(index, mapping) {
    esClient.indices.create({
        index: index,
        body: {
            settings: {
                "index" : {
                    "number_of_shards" : 1
                }
            },
            mappings: mapping
        }
    }, function (err, resp, status) {
        //console.log(err, resp, status);
    });
}

function putMapping(index, type, body) {
    console.log(index);
    esClient.indices.putMapping({
        index: index,
        type : type,
        body: body

    }, function (err, resp, status) {
        console.log("Coucou " + index);
        console.log(err, resp, status);
    });
}

function bulkIndex(index, type, data) {
    //Fonction d'indexation.
    let bulkBody = [];

    data.forEach(item => {
        bulkBody.push({
            index: {
                _index: index,
                _type: type,
                _id: item.id,
            },
        });

        bulkBody.push(item);
    });

    esClient.bulk({body: bulkBody})
        .then(response => {
            let errorCount = 0;
            response.items.forEach(item => {
                if (item.index && item.index.error) {
                    console.log(++errorCount, item.index.error);
                }
            });
            console.log(
                `Successfully indexed ${data.length - errorCount}
       out of ${data.length} items.`
            );
            /*esClient.indices.putMapping({
                index: index,
                type: type,
                body: mapping
            }, function(err,resp){
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(resp);
                }
            });*/
        })
        .catch(console.err);

}

function search(index, body) {
    //Fonction de recherche. Voir ../routes/product.js
    return esClient.search({index: index, body: body});
}

function indices(){
    //Fonction de debug. Voir ../routes/product.js
    esClient.cat.indices({v: true}).then(console.log).catch(console.err);
}

function defFilter(data) {
    let res = [
        {
            name: "marque",
            content: [],
            title: "Marque",
            selected: []
        },
        {
            name: "couleur",
            content: [],
            title: "Couleur",
            selected: []
        },
        {
            name: "matiere",
            content: [],
            title: "Matiere",
            selected: []
        },
        {
            name: "prix",
            content: [],
            title: "Prix",
            selected: []
        },
    ];
    let tmp = [
        {},
        {},
        {},
        {}
    ];
    data.hits.hits.forEach((item) => {
        if (tmp[0].hasOwnProperty(item._source.marque)) {
            tmp[0][item._source.marque] += 1;
        } else {
            tmp[0][item._source.marque] = 1;
        }
        if (tmp[1].hasOwnProperty(item._source.couleur)) {
            tmp[1][item._source.couleur] += 1;
        } else {
            tmp[1][item._source.couleur] = 1;
        }
        if (tmp[2].hasOwnProperty(item._source.matiere)) {
            tmp[2][item._source.matiere] += 1;
        } else {
            tmp[2][item._source.matiere] = 1;
        }
        if (tmp[3].hasOwnProperty(item._source.prix)) {
            tmp[3][item._source.prix] += 1;
        } else {
            tmp[3][item._source.prix] = 1;
        }
    });
    let count = 0;
    for (let i = 0; i < tmp.length; i++) {
        for (let prop in tmp[i]) {
            if (tmp[i][prop]/ data.hits.total > 0.02) {
                let value = prop.replace(' ', '_');
                res[i].content.push({id: count, text: prop, value: value});
                count ++;
            }
        }
    }
    if (count === 0) {
        return [];
    }
    return res;

}

let productPromise = new Promise((resolve, reject) => {
    //Promesse permettant de récupérer tous les produits de la base de données.
    DB.query("SELECT product.id AS id, product.nom AS nom, product.prix AS prix, product.categorie AS categorie, product.sous_categorie AS sous_categorie, product.couleur AS couleur, product.couleur_type AS couleur_type, product.matiere AS matiere, product.forme AS forme, marque.nom AS marque, product.collection AS collection, product.numero AS numero, product.description AS description FROM product INNER JOIN marque ON marque.id = product.id_marque", (err, data) => {
        if (err) {
            reject(err);
        }
        resolve(JSON.parse(JSON.stringify(data)))
    });
});

productPromise.then((data) => {
    esClient.cat.indices().then((val) => {
        if(val === undefined){
            let mapping = {
                product: {
                    properties: {
                        "nom": {
                            "type": "keyword",
                            "copy_to": "all_prop"
                        },
                        "categorie": {
                            "type": "text",
                            "copy_to": "all_prop"
                        },
                        "sous_categorie": {
                            "type": "text",
                            "copy_to": "all_prop"
                        },
                        "couleur": {
                            "type": "text",
                            "copy_to": "all_prop"
                        },
                        "couleur_type": {
                            "type": "text",
                            "copy_to": "all_prop"
                        },
                        "forme": {
                            "type": "text",
                            "copy_to": "all_prop"
                        },
                        "marque": {
                            "type": "keyword",
                            "copy_to": "all_prop"
                        },
                        "description": {
                            "type": "text",
                            "copy_to": "all_prop"
                        },
                        "matiere": {
                            "type": "keyword",
                            "copy_to": "all_prop"
                        },
                    }
                }
            };
            createIndex('product', mapping);
            //indexDoc('product', 'product', data);
        }
    }).catch(console.err);
}).catch(console.err);

let articlePromise = new Promise((resolve, reject) => {
    DB.query("SELECT article.id AS id, article.date AS date, article.type AS type, article.texte AS texte, article.titre AS titre, article.sous_titre AS sous_titre, GROUP_CONCAT(tag.label) AS tags FROM article LEFT JOIN lien_tag_article ON lien_tag_article.id_article = article.id LEFT JOIN tag ON tag.id = lien_tag_article.id_tag GROUP BY article.id", (err, data) => {
        if (err) {
            reject(err);
        }
        resolve(data)
    });
});

articlePromise.then((data) => {
    data.forEach(item => {
        if (item.tags != null) {
            item.tags = item.tags.replace(',', ' ');
        }
    });
    esClient.cat.indices().then((val) => {
        if(val === undefined){
            let mapping = {article: {
                    properties: {
                        "texte": {
                            "type": "text",
                            "copy_to": "all_prop"
                        },
                        "titre": {
                            "type": "keyword",
                            "copy_to": "all_prop"
                        },
                        "sous-titre": {
                            "type": "text",
                            "copy_to": "all_prop"
                        },
                        "tags": {
                            "type": "text",
                            "copy_to": "all_prop"
                        },
                        "date": {
                            "type": "date",
                        }
                    }
                }
            };
            //createIndex('article', mapping);
            indexDoc('article', 'article', data);
        }
    }).catch(console.err);
}).catch(console.err);


module.exports.search = search;
module.exports.indices = indices;
module.exports.defFilter = defFilter;

