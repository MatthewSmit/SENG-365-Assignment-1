import express = require('express');
import logger = require('morgan');
import bodyParser = require('body-parser');

import {Crowdfunder} from "./crowdfunder";
import {setup} from "./routes";

export function start() {
    const crowdfundder = new Crowdfunder();
    const app = express();
    app.use(logger('dev'));
    app.use(bodyParser.json());

    setup(app, crowdfundder);

    app.listen(80, function() {
        console.log("Application has started");
    });
}