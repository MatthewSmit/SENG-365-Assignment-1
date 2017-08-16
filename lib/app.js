"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const dataConnection_1 = require("./dataConnection");
const routes = require("./routes");
const helper = require("./helper");
function start() {
    const app = express();
    helper(app);
    app.listen(4941, () => {
        console.log("Server starting to listen");
        const dataConnection = new dataConnection_1.DataConnection();
        dataConnection.testConnection(() => {
            app.use(logger("dev"));
            app.use(bodyParser.json());
            routes(app, dataConnection);
            console.log("Routes finished setting up");
        });
    });
}
exports.start = start;
//# sourceMappingURL=app.js.map