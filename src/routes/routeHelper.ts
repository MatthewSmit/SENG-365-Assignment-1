import {Request, Response} from "express";
import {isNullOrUndefined, isString} from "util";

import {ITokenData, verifyToken} from "../token";
import {DataConnection} from "../dataConnection";

export function sendResponse(response: Response, httpError: number, responseBody: any): void {
    response.status(httpError);

    if (isNullOrUndefined(responseBody)) {
        if (httpError === 200) {
            response.json();
        }
        response.end();
    } else {
        response.json(responseBody);
        response.end();
    }
}

export function getId(request: Request): number {
    const id: number = Number(request.params.id);
    if (isNullOrUndefined(request.params.id) || !Number.isInteger(id)) {
        return null;
    } else {
        return id;
    }
}

export function getToken(dataConnection: DataConnection, request: Request): Promise<ITokenData> {
    const tokenString: string | string[] | any = request.headers["x-authorization"];
    if (!isString(tokenString)) {
        return Promise.resolve(null);
    }

    const token: ITokenData = verifyToken(<string>tokenString);
    if (isNullOrUndefined(token)) {
        return Promise.resolve(null);
    }

    return dataConnection.query(
        "SELECT logoutTime FROM Users WHERE id=?",
        [token.id])
        .then(rows => {
            if (rows.length === 0) {
                return null;
            } else {
                const user: any = rows[0];
                const logoutTime: Date = user.logoutTime;
                if (logoutTime > token.issuedAt) {
                    return null;
                } else {
                    return token;
                }
            }
        });
}