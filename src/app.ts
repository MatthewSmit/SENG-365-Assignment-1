import express = require("express");
import logger = require("morgan");
import bodyParser = require("body-parser");

import {DataConnection} from "./dataConnection";
import routes = require("./routes");

export function start(): void {
    const dataConnection: DataConnection = new DataConnection();
    dataConnection.testConnection(() => {
        const app: express.Express = express();
        app.use(logger("dev"));
        app.use(bodyParser.json());

        routes(app, dataConnection);

        app.listen(4941, () => {
            console.log("Application has started");
        });
    });
}