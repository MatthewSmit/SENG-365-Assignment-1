"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const token_1 = require("../token");
function sendResponse(response, httpError, responseBody) {
    if (util_1.isNullOrUndefined(responseBody)) {
        response.status(httpError);
        if (httpError === 200) {
            response.json("{}");
        }
        response.end();
    }
    else {
        response.json(responseBody);
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
function getToken(request) {
    const tokenString = request.headers["x-authorization"];
    if (tokenString === null || Array.isArray(tokenString)) {
        return null;
    }
    return token_1.verifyToken(tokenString);
}
exports.getToken = getToken;
//# sourceMappingURL=routeHelper.js.map