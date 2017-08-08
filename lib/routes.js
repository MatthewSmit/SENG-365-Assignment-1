"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const formidable = require("express-formidable");
const util_1 = require("util");
const crowdfunder_1 = require("./crowdfunder");
const token_1 = require("./token");
function sendResponse(response, httpError, responseBody) {
    if (util_1.isNullOrUndefined(responseBody)) {
        response.status(httpError).end();
    }
    else {
        response.json(responseBody);
    }
}
function getId(request) {
    const id = Number(request.params.id);
    if (util_1.isNullOrUndefined(request.params.id) || !Number.isInteger(id)) {
        return null;
    }
    else {
        return id;
    }
}
function getToken(request) {
    const tokenString = request.headers["x-authorization"];
    if (tokenString === null || Array.isArray(tokenString))
        return null;
    return token_1.verifyToken(tokenString);
}
function setup(app, crowdFunder) {
    app.get('/api/v1/projects', function (request, response) {
        const startIndex = Number(request.query.startIndex) || 0;
        const count = Number(request.query.count) || -1;
        crowdFunder.getProjects(startIndex, count, (result) => {
            sendResponse(response, result.httpCode, result.response);
        });
    });
    app.post('/api/v1/projects', function (request, response) {
        const project = request.body;
        if (!crowdfunder_1.verifyProjectData(project)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.createProject(project, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });
    app.get('/api/v1/projects/:id', function (request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else {
            crowdFunder.getProject(id, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });
    app.put('/api/v1/projects/:id', function (request, response) {
        const id = getId(request);
        const open = request.body.open;
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else if (!util_1.isBoolean(open)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.updateProject(id, open, (result) => {
                sendResponse(response, result, null);
            });
        }
    });
    app.get('/api/v1/projects/:id/image', function (request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else {
            crowdFunder.getImage(id, (result) => {
                if (result.httpCode != 200) {
                    sendResponse(response, result.httpCode, null);
                }
                else {
                    response.type(result.type);
                    response.send(result.response);
                }
            });
        }
    });
    app.put('/api/v1/projects/:id/image', formidable(), function (request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else if (util_1.isNullOrUndefined(request.files.file)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.updateImage(id, request.files.file, (result) => {
                sendResponse(response, result, null);
            });
        }
    });
    app.post('/api/v1/projects/:id/pledge', function (request, response) {
        const id = getId(request);
        const pledge = request.body;
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else if (!crowdfunder_1.verifyPledge(pledge)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.submitPledge(id, pledge, (result) => {
                sendResponse(response, result, null);
            });
        }
    });
    app.get('/api/v1/projects/:id/rewards', function (request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else {
            crowdFunder.getRewards(id, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });
    app.put('/api/v1/projects/:id/rewards', function (request, response) {
        const id = getId(request);
        const rewards = request.body.rewards;
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else if (!util_1.isArray(rewards)) {
            sendResponse(response, 400, null);
        }
        else {
            let valid = true;
            for (let reward of rewards) {
                if (!crowdfunder_1.verifyReward(reward))
                    valid = false;
            }
            if (!valid) {
                sendResponse(response, 400, null);
            }
            else {
                crowdFunder.updateRewards(id, rewards, (result) => {
                    sendResponse(response, result, null);
                });
            }
        }
    });
    app.post('/api/v1/users', function (request, response) {
        const user = request.body;
        if (!crowdfunder_1.verifyUser(user)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.createUser(user, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });
    app.post('/api/v1/users/login', function (request, response) {
        const valid = 'username' in request.query && util_1.isString(request.query.username) &&
            'password' in request.query && util_1.isString(request.query.password);
        if (!valid) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.login(request.query.username, request.query.password, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });
    app.post('/api/v1/users/logout', function (request, response) {
        crowdFunder.logout((result) => {
            sendResponse(response, result, null);
        });
    });
    app.get('/api/v1/users/login_status', function (request, response) {
        const token = getToken(request);
        if (token === null) {
            sendResponse(response, 200, false);
        }
        else {
            crowdFunder.getLoginStatus(token, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });
    app.get('/api/v1/users/:id', function (request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else {
            crowdFunder.getUser(id, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });
    app.put('/api/v1/users/:id', function (request, response) {
        const id = getId(request);
        const user = request.body;
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else if (!crowdfunder_1.verifyUser(user)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.updateUser(id, user, (result) => {
                sendResponse(response, result, null);
            });
        }
    });
    app.delete('/api/v1/users/:id', function (request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else {
            crowdFunder.deleteUser(id, (result) => {
                sendResponse(response, result, null);
            });
        }
    });
}
exports.setup = setup;
//# sourceMappingURL=routes.js.map