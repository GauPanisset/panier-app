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
    data = mysql.createConnection(config); // Recreate the connection, since
                                                    // the old one cannot be reused.

    data.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                            // If you're also serving http, display a 503 error.
    data.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

handleDisconnect();

module.exports = data;
