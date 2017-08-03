"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const crowdfunder_1 = require("./crowdfunder");
const routes_1 = require("./routes");
function start() {
    const crowdfundder = new crowdfunder_1.Crowdfunder();
    const app = express();
    app.use(logger('dev'));
    app.use(bodyParser.json());
    routes_1.setup(app, crowdfundder);
    app.listen(80, function () {
        console.log("Application has started");
    });
}
exports.start = start;
//# sourceMappingURL=app.js.map