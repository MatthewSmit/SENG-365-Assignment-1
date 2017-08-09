import {Response, Router} from "express";
import formidable = require('express-formidable');
import {isArray, isBoolean, isNullOrUndefined} from "util";

import {verifyPledge, verifyProjectData, verifyReward} from "../controllers/interfaces";
import projects = require("../controllers/projects");
import {DataConnection} from "../dataConnection";
import {sendResponse, getId} from "./routeHelper";

export = function(dataConnection: DataConnection): Router {
    projects.setup(dataConnection);

    const router = Router();

    router.route('/projects')
        .get((request, response) => {
            const startIndex: number = Number(request.query.startIndex) || 0;
            const count: number = Number(request.query.count) || -1;
            projects.getProjects(startIndex, count, result => {
                sendResponse(response, result.httpCode, result.response);
            });
        })
        .post((request, response) => {
            const project = request.body;
            if (!verifyProjectData(project)) {
                sendResponse(response, 400, null);
            }
            else {
                projects.createProject(project, result => {
                    sendResponse(response, result.httpCode, result.response);
                });
            }
        });

    router.route('/projects/:id')
        .get((request, response) => {
            const id = getId(request);
            if (id === null) {
                sendResponse(response, 404, null);
            }
            else {
                projects.getProject(id, result => {
                    sendResponse(response, result.httpCode, result.response);
                });
            }
        })
        .put((request, response) => {
            const id = getId(request);
            const open = request.body.open;
            if (id === null) {
                sendResponse(response, 404, null);
            }
            else if (!isBoolean(open)) {
                sendResponse(response, 400, null);
            }
            else {
                projects.updateProject(id, open, result => {
                    sendResponse(response, result, null);
                });
            }
        });

    router.route('/projects/:id/image')
        .get((request, response) => {
            const id = getId(request);
            if (id === null) {
                sendResponse(response, 404, null);
            }
            else {
                projects.getImage(id, result => {
                    if (result.httpCode != 200) {
                        sendResponse(response, result.httpCode, null);
                    }
                    else {
                        response.type(result.type);
                        response.send(result.response);
                    }
                });
            }
        })
        .put(formidable, (request: any, response: Response) => {
            const id = getId(request);
            if (id === null) {
                sendResponse(response, 404, null);
            }
            else if (isNullOrUndefined(request.files.file)) {
                sendResponse(response, 400, null);
            }
            else {
                projects.updateImage(id, request.files.file, result => {
                    sendResponse(response, result, null);
                });
            }
        });

    router.route('/projects/:id/pledge')
        .post((request, response) => {
            const id = getId(request);
            const pledge = request.body;
            if (id === null) {
                sendResponse(response, 404, null);
            }
            else if (!verifyPledge(pledge)) {
                sendResponse(response, 400, null);
            }
            else {
                projects.submitPledge(id, pledge, result => {
                    sendResponse(response, result, null);
                });
            }
        });

    router.route('/projects/:id/rewards')
        .get((request, response) => {
            const id = getId(request);
            if (id === null) {
                sendResponse(response, 404, null);
            }
            else {
                projects.getRewards(id, result => {
                    sendResponse(response, result.httpCode, result.response);
                });
            }
        })
        .put((request, response) => {
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
                    projects.updateRewards(id, <[any]>rewards, result => {
                        sendResponse(response, result, null);
                    });
                }
            }
        });

    return router;
}