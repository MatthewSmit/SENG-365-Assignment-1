"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql");
const config = require("./config");
class DataConnection {
    constructor() {
        this.pool = mysql.createPool(config.mysql);
    }
    testConnection(callback) {
        let connection = mysql.createConnection(config.mysql);
        connection.connect((err) => {
            if (err) {
                console.log(err);
                console.log("Unable to connect to mysql, trying again");
                setTimeout(() => {
                    this.testConnection(callback);
                }, 1000);
            }
        });
        connection.query("select * from Users;", (err, rows, fields) => {
            if (err) {
                // TODO: Load mock data
                console.log(err);
                console.log("Unable to query mysql table, trying again");
                this.testConnection(callback);
            }
            else {
                console.log("Connected to mysql");
                callback();
            }
        });
        connection.end();
    }
    query(sql, values, callback) {
        this.pool.getConnection((err, connection) => {
            if (err) {
                console.log("Error with sql query " + sql);
                console.log(err);
                connection.release();
                callback(err, null, null);
            }
            else {
                let query = connection.query(sql, values, (err, rows, fields) => {
                    connection.release();
                    if (err) {
                        console.log("Error with sql query " + sql);
                        console.log(err);
                        callback(err, null, null);
                    }
                    else {
                        callback(err, rows, fields);
                    }
                });
                console.log(query.sql);
            }
        });
    }
}
exports.DataConnection = DataConnection;
//# sourceMappingURL=dataConnection.js.map