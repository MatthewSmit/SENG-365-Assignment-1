import {DataConnection} from "../dataConnection";
import {ApiResponse, LogInResponse, PublicUser, User} from "./interfaces";
import {createToken, TokenData} from "../token";

let dataConnection: DataConnection;

export function setup(newDataConnection: DataConnection) {
    dataConnection = newDataConnection;
}

export function createUser(user: User, callback: (result: ApiResponse<number>) => void): void {
    callback({
                 httpCode: 200,
                 response: 0
             });
}

export function login(username: string, password: string, callback: (result: ApiResponse<LogInResponse>) => void): void {
    dataConnection.query("SELECT id, password FROM Users WHERE username=?",
    [username],
    (err, rows) => {
        if (err) {
            callback({
                httpCode: 500
            });
        }
        // 400 error if username doesn't match 1 user. (We should prevent it from matching more then 1 user in both SQL and createUser)
        else if (rows.length != 1) {
            callback({
                httpCode: 400
            });
        }
        else {
            // Return 400 if password is wrong
            //TODO: Should this hash the password or does the client do that?
            const user = rows[0];
            if (user.password != password) {
                callback({
                    httpCode: 400
                });
            }
            else {
                // Generate token for user
                const id = Number(user.id);
                let token: string = null;
                try {
                    token = createToken(id);
                }
                catch (error) {
                    console.log("Error when generating login token:");
                    console.log(err);
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
    });
}

export function logout(token: TokenData, callback: (result: number) => void) {
    const id = token.id;
    dataConnection.query("UPDATE Users SET logoutTime=NOW() WHERE id=?",
        [id],
        (err, rows) => {
            if (err) {
                callback(500);
            }
            else {
                callback(200);
            }
        });
}

export function getUser(id: number, callback: (result: ApiResponse<PublicUser>) => void): void {
    dataConnection.query(
    "SELECT username, email, location FROM Users WHERE id=?",
    [id],
    (err, rows) => {
        if (err) {
            callback({
                httpCode: 500
            });
        }
        else {
            if (rows.length == 0) {
                callback({
                    httpCode: 404
                });
            }
            else {
                const user = rows[0];
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
        }
    });
}

export function getLoginStatus(token: TokenData, callback: (result: ApiResponse<boolean>) => void): void {
    const id = token.id;
    dataConnection.query(
    "SELECT logoutTime FROM Users WHERE id=?",
    [id],
    (err, rows) => {
        if (err) {
            callback({
                httpCode: 500
            });
        }
        else {
            if (rows.length == 0) {
                callback({
                    httpCode: 200,
                    response: false
                });
            }
            else {
                const user = rows[0];
                const logoutTime: Date = user.logoutTime;
                if (logoutTime >= token.issuedAt) {
                    callback({
                        httpCode: 200,
                        response: false
                    });
                }
                else {
                    callback({
                        httpCode: 200,
                        response: true
                    });
                }
            }
        }
    });
}

export function updateUser(id: number, user: User, callback: (result: number) => void): void {
    callback(500);
}

export function deleteUser(id: number, callback: (result: number) => void): void {
    callback(500);
}