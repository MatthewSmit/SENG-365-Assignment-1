"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const config = require("./config");
function createToken(id) {
    return jwt.sign({
        id: id
    }, config.tokenSecret, { expiresIn: "30d" });
}
exports.createToken = createToken;
function verifyToken(token) {
    let data;
    try {
        data = jwt.verify(token, config.tokenSecret, { algorithms: ['HS256'] });
    }
    catch (error) {
        console.log("Token verification failed.");
        console.log(error);
        return null;
    }
    if (typeof data === "string")
        return null;
    return {
        id: data.id,
        issuedAt: new Date(data.iat * 1000)
    };
}
exports.verifyToken = verifyToken;
//# sourceMappingURL=token.js.map