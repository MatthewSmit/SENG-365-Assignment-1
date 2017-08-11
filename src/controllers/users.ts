import {DataConnection} from "../dataConnection";
import {IApiResponse, ILogInResponse, IPublicUser, IUser} from "./interfaces";
import {createToken, ITokenData} from "../token";

let dataConnection: DataConnection;

export function setup(newDataConnection: DataConnection): void {
    dataConnection = newDataConnection;
}

export function createUser(user: IUser, callback: (result: IApiResponse<number>) => void): void {
    callback({
                 httpCode: 200,
                 response: 0
             });
}

export function login(username: string, password: string, callback: (result: IApiResponse<ILogInResponse>) => void): void {
    dataConnection.query("SELECT id, password FROM Users WHERE username=?",
    [username])
        .then(rows => {
            // 400 error if username doesn't match 1 user. (We should prevent it from matching more then 1 user in both SQL and createUser)
            if (rows.length !== 1) {
                callback({
                    httpCode: 400
                });
            } else {
                // return 400 if password is wrong
                const user: any = rows[0];
                if (user.password !== password) {
                    callback({
                        httpCode: 400
                    });
                } else {
                    // generate token for user
                    const id: number = Number(user.id);
                    let token: string = null;
                    try {
                        token = createToken(id);
                    } catch (error) {
                        console.log("Error when generating login token:");
                        console.log(error);
                        callback({
                            httpCode: 500
                        });
                    }
                    if (token !== null) {
                        callback({
                            httpCode: 200,
                            response: {
                                id: id,
                                token: token
                            }
                        });
                    }
                }
            }
        })
        .catch(() => {
            callback({
                httpCode: 500
            });
        });
}

export function logout(token: ITokenData, callback: (result: number) => void): void {
    const id: number = token.id;
    dataConnection.query("UPDATE Users SET logoutTime=NOW() WHERE id=?",
        [id])
        .then(() => {
            callback(200);
        })
        .catch(() => {
            callback(500);
        });
}

export function getUser(id: number, callback: (result: IApiResponse<IPublicUser>) => void): void {
    dataConnection.query(
    "SELECT username, email, location FROM Users WHERE id=?",
    [id])
        .then(rows => {
            if (rows.length === 0) {
                callback({
                    httpCode: 404
                });
            } else {
                const user: any = rows[0];
                callback({
                    httpCode: 200,
                    response: {
                        id: id,
                        username: user.username,
                        location: user.location,
                        email: user.email
                    }
                });
            }
        })
        .catch(() => {
            callback({
                httpCode: 500
            });
        });
}

export function getLoginStatus(token: ITokenData, callback: (result: IApiResponse<boolean>) => void): void {
    const id: number = token.id;
    dataConnection.query(
    "SELECT logoutTime FROM Users WHERE id=?",
    [id])
        .then(rows => {
            if (rows.length === 0) {
                callback({
                    httpCode: 200,
                    response: false
                });
            } else {
                const user: any = rows[0];
                const logoutTime: Date = user.logoutTime;
                if (logoutTime >= token.issuedAt) {
                    callback({
                        httpCode: 200,
                        response: false
                    });
                } else {
                    callback({
                        httpCode: 200,
                        response: true
                    });
                }
            }
        })
        .catch(() => {
            callback({
                httpCode: 500
            });
        });
}

export function updateUser(id: number, user: IUser, callback: (result: number) => void): void {
    dataConnection.query("SELECT password FROM Users WHERE id=?",
        [id])
        .then(rows => {
            if (rows.length === 0) {
                callback(404);
            } else if (rows[0].password !== user.password) {
                callback(401);
            } else {
                dataConnection.query("UPDATE Users SET username=?, location=?, email=? WHERE id=?",
                    [user.user.username, user.user.location, user.user.email, id])
                    .then(() => {
                        callback(200);
                    })
                    .catch(() => {
                        callback(500);
                    });
            }
        })
        .catch(() => {
            callback(500);
        });
}

export function deleteUser(id: number, callback: (result: number) => void): void {
    callback(500);
}