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
class CrowdFunder {
    constructor(dataConnection) {
        this.dataConnection = dataConnection;
    }
    getProjects(startIndex, count, callback) {
        this.dataConnection.query("SELECT id, title, subtitle FROM Projects ORDER BY id LIMIT ? OFFSET ?", [count < 0 ? 200 : count, startIndex], (err, rows, fields) => {
            if (err) {
                callback({
                    httpCode: 500
                });
            }
            else {
                let response = [];
                for (let project of rows) {
                    response.push({
                        id: project.id,
                        title: project.title,
                        subtitle: project.subtitle,
                        imageUri: '/projects/' + project.id + '/image'
                    });
                }
                callback({
                    httpCode: 200,
                    response: response
                });
            }
        });
    }
    createProject(project, callback) {
        callback({
            httpCode: 200,
            response: 0
        });
    }
    getProject(id, callback) {
        this.dataConnection.query("SELECT Projects.title, Projects.subtitle, Projects.description, Projects.target, Projects.creationDate, COUNT(Backers.user_id), SUM(Backers.amount) " +
            "FROM Projects " +
            "INNER JOIN Backers ON Backers.project_id = Projects.id " +
            "WHERE id = ?; " +
            "SELECT Users.id, Users.username " +
            "FROM ProjectCreators " +
            "INNER JOIN Users ON Users.id = ProjectCreators.user_id " +
            "WHERE ProjectCreators.project_id = ?; " +
            "SELECT Rewards.id, Rewards.amount, Rewards.description " +
            "FROM Rewards " +
            "WHERE Rewards.project_id = ?; " +
            "SELECT Users.id, Users.username, Backers.amount, Backers.private " +
            "FROM Backers " +
            "INNER JOIN Users ON Users.id = Backers.user_id " +
            "WHERE Backers.project_id = ?;", [id, id, id, id], (err, rows, fields) => {
            if (err) {
                callback({
                    httpCode: 500
                });
            }
            else {
                if (rows[0].length == 0) {
                    callback({
                        httpCode: 400
                    });
                }
                else {
                    const projectSql = rows[0][0];
                    const creatorsSql = rows[1];
                    const rewardsSql = rows[2];
                    const backersSql = rows[3];
                    let creators = [];
                    for (let creator of creatorsSql) {
                        creators.push({
                            id: creator.id,
                            name: creator.username
                        });
                    }
                    let rewards = [];
                    for (let reward of rewardsSql) {
                        rewards.push({
                            id: reward.id,
                            amount: reward.amount,
                            description: reward.description
                        });
                    }
                    let backers = [];
                    for (let backer of backersSql) {
                        if (backer.private == 0) {
                            backers.push({
                                name: backer.username,
                                amount: backer.amount
                            });
                        }
                    }
                    callback({
                        httpCode: 200,
                        response: {
                            project: {
                                id: id,
                                creationDate: projectSql.creationDate,
                                data: {
                                    title: projectSql.title,
                                    subtitle: projectSql.subtitle,
                                    description: projectSql.description,
                                    imageUri: '/projects/' + id + '/image',
                                    target: projectSql.target,
                                    creators: creators,
                                    rewards: rewards
                                }
                            },
                            progress: {
                                target: projectSql.target,
                                currentPledged: projectSql["SUM(Backers.amount)"],
                                numberOfBackers: projectSql["COUNT(Backers.user_id)"]
                            },
                            backers: backers
                        }
                    });
                }
            }
        });
    }
    updateProject(id, open, callback) {
        callback(200);
    }
    getRewards(id, callback) {
        this.dataConnection.query("SELECT Rewards.id, Rewards.amount, Rewards.description " +
            "FROM Rewards " +
            "WHERE Rewards.project_id = ?", [id, id, id, id], (err, rows, fields) => {
            if (err) {
                callback({
                    httpCode: 500
                });
            }
            else {
                let rewards = [];
                for (let reward of rows) {
                    rewards.push({
                        id: reward.id,
                        amount: reward.amount,
                        description: reward.description
                    });
                }
                callback({
                    httpCode: 200,
                    response: rewards
                });
            }
        });
    }
    updateRewards(id, rewards, callback) {
        callback(200);
    }
    getImage(id, callback) {
        callback({
            httpCode: 200,
            response: new Buffer(0)
        });
    }
    updateImage(id, image, callback) {
        callback(200);
    }
    submitPledge(id, pledge, callback) {
        callback(200);
    }
    createUser(user, callback) {
        callback({
            httpCode: 200,
            response: 0
        });
    }
    login(username, password, callback) {
        callback({
            httpCode: 200,
            response: {
                id: 0,
                token: "string"
            }
        });
    }
    logout(callback) {
        callback(200);
    }
    getUser(id, callback) {
        callback({
            httpCode: 200,
            response: {
                id: 0,
                username: "string",
                location: "string",
                email: "string"
            }
        });
    }
    updateUser(id, user, callback) {
        callback(200);
    }
    deleteUser(id, callback) {
        callback(200);
    }
}
exports.CrowdFunder = CrowdFunder;
//# sourceMappingURL=crowdfunder.js.map