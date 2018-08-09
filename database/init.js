const mysql = require('mysql');

const url = process.env.DATABASE_URL;
//const url = "mysql://bba43b57d25079:712ed0dc@us-cdbr-iron-east-01.cleardb.net/heroku_526969b9ba26bf4?reconnect=true";
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

let data;

function handleDisconnect() {
    data = mysql.createConnection(config);


    data.connect(function(err) {
        if(err) {
            console.log('error when connecting to db:', err);
            handleDisconnect();
        } else {
            console.log('connected');
        }
    });

    data.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
            err.fatal = false;
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

module.exports = data;
