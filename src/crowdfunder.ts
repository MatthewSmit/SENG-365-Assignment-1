// Used for the GET - projects/ endpoint. This contains a subset of the project data.
import {isArray, isBoolean, isString} from "util";

import {DataConnection} from "./dataConnection";

interface ProjectOverview {
    id: number;
    title: string;
    subtitle: string;
    imageUri: string;
}

interface Backer {
    name: number;
    amount: number;
}

// object containing project with dynamic content (backers, progress, rewards)
interface ProjectDetails {
    project: Project;
    progress: Progress;
    backers: Backer[];
}

// object containing project, and generated data (creation date, id)
interface Project {
    id: number;
    creationDate: number;
    data: ProjectData;
}

interface Creator {
    id: number;
    name: string;
}

function verifyCreator(creator: any): boolean {
    return 'id' in creator && Number.isInteger(creator.id) &&
        'name' in creator && isString(creator.name);
}

// object containing raw project data.
export interface ProjectData {
    title: string;
    subtitle: string;
    description: string;
    imageUri: string;
    // target amount in cents
    target: number;
    creators: Creator[];
    rewards: Reward[];
}

export function verifyProjectData(projectData: any): boolean {
    let valid = 'title' in projectData && isString(projectData.title) &&
        'subtitle' in projectData && isString(projectData.subtitle) &&
        'description' in projectData && isString(projectData.description) &&
        'imageUri' in projectData && isString(projectData.imageUri) &&
        'target' in projectData && Number.isInteger(projectData.target) &&
        'creators' in projectData && isArray(projectData.creators) &&
        'rewards' in projectData && isArray(projectData.rewards);

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

// assumptions - we are only dealing with a single currency, money can be represented in cents
interface Progress {
    target: number;
    currentPledged: number;
    numberOfBackers: number;
}

// a project reward
interface Reward {
    // id of the reward
    id: number;
    // reward amount in cents
    amount: number;
    // reward description
    description: string;
}

export function verifyReward(reward: any): boolean {
    return 'id' in reward && Number.isInteger(reward.id) &&
        'amount' in reward && Number.isInteger(reward.amount) &&
        'description' in reward && isString(reward.description);
}

interface Pledge {
    // id of the backer
    id: number;
    // pledge amount in cents
    amount: number;
    // hide the username
    anonymous: boolean;
    card: CreditCard;
}

export function verifyPledge(pledge: any): boolean {
    return 'id' in pledge && Number.isInteger(pledge.id) &&
        'amount' in pledge && Number.isInteger(pledge.amount) &&
        'anonymous' in pledge && isBoolean(pledge.anonymous) &&
        'card' in pledge && 'authToken' in pledge.card && isString(pledge.card.authToken);
}

interface CreditCard {
    authToken: string;
}

interface User {
    user: PublicUser;
    password: string;
}

export function verifyUser(user: any): boolean {
    return 'user' in user && verifyPublicUser(user.user) &&
        'password' in user && isString(user.password);
}

interface PublicUser {
    id: number;
    username: string;
    location: string;
    email: string;
}

function verifyPublicUser(user: any): boolean {
    return 'id' in user && Number.isInteger(user.id) &&
        'username' in user && isString(user.username) &&
        'location' in user && isString(user.location) &&
        'email' in user && isString(user.email);
}

interface LogInResponse {
    // the id of the logged in user
    id: number;
    // a token to be used for future calls
    token: string;
}

interface ApiResponse<T> {
    httpCode: number;
    response?: T;
}

export class CrowdFunder {
    private dataConnection: DataConnection;

    constructor(dataConnection: DataConnection) {
        this.dataConnection = dataConnection;
    }

    public getProjects(startIndex: number, count: number, callback: (result: ApiResponse<ProjectOverview[]>) => void) {
        this.dataConnection.query("SELECT id, title, subtitle FROM Projects ORDER BY id LIMIT ? OFFSET ?", [count < 0 ? 200 : count, startIndex], (err, rows, fields) => {
            if (err) {
                callback({
                    httpCode: 500
                });
            }
            else {
                let response: ProjectOverview[] = [];
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

    public createProject(project: ProjectData, callback: (result: ApiResponse<number>) => void): void {
        callback({
            httpCode: 200,
            response: 0
        });
    }

    public getProject(id: number, callback: (result: ApiResponse<ProjectDetails>) => void): void {
        this.dataConnection.query(
            "SELECT Projects.title, Projects.subtitle, Projects.description, Projects.target, Projects.creationDate, COUNT(Backers.user_id), SUM(Backers.amount) " +
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
            "WHERE Backers.project_id = ?;",

            [id, id, id, id],

            (err, rows, fields) => {
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

                    let creators: Creator[] = [];
                    for (let creator of creatorsSql) {
                        creators.push({
                            id: creator.id,
                            name: creator.username
                        });
                    }

                    let rewards: Reward[] = [];
                    for (let reward of rewardsSql) {
                        rewards.push({
                            id: reward.id,
                            amount: reward.amount,
                            description: reward.description
                        });
                    }

                    let backers: Backer[] = [];
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

    public updateProject(id: number, open: boolean, callback: (result: number) => void): void {
        callback(200);
    }

    public getRewards(id: number, callback: (result: ApiResponse<Reward[]>) => void): void {
        this.dataConnection.query(
            "SELECT Rewards.id, Rewards.amount, Rewards.description " +
            "FROM Rewards " +
            "WHERE Rewards.project_id = ?",

            [id, id, id, id],

            (err, rows, fields) => {
                if (err) {
                    callback({
                        httpCode: 500
                    });
                }
                else {
                    let rewards: Reward[] = [];
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

    public updateRewards(id: number, rewards: [Reward], callback: (result: number) => void): void {
        callback(200);
    }

    public getImage(id: number, callback: (result: ApiResponse<Buffer>) => void): void {
        callback({
            httpCode: 200,
            response: new Buffer(0)
        });
    }

    public updateImage(id: number, image: any, callback: (result: number) => void): void {
        callback(200);
    }

    public submitPledge(id: number, pledge: Pledge, callback: (result: number) => void): void {
        callback(200);
    }

    public createUser(user: User, callback: (result: ApiResponse<number>) => void): void {
        callback({
            httpCode: 200,
            response: 0
        });
    }

    public login(username: string, password: string, callback: (result: ApiResponse<LogInResponse>) => void): void {
        callback({
            httpCode: 200,
            response: {
                id: 0,
                token: "string"
            }
        });
    }

    public logout(callback: (result: number) => void) {
        callback(200);
    }

    public getUser(id: number, callback: (result: ApiResponse<PublicUser>) => void): void {
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

    public updateUser(id: number, user: User, callback: (result: number) => void): void {
        callback(200);
    }

    public deleteUser(id: number, callback: (result: number) => void): void {
        callback(200);
    }
}