#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import { parseArgs } from "node:util";
import fs from "fs";
import chalk from "chalk";
import { watch } from "chokidar";
import JSON5 from "json5";
import { Low } from "lowdb";
import { DataFile, JSONFile } from "lowdb/node";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { Observer } from "./observer.js";
function help() {
    console.log(`Usage: also-json-server [options] <file>

Options:
  -p, --port <port>         Port (default: 3000)
  -h, --host <host>         Host (default: localhost)
  -s, --static <dir>        Static files directory (multiple allowed)
  --auth                    Use authorization to access
  --path                    Add partial path to url to mimic versioning, like /api/v1
  --object                  Return result as an object with status code, message
  --use-test-db <file>      Generate a db file to try the server
  --help                    Show this message
  --version                 Show version number
`);
}
const test_data = {
    users: [
        {
            id: "1",
            username: "user",
            password: "pass",
            token: "12dea96fec20593566ab75692c9949596833adc9",
        },
    ],
    posts: [
        { id: "1", title: "a title", views: 100 },
        { id: "2", title: "another title", views: 200 },
    ],
    comments: [
        { id: "1", text: "a comment about post 1", postId: "1" },
        { id: "2", text: "another comment about post 1", postId: "1" },
    ],
    contacts: [
        { id: "1", name: "Tracy", mobile: "(555)1234-1256" },
        { id: "2", name: "Tina", mobile: "(555)2367-1287" },
        { id: "3", name: "Bill", mobile: "(555)2589-1134" },
        { id: "4", name: "Michael", mobile: "(555)3345-2345" },
        { id: "5", name: "Jackie", mobile: "(555)1123-1123" },
    ],
    groups: [
        { id: "1", name: "Colegue" },
        { id: "2", name: "Friend" },
        { id: "3", name: "Family" },
        { id: "4", name: "Business" },
    ],
    contacts_groups: [
        { id: "1", contactId: "1", groupId: "1" },
        { id: "2", contactId: "1", groupId: "2" },
        { id: "3", contactId: "2", groupId: "1" },
        { id: "4", contactId: "2", groupId: "3" },
        { id: "5", contactId: "3", groupId: "1" },
        { id: "6", contactId: "3", groupId: "2" },
        { id: "7", contactId: "3", groupId: "3" },
    ],
    members: [
        { id: "1", name: "Lexi", clubs: ["1", "3"] },
        { id: "2", name: "Ben", clubs: ["1"] },
        { id: "3", name: "Billy", clubs: ["2", "3"] },
        { id: "4", name: "Jane", clubs: ["1", "5"] },
        { id: "5", name: "Jhon", clubs: ["2", "5"] },
        { id: "6", name: "Mark", clubs: [] },
        { id: "7", name: "Joe", clubs: ["1", "3"] },
    ],
    clubs: [
        { id: "1", name: "club 1" },
        { id: "2", name: "club 2" },
        { id: "3", name: "club 3" },
        { id: "4", name: "club 4" },
        { id: "5", name: "club 5" },
    ],
};
// Parse args
function args() {
    try {
        const { values, positionals } = parseArgs({
            options: {
                auth: {
                    type: "boolean",
                },
                port: {
                    type: "string",
                    short: "p",
                    default: process.env["PORT"] ?? "3000",
                },
                host: {
                    type: "string",
                    short: "h",
                    default: process.env["HOST"] ?? "localhost",
                },
                path: {
                    type: "string",
                    default: "",
                },
                object: {
                    type: "boolean",
                },
                "use-test-db": {
                    type: "string",
                },
                static: {
                    type: "string",
                    short: "s",
                    multiple: true,
                    default: [],
                },
                help: {
                    type: "boolean",
                },
                version: {
                    type: "boolean",
                },
                // Deprecated
                watch: {
                    type: "boolean",
                    short: "w",
                },
            },
            allowPositionals: true,
        });
        // --version
        if (values.version) {
            const pkg = JSON.parse(readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf-8"));
            console.log(pkg.version);
            process.exit();
        }
        // Handle --watch
        if (values.watch) {
            console.log(chalk.yellow("--watch/-w can be omitted, JSON Server 1+ watches for file changes by default"));
        }
        if (values.help || positionals.length === 0) {
            help();
            process.exit();
        }
        let path = "";
        if (values.path.length > 0) {
            path = values.path.replace(/\/+$/, "");
            if (!/^\/([a-zA-Z0-9\-/]+)$/.test(path))
                throw new Error("Invalid Path Option!");
        }
        // App args and options
        return {
            auth: values.auth,
            file: positionals[0] ?? "",
            port: parseInt(values.port),
            path,
            test_db: values["use-test-db"] ?? "",
            object: values.object,
            host: values.host,
            static: values.static,
        };
    }
    catch (e) {
        if (e.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION") {
            console.log(chalk.red(e.message.split(".")[0]));
            help();
            process.exit(1);
        }
        else {
            throw e;
        }
    }
}
const { auth, file, port, host, path, object, test_db, static: staticArr, } = args();
if (test_db) {
    let db_name = test_db;
    if (!(test_db.endsWith(".json") || test_db.endsWith(".json5"))) {
        db_name = `${test_db}.json5`;
    }
    let data_string = '';
    if (db_name.endsWith(".json5")) {
        data_string = test_data.toString();
    }
    else {
        data_string = JSON.stringify(test_data);
    }
    try {
        fs.writeFileSync(db_name, data_string);
    }
    catch (err) {
        console.error("Write test db file failed.", err);
    }
}
if (!test_db && !existsSync(file)) {
    console.log(chalk.red(`File ${file} not found`));
    process.exit(1);
}
// Handle empty string JSON file
if (readFileSync(file, "utf-8").trim() === "") {
    writeFileSync(file, "{}");
}
// Set up database
let adapter;
if (extname(file) === ".json5") {
    adapter = new DataFile(file, {
        parse: JSON5.parse,
        stringify: JSON5.stringify,
    });
}
else {
    adapter = new JSONFile(file);
}
const observer = new Observer(adapter);
const db = new Low(observer, {});
await db.read();
// Create app
const app = createApp(db, { logger: false, static: staticArr }, auth, path, object);
function logRoutes(data) {
    console.log(chalk.bold("Endpoints:"));
    if (Object.keys(data).length === 0) {
        console.log(chalk.gray(`No endpoints found, try adding some data to ${file}`));
        return;
    }
    console.log(auth
        ? `${chalk.gray(`http://${host}:${port}/${chalk.blue("auth/login")}`)}\n`
        : "", Object.keys(data)
        .map((key) => `${chalk.gray(`http://${host}:${port}${path}/`)}${chalk.blue(key)}`)
        .join("\n"));
}
const kaomojis = ["♡⸜(˶˃ ᵕ ˂˶)⸝♡", "♡( ◡‿◡ )", "( ˶ˆ ᗜ ˆ˵ )", "(˶ᵔ ᵕ ᵔ˶)"];
function randomItem(items) {
    const index = Math.floor(Math.random() * items.length);
    return items.at(index) ?? "";
}
app.listen(port, () => {
    console.log([
        chalk.bold(`JSON Server started on PORT :${port}`),
        chalk.gray(auth ? "Using auth..." : ""),
        chalk.gray("Press CTRL-C to stop"),
        chalk.gray(`Watching ${file}...`),
        "",
        chalk.magenta(randomItem(kaomojis)),
        "",
        chalk.bold("Index:"),
        chalk.gray(`http://${host}:${port}/`),
        "",
        chalk.bold("Static files:"),
        chalk.gray("Serving ./public directory if it exists"),
        "",
    ].join("\n"));
    logRoutes(db.data);
});
// Watch file for changes
if (process.env["NODE_ENV"] !== "production") {
    let writing = false; // true if the file is being written to by the app
    let prevEndpoints = "";
    observer.onWriteStart = () => {
        writing = true;
    };
    observer.onWriteEnd = () => {
        writing = false;
    };
    observer.onReadStart = () => {
        prevEndpoints = JSON.stringify(Object.keys(db.data).sort());
    };
    observer.onReadEnd = (data) => {
        if (data === null) {
            return;
        }
        const nextEndpoints = JSON.stringify(Object.keys(data).sort());
        if (prevEndpoints !== nextEndpoints) {
            console.log();
            logRoutes(data);
        }
    };
    watch(file).on("change", () => {
        // Do no reload if the file is being written to by the app
        if (!writing) {
            db.read().catch((e) => {
                if (e instanceof SyntaxError) {
                    return console.log(chalk.red(["", `Error parsing ${file}`, e.message].join("\n")));
                }
                console.log(e);
            });
        }
    });
}
