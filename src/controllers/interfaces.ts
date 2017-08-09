import {isArray, isBoolean, isString} from "util";

// Used for the GET - projects/ endpoint. This contains a subset of the project data.
export interface ProjectOverview {
    id: number;
    title: string;
    subtitle: string;
    imageUri: string;
}

export interface Backer {
    name: number;
    amount: number;
}

// object containing project with dynamic content (backers, progress, rewards)
export interface ProjectDetails {
    project: Project;
    progress: Progress;
    backers: Backer[];
}

// object containing project, and generated data (creation date, id)
export interface Project {
    id: number;
    creationDate: number;
    data: ProjectData;
}

export interface Creator {
    id: number;
    name: string;
}

export function verifyCreator(creator: any): boolean {
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
export interface Progress {
    target: number;
    currentPledged: number;
    numberOfBackers: number;
}

// a project reward
export interface Reward {
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

export interface Pledge {
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

export interface CreditCard {
    authToken: string;
}

export interface User {
    user: PublicUser;
    password: string;
}

export function verifyUser(user: any): boolean {
    return 'user' in user && verifyPublicUser(user.user) &&
        'password' in user && isString(user.password);
}

export interface PublicUser {
    id: number;
    username: string;
    location: string;
    email: string;
}

export function verifyPublicUser(user: any): boolean {
    return 'id' in user && Number.isInteger(user.id) &&
        'username' in user && isString(user.username) &&
        'location' in user && isString(user.location) &&
        'email' in user && isString(user.email);
}

export interface LogInResponse {
    // the id of the logged in user
    id: number;
    // a token to be used for future calls
    token: string;
}

export interface ApiResponse<T> {
    httpCode: number;
    type?: string,
    response?: T;
}