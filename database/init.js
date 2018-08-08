const mysql = require('mysql');

const data = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "myDatabase",
    socketPath: "/Applications/MAMP/tmp/mysql/mysql.sock"
});

data.connect((err) => {
    if (err) {
        throw err;
    }
});

module.exports = data;
