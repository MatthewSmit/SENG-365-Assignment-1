"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../token");
let dataConnection;
function setup(newDataConnection) {
    dataConnection = newDataConnection;
}
exports.setup = setup;
function createUser(user, callback) {
    callback({
        httpCode: 200,
        response: 0
    });
}
exports.createUser = createUser;
function login(username, password, callback) {
    dataConnection.query("SELECT id, password FROM Users WHERE username=?", [username], (err, rows) => {
        if (err) {
            callback({
                httpCode: 500
            });
        }
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
                let token = null;
                try {
                    token = token_1.createToken(id);
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
exports.login = login;
function logout(token, callback) {
    const id = token.id;
    dataConnection.query("UPDATE Users SET logoutTime=NOW() WHERE id=?", [id], (err, rows) => {
        if (err) {
            callback(500);
        }
        else {
            callback(200);
        }
    });
}
exports.logout = logout;
function getUser(id, callback) {
    dataConnection.query("SELECT username, email, location FROM Users WHERE id=?", [id], (err, rows) => {
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
exports.getUser = getUser;
function getLoginStatus(token, callback) {
    const id = token.id;
    dataConnection.query("SELECT logoutTime FROM Users WHERE id=?", [id], (err, rows) => {
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
                const logoutTime = user.logoutTime;
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
exports.getLoginStatus = getLoginStatus;
function updateUser(id, user, callback) {
    callback(500);
}
exports.updateUser = updateUser;
function deleteUser(id, callback) {
    callback(500);
}
exports.deleteUser = deleteUser;
//# sourceMappingURL=users.js.map