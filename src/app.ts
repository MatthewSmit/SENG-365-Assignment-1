import express = require('express');
import logger = require('morgan');
import bodyParser = require('body-parser');

import {CrowdFunder} from "./crowdfunder";
import {DataConnection} from "./dataConnection";
import {setup} from "./routes";

export function start() {
    const dataConnection = new DataConnection();
    dataConnection.testConnection(function() {
        const crowdFunder = new CrowdFunder(dataConnection);
        const app = express();
        app.use(logger('dev'));
        app.use(bodyParser.json());

        setup(app, crowdFunder);

        app.listen(80, function() {
            console.log("Application has started");
        });
    });
}