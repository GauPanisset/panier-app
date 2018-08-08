const Express = require('express');
const BP = require('body-parser');
const serveStatic = require('serve-static');


const app = Express();

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

app.use(serveStatic(__dirname + "/dist"));

app.listen(3031, (err) => {

    if (err) {
        console.log(err);
    }
    else {
        console.log('app listening on port 3031');
    }
});
