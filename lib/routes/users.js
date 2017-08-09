"use strict";
const express_1 = require("express");
const util_1 = require("util");
const interfaces_1 = require("../controllers/interfaces");
const users = require("../controllers/users");
const routeHelper_1 = require("./routeHelper");
module.exports = function (dataConnection) {
    users.setup(dataConnection);
    const router = express_1.Router();
    router.route('/users')
        .post((request, response) => {
        const user = request.body;
        if (!interfaces_1.verifyUser(user)) {
            routeHelper_1.sendResponse(response, 400, null);
        }
        else {
            users.createUser(user, (result) => {
                routeHelper_1.sendResponse(response, result.httpCode, result.response);
            });
        }
    });
    router.route('/users/login')
        .post((request, response) => {
        const valid = 'username' in request.query && util_1.isString(request.query.username) &&
            'password' in request.query && util_1.isString(request.query.password);
        if (!valid) {
            routeHelper_1.sendResponse(response, 400, null);
        }
        else {
            users.login(request.query.username, request.query.password, (result) => {
                routeHelper_1.sendResponse(response, result.httpCode, result.response);
            });
        }
    });
    router.route('/users/logout')
        .post((request, response) => {
        const token = routeHelper_1.getToken(request);
        if (token === null) {
            routeHelper_1.sendResponse(response, 401, null);
        }
        else {
            users.logout(token, (result) => {
                routeHelper_1.sendResponse(response, result, null);
            });
        }
    });
    router.route('/users/login_status')
        .get((request, response) => {
        const token = routeHelper_1.getToken(request);
        if (token === null) {
            routeHelper_1.sendResponse(response, 200, false);
        }
        else {
            users.getLoginStatus(token, (result) => {
                routeHelper_1.sendResponse(response, result.httpCode, result.response);
            });
        }
    });
    router.route('/users/:id')
        .get((request, response) => {
        const id = routeHelper_1.getId(request);
        if (id === null) {
            routeHelper_1.sendResponse(response, 404, null);
        }
        else {
            users.getUser(id, (result) => {
                routeHelper_1.sendResponse(response, result.httpCode, result.response);
            });
        }
    })
        .put((request, response) => {
        const id = routeHelper_1.getId(request);
        const user = request.body;
        if (id === null) {
            routeHelper_1.sendResponse(response, 404, null);
        }
        else if (!interfaces_1.verifyUser(user)) {
            routeHelper_1.sendResponse(response, 400, null);
        }
        else {
            users.updateUser(id, user, (result) => {
                routeHelper_1.sendResponse(response, result, null);
            });
        }
    })
        .delete((request, response) => {
        const id = routeHelper_1.getId(request);
        if (id === null) {
            routeHelper_1.sendResponse(response, 404, null);
        }
        else {
            users.deleteUser(id, (result) => {
                routeHelper_1.sendResponse(response, result, null);
            });
        }
    });
    return router;
};
//# sourceMappingURL=users.js.map