import {Router} from "express";
import {isString} from "util";

import {IUser, verifyUser} from "../controllers/interfaces";
import users = require("../controllers/users");
import {DataConnection} from "../dataConnection";
import {getId, getToken, sendResponse} from "./routeHelper";
import {ITokenData} from "../token";

export = function(dataConnection: DataConnection): Router {
    users.setup(dataConnection);

    const router: Router = Router();

    router.route("/users")
        .post((request, response) => {
            const user: IUser = request.body;
            if (!verifyUser(user)) {
                sendResponse(response, 400, null);
            } else {
                users.createUser(user, (result) => {
                    sendResponse(response, result.httpCode, result.response);
                });
            }
        });

    router.route("/users/login")
        .post((request, response) => {
            const valid: boolean = "username" in request.query && isString(request.query.username) &&
                "password" in request.query && isString(request.query.password);

            if (!valid) {
                sendResponse(response, 400, null);
            } else {
                users.login(request.query.username, request.query.password, (result) => {
                    sendResponse(response, result.httpCode, result.response);
                });
            }
        });

    router.route("/users/logout")
        .post((request, response) => {
            const token: ITokenData = getToken(request);
            if (token === null) {
                sendResponse(response, 401, null);
            } else {
                users.logout(token, (result) => {
                    sendResponse(response, result, null);
                });
            }
        });

    router.route("/users/login_status")
        .get((request, response) => {
            const token: ITokenData = getToken(request);
            if (token === null) {
                sendResponse(response, 200, false);
            } else {
                users.getLoginStatus(token, (result) => {
                    sendResponse(response, result.httpCode, result.response);
                });
            }
        });

    router.route("/users/:id")
        .get((request, response) => {
            const id: number = getId(request);
            if (id === null) {
                sendResponse(response, 404, null);
            } else {
                users.getUser(id, (result) => {
                    sendResponse(response, result.httpCode, result.response);
                });
            }
        })
        .put((request, response) => {
            const id: number = getId(request);
            const user: IUser = request.body;
            if (id === null) {
                sendResponse(response, 404, null);
            } else if (!verifyUser(user)) {
                sendResponse(response, 400, null);
            } else {
                users.updateUser(id, user, (result) => {
                    sendResponse(response, result, null);
                });
            }
        })
        .delete((request, response) => {
            const id: number = getId(request);
            if (id === null) {
                sendResponse(response, 404, null);
            } else {
                users.deleteUser(id, (result) => {
                    sendResponse(response, result, null);
                });
            }
        });

    return router;
};