"use strict";
const express_1 = require("express");
const multer = require("multer");
const util_1 = require("util");
const interfaces_1 = require("../controllers/interfaces");
const projects = require("../controllers/projects");
const config = require("../config");
const routeHelper_1 = require("./routeHelper");
const upload = multer({ dest: config.uploadDirectory });
let dataConnection;
function ownsProject(response, projectId, userId, ownsCallback, notOwnsCallback) {
    dataConnection.query("SELECT * FROM ProjectCreators WHERE project_id=? AND user_id=?", [projectId, userId])
        .then(rows => {
        if (rows.length === 0) {
            notOwnsCallback();
        }
        else {
            ownsCallback();
        }
    })
        .catch(() => {
        routeHelper_1.sendResponse(response, 500, null);
    });
}
module.exports = function (newDataConnection) {
    dataConnection = newDataConnection;
    projects.setup(newDataConnection);
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
        routeHelper_1.getToken(dataConnection, request)
            .then(token => {
            if (token === null) {
                routeHelper_1.sendResponse(response, 401, null);
            }
            else if (id === null) {
                routeHelper_1.sendResponse(response, 404, null);
            }
            else if (!util_1.isBoolean(open)) {
                routeHelper_1.sendResponse(response, 400, null);
            }
            else {
                ownsProject(response, id, token.id, () => {
                    projects.updateProject(id, open, result => {
                        routeHelper_1.sendResponse(response, result, null);
                    });
                }, () => {
                    routeHelper_1.sendResponse(response, 403, null);
                });
            }
        })
            .catch(() => {
            routeHelper_1.sendResponse(response, 500, null);
        });
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
        .put(upload.single("image"), (request, response) => {
        const id = routeHelper_1.getId(request);
        routeHelper_1.getToken(dataConnection, request)
            .then(token => {
            if (token === null) {
                routeHelper_1.sendResponse(response, 401, null);
            }
            else if (id === null) {
                routeHelper_1.sendResponse(response, 404, null);
            }
            else if (util_1.isNullOrUndefined(request.file)) {
                routeHelper_1.sendResponse(response, 400, null);
            }
            else if (!request.file.mimetype.match(/^image\/png/) && !request.file.mimetype.match(/^image\/jpeg/)) {
                routeHelper_1.sendResponse(response, 400, null);
            }
            else {
                ownsProject(response, id, token.id, () => {
                    projects.updateImage(id, request.file, result => {
                        routeHelper_1.sendResponse(response, result, null);
                    });
                }, () => {
                    routeHelper_1.sendResponse(response, 403, null);
                });
            }
        })
            .catch(() => {
            routeHelper_1.sendResponse(response, 500, null);
        });
    });
    router.route("/projects/:id/pledge")
        .post((request, response) => {
        const id = routeHelper_1.getId(request);
        const pledge = request.body;
        routeHelper_1.getToken(dataConnection, request)
            .then(token => {
            if (token === null) {
                routeHelper_1.sendResponse(response, 401, null);
            }
            else if (id === null) {
                routeHelper_1.sendResponse(response, 404, null);
            }
            else if (!interfaces_1.verifyPledge(pledge)) {
                routeHelper_1.sendResponse(response, 400, null);
            }
            else {
                ownsProject(response, id, token.id, () => {
                    routeHelper_1.sendResponse(response, 403, null);
                }, () => {
                    projects.submitPledge(id, token, pledge, result => {
                        routeHelper_1.sendResponse(response, result, null);
                    });
                });
            }
        })
            .catch(() => {
            routeHelper_1.sendResponse(response, 500, null);
        });
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
        const rewards = request.body;
        routeHelper_1.getToken(dataConnection, request)
            .then(token => {
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
                    ownsProject(response, id, token.id, () => {
                        projects.updateRewards(id, rewards, result => {
                            routeHelper_1.sendResponse(response, result, null);
                        });
                    }, () => {
                        routeHelper_1.sendResponse(response, 403, null);
                    });
                }
            }
        })
            .catch(() => {
            routeHelper_1.sendResponse(response, 500, null);
        });
    });
    return router;
};
//# sourceMappingURL=projects.js.map