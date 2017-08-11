"use strict";
const projects = require("./routes/projects");
const users = require("./routes/users");
module.exports = (app, dataConnection) => {
    app.use("/api/v1", projects(dataConnection));
    app.use("/api/v1", users(dataConnection));
};
//# sourceMappingURL=routes.js.map