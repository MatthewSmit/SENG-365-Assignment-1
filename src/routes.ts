import {Express, Request, Response} from "express";
import formidable = require('express-formidable');
import {isArray, isBoolean, isNullOrUndefined, isString} from "util";

import {CrowdFunder, verifyPledge, verifyProjectData, verifyReward, verifyUser} from "./crowdfunder";

function sendResponse(response: Response, httpError: number, responseBody: any) {
    if (isNullOrUndefined(responseBody)) {
        response.status(httpError).end();
    }
    else {
        response.json(responseBody);
    }
}

function getId(request: Request): any {
    const id = Number(request.params.id);
    if (isNullOrUndefined(request.params.id) || !Number.isInteger(id)) {
        return null;
    }
    else {
        return id;
    }
}

export function setup(app: Express, crowdfunder: CrowdFunder) {
    app.get('/projects', function(request, response) {
        const startIndex: number = Number(request.query.startIndex) || 0;
        const count: number = Number(request.query.count) || -1;
        crowdfunder.getProjects(startIndex, count, (result) => {
            sendResponse(response, result.httpCode, result.response);
        });
    });

    app.post('/projects', function(request, response) {
        const project = request.body;
        if (!verifyProjectData(project)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdfunder.createProject(project, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });

    app.get('/projects/:id', function(request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 400, null);
        }
        else {
            crowdfunder.getProject(id, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });

    app.put('/projects/:id', function(request, response) {
        const id = getId(request);
        const open = request.body.open;
        if (id === null || !isBoolean(open)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdfunder.updateProject(id, open, (result) => {
                sendResponse(response, result, null);
            });
        }
    });

    app.get('/projects/:id/image', function(request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 400, null);
        }
        else {
            crowdfunder.getImage(id, (result) => {
                if (result.httpCode != 200) {
                    sendResponse(response, result.httpCode, null);
                }
                else {
                    response.type('png');
                    response.send(result.response);
                }
            });
        }
    });

    app.put('/projects/:id/image', formidable(), function(request: any, response) {
        const id = getId(request);
        if (id === null || isNullOrUndefined(request.files.file)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdfunder.updateImage(id, request.files.file, (result) => {
                sendResponse(response, result, null);
            });
        }
    });

    app.post('/projects/:id/pledge', function(request, response) {
        const id = getId(request);
        const pledge = request.body;
        if (id === null || !verifyPledge(pledge)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdfunder.submitPledge(id, pledge, (result) => {
                sendResponse(response, result, null);
            });
        }
    });

    app.get('/projects/:id/rewards', function(request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 400, null);
        }
        else {
            crowdfunder.getRewards(id, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });

    app.put('/projects/:id/rewards', function(request, response) {
        const id = getId(request);
        const rewards = request.body.rewards;
        if (id === null || !isArray(rewards)) {
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
                crowdfunder.updateRewards(id, <[any]>rewards, (result) => {
                    sendResponse(response, result, null);
                });
            }
        }
    });

    app.post('/users', function(request, response) {
        const user = request.body;
        if (!verifyUser(user)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdfunder.createUser(user, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });

    app.post('/users/login', function(request, response) {
        const valid = 'username' in request.query && isString(request.query.username) &&
            'password' in request.query && isString(request.query.password);

        if (!valid) {
            sendResponse(response, 400, null);
        }
        else {
            crowdfunder.login(request.query.username, request.query.password, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });

    app.post('/users/logout', function(request, response) {
        crowdfunder.logout((result) => {
            sendResponse(response, result, null);
        });
    });

    app.get('/users/:id', function(request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 400, null);
        }
        else {
            crowdfunder.getUser(id, (result) => {
                sendResponse(response, result.httpCode, result.response);
            });
        }
    });

    app.put('/users/:id', function(request, response) {
        const id = getId(request);
        const user = request.body;
        if (id === null || !verifyUser(user)) {
            sendResponse(response, 400, null);
        }
        else {
            crowdfunder.updateUser(id, user, (result) => {
                sendResponse(response, result, null);
            });
        }
    });

    app.delete('/users/:id', function(request, response) {
        const id = getId(request);
        if (id === null) {
            sendResponse(response, 400, null);
        }
        else {
            crowdfunder.deleteUser(id, (result) => {
                sendResponse(response, result, null);
            });
        }
    });
}