const mysql = require('mysql');
const Fs = require('fs');
const Path = require('path');

const url = process.env.CLEARDB_DATABASE_URL; //"mysql://bba43b57d25079:712ed0dc@us-cdbr-iron-east-01.cleardb.net/heroku_526969b9ba26bf4?reconnect=true";
                                                //mysql://user:password@host/database
let config;

if (url !== undefined) {
    config = {
        user: url.substring(url.indexOf("/") + 2, url.indexOf(":", url.indexOf("/"))),
        password: url.substring(url.indexOf(":", url.indexOf("/")) + 1, url.indexOf("@")),
        host: url.substring(url.indexOf("@") + 1, url.indexOf("/", url.indexOf("@"))),
        database: url.substring(url.indexOf("/", url.indexOf("@")) + 1, url.indexOf("?"))
    };
    console.log(config);
} else {
    config = {
        host: "localhost",
        user: "root",
        password: "root",
        database: "myDatabase",
        socketPath: "/Applications/MAMP/tmp/mysql/mysql.sock"
    }
}

const data = mysql.createConnection(config);



data.connect((err) => {
    if (err) {
        throw err;
    }
});

if (url !== undefined) {

    const init = Fs.readFileSync(Path.join(process.cwd(), './database/init.sql'), 'utf-8');

    data.query(init);
}

module.exports = data;
