"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql");
class PromiseConnection {
    constructor(connection) {
        this.connection = connection;
    }
    connect() {
        return new Promise((resolve, reject) => {
            this.connection.connect(error => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(this);
                }
            });
        });
    }
    query(sql, values) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, values, (error, rows) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    end() {
        this.connection.end();
    }
    release() {
        this.connection.release();
    }
}
exports.PromiseConnection = PromiseConnection;
class PromisePool {
    constructor(pool) {
        this.pool = pool;
    }
    getConnection() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((error, connection) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(new PromiseConnection(connection));
                }
            });
        });
    }
}
exports.PromisePool = PromisePool;
function createPool(config) {
    return new PromisePool(mysql.createPool(config));
}
exports.createPool = createPool;
function createConnection(config) {
    return new PromiseConnection(mysql.createConnection(config)).connect();
}
exports.createConnection = createConnection;
//# sourceMappingURL=mysql-promise.js.map