"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let dataConnection;
function setup(newDataConnection) {
    dataConnection = newDataConnection;
}
exports.setup = setup;
function getProjects(startIndex, count, callback) {
    // get data from Projects table
    dataConnection.query("SELECT id, title, subtitle FROM Projects ORDER BY id LIMIT ? OFFSET ?", [count < 0 ? 200 : count, startIndex])
        .then(rows => {
        // convert from SQL row to ProjectOverview[]
        let response = [];
        for (let project of rows) {
            response.push({
                id: project.id,
                title: project.title,
                subtitle: project.subtitle,
                imageUri: "/api/v1/projects/" + project.id + "/image"
            });
        }
        // return response
        callback({
            httpCode: 200,
            response: response
        });
    })
        .catch(() => {
        // 500 error if SQL issue
        callback({
            httpCode: 500
        });
    });
}
exports.getProjects = getProjects;
function createProject(project, callback) {
    callback({
        httpCode: 500,
        response: 0
    });
}
exports.createProject = createProject;
function getProject(id, callback) {
    // multiple queries because we need a lot of data
    dataConnection.query(
    // get project information, including number of backers and sum of backer amount
    "SELECT Projects.title, Projects.subtitle, Projects.description, Projects.target, Projects.creationDate, COUNT(Backers.user_id), SUM(Backers.amount) " +
        "FROM Projects " +
        "INNER JOIN Backers ON Backers.project_id = Projects.id " +
        "WHERE id = ?; " +
        // get id, username of the project creators
        "SELECT Users.id, Users.username " +
        "FROM ProjectCreators " +
        "INNER JOIN Users ON Users.id = ProjectCreators.user_id " +
        "WHERE ProjectCreators.project_id = ?; " +
        // get reward descriptions
        "SELECT Rewards.id, Rewards.amount, Rewards.description " +
        "FROM Rewards " +
        "WHERE Rewards.project_id = ?; " +
        // get all backers for the project
        "SELECT Users.id, Users.username, Backers.amount, Backers.private " +
        "FROM Backers " +
        "INNER JOIN Users ON Users.id = Backers.user_id " +
        "WHERE Backers.project_id = ?;", [id, id, id, id])
        .then(rows => {
        // 404 error if project id doesn't exist
        if (rows[0].length === 0) {
            callback({
                httpCode: 404
            });
        }
        else {
            // convert from sql data to json data
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
                if (backer.private === 0) {
                    backers.push({
                        name: backer.username,
                        amount: backer.amount
                    });
                }
            }
            // return response
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
                            imageUri: `/api/v1/projects/${id}/image`,
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
    })
        .catch(() => {
        // 500 error if SQL error
        callback({
            httpCode: 500
        });
    });
}
exports.getProject = getProject;
function updateProject(id, open, callback) {
    callback(500);
}
exports.updateProject = updateProject;
function getRewards(id, callback) {
    // get all reward data for a project
    dataConnection.query("SELECT Rewards.id, Rewards.amount, Rewards.description " +
        "FROM Rewards " +
        "WHERE Rewards.project_id = ?", [id])
        .then(rows => {
        // convert from SQL format to JSON format
        let rewards = [];
        for (let reward of rows) {
            rewards.push({
                id: reward.id,
                amount: reward.amount,
                description: reward.description
            });
        }
        // return response
        callback({
            httpCode: 200,
            response: rewards
        });
    })
        .catch(() => {
        // return 500 Error if SQL error
        callback({
            httpCode: 500
        });
    });
}
exports.getRewards = getRewards;
function updateRewards(id, rewards, callback) {
    callback(500);
}
exports.updateRewards = updateRewards;
function getImage(id, callback) {
    dataConnection.query("SELECT imageData FROM Projects WHERE id=?", [id])
        .then(rows => {
        if (rows.length === 0) {
            // return 404 if project not found
            callback({
                httpCode: 404
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
                // return the image
                let type = match[1];
                let data = match[2];
                callback({
                    httpCode: 200,
                    type: type,
                    response: new Buffer(data, "base64")
                });
            }
        }
    })
        .catch(() => {
        // return 500 if SQL Error
        callback({
            httpCode: 500
        });
    });
}
exports.getImage = getImage;
function updateImage(id, image, callback) {
    callback(500);
}
exports.updateImage = updateImage;
function submitPledge(id, pledge, callback) {
    callback(500);
}
exports.submitPledge = submitPledge;
//# sourceMappingURL=projects.js.map