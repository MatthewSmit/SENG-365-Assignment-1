import {isArray, isBoolean, isString} from "util";

import {DataConnection} from "./dataConnection";
import {createToken, TokenData} from "./token";

// Used for the GET - projects/ endpoint. This contains a subset of the project data.
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
    type?: string,
    response?: T;
}

export class CrowdFunder {
    private dataConnection: DataConnection;

    constructor(dataConnection: DataConnection) {
        this.dataConnection = dataConnection;
    }

    public getProjects(startIndex: number, count: number, callback: (result: ApiResponse<ProjectOverview[]>) => void) {
        // Get data from Projects table
        this.dataConnection.query("SELECT id, title, subtitle FROM Projects ORDER BY id LIMIT ? OFFSET ?",
            [count < 0 ? 200 : count, startIndex],
            (err, rows) => {
            // 500 error if SQL issue
            if (err) {
                callback({
                    httpCode: 500
                });
            }
            else {
                // Convert from SQL row to ProjectOverview[]
                let response: ProjectOverview[] = [];
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
            "WHERE Backers.project_id = ?;",

            [id, id, id, id],

            (err, rows) => {
            if (err) {
                // 500 error if SQL error
                callback({
                    httpCode: 500
                });
            }
            else {
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
            }
        });
    }

    public updateProject(id: number, open: boolean, callback: (result: number) => void): void {
        callback(200);
    }

    public getRewards(id: number, callback: (result: ApiResponse<Reward[]>) => void): void {
        // Get all reward data for a project
        this.dataConnection.query(
            "SELECT Rewards.id, Rewards.amount, Rewards.description " +
            "FROM Rewards " +
            "WHERE Rewards.project_id = ?",

            [id],

            (err, rows) => {
                if (err) {
                    // Return 500 Error if SQL error
                    callback({
                        httpCode: 500
                    });
                }
                else {
                    // Convert from SQL format to JSON format
                    let rewards: Reward[] = [];
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

    public updateRewards(id: number, rewards: [Reward], callback: (result: number) => void): void {
        callback(200);
    }

    public getImage(id: number, callback: (result: ApiResponse<Buffer>) => void): void {
        this.dataConnection.query("SELECT imageData FROM Projects WHERE id=?",
            [id],
            (err, rows) => {
                if (err) {
                    // Return 500 if SQL Error
                    callback({
                        httpCode: 500
                    });
                }
                else if (rows.length == 0) {
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
                        let type =  match[1];
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
        this.dataConnection.query("SELECT id, password FROM Users WHERE username=?",
            [username],
            (err, rows) => {
                if (err) {
                    callback({
                        httpCode: 500
                    });
                }
                // 400 error if username doesn't match 1 user. (We should prevent it from matching more then 1 user in both SQL and createUser)
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
                        let token: string = null;
                        try {
                            token = createToken(id);
                        }
                        catch (error) {
                            console.log("Error when generating login token:");
                            console.log(err);
                            callback({
                                httpCode: 500
                            });
                        }
                        if (token !== null) {
                            callback({
                                httpCode: 200,
                                response: {
                                    id: id,
                                    token: token
                                }
                            });
                        }
                    }
                }
            });
    }

    public logout(callback: (result: number) => void) {
        callback(200);
    }

    public getUser(id: number, callback: (result: ApiResponse<PublicUser>) => void): void {
        this.dataConnection.query(
            "SELECT username, email, location FROM Users WHERE id=?",
            [id],
            (err, rows) => {
                if (err) {
                    callback({
                        httpCode: 500
                    });
                }
                else {
                    if (rows.length == 0) {
                        callback({
                            httpCode: 404
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

    public getLoginStatus(token: TokenData, callback: (result: ApiResponse<boolean>) => void): void {
        const id = token.id;
        this.dataConnection.query(
            "SELECT logoutTime FROM Users WHERE id=?",
            [id],
            (err, rows) => {
                if (err) {
                    callback({
                        httpCode: 500
                    });
                }
                else {
                    if (rows.length == 0) {
                        callback({
                            httpCode: 200,
                            response: false
                        });
                    }
                    else {
                        const user = rows[0];
                        const logoutTime: Date = user.logoutTime;
                        if (logoutTime >= token.issuedAt) {
                            callback({
                                httpCode: 200,
                                response: false
                            });
                        }
                        else {
                            callback({
                                httpCode: 200,
                                response: true
                            });
                        }
                    }
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