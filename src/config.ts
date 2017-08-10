import {IPoolConfig} from "mysql";

interface IConfig {
    mysql: IPoolConfig;
    tokenSecret: string;
}

const config: IConfig = {
    mysql: {
        connectionLimit: 100,
        host: process.env.SENG365_MYSQL_HOST || "localhost",
        port: Number(process.env.SENG365_MYSQL_PORT) || 3306,
        user: "root",
        password: "secret",
        database: "crowdfunder",
        multipleStatements: true
    },
    tokenSecret: "LhC1lSHg7aX1JqvoqlxJm8qJlxg5QUnz"
};

export = config;