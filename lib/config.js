"use strict";
const config = {
    mysql: {
        connectionLimit: 100,
        host: process.env.SENG365_MYSQL_HOST || 'localhost',
        port: Number(process.env.SENG365_MYSQL_PORT) || 3306,
        user: 'root',
        password: 'secret',
        database: 'crowdfunder',
        multipleStatements: true
    }
};
module.exports = config;
//# sourceMappingURL=config.js.map