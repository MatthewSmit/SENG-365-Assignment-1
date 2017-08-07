const http = require('http');
const basePath = "http://localhost/api/v1/";

function isObject(value) {
    return typeof value === "object" && value !== null;
}

function objectHasInteger(object, field) {
    if (!(field in object))
        return false;

    return Number.isInteger(object[field]);
}

function objectHasString(object, field) {
    if (!(field in object))
        return false;

    return typeof object[field] === "string";
}

function objectHasObject(object, field) {
    if (!(field in object))
        return false;

    return isObject(object[field]);
}

function objectHasArray(object, field) {
    if (!(field in object))
        return false;

    return Array.isArray(object[field]);
}

function testJson(test, url, callback) {
    http.get(basePath + url, response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);

        const contentType = response.headers['content-type'];
        test.ok(/^application\/json/.test(contentType));

        response.setEncoding('utf8');
        let rawData = '';
        response.on('data', chunk => { rawData += chunk; });
        response.on('end', () => {
            const parsedData = JSON.parse(rawData);
            callback(parsedData);
            test.done();
        });
    }).on('error', (e) => {
        test.fail();
        test.done();
    });
}

exports.testProjects = function(test) {
    testJson(test, "projects", json => {
        test.ok(Array.isArray(json));

        for (let value of json) {
            test.ok(isObject(value));

            test.ok(objectHasInteger(value, "id"));
            test.ok(objectHasString(value, "title"));
            test.ok(objectHasString(value, "subtitle"));
            test.ok(objectHasString(value, "imageUri"));
        }
    });
};

exports.testProjectsAdvanced = function(test) {
    test.fail();
    test.done();
};

exports.testProjectsCreate = function(test) {
    test.fail();
    test.done();
};

exports.testProjectsId = function(test) {
    // Assume 1 is always a valid id
    testJson(test, "projects/1", json => {
        test.ok(isObject(json));
        test.ok(objectHasObject(json, "project"));
        test.ok(objectHasObject(json, "progress"));
        test.ok(objectHasArray(json, "backers"));

        const project = json.project;
        test.ok(objectHasInteger(project, "id"));
        test.ok(objectHasInteger(project, "creationDate"));
        test.ok(objectHasObject(project, "data"));

        const projectData = project.data;
        test.ok(objectHasString(projectData, "title"));
        test.ok(objectHasString(projectData, "subtitle"));
        test.ok(objectHasString(projectData, "description"));
        test.ok(objectHasString(projectData, "imageUri"));
        test.ok(objectHasInteger(projectData, "target"));
        test.ok(objectHasArray(projectData, "creators"));
        test.ok(objectHasArray(projectData, "rewards"));

        const projectCreators = projectData.creators;
        for (let projectCreator of projectCreators) {
            test.ok(isObject(projectCreator));
            test.ok(objectHasInteger(projectCreator, "id"));
            test.ok(objectHasString(projectCreator, "name"));
        }

        const projectRewards = projectData.rewards;
        for (let projectReward of projectRewards) {
            test.ok(isObject(projectReward));
            test.ok(objectHasInteger(projectReward, "id"));
            test.ok(objectHasInteger(projectReward, "amount"));
            test.ok(objectHasString(projectReward, "description"));
        }

        const progress = json.progress;
        test.ok(objectHasInteger(progress, "target"));
        test.ok(objectHasInteger(progress, "currentPledged"));
        test.ok(objectHasInteger(progress, "numberOfBackers"));

        const backers = json.backers;
        for (let backer of backers) {
            test.ok(isObject(backer));
            test.ok(objectHasString(backer, "name"));
            test.ok(objectHasInteger(backer, "amount"));
        }
    });
};

exports.testProjectsModify = function(test) {
    test.fail();
    test.done();
};

exports.testProjectsImage = function(test) {
    test.fail();
    test.done();
};

exports.testProjectsModifyImage = function(test) {
    test.fail();
    test.done();
};

exports.testProjectsSubmitPledge = function(test) {
    test.fail();
    test.done();
};

exports.testProjectsGetRewards = function(test) {
    test.fail();
    test.done();
};

exports.testProjectsPutRewards = function(test) {
    test.fail();
    test.done();
};

exports.testUsersCreateDelete = function(test) {
    test.fail();
    test.done();
};

exports.testUsersLoginLogout = function(test) {
    test.fail();
    test.done();
};

exports.testUsersGet = function(test) {
    test.fail();
    test.done();
};

exports.testUsersUpdate = function(test) {
    test.fail();
    test.done();
};