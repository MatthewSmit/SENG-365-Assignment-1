"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Used for the GET - projects/ endpoint. This contains a subset of the project data.
const util_1 = require("util");
function verifyCreator(creator) {
    return 'id' in creator && Number.isInteger(creator.id) &&
        'name' in creator && util_1.isString(creator.name);
}
function verifyProjectData(projectData) {
    let valid = 'title' in projectData && util_1.isString(projectData.title) &&
        'subtitle' in projectData && util_1.isString(projectData.subtitle) &&
        'description' in projectData && util_1.isString(projectData.description) &&
        'imageUri' in projectData && util_1.isString(projectData.imageUri) &&
        'target' in projectData && Number.isInteger(projectData.target) &&
        'creators' in projectData && util_1.isArray(projectData.creators) &&
        'rewards' in projectData && util_1.isArray(projectData.rewards);
    if (!valid)
        return false;
    for (let creator of projectData.creators) {
        if (!verifyCreator(creator))
            return false;
    }
    for (let reward of projectData.rewards) {
        if (!verifyReward(reward))
            return false;
    }
    return true;
}
exports.verifyProjectData = verifyProjectData;
function verifyReward(reward) {
    return 'id' in reward && Number.isInteger(reward.id) &&
        'amount' in reward && Number.isInteger(reward.amount) &&
        'description' in reward && util_1.isString(reward.description);
}
exports.verifyReward = verifyReward;
function verifyPledge(pledge) {
    return 'id' in pledge && Number.isInteger(pledge.id) &&
        'amount' in pledge && Number.isInteger(pledge.amount) &&
        'anonymous' in pledge && util_1.isBoolean(pledge.anonymous) &&
        'card' in pledge && 'authToken' in pledge.card && util_1.isString(pledge.card.authToken);
}
exports.verifyPledge = verifyPledge;
function verifyUser(user) {
    return 'user' in user && verifyPublicUser(user.user) &&
        'password' in user && util_1.isString(user.password);
}
exports.verifyUser = verifyUser;
function verifyPublicUser(user) {
    return 'id' in user && Number.isInteger(user.id) &&
        'username' in user && util_1.isString(user.username) &&
        'location' in user && util_1.isString(user.location) &&
        'email' in user && util_1.isString(user.email);
}
class Crowdfunder {
    getProjects(startIndex, count) {
        return {
            httpCode: 200,
            response: [{ id: 0, title: "string", subtitle: "string", imageUri: "string" }]
        };
    }
    createProject(project) {
        return {
            httpCode: 200,
            response: 0
        };
    }
    getProject(id) {
        return {
            httpCode: 200,
            response: {
                project: {
                    id: id,
                    creationDate: 0,
                    data: {
                        title: "string",
                        subtitle: "string",
                        description: "string",
                        imageUri: "string",
                        target: 0,
                        creators: [
                            {
                                id: 0,
                                name: "string"
                            }
                        ],
                        rewards: [
                            {
                                id: 0,
                                amount: 0,
                                description: "string"
                            }
                        ]
                    }
                },
                progress: {
                    target: 0,
                    currentPledged: 0,
                    numberOfBackers: 0
                },
                backers: [
                    {
                        name: 0,
                        amount: 0
                    }
                ]
            }
        };
    }
    updateProject(id, open) {
        return 200;
    }
    getRewards(id) {
        return {
            httpCode: 200,
            response: [
                {
                    id: 0,
                    amount: 0,
                    description: "string"
                }
            ]
        };
    }
    updateRewards(id, rewards) {
        return 200;
    }
    getImage(id) {
        return {
            httpCode: 200,
            response: new Buffer(0)
        };
    }
    updateImage(id, image) {
        return 200;
    }
    submitPledge(id, pledge) {
        return 200;
    }
    createUser(user) {
        return {
            httpCode: 200,
            response: 0
        };
    }
    login(username, password) {
        return {
            httpCode: 200,
            response: {
                id: 0,
                token: "string"
            }
        };
    }
    logout() {
        return 200;
    }
    getUser(id) {
        return {
            httpCode: 200,
            response: {
                id: 0,
                username: "string",
                location: "string",
                email: "string"
            }
        };
    }
    updateUser(id, user) {
        return 200;
    }
    deleteUser(id) {
        return 200;
    }
}
exports.Crowdfunder = Crowdfunder;
//# sourceMappingURL=crowdfunder.js.map