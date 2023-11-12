const mysql = require('mysql2');

require('dotenv').config();

const snPool = mysql.createPool({
    host: '10.147.19.172',
    port: '3306',
    user: 'GSA',
    password: '9379992a',
    database: 'sn'
});

const taPool = mysql.createPool({
    host: '10.147.19.172',
    port: '3306',
    user: 'GSA',
    password: '9379992a',
    database: 'ta'
});

const wo3Pool = mysql.createPool({
    host: '10.147.19.172',
    port: '3306',
    user: 'GSA',
    password: '9379992a',
    database: 'wo3'
});

module.exports = { snPool, taPool, wo3Pool };