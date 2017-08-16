import {Express} from "express";

export = function(app: Express) {
    const messages: string[] = [];

    const oldOutWrite = process.stdout.write;
    const oldErrorWrite = process.stderr.write;

    process.stdout.write = function(buffer: string): boolean {
        messages.push(buffer);
        return oldOutWrite.apply(process.stdout, arguments);
    };

    process.stderr.write = function(buffer: string): boolean {
        messages.push(buffer);
        return oldErrorWrite.apply(process.stdout, arguments);
    };

    app.get("/api/help", function(request, response) {
        response.json({
            messages: messages
        });
    });
}