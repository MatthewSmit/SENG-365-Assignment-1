"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const dataConnection_1 = require("./dataConnection");
const routes = require("./routes");
function start() {
    const dataConnection = new dataConnection_1.DataConnection();
    dataConnection.testConnection(function () {
        const app = express();
        app.use(logger('dev'));
        app.use(bodyParser.json());
        routes(app, dataConnection);
        app.listen(4941, function () {
            console.log("Application has started");
        });
    });
}
exports.start = start;
//# sourceMappingURL=app.js.map