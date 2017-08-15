"use strict";
module.exports = function (app) {
    const messages = [];
    const oldOutWrite = process.stdout.write;
    const oldErrorWrite = process.stderr.write;
    process.stdout.write = function (buffer) {
        messages.push(buffer);
        return oldOutWrite.apply(process.stdout, arguments);
    };
    process.stderr.write = function (buffer) {
        messages.push(buffer);
        return oldErrorWrite.apply(process.stdout, arguments);
    };
    app.get("/api/help", function (request, response) {
        response.json({
            messages: messages
        });
    });
};
//# sourceMappingURL=helper.js.map