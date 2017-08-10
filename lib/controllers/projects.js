"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let dataConnection;
function setup(newDataConnection) {
    dataConnection = newDataConnection;
}
exports.setup = setup;
function getProjects(startIndex, count, callback) {
    // Get data from Projects table
    dataConnection.query("SELECT id, title, subtitle FROM Projects ORDER BY id LIMIT ? OFFSET ?", [count < 0 ? 200 : count, startIndex])
        .then(rows => {
        // Convert from SQL row to ProjectOverview[]
        let response = [];
        for (let project of rows) {
            response.push({
                id: project.id,
                title: project.title,
                subtitle: project.subtitle,
                imageUri: '/api/v1/projects/' + project.id + '/image'
            });
        }
        // Return response
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
    // Multiple queries because we need a lot of data
    dataConnection.query(
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
        "WHERE Backers.project_id = ?;", [id, id, id, id])
        .then(rows => {
        // 404 error if project id doesn't exist
        if (rows[0].length == 0) {
            callback({
                httpCode: 404
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
    // Get all reward data for a project
    dataConnection.query("SELECT Rewards.id, Rewards.amount, Rewards.description " +
        "FROM Rewards " +
        "WHERE Rewards.project_id = ?", [id])
        .then(rows => {
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
    })
        .catch(() => {
        // Return 500 Error if SQL error
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
        if (rows.length == 0) {
            // Return 404 if project not found
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
    })
        .catch(() => {
        // Return 500 if SQL Error
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