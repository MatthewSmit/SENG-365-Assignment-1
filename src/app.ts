import express = require('express');
import logger = require('morgan');
import bodyParser = require('body-parser');

import {DataConnection} from "./dataConnection";
import routes = require("./routes");

export function start() {
    const dataConnection = new DataConnection();
    dataConnection.testConnection(function() {
        const app = express();
        app.use(logger('dev'));
        app.use(bodyParser.json());

        routes(app, dataConnection);

        app.listen(4941, function() {
            console.log("Application has started");
        });
    });
}