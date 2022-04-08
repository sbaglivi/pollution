const mysql = require("mysql");
require('dotenv').config();
let dbSettings = {
    connectionLimit: 5,
    host: 'localhost',
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'pollution'
}
class DB {
    constructor() {
        this.pool = mysql.createPool(dbSettings);
    }
    async query(sqlString, params = []) {
        return new Promise((resolve, reject) => {
            this.pool.query(sqlString, params, (err, results) => {
                if (err) reject(err);
                resolve(results);
            })
        })
    }
}
let database = new DB();
module.exports = database;