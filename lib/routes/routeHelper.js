"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const token_1 = require("../token");
function sendResponse(response, httpError, responseBody) {
    response.status(httpError);
    if (util_1.isNullOrUndefined(responseBody)) {
        if (httpError === 200) {
            response.json();
        }
        response.end();
    }
    else {
        response.json(responseBody);
        response.end();
    }
}
exports.sendResponse = sendResponse;
function getId(request) {
    const id = Number(request.params.id);
    if (util_1.isNullOrUndefined(request.params.id) || !Number.isInteger(id)) {
        return null;
    }
    else {
        return id;
    }
}
exports.getId = getId;
function getToken(dataConnection, request) {
    const tokenString = request.headers["x-authorization"];
    if (!util_1.isString(tokenString)) {
        return Promise.resolve(null);
    }
    const token = token_1.verifyToken(tokenString);
    if (util_1.isNullOrUndefined(token)) {
        return Promise.resolve(null);
    }
    return dataConnection.query("SELECT logoutTime FROM Users WHERE id=?", [token.id])
        .then(rows => {
        if (rows.length === 0) {
            return null;
        }
        else {
            const user = rows[0];
            const logoutTime = user.logoutTime;
            if (logoutTime > token.issuedAt) {
                return null;
            }
            else {
                return token;
            }
        }
    });
}
exports.getToken = getToken;
//# sourceMappingURL=routeHelper.js.map