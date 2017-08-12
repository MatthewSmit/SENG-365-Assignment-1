"use strict";
const express_1 = require("express");
const formidable = require("express-formidable");
const util_1 = require("util");
const interfaces_1 = require("../controllers/interfaces");
const projects = require("../controllers/projects");
const routeHelper_1 = require("./routeHelper");
module.exports = function (dataConnection) {
    projects.setup(dataConnection);
    const router = express_1.Router();
    router.route("/projects")
        .get((request, response) => {
        const startIndex = Number(request.query.startIndex) || 0;
        const count = Number(request.query.count) || -1;
        projects.getProjects(startIndex, count, result => {
            routeHelper_1.sendResponse(response, result.httpCode, result.response);
        });
    })
        .post((request, response) => {
        const project = request.body;
        routeHelper_1.getToken(dataConnection, request)
            .then(token => {
            if (token === null) {
                routeHelper_1.sendResponse(response, 401, null);
            }
            else if (!interfaces_1.verifyProjectData(project)) {
                routeHelper_1.sendResponse(response, 400, null);
            }
            else {
                let anyCreators = false;
                for (let creator of project.creators) {
                    if (creator.id === token.id) {
                        anyCreators = true;
                        break;
                    }
                }
                if (!anyCreators) {
                    routeHelper_1.sendResponse(response, 401, null);
                }
                else {
                    projects.createProject(project, result => {
                        routeHelper_1.sendResponse(response, result.httpCode, result.response);
                    });
                }
            }
        })
            .catch(() => {
            routeHelper_1.sendResponse(response, 500, null);
        });
    });
    router.route("/projects/:id")
        .get((request, response) => {
        const id = routeHelper_1.getId(request);
        if (id === null) {
            routeHelper_1.sendResponse(response, 404, null);
        }
        else {
            projects.getProject(id, result => {
                routeHelper_1.sendResponse(response, result.httpCode, result.response);
            });
        }
    })
        .put((request, response) => {
        const id = routeHelper_1.getId(request);
        const open = request.body.open;
        if (id === null) {
            routeHelper_1.sendResponse(response, 404, null);
        }
        else if (!util_1.isBoolean(open)) {
            routeHelper_1.sendResponse(response, 400, null);
        }
        else {
            projects.updateProject(id, open, result => {
                routeHelper_1.sendResponse(response, result, null);
            });
        }
    });
    router.route("/projects/:id/image")
        .get((request, response) => {
        const id = routeHelper_1.getId(request);
        if (id === null) {
            routeHelper_1.sendResponse(response, 404, null);
        }
        else {
            projects.getImage(id, result => {
                if (result.httpCode !== 200) {
                    routeHelper_1.sendResponse(response, result.httpCode, null);
                }
                else {
                    response.type(result.type);
                    response.send(result.response);
                }
            });
        }
    })
        .put(formidable, (request, response) => {
        const id = routeHelper_1.getId(request);
        if (id === null) {
            routeHelper_1.sendResponse(response, 404, null);
        }
        else if (util_1.isNullOrUndefined(request.files.file)) {
            routeHelper_1.sendResponse(response, 400, null);
        }
        else {
            projects.updateImage(id, request.files.file, result => {
                routeHelper_1.sendResponse(response, result, null);
            });
        }
    });
    router.route("/projects/:id/pledge")
        .post((request, response) => {
        const id = routeHelper_1.getId(request);
        const pledge = request.body;
        if (id === null) {
            routeHelper_1.sendResponse(response, 404, null);
        }
        else if (!interfaces_1.verifyPledge(pledge)) {
            routeHelper_1.sendResponse(response, 400, null);
        }
        else {
            projects.submitPledge(id, pledge, result => {
                routeHelper_1.sendResponse(response, result, null);
            });
        }
    });
    router.route("/projects/:id/rewards")
        .get((request, response) => {
        const id = routeHelper_1.getId(request);
        if (id === null) {
            routeHelper_1.sendResponse(response, 404, null);
        }
        else {
            projects.getRewards(id, result => {
                routeHelper_1.sendResponse(response, result.httpCode, result.response);
            });
        }
    })
        .put((request, response) => {
        const id = routeHelper_1.getId(request);
        const rewards = request.body.rewards;
        if (id === null) {
            routeHelper_1.sendResponse(response, 404, null);
        }
        else if (!util_1.isArray(rewards)) {
            routeHelper_1.sendResponse(response, 400, null);
        }
        else {
            let valid = true;
            for (let reward of rewards) {
                if (!interfaces_1.verifyReward(reward)) {
                    valid = false;
                }
            }
            if (!valid) {
                routeHelper_1.sendResponse(response, 400, null);
            }
            else {
                projects.updateRewards(id, rewards, result => {
                    routeHelper_1.sendResponse(response, result, null);
                });
            }
        }
    });
    return router;
};
//# sourceMappingURL=projects.js.map