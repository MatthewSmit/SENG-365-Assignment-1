// Used for the GET - projects/ endpoint. This contains a subset of the project data.
import {isArray, isBoolean, isString} from "util";

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
    backers: [Backer];
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
    creators: [Creator];
    rewards: [Reward];
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
    response: T;
}

export class Crowdfunder {
    public getProjects(startIndex: number, count: number): ApiResponse<[ProjectOverview]> {
        return {
            httpCode: 200,
            response: [{id: 0, title: "string", subtitle: "string", imageUri: "string"}]
        };
    }

    public createProject(project: ProjectData): ApiResponse<number> {
        return {
            httpCode: 200,
            response: 0
        };
    }

    public getProject(id: number): ApiResponse<ProjectDetails> {
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

    public updateProject(id: number, open: boolean): number {
        return 200;
    }

    public getRewards(id: number): ApiResponse<[Reward]> {
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

    public updateRewards(id: number, rewards: [Reward]): number {
        return 200;
    }

    public getImage(id: number): ApiResponse<Buffer> {
        return {
            httpCode: 200,
            response: new Buffer(0)
        }
    }

    public updateImage(id: number, image: any): number {
        return 200;
    }

    public submitPledge(id: number, pledge: Pledge): number {
        return 200;
    }

    public createUser(user: User): ApiResponse<number> {
        return {
            httpCode: 200,
            response: 0
        };
    }

    public login(username: string, password: string): ApiResponse<LogInResponse> {
        return {
            httpCode: 200,
            response: {
                id: 0,
                token: "string"
            }
        };
    }

    public logout(): number {
        return 200;
    }

    public getUser(id: number): ApiResponse<PublicUser> {
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

    public updateUser(id: number, user: User): number {
        return 200;
    }

    public deleteUser(id: number): number {
        return 200;
    }
}