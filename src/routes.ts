import {Express} from "express";

import projects = require("./routes/projects");
import users = require("./routes/users");
import {DataConnection} from "./dataConnection";

export = (app: Express, dataConnection: DataConnection) => {
    app.use("/api/v1", projects(dataConnection));
    app.use("/api/v1", users(dataConnection));
};