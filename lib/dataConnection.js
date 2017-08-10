"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const config = require("./config");
const mysql = require("./mysql-promise");
class DataConnection {
    constructor() {
        this.pool = mysql.createPool(config.mysql);
    }
    testConnection(callback) {
        let connection;
        mysql.createConnection(config.mysql)
            .then(newConnection => {
            connection = newConnection;
            return connection.query("select * from Users");
        })
            .then(() => {
            connection.end();
            console.log("Connected to mysql");
            callback();
        })
            .catch((error) => {
            console.log(error);
            console.log("Unable to connect to mysql");
            if (error.code == "ER_BAD_DB_ERROR") {
                this.createDatabase(callback);
            }
            else if (error.code == "ER_NO_SUCH_TABLE") {
                this.createTables(callback);
            }
            else {
                setTimeout(() => {
                    this.testConnection(callback);
                }, 1000);
            }
        });
    }
    query(sql, values) {
        let connection;
        return this.pool.getConnection()
            .then(newConnection => {
            connection = newConnection;
            return connection.query(sql, values);
        })
            .then(rows => {
            connection.release();
            return rows;
        })
            .catch(error => {
            if (connection !== null) {
                connection.release();
            }
            console.log("Error with sql query " + sql);
            console.log(error);
            throw error;
        });
    }
    createDatabase(callback) {
        console.log("Creating " + config.mysql.database + " database");
        const mysqlConfig = JSON.parse(JSON.stringify(config.mysql));
        delete mysqlConfig.database;
        let connection;
        mysql.createConnection(mysqlConfig)
            .then((newConnection) => {
            connection = newConnection;
            return connection.query("CREATE DATABASE " + config.mysql.database);
        })
            .then(() => {
            connection.end();
            this.createTables(callback);
        })
            .catch((error) => {
            console.log(error);
            console.log("Unable to connect to mysql");
            setTimeout(() => {
                this.testConnection(callback);
            }, 1000);
        });
    }
    createTables(callback) {
        console.log("Populating tables with mock data");
        let query = '';
        const directory = __dirname + '/../mocks/';
        fs_1.readdirSync(directory).forEach(file => {
            let fullFile = directory + file;
            const stat = fs_1.statSync(fullFile);
            if (stat.isFile() && file.match(/\.sql$/i)) {
                query += fs_1.readFileSync(fullFile, 'utf8');
            }
        });
        let connection;
        mysql.createConnection(config.mysql)
            .then(newConnection => {
            connection = newConnection;
            return connection.query(query);
        })
            .then(() => {
            connection.end();
            console.log("Connected to mysql");
            callback();
        })
            .catch(error => {
            console.log(error);
            console.log("Unable to connect to mysql");
            setTimeout(() => {
                this.testConnection(callback);
            }, 1000);
        });
    }
}
exports.DataConnection = DataConnection;
//# sourceMappingURL=dataConnection.js.map