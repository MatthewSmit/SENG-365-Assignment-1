import mysql = require('mysql');

import config = require('./config');

export class DataConnection {
    private pool: mysql.IPool;

    public constructor() {
        this.pool = mysql.createPool(config.mysql);
    }

    public testConnection(callback: () => void) {
        let connection = mysql.createConnection(config.mysql);
        connection.connect((err) => {
            if (err)
            {
                console.log(err);
                console.log("Unable to connect to mysql, trying again");

                setTimeout(() => {
                    this.testConnection(callback);
                },1000);
            }
        });
        connection.query("select * from Users;", (err, rows, fields) => {
            if (err)
            {
                // TODO: Load mock data
                console.log(err);
                console.log("Unable to query mysql table, trying again");

                this.testConnection(callback);
            }
            else
            {
                console.log("Connected to mysql");
                callback();
            }
        });
        connection.end();
    }

    public query(sql: string, values: any[], callback: (err : mysql.IError, rows?: any, fields?: mysql.IFieldInfo[]) => void) {
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