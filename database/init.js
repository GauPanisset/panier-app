const mysql = require('mysql');

const url = process.env.CLEARDB_DATABASE_URL;
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

module.exports = data;
