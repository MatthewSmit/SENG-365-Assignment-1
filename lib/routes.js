"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const formidable = require("express-formidable");
const util_1 = require("util");
const crowdfunder_1 = require("./crowdfunder");
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
function setup(app, crowdfunder) {
    app.get('/projects', function (request, response) {
        const startIndex = Number(request.query.startIndex) || 0;
        const count = Number(request.query.count) || -1;
        const result = crowdfunder.getProjects(startIndex, count);
        sendResponse(response, result.httpCode, result.response);
    });
    app.post('/projects', function (request, response) {
        const project = request.body;
        if (!crowdfunder_1.verifyProjectData(project)) {
            sendResponse(response, 400, null);
        }
        else {
            const result = crowdfunder.createProject(project);
            sendResponse(response, result.httpCode, result.response);
        }
    });
    app.get('/projects/:id', function (request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 400, null);
        }
        else {
            const result = crowdfunder.getProject(id);
            sendResponse(response, result.httpCode, result.response);
        }
    });
    app.put('/projects/:id', function (request, response) {
        const id = getId(request);
        const open = request.body.open;
        if (id === null || !util_1.isBoolean(open)) {
            sendResponse(response, 400, null);
        }
        else {
            const result = crowdfunder.updateProject(id, open);
            sendResponse(response, result, null);
        }
    });
    app.get('/projects/:id/image', function (request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 400, null);
        }
        else {
            const result = crowdfunder.getImage(id);
            if (result.httpCode != 200) {
                sendResponse(response, result.httpCode, null);
            }
            else {
                response.type('png');
                response.send(result.response);
            }
        }
    });
    app.put('/projects/:id/image', formidable(), function (request, response) {
        const id = getId(request);
        if (id === null || util_1.isNullOrUndefined(request.files.file)) {
            sendResponse(response, 400, null);
        }
        else {
            const result = crowdfunder.updateImage(id, request.files.file);
            sendResponse(response, result, null);
        }
    });
    app.post('/projects/:id/pledge', function (request, response) {
        const id = getId(request);
        const pledge = request.body;
        if (id === null || !crowdfunder_1.verifyPledge(pledge)) {
            sendResponse(response, 400, null);
        }
        else {
            const result = crowdfunder.submitPledge(id, pledge);
            sendResponse(response, result, null);
        }
    });
    app.get('/projects/:id/rewards', function (request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 400, null);
        }
        else {
            const result = crowdfunder.getRewards(id);
            sendResponse(response, result.httpCode, result.response);
        }
    });
    app.put('/projects/:id/rewards', function (request, response) {
        const id = getId(request);
        const rewards = request.body.rewards;
        if (id === null || !util_1.isArray(rewards)) {
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
                const result = crowdfunder.updateRewards(id, rewards);
                sendResponse(response, result, null);
            }
        }
    });
    app.post('/users', function (request, response) {
        const user = request.body;
        if (!crowdfunder_1.verifyUser(user)) {
            sendResponse(response, 400, null);
        }
        else {
            const result = crowdfunder.createUser(user);
            sendResponse(response, result.httpCode, result.response);
        }
    });
    app.post('/users/login', function (request, response) {
        const valid = 'username' in request.query && util_1.isString(request.query.username) &&
            'password' in request.query && util_1.isString(request.query.password);
        if (!valid) {
            sendResponse(response, 400, null);
        }
        else {
            const result = crowdfunder.login(request.query.username, request.query.password);
            sendResponse(response, result.httpCode, result.response);
        }
    });
    app.post('/users/logout', function (request, response) {
        const result = crowdfunder.logout();
        sendResponse(response, result, null);
    });
    app.get('/users/:id', function (request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 400, null);
        }
        else {
            const result = crowdfunder.getUser(id);
            sendResponse(response, result.httpCode, result.response);
        }
    });
    app.put('/users/:id', function (request, response) {
        const id = getId(request);
        const user = request.body;
        if (id === null || !crowdfunder_1.verifyUser(user)) {
            sendResponse(response, 400, null);
        }
        else {
            const result = crowdfunder.updateUser(id, user);
            sendResponse(response, result, null);
        }
    });
    app.delete('/users/:id', function (request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 400, null);
        }
        else {
            const result = crowdfunder.deleteUser(id);
            sendResponse(response, result, null);
        }
    });
}
exports.setup = setup;
//# sourceMappingURL=routes.js.map