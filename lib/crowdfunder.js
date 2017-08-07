"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const util_1 = require("util");
const config = require("./config");
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
        // Get data from Projects table
        this.dataConnection.query("SELECT id, title, subtitle FROM Projects ORDER BY id LIMIT ? OFFSET ?", [count < 0 ? 200 : count, startIndex], (err, rows, fields) => {
            // 500 error if SQL issue
            if (err) {
                callback({
                    httpCode: 500
                });
            }
            else {
                // Convert from SQL row to ProjectOverview[]
                let response = [];
                for (let project of rows) {
                    response.push({
                        id: project.id,
                        title: project.title,
                        subtitle: project.subtitle,
                        imageUri: '/projects/' + project.id + '/image'
                    });
                }
                // Return response
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
        // Multiple queries because we need a lot of data
        this.dataConnection.query(
        // Get project information, including number of backers and sum of backer amount
        "SELECT Projects.title, Projects.subtitle, Projects.description, Projects.target, Projects.creationDate, COUNT(Backers.user_id), SUM(Backers.amount) " +
            "FROM Projects " +
            "INNER JOIN Backers ON Backers.project_id = Projects.id " +
            "WHERE id = ?; " +
            // Get id, username of the project creators
            "SELECT Users.id, Users.username " +
            "FROM ProjectCreators " +
            "INNER JOIN Users ON Users.id = ProjectCreators.user_id " +
            "WHERE ProjectCreators.project_id = ?; " +
            // Get reward descriptions
            "SELECT Rewards.id, Rewards.amount, Rewards.description " +
            "FROM Rewards " +
            "WHERE Rewards.project_id = ?; " +
            // Get all backers for the project
            "SELECT Users.id, Users.username, Backers.amount, Backers.private " +
            "FROM Backers " +
            "INNER JOIN Users ON Users.id = Backers.user_id " +
            "WHERE Backers.project_id = ?;", [id, id, id, id], (err, rows, fields) => {
            if (err) {
                // 500 error if SQL error
                callback({
                    httpCode: 500
                });
            }
            else {
                // 400 error if project id doesn't exist
                if (rows[0].length == 0) {
                    callback({
                        httpCode: 400
                    });
                }
                else {
                    // Convert from sql data to json data
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
                    // Return response
                    callback({
                        httpCode: 200,
                        response: {
                            project: {
                                id: id,
                                creationDate: projectSql.creationDate.getTime(),
                                data: {
                                    title: projectSql.title,
                                    subtitle: projectSql.subtitle,
                                    description: projectSql.description,
                                    imageUri: `/projects/${id}/image`,
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
        // Get all reward data for a project
        this.dataConnection.query("SELECT Rewards.id, Rewards.amount, Rewards.description " +
            "FROM Rewards " +
            "WHERE Rewards.project_id = ?", [id], (err, rows, fields) => {
            if (err) {
                // Return 500 Error if SQL error
                callback({
                    httpCode: 500
                });
            }
            else {
                // Convert from SQL format to JSON format
                let rewards = [];
                for (let reward of rows) {
                    rewards.push({
                        id: reward.id,
                        amount: reward.amount,
                        description: reward.description
                    });
                }
                // Return response
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
        this.dataConnection.query("SELECT imageData FROM Projects WHERE id=?", [id], (err, rows, fields) => {
            if (err) {
                // Return 500 if SQL Error
                callback({
                    httpCode: 500
                });
            }
            else if (rows.length == 0) {
                // Return 400 if project not found
                callback({
                    httpCode: 400
                });
            }
            else {
                // stored in the database as data:image/png;base64,BASE64 PNG DATA
                let image = rows[0].imageData;
                let match = image.match(/^data:([^,;]+);base64,(.+)$/);
                if (match === null) {
                    // 500 if unable to extract data from image. This shouldn't happen.
                    console.log(`Regex for getting image for project id: ${id} has failed`);
                    callback({
                        httpCode: 500
                    });
                }
                else {
                    // Return the image
                    let type = match[1];
                    let data = match[2];
                    callback({
                        httpCode: 200,
                        type: type,
                        response: new Buffer(data, "base64")
                    });
                }
            }
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
        this.dataConnection.query("SELECT id, password FROM Users WHERE username=?", [username], (err, rows) => {
            if (err) {
                callback({
                    httpCode: 500
                });
            }
            else if (rows.length != 1) {
                callback({
                    httpCode: 400
                });
            }
            else {
                // Return 400 if password is wrong
                //TODO: Should this hash the password or does the client do that?
                const user = rows[0];
                if (user.password != password) {
                    callback({
                        httpCode: 400
                    });
                }
                else {
                    // Generate token for user
                    const id = Number(user.id);
                    jwt.sign({
                        id: id
                    }, config.tokenSecret, { expiresIn: "30d" }, function (err, token) {
                        if (err) {
                            console.log("Error when generating login token:");
                            console.log(err);
                            callback({
                                httpCode: 500
                            });
                        }
                        else {
                            callback({
                                httpCode: 200,
                                response: {
                                    id: id,
                                    token: token
                                }
                            });
                        }
                    });
                }
            }
        });
    }
    logout(callback) {
        callback(200);
    }
    getUser(id, callback) {
        this.dataConnection.query("SELECT username, email, location FROM Users WHERE id=?", [id], (err, rows, fields) => {
            if (err) {
                callback({
                    httpCode: 500
                });
            }
            else {
                if (rows.length == 0) {
                    callback({
                        httpCode: 400
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