import {Test} from "nodeunit";
import request = require('request-promise-native')
import {isArray} from "util";
import {RequestResponse} from "request";

const apiPath = "http://localhost:4941/api/v1/";

function isObject(value: any) {
    return typeof value === "object" && value !== null;
}

function objectHasInteger(object: any, field: string) {
    if (!(field in object))
        return false;

    return Number.isInteger(object[field]);
}

function objectHasString(object: any, field: string) {
    if (!(field in object))
        return false;

    return typeof object[field] === "string";
}

function objectHasObject(object: any, field: string) {
    if (!(field in object))
        return false;

    return isObject(object[field]);
}

function objectHasArray(object: any, field: string) {
    if (!(field in object))
        return false;

    return Array.isArray(object[field]);
}

function testContentType(test: Test, contentType: string | string[], regExp: RegExp | RegExp[]) {
    let realContentType;

    if (isArray(contentType)) {
        realContentType = contentType[0];
    }
    else {
        realContentType = contentType;
    }

    if (isArray(regExp)) {
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

function sendRequest(url: string, method: string, headers: any): Promise<RequestResponse> {
    const options: any = {
        uri: apiPath + url,
        method: method,
        headers: headers,
        simple: false,
        resolveWithFullResponse: true
    };

    return request(options);
}

function testJson(test: Test, url: string, headers: any): Promise<any> {
    return sendRequest(url, "GET", headers)
        .then((response: RequestResponse) => {
            const statusCode = response.statusCode;
            test.equal(statusCode, 200);

            testContentType(test, response.headers['content-type'], /^application\/json/);

            response.setEncoding('utf8');

            return JSON.parse(response.body);
        });
}

function testImage(test: Test, url: string, headers: any): Promise<void> {
    return sendRequest(url, "GET", headers)
        .then(response => {
            const statusCode = response.statusCode;
            test.equal(statusCode, 200);

            testContentType(test, response.headers['content-type'], [/^image\/png/, /^image\/jpeg/]);

            return response.body;
        });
}

function testHttp(test: Test, url: string, headers: any, expectedStatusCode: number): Promise<void> {
    return sendRequest(url, "GET", headers)
        .then(response => {
            const statusCode = response.statusCode;
            test.equal(statusCode, expectedStatusCode);
        });
}

function equals(lhs: any, rhs: any) {
    if (!Array.isArray(lhs))
        throw new Error();
    if (!Array.isArray(rhs))
        throw new Error();

    if (lhs.length !== rhs.length)
        return false;

    for (let i in lhs) {
        let lhsValue = lhs[i];
        let rhsValue = rhs[i];

        if (!isObject(lhsValue))
            return false;
        if (!isObject(rhsValue))
            return false;

        if (lhsValue.id !== rhsValue.id)
            return false;
        if (lhsValue.title !== rhsValue.title)
            return false;
        if (lhsValue.subtitle !== rhsValue.subtitle)
            return false;
        if (lhsValue.imageUri !== rhsValue.imageUri)
            return false;
    }

    return true;
}


export function testProjects(test: Test) {
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

export function testProjectsAdvanced(test: Test) {
    let allProjects: any;

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

export function testProjectsCreate(test: Test) {
    test.ok(false);
    test.done();
}

export function testProjectsId(test: Test) {
    // Assume 1 is always a valid id
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
                test.ok(objectHasString(backer, "name"));
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

export function testProjectsModify(test: Test) {
    test.ok(false);
    test.done();
}

export function testProjectsImage(test: Test) {
    testImage(test, "projects/1/image", {})
        .then(() => {
            test.done();
        })
        .catch(error => {
            test.ok(false, error);
            test.done
        });
}

export function testProjectsModifyImage(test: Test) {
    test.ok(false);
    test.done();
}

export function testProjectsSubmitPledge(test: Test) {
    test.ok(false);
    test.done();
}

export function testProjectsGetRewards(test: Test) {
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

export function testProjectsPutRewards(test: Test) {
    test.ok(false);
    test.done();
}

export function testUsersCreateDelete(test: Test) {
    test.ok(false);
    test.done();
}

export function testUsersLoginLogout(test: Test) {
    let token: string = null;

    sendRequest('users/login?username=dclemett0&password=secret', "POST", {})
        .then(response => {
            const statusCode = response.statusCode;
            test.equal(statusCode, 200);

            testContentType(test, response.headers['content-type'], /^application\/json/);

            response.setEncoding('utf8');
            const json = JSON.parse(response.body);

            objectHasInteger(json, "id");
            objectHasString(json, "token");

            token = json.token;

            return testJson(test, 'users/login_status', { "x-authorization": token });
        })
        .then(json => {
            test.strictEqual(json, true);

            // Token login resolution is 1s, so wait at least 1s before logging out.
            return new Promise(resolve => setTimeout(() => resolve(), 1000));
        })
        .then(() => {
            return sendRequest('users/logout', "POST", { "x-authorization": token });
        })
        .then(response => {
            const statusCode = response.statusCode;
            test.equal(statusCode, 200);

            testContentType(test, response.headers['content-type'], /^application\/json/);

            return testJson(test, 'users/login_status', { "x-authorization": token });
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

export function testUsersGet(test: Test) {
    // Assume 1 is always a valid id
    testJson(test, "users/1", {})
        .catch(json => {
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

export function testUsersUpdate(test: Test) {
    test.ok(false);
    test.done();
}