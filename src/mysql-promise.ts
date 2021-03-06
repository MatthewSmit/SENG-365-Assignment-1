import mysql = require("mysql");

import {IConnection, IConnectionConfig, IError, IPool, IPoolConfig} from "mysql";

export {IError, IFieldInfo, IPool, IPoolConfig} from "mysql";

export class PromiseConnection {
    private connection: IConnection;

    public constructor(connection: IConnection) {
        this.connection = connection;
    }

    public connect(): Promise<PromiseConnection> {
        return new Promise((resolve, reject) => {
            this.connection.connect(error => {
                if (error) {
                    reject(error);
                } else {
                    resolve(this);
                }
            });
        });
    }

    public query(sql: string, values?: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, values, (error, rows) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public end(): void {
    this.connection.end();
}

    public release(): void {
        this.connection.release();
    }
}

export class PromisePool {
    private pool: mysql.IPool;

    public constructor(pool: IPool) {
        this.pool = pool;
    }

    public getConnection(): Promise<PromiseConnection> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((error, connection) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(new PromiseConnection(connection));
                }
            });
        });
    }
}

export function createPool(config: IPoolConfig): PromisePool {
    return new PromisePool(mysql.createPool(config));
}

export function createConnection(config: IConnectionConfig): Promise<PromiseConnection> {
    return new PromiseConnection(mysql.createConnection(config)).connect();
}