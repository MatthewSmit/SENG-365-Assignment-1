"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const crowdfunder_1 = require("./crowdfunder");
const dataConnection_1 = require("./dataConnection");
const routes_1 = require("./routes");
function start() {
    const dataConnection = new dataConnection_1.DataConnection();
    dataConnection.testConnection(function () {
        const crowdFunder = new crowdfunder_1.CrowdFunder(dataConnection);
        const app = express();
        app.use(logger('dev'));
        app.use(bodyParser.json());
        routes_1.setup(app, crowdFunder);
        app.listen(80, function () {
            console.log("Application has started");
        });
    });
}
exports.start = start;
//# sourceMappingURL=app.js.map