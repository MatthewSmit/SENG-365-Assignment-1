import {Request, Response} from "express";
import {isNullOrUndefined} from "util";

import {ITokenData, verifyToken} from "../token";

export function sendResponse(response: Response, httpError: number, responseBody: any): void {
    if (isNullOrUndefined(responseBody)) {
        response.status(httpError);
        if (httpError === 200) {
            response.json();
        }
        response.end();
    } else {
        response.json(responseBody);
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

export function getToken(request: Request): ITokenData {
    const tokenString: string | string[] | any = request.headers["x-authorization"];
    if (tokenString === null || Array.isArray(tokenString)) {
        return null;
    }

    return verifyToken(tokenString);
}