import {Express, Request, Response} from "express";
import formidable = require('express-formidable');
import {isArray, isBoolean, isNullOrUndefined, isString} from "util";

import {CrowdFunder, verifyPledge, verifyProjectData, verifyReward, verifyUser} from "./crowdfunder";
import {verifyToken} from "./token";

function sendResponse(response: Response, httpError: number, responseBody: any) {
    if (isNullOrUndefined(responseBody)) {
        response.status(httpError).end();
    }
    else {
        response.json(responseBody);
    }
}

function getId(request: Request): number {
    const id = Number(request.params.id);
    if (isNullOrUndefined(request.params.id) || !Number.isInteger(id)) {
        return null;
    }
    else {
        return id;
    }
}

function getToken(request: Request): any {
    const tokenString = request.headers["x-authorization"];
    if (tokenString === null || Array.isArray(tokenString))
        return null;

    return verifyToken(tokenString);
}

export function setup(app: Express, crowdFunder: CrowdFunder) {
    app.get('/api/v1/projects', function(request, response) {
        const startIndex: number = Number(request.query.startIndex) || 0;
        const count: number = Number(request.query.count) || -1;
        crowdFunder.getProjects(startIndex, count, (result) => {
            sendResponse(response, result.httpCode, result.response);
        });
    });

    app.post('/api/v1/projects', function(request, response) {
        const project = request.body;
        if (!verifyProjectData(project)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.createProject(project, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });

    app.get('/api/v1/projects/:id', function(request, response) {
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

    app.put('/api/v1/projects/:id', function(request, response) {
        const id = getId(request);
        const open = request.body.open;
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else if (!isBoolean(open)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.updateProject(id, open, (result) => {
                sendResponse(response, result, null);
            });
        }
    });

    app.get('/api/v1/projects/:id/image', function(request, response) {
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

    app.put('/api/v1/projects/:id/image', formidable(), function(request: any, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else if (isNullOrUndefined(request.files.file)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.updateImage(id, request.files.file, (result) => {
                sendResponse(response, result, null);
            });
        }
    });

    app.post('/api/v1/projects/:id/pledge', function(request, response) {
        const id = getId(request);
        const pledge = request.body;
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else if (!verifyPledge(pledge)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.submitPledge(id, pledge, (result) => {
                sendResponse(response, result, null);
            });
        }
    });

    app.get('/api/v1/projects/:id/rewards', function(request, response) {
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

    app.put('/api/v1/projects/:id/rewards', function(request, response) {
        const id = getId(request);
        const rewards = request.body.rewards;
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else if (!isArray(rewards)) {
            sendResponse(response, 400, null);
        }
        else {
            let valid = true;
            for (let reward of rewards) {
                if (!verifyReward(reward))
                    valid = false;
            }

            if (!valid) {
                sendResponse(response, 400, null);
            }
            else {
                crowdFunder.updateRewards(id, <[any]>rewards, (result) => {
                    sendResponse(response, result, null);
                });
            }
        }
    });

    app.post('/api/v1/users', function(request, response) {
        const user = request.body;
        if (!verifyUser(user)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.createUser(user, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });

    app.post('/api/v1/users/login', function(request, response) {
        const valid = 'username' in request.query && isString(request.query.username) &&
            'password' in request.query && isString(request.query.password);

        if (!valid) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.login(request.query.username, request.query.password, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });

    app.post('/api/v1/users/logout', function(request, response) {
        crowdFunder.logout((result) => {
            sendResponse(response, result, null);
        });
    });

    app.get('/api/v1/users/login_status', function(request, response) {
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

    app.get('/api/v1/users/:id', function(request, response) {
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

    app.put('/api/v1/users/:id', function(request, response) {
        const id = getId(request);
        const user = request.body;
        if (id === null) {
            sendResponse(response, 404, null);
        }
        else if (!verifyUser(user)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdFunder.updateUser(id, user, (result) => {
                sendResponse(response, result, null);
            });
        }
    });

    app.delete('/api/v1/users/:id', function(request, response) {
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