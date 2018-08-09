const Express = require('express');
const BP = require('body-parser');
const HTTP = require('http');

const app = Express();

const PORT = process.env.PORT || 3031;

app.use(BP.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/product', require('./routes/product.js').router);
app.use('/article', require('./routes/article.js').router);
app.use('/brand', require('./routes/brand.js').router);
app.use('/shop', require('./routes/shop.js').router);
app.use('/filter', require('./routes/filter.js').router);

setInterval(function() {
    HTTP.get("http://panier-app.herokuapp.com");
}, 300000);

app.listen(PORT, (err) => {

    if (err) {
        console.log(err);
    }
    else {
        console.log('app listening on port' + PORT);
    }
});
