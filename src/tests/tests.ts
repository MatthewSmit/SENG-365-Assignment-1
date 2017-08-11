import {Test} from "nodeunit";
import {RequestResponse} from "request";
import {isArray, isNullOrUndefined} from "util";

import request = require("request-promise-native");
import {IPublicUser} from "../controllers/interfaces";

const apiPath: string = "http://localhost:4941/api/v1/";

function isObject(value: any): boolean {
    return typeof value === "object" && value !== null;
}

function objectHasInteger(object: any, field: string): boolean {
    if (!(field in object)) {
        return false;
    }

    return Number.isInteger(object[field]);
}

function objectHasString(object: any, field: string): boolean {
    if (!(field in object)) {
        return false;
    }

    return typeof object[field] === "string";
}

function objectHasObject(object: any, field: string): boolean {
    if (!(field in object)) {
        return false;
    }

    return isObject(object[field]);
}

function objectHasArray(object: any, field: string): any {
    if (!(field in object)) {
        return false;
    }

    return Array.isArray(object[field]);
}

function testContentType(test: Test, contentType: string | string[], regExp: RegExp | RegExp[]): void {
    let realContentType: string;

    if (isArray(contentType)) {
        realContentType = contentType[0];
    } else {
        realContentType = contentType;
    }

    if (isArray(regExp)) {
        let regexMatch: boolean = false;
        for (let regExpInstance of regExp) {
            if (regExpInstance.test(realContentType)) {
                regexMatch = true;
                break;
            }
        }
        test.ok(regexMatch);
    } else {
        test.ok(regExp.test(realContentType));
    }
}

function sendRequest(url: string, method: string, headers: any, body?: any): Promise<RequestResponse> {
    const options: any = {
        uri: apiPath + url,
        method: method,
        headers: headers,
        simple: false,
        resolveWithFullResponse: true
    };

    if (!isNullOrUndefined(body)) {
        options.body = JSON.stringify(body);
        headers["content-type"] = "application/json";
    }

    return request(options);
}

function testJson(test: Test, url: string, headers: any): Promise<any> {
    return sendRequest(url, "GET", headers)
        .then((response: RequestResponse) => {
            const statusCode: number = response.statusCode;
            test.equal(statusCode, 200);

            testContentType(test, response.headers["content-type"], /^application\/json/);

            response.setEncoding("utf8");

            return JSON.parse(response.body);
        });
}

function testImage(test: Test, url: string, headers: any): Promise<void> {
    return sendRequest(url, "GET", headers)
        .then(response => {
            const statusCode: number = response.statusCode;
            test.equal(statusCode, 200);

            testContentType(test, response.headers["content-type"], [/^image\/png/, /^image\/jpeg/]);

            return response.body;
        });
}

function testHttp(test: Test, url: string, headers: any, expectedStatusCode: number): Promise<void> {
    return sendRequest(url, "GET", headers)
        .then(response => {
            const statusCode: number = response.statusCode;
            test.equal(statusCode, expectedStatusCode);
        });
}

function equals(lhs: any, rhs: any): boolean {
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
            let lhsValue: any = lhs[i];
            let rhsValue: any = rhs[i];

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


export function testProjects(test: Test): void {
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

export function testProjectsAdvanced(test: Test): void {
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

export function testProjectsCreate(test: Test): void {
    test.ok(false);
    test.done();
}

export function testProjectsId(test: Test): void {
    // assume 1 is always a valid id
    testJson(test, "projects/1", {})
        .then(json => {
            test.ok(isObject(json));
            test.ok(objectHasObject(json, "project"));
            test.ok(objectHasObject(json, "progress"));
            test.ok(objectHasArray(json, "backers"));

            const project: any = json.project;
            test.ok(objectHasInteger(project, "id"));
            test.ok(objectHasInteger(project, "creationDate"));
            test.ok(objectHasObject(project, "data"));

            const projectData: any = project.data;
            test.ok(objectHasString(projectData, "title"));
            test.ok(objectHasString(projectData, "subtitle"));
            test.ok(objectHasString(projectData, "description"));
            test.ok(objectHasString(projectData, "imageUri"));
            test.ok(objectHasInteger(projectData, "target"));
            test.ok(objectHasArray(projectData, "creators"));
            test.ok(objectHasArray(projectData, "rewards"));

            const projectCreators: any = projectData.creators;
            for (let projectCreator of projectCreators) {
                test.ok(isObject(projectCreator));
                test.ok(objectHasInteger(projectCreator, "id"));
                test.ok(objectHasString(projectCreator, "name"));
            }

            const projectRewards: any = projectData.rewards;
            for (let projectReward of projectRewards) {
                test.ok(isObject(projectReward));
                test.ok(objectHasInteger(projectReward, "id"));
                test.ok(objectHasInteger(projectReward, "amount"));
                test.ok(objectHasString(projectReward, "description"));
            }

            const progress: any = json.progress;
            test.ok(objectHasInteger(progress, "target"));
            test.ok(objectHasInteger(progress, "currentPledged"));
            test.ok(objectHasInteger(progress, "numberOfBackers"));

            const backers: any = json.backers;
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

export function testProjectsModify(test: Test): void {
    test.ok(false);
    test.done();
}

export function testProjectsImage(test: Test): void {
    testImage(test, "projects/1/image", {})
        .then(() => {
            test.done();
        })
        .catch(error => {
            test.ok(false, error);
            test.done();
        });
}

export function testProjectsModifyImage(test: Test): void {
    test.ok(false);
    test.done();
}

export function testProjectsSubmitPledge(test: Test): void {
    test.ok(false);
    test.done();
}

export function testProjectsGetRewards(test: Test): void {
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

export function testProjectsPutRewards(test: Test): void {
    test.ok(false);
    test.done();
}

export function testUsersCreateDelete(test: Test): void {
    test.ok(false);
    test.done();
}

export function testUsersLoginLogout(test: Test): void {
    let token: string = null;

    sendRequest("users/login?username=dclemett0&password=secret", "POST", {})
        .then(response => {
            const statusCode: number = response.statusCode;
            test.equal(statusCode, 200);

            testContentType(test, response.headers["content-type"], /^application\/json/);

            response.setEncoding("utf8");
            const json: any = JSON.parse(response.body);

            objectHasInteger(json, "id");
            objectHasString(json, "token");

            token = json.token;

            return testJson(test, "users/login_status", {"x-authorization": token});
        })
        .then(json => {
            test.strictEqual(json, true);

            // token login resolution is 1s, so wait at least 1s before logging out.
            return new Promise(resolve => setTimeout(() => resolve(), 1000));
        })
        .then(() => {
            return sendRequest("users/logout", "POST", {"x-authorization": token});
        })
        .then(response => {
            const statusCode: number = response.statusCode;
            test.equal(statusCode, 200);

            return testJson(test, "users/login_status", {"x-authorization": token});
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

export function testUsersGet(test: Test): void {
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

export function testUsersUpdate(test: Test): void {
    const TEST_USERNAME: string = "NewUserName";
    const TEST_LOCATION: string = "NewLocation";
    const TEST_EMAIL: string = "NewEmail@Email.Email";

    let token: string = null;
    let id: number = null;
    let originalData: IPublicUser = null;
    let newData: IPublicUser = null;

    sendRequest("users/login?username=dclemett0&password=secret", "POST", {})
        // test login worked then get user data
        .then(response => {
            const statusCode: number = response.statusCode;
            test.equal(statusCode, 200);

            testContentType(test, response.headers["content-type"], /^application\/json/);

            response.setEncoding("utf8");
            const json: any = JSON.parse(response.body);

            objectHasInteger(json, "id");
            objectHasString(json, "token");

            token = json.token;
            id = json.id;

            return testJson(test, `users/${id}`, {"x-authorization": token});
        })
        // store original user data then update user data with test data
        .then(json => {
            originalData = json;

            newData = JSON.parse(JSON.stringify(originalData));
            newData.username = TEST_USERNAME;
            newData.location = TEST_LOCATION;
            newData.email = TEST_EMAIL;

            return sendRequest(`users/${id}`, "PUT", {"x-authorization": token}, {
                user: newData,
                password: "secret"
            });
        })
        // test user data response then get user data again
        .then(response => {
            const statusCode: number = response.statusCode;
            test.equal(statusCode, 200);

            return testJson(test, `users/${id}`, {"x-authorization": token});
        })
        // test user data was changed then restore original user data
        .then(json => {
            test.strictEqual(json.username, TEST_USERNAME);
            test.strictEqual(json.location, TEST_LOCATION);
            test.strictEqual(json.email, TEST_EMAIL);

            return sendRequest(`users/${id}`, "PUT", {"x-authorization": token}, {
                user: originalData,
                password: "secret"
            });
        })
        // test updating user data with wrong password
        .then(response => {
            const statusCode: number = response.statusCode;
            test.equal(statusCode, 200);

            return sendRequest(`users/${id}`, "PUT", {"x-authorization": token}, {
                user: newData,
                password: "wrongSecret"
            });
        })
        // test updating user data with no token
        .then(response => {
            const statusCode: number = response.statusCode;
            test.equal(statusCode, 401);

            return sendRequest(`users/${id}`, "PUT", {}, {
                user: newData,
                password: "secret"
            });
        })
        // test updating other user data
        .then(response => {
            const statusCode: number = response.statusCode;
            test.equal(statusCode, 401);

            return sendRequest(`users/5`, "PUT", {"x-authorization": token}, {
                user: newData,
                password: "secret"
            });
        })
        // test updating user data with invalid id
        .then(response => {
            const statusCode: number = response.statusCode;
            test.equal(statusCode, 403);

            return sendRequest(`users/ham`, "PUT", {"x-authorization": token}, {
                user: newData,
                password: "secret"
            });
        })
        .then(response => {
            const statusCode: number = response.statusCode;
            test.equal(statusCode, 404);

            test.done();
        })
        .catch(error => {
            test.ok(false, error);
            test.done();
        });
}