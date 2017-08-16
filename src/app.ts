import express = require("express");
import logger = require("morgan");
import bodyParser = require("body-parser");

import {DataConnection} from "./dataConnection";
import routes = require("./routes");
import helper = require("./helper");

export function start(): void {
    const app: express.Express = express();
    helper(app);

    app.listen(4941, () => {
        console.log("Server starting to listen");

        const dataConnection: DataConnection = new DataConnection();
        dataConnection.testConnection(() => {
            app.use(logger("dev"));
            app.use(bodyParser.json());

            routes(app, dataConnection);
            console.log("Routes finished setting up");
        });
    });
}