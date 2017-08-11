"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../token");
const util_1 = require("util");
let dataConnection;
function setup(newDataConnection) {
    dataConnection = newDataConnection;
}
exports.setup = setup;
function createUser(user, callback) {
    dataConnection.query("SELECT id FROM Users WHERE username=?", [user.user.username])
        .then(rows => {
        if (rows.length === 0) {
            return dataConnection.query("INSERT INTO Users (username, password, location, email) VALUES (?, ?, ?, ?)", [user.user.username, user.password, user.user.location, user.user.email]);
        }
        else {
            return { httpCode: 400, response: 0 };
        }
    })
        .then(result => {
        if (util_1.isUndefined(result.httpCode)) {
            return dataConnection.query("SELECT id FROM Users WHERE username=?", [user.user.username]);
        }
        else {
            return result;
        }
    })
        .then(result => {
        if (util_1.isUndefined(result.httpCode)) {
            return { httpCode: 201, response: result[0].id };
        }
        else {
            return result;
        }
    })
        .then(result => {
        callback({
            httpCode: result.httpCode,
            response: result.response
        });
    })
        .catch(() => {
        callback({
            httpCode: 500,
            response: 0
        });
    });
}
exports.createUser = createUser;
function login(username, password, callback) {
    dataConnection.query("SELECT id, password FROM Users WHERE username=?", [username])
        .then(rows => {
        // 400 error if username doesn't match 1 user. (We should prevent it from matching more then 1 user in both SQL and createUser)
        if (rows.length !== 1) {
            callback({
                httpCode: 400
            });
        }
        else {
            // return 400 if password is wrong
            const user = rows[0];
            if (user.password !== password) {
                callback({
                    httpCode: 400
                });
            }
            else {
                // generate token for user
                const id = Number(user.id);
                let token = null;
                try {
                    token = token_1.createToken(id);
                }
                catch (error) {
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
exports.login = login;
function logout(token, callback) {
    const id = token.id;
    dataConnection.query("UPDATE Users SET logoutTime=NOW() WHERE id=?", [id])
        .then(() => {
        callback(200);
    })
        .catch(() => {
        callback(500);
    });
}
exports.logout = logout;
function getUser(id, callback) {
    dataConnection.query("SELECT username, email, location FROM Users WHERE id=?", [id])
        .then(rows => {
        if (rows.length === 0) {
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
    })
        .catch(() => {
        callback({
            httpCode: 500
        });
    });
}
exports.getUser = getUser;
function updateUser(id, user, callback) {
    dataConnection.query("SELECT password FROM Users WHERE id=?", [id])
        .then(rows => {
        if (rows.length === 0) {
            callback(404);
        }
        else if (rows[0].password !== user.password) {
            callback(401);
        }
        else {
            dataConnection.query("UPDATE Users SET username=?, location=?, email=? WHERE id=?", [user.user.username, user.user.location, user.user.email, id])
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
exports.updateUser = updateUser;
function deleteUser(id, callback) {
    dataConnection.query("DELETE FROM Users WHERE id=?", [id])
        .then(() => {
        callback(200);
    })
        .catch(() => {
        callback(500);
    });
}
exports.deleteUser = deleteUser;
//# sourceMappingURL=users.js.map