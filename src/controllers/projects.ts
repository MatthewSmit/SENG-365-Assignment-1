import {DataConnection} from "../dataConnection";
import {IApiResponse, IBacker, ICreator, IPledge, IProjectData, IProjectDetails, IProjectOverview, IReward} from "./interfaces";

let dataConnection: DataConnection;

export function setup(newDataConnection: DataConnection): void {
    dataConnection = newDataConnection;
}

export function getProjects(startIndex: number, count: number, callback: (result: IApiResponse<IProjectOverview[]>) => void): void {
    // get data from Projects table
    dataConnection.query("SELECT id, title, subtitle FROM Projects ORDER BY id LIMIT ? OFFSET ?",
        [count < 0 ? 200 : count, startIndex])
        .then(rows => {
            // convert from SQL row to ProjectOverview[]
            let response: IProjectOverview[] = [];
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

export function createProject(project: IProjectData, callback: (result: IApiResponse<number>) => void): void {
    callback({
        httpCode: 500,
        response: 0
    });
}

export function getProject(id: number, callback: (result: IApiResponse<IProjectDetails>) => void): void {
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
    "WHERE Backers.project_id = ?;",

    [id, id, id, id])
        .then(rows => {
            // 404 error if project id doesn't exist
            if (rows[0].length === 0) {
                callback({
                    httpCode: 404
                });
            } else {
                // convert from sql data to json data
                const projectSql: any = rows[0][0];
                const creatorsSql: any = rows[1];
                const rewardsSql: any = rows[2];
                const backersSql: any = rows[3];

                let creators: ICreator[] = [];
                for (let creator of creatorsSql) {
                    creators.push({
                        id: creator.id,
                        name: creator.username
                    });
                }

                let rewards: IReward[] = [];
                for (let reward of rewardsSql) {
                    rewards.push({
                        id: reward.id,
                        amount: reward.amount,
                        description: reward.description
                    });
                }

                let backers: IBacker[] = [];
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

export function updateProject(id: number, open: boolean, callback: (result: number) => void): void {
    callback(500);
}

export function getRewards(id: number, callback: (result: IApiResponse<IReward[]>) => void): void {
    // get all reward data for a project
    dataConnection.query(
        "SELECT Rewards.id, Rewards.amount, Rewards.description " +
        "FROM Rewards " +
        "WHERE Rewards.project_id = ?",

        [id])
        .then(rows => {
            // convert from SQL format to JSON format
            let rewards: IReward[] = [];
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

export function updateRewards(id: number, rewards: [IReward], callback: (result: number) => void): void {
    callback(500);
}

export function getImage(id: number, callback: (result: IApiResponse<Buffer>) => void): void {
    dataConnection.query("SELECT imageData FROM Projects WHERE id=?",
    [id])
        .then(rows => {
            if (rows.length === 0) {
                // return 404 if project not found
                callback({
                    httpCode: 404
                });
            } else {
                // stored in the database as data:image/png;base64,BASE64 PNG DATA
                let image: string = rows[0].imageData;
                let match: RegExpMatchArray = image.match(/^data:([^,;]+);base64,(.+)$/);
                if (match === null) {
                    // 500 if unable to extract data from image. This shouldn't happen.
                    console.log(`Regex for getting image for project id: ${id} has failed`);
                    callback({
                        httpCode: 500
                    });
                } else {
                    // return the image
                    let type: string = match[1];
                    let data: string = match[2];
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

export function updateImage(id: number, image: any, callback: (result: number) => void): void {
    callback(500);
}

export function submitPledge(id: number, pledge: IPledge, callback: (result: number) => void): void {
    callback(500);
}