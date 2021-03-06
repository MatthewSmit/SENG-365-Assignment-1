import jwt = require("jsonwebtoken");

import config = require("./config");

export interface ITokenData {
    id: number;
    issuedAt: Date;
}

export function createToken(id: number): string {
    return jwt.sign(<object>{
        id: id
    }, config.tokenSecret, {expiresIn: "30d"});
}

export function verifyToken(token: string): ITokenData {
    let data: any;
    try {
        data = jwt.verify(token, config.tokenSecret, { algorithms: ["HS256"] });
    } catch(error) {
        console.log("Token verification failed.");
        console.log(error);
        return null;
    }

    if (typeof data === "string") {
        return null;
    }

    return {
        id: data.id,
        issuedAt: new Date(data.iat * 1000)
    };
}