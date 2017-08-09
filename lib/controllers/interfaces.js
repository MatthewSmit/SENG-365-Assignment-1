"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
function verifyCreator(creator) {
    return 'id' in creator && Number.isInteger(creator.id) &&
        'name' in creator && util_1.isString(creator.name);
}
exports.verifyCreator = verifyCreator;
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
exports.verifyPublicUser = verifyPublicUser;
//# sourceMappingURL=interfaces.js.map