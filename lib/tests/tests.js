"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const util_1 = require("util");
const request = require("request-promise-native");
const apiPath = "http://localhost:4941/api/v1/";
function isObject(value) {
    return typeof value === "object" && value !== null;
}
function objectHasInteger(object, field) {
    if (!(field in object)) {
        return false;
    }
    return Number.isInteger(object[field]);
}
function objectHasString(object, field) {
    if (!(field in object)) {
        return false;
    }
    return typeof object[field] === "string";
}
function objectHasObject(object, field) {
    if (!(field in object)) {
        return false;
    }
    return isObject(object[field]);
}
function objectHasArray(object, field) {
    if (!(field in object)) {
        return false;
    }
    return Array.isArray(object[field]);
}
function testContentType(test, contentType, regExp) {
    let realContentType;
    if (util_1.isArray(contentType)) {
        realContentType = contentType[0];
    }
    else {
        realContentType = contentType;
    }
    if (util_1.isArray(regExp)) {
        let regexMatch = false;
        for (let regExpInstance of regExp) {
            if (regExpInstance.test(realContentType)) {
                regexMatch = true;
                break;
            }
        }
        test.ok(regexMatch);
    }
    else {
        test.ok(regExp.test(realContentType));
    }
}
function sendRequest(url, method, headers, body, formData) {
    const options = {
        uri: apiPath + url,
        method: method,
        headers: headers,
        simple: false,
        resolveWithFullResponse: true
    };
    if (!util_1.isNullOrUndefined(body)) {
        options.body = JSON.stringify(body);
        headers["content-type"] = "application/json";
    }
    if (!util_1.isNullOrUndefined(formData)) {
        options.formData = formData;
    }
    return request(options);
}
function testJson(test, url, headers) {
    return sendRequest(url, "GET", headers)
        .then((response) => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);
        testContentType(test, response.headers["content-type"], /^application\/json/);
        response.setEncoding("utf8");
        return JSON.parse(response.body);
    });
}
function testImage(test, url, headers) {
    return sendRequest(url, "GET", headers)
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);
        testContentType(test, response.headers["content-type"], [/^image\/png/, /^image\/jpeg/]);
        return response.body;
    });
}
function testHttp(test, url, headers, expectedStatusCode) {
    return sendRequest(url, "GET", headers)
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, expectedStatusCode);
    });
}
function equals(lhs, rhs) {
    if (!Array.isArray(lhs)) {
        throw new Error();
    }
    if (!Array.isArray(rhs)) {
        throw new Error();
    }
    if (lhs.length !== rhs.length) {
        return false;
    }
    for (let i in lhs) {
        if (i) {
            let lhsValue = lhs[i];
            let rhsValue = rhs[i];
            if (!isObject(lhsValue)) {
                return false;
            }
            if (!isObject(rhsValue)) {
                return false;
            }
            if (lhsValue.id !== rhsValue.id) {
                return false;
            }
            if (lhsValue.title !== rhsValue.title) {
                return false;
            }
            if (lhsValue.subtitle !== rhsValue.subtitle) {
                return false;
            }
            if (lhsValue.imageUri !== rhsValue.imageUri) {
                return false;
            }
        }
    }
    return true;
}
function testProjects(test) {
    testJson(test, "projects", {})
        .then(json => {
        test.ok(Array.isArray(json));
        for (let value of json) {
            test.ok(isObject(value));
            test.ok(objectHasInteger(value, "id"));
            test.ok(objectHasString(value, "title"));
            test.ok(objectHasString(value, "subtitle"));
            test.ok(objectHasString(value, "imageUri"));
        }
        test.done();
    })
        .catch(error => {
        test.ok(false, error);
        test.done();
    });
}
exports.testProjects = testProjects;
function testProjectsAdvanced(test) {
    let allProjects;
    testJson(test, "projects", {})
        .then(json => {
        allProjects = json;
        return testJson(test, "projects?startIndex=1&count=4", {});
    })
        .then(json => {
        test.ok(equals(json, allProjects.slice(1, 5)));
        return testJson(test, "projects?startIndex=15&count=1", {});
    })
        .then(json => {
        test.ok(equals(json, allProjects.slice(15, 16)));
        return testJson(test, "projects?startIndex=1000000000&count=1", {});
    })
        .then(json => {
        test.ok(json.length === 0);
        test.done();
    })
        .catch(error => {
        test.ok(false, error);
        test.done();
    });
}
exports.testProjectsAdvanced = testProjectsAdvanced;
function testProjectsCreate(test) {
    let token = null;
    let id = null;
    sendRequest("users/login?username=dclemett0&password=secret", "POST", {})
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);
        testContentType(test, response.headers["content-type"], /^application\/json/);
        response.setEncoding("utf8");
        const json = JSON.parse(response.body);
        objectHasInteger(json, "id");
        objectHasString(json, "token");
        token = json.token;
        id = json.id;
        let projectData = {
            title: "TEST PROJECT",
            subtitle: "TEST PROJECT SUBTITLE",
            description: "TEST PROJECT DESCRIPTION",
            imageUri: "",
            target: 10000,
            creators: [
                {
                    id: id,
                    name: ""
                }
            ],
            rewards: [
                {
                    id: 0,
                    amount: 100,
                    description: "REWARD 0"
                },
                {
                    id: 0,
                    amount: 1000,
                    description: "REWARD 1"
                }
            ]
        };
        return sendRequest("projects", "POST", { "x-authorization": token }, projectData);
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 201);
        testContentType(test, response.headers["content-type"], /^application\/json/);
        response.setEncoding("utf8");
        const json = JSON.parse(response.body);
        test.notStrictEqual(json, 0);
        test.done();
    })
        .catch(error => {
        test.ok(false, error);
        test.done();
    });
}
exports.testProjectsCreate = testProjectsCreate;
function testProjectsId(test) {
    // assume 1 is always a valid id
    testJson(test, "projects/1", {})
        .then(json => {
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
            test.ok(objectHasInteger(backer, "name"));
            test.ok(objectHasInteger(backer, "amount"));
        }
        return testHttp(test, "projects/ham", {}, 404);
    })
        .then(() => {
        test.done();
    })
        .catch(error => {
        test.ok(false, error);
        test.done();
    });
}
exports.testProjectsId = testProjectsId;
function testProjectsModify(test) {
    let token = null;
    sendRequest("projects/1", "PUT", {}, { open: true })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 401);
        return sendRequest("users/login?username=dclemett0&password=secret", "POST", {});
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);
        testContentType(test, response.headers["content-type"], /^application\/json/);
        response.setEncoding("utf8");
        const json = JSON.parse(response.body);
        objectHasInteger(json, "id");
        objectHasString(json, "token");
        token = json.token;
        return sendRequest("projects/1", "PUT", { "x-authorization": token }, { open: true });
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 201);
        test.done();
    })
        .catch(error => {
        test.ok(false, error);
        test.done();
    });
}
exports.testProjectsModify = testProjectsModify;
function testProjectsImage(test) {
    testImage(test, "projects/1/image", {})
        .then(() => {
        test.done();
    })
        .catch(error => {
        test.ok(false, error);
        test.done();
    });
}
exports.testProjectsImage = testProjectsImage;
function testProjectsModifyImage(test) {
    let token = null;
    let formData = {
        image: fs_1.createReadStream(__dirname + "/../../PNG_transparency_demonstration_1.png")
    };
    sendRequest("users/login?username=dclemett0&password=secret", "POST", {})
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);
        testContentType(test, response.headers["content-type"], /^application\/json/);
        response.setEncoding("utf8");
        const json = JSON.parse(response.body);
        objectHasInteger(json, "id");
        objectHasString(json, "token");
        token = json.token;
        return sendRequest("projects/1/image", "PUT", { "x-authorization": token }, null, formData);
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 201);
        test.done();
    })
        .catch(error => {
        test.ok(false, error);
        test.done();
    });
}
exports.testProjectsModifyImage = testProjectsModifyImage;
function testProjectsSubmitPledge(test) {
    test.ok(false);
    test.done();
}
exports.testProjectsSubmitPledge = testProjectsSubmitPledge;
function testProjectsGetRewards(test) {
    testJson(test, "projects/1/rewards", {})
        .then(json => {
        test.ok(Array.isArray(json));
        for (let reward of json) {
            test.ok(isObject(reward));
            test.ok(objectHasInteger(reward, "id"));
            test.ok(objectHasInteger(reward, "amount"));
            test.ok(objectHasString(reward, "description"));
        }
        test.done();
    })
        .catch(error => {
        test.ok(false, error);
        test.done();
    });
}
exports.testProjectsGetRewards = testProjectsGetRewards;
function testProjectsPutRewards(test) {
    test.ok(false);
    test.done();
}
exports.testProjectsPutRewards = testProjectsPutRewards;
function testUsersCreateDelete(test) {
    const TEST_USERNAME = "NewUser";
    const TEST_LOCATION = "NewLocation";
    const TEST_EMAIL = "NewEmail@Email.Email";
    let token = null;
    let id = null;
    sendRequest(`users/login?username=${TEST_USERNAME}&password=secret`, "POST", {})
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 400);
        return sendRequest("users", "POST", {}, {
            user: {
                id: 0,
                username: TEST_USERNAME,
                location: TEST_LOCATION,
                email: TEST_EMAIL
            },
            password: "secret"
        });
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 201);
        return sendRequest(`users/login?username=${TEST_USERNAME}&password=secret`, "POST", {});
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);
        testContentType(test, response.headers["content-type"], /^application\/json/);
        response.setEncoding("utf8");
        const json = JSON.parse(response.body);
        objectHasInteger(json, "id");
        objectHasString(json, "token");
        token = json.token;
        id = json.id;
        return testJson(test, `users/${id}`, { "x-authorization": token });
    })
        .then(json => {
        test.strictEqual(json.username, TEST_USERNAME);
        test.strictEqual(json.location, TEST_LOCATION);
        test.strictEqual(json.email, TEST_EMAIL);
        return sendRequest(`users/${id}`, "DELETE", {});
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 401);
        return sendRequest("users/1", "DELETE", { "x-authorization": token });
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 403);
        return sendRequest(`users/${id}`, "DELETE", { "x-authorization": token });
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);
        test.done();
    })
        .catch(error => {
        test.ok(false, error);
        test.done();
    });
}
exports.testUsersCreateDelete = testUsersCreateDelete;
function testUsersLoginLogout(test) {
    let token = null;
    sendRequest("users/login?username=dclemett0&password=secret", "POST", {})
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);
        testContentType(test, response.headers["content-type"], /^application\/json/);
        response.setEncoding("utf8");
        const json = JSON.parse(response.body);
        objectHasInteger(json, "id");
        objectHasString(json, "token");
        token = json.token;
        return testJson(test, "users/login_status", { "x-authorization": token });
    })
        .then(json => {
        test.strictEqual(json, true);
        // token login resolution is 1s, so wait at least 1s before logging out.
        return new Promise(resolve => setTimeout(() => resolve(), 1000));
    })
        .then(() => {
        return sendRequest("users/logout", "POST", { "x-authorization": token });
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);
        return testJson(test, "users/login_status", { "x-authorization": token });
    })
        .then(json => {
        test.strictEqual(json, false);
        test.done();
    })
        .catch(error => {
        test.ok(false, error);
        test.done();
    });
}
exports.testUsersLoginLogout = testUsersLoginLogout;
function testUsersGet(test) {
    // assume 1 is always a valid id
    testJson(test, "users/1", {})
        .then(json => {
        test.ok(isObject(json));
        test.ok(objectHasInteger(json, "id"));
        test.ok(objectHasString(json, "username"));
        test.ok(objectHasString(json, "location"));
        test.ok(objectHasString(json, "email"));
        return testHttp(test, "users/ham", {}, 404);
    })
        .then(() => {
        test.done();
    })
        .catch(error => {
        test.ok(false, error);
        test.done();
    });
}
exports.testUsersGet = testUsersGet;
function testUsersUpdate(test) {
    const TEST_USERNAME = "NewUserName";
    const TEST_LOCATION = "NewLocation";
    const TEST_EMAIL = "NewEmail@Email.Email";
    let token = null;
    let id = null;
    let originalData = null;
    let newData = null;
    sendRequest("users/login?username=dclemett0&password=secret", "POST", {})
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);
        testContentType(test, response.headers["content-type"], /^application\/json/);
        response.setEncoding("utf8");
        const json = JSON.parse(response.body);
        objectHasInteger(json, "id");
        objectHasString(json, "token");
        token = json.token;
        id = json.id;
        return testJson(test, `users/${id}`, { "x-authorization": token });
    })
        .then(json => {
        originalData = json;
        newData = JSON.parse(JSON.stringify(originalData));
        newData.username = TEST_USERNAME;
        newData.location = TEST_LOCATION;
        newData.email = TEST_EMAIL;
        return sendRequest(`users/${id}`, "PUT", { "x-authorization": token }, {
            user: newData,
            password: "secret"
        });
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);
        return testJson(test, `users/${id}`, { "x-authorization": token });
    })
        .then(json => {
        test.strictEqual(json.username, TEST_USERNAME);
        test.strictEqual(json.location, TEST_LOCATION);
        test.strictEqual(json.email, TEST_EMAIL);
        return sendRequest(`users/${id}`, "PUT", { "x-authorization": token }, {
            user: originalData,
            password: "secret"
        });
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 200);
        return sendRequest(`users/${id}`, "PUT", { "x-authorization": token }, {
            user: newData,
            password: "wrongSecret"
        });
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 401);
        return sendRequest(`users/${id}`, "PUT", {}, {
            user: newData,
            password: "secret"
        });
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 401);
        return sendRequest(`users/5`, "PUT", { "x-authorization": token }, {
            user: newData,
            password: "secret"
        });
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 403);
        return sendRequest(`users/ham`, "PUT", { "x-authorization": token }, {
            user: newData,
            password: "secret"
        });
    })
        .then(response => {
        const statusCode = response.statusCode;
        test.equal(statusCode, 404);
        test.done();
    })
        .catch(error => {
        test.ok(false, error);
        test.done();
    });
}
exports.testUsersUpdate = testUsersUpdate;
//# sourceMappingURL=tests.js.map