import {readdirSync, readFileSync, Stats, statSync} from "fs";

import config = require("./config");
import mysql = require("./mysql-promise");

export class DataConnection {
    private pool: mysql.PromisePool;

    public constructor() {
        this.pool = mysql.createPool(config.mysql);
    }

    public testConnection(callback: () => void): void {
        let connection: mysql.PromiseConnection;

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
            .catch((error: mysql.IError) => {
                console.log(error);
                console.log("Unable to connect to mysql");

                if (error.code === "ER_BAD_DB_ERROR") {
                    this.createDatabase(callback);
                } else if (error.code === "ER_NO_SUCH_TABLE") {
                    this.createTables(callback);
                } else {
                    setTimeout(() => {
                        this.testConnection(callback);
                    }, 1000);
                }
            });
    }

    public query(sql: string, values?: any[]): Promise<any> {
        let connection: mysql.PromiseConnection;

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

    private createDatabase(callback: () => void): void {
        console.log("Creating " + config.mysql.database + " database");
        const mysqlConfig: mysql.IPoolConfig = JSON.parse(JSON.stringify(config.mysql));
        delete mysqlConfig.database;

        let connection: mysql.PromiseConnection;

        mysql.createConnection(mysqlConfig)
            .then((newConnection: mysql.PromiseConnection) => {
                connection = newConnection;
                return connection.query("CREATE DATABASE " + config.mysql.database);
            })
            .then(() => {
                connection.end();
                this.createTables(callback);
            })
            .catch((error: mysql.IError) => {
                console.log(error);
                console.log("Unable to connect to mysql");

                setTimeout(() => {
                    this.testConnection(callback);
                }, 1000);
            });
    }

    private createTables(callback: () => void): void {
        console.log("Populating tables with mock data");

        let query: string = "";

        const directory: string = __dirname + "/../mocks/";
        readdirSync(directory).forEach(file => {
            let fullFile: string = directory + file;
            const stat: Stats = statSync(fullFile);

            if (stat.isFile() && file.match(/\.sql$/i)) {
                query += readFileSync(fullFile, "utf8");
            }
        });

        let connection: mysql.PromiseConnection;

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