#!/usr/bin/env node --max-old-space-size=4096
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import { parseArgs } from "node:util";
import fs from "fs";

import chalk from "chalk";
import { watch } from "chokidar";
import JSON5 from "json5";
import { Adapter, Low } from "lowdb";
import { DataFile, JSONFile } from "lowdb/node";
import { PackageJson } from "type-fest";

import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { Observer } from "./observer.js";
import { Data } from "./service.js";

function help() {
  console.log(`Usage: also-json-server [options] <file>

Options:
  -p, --port <port>      Port (default: 3000)
  -h, --host <host>      Host (default: localhost)
  -s, --static <dir>     Static files directory (multiple allowed)
  -a, --auth             Use authorization to access
  -P, --path <path>      Add partial path to customize url, like /api/v1
  -o, --return-object    Return result as an object with status code, message and data
  -t  --try-server       Generate a data file to try the server
  -d  --delay <auto|ms>  Delay the response for some milliseconds to mimic network latency,
                         "auto" means the time will be in 300~1000 ms randomly for each request.     
  --help                 Show this message
  --version              Show version number
`);
}

const test_data = {
  users: [
    {
      id: "1",
      username: "User1",
      password: "UserPass1",
      token: "3604ab439517b1bc0161a8debd461d8461863b99",
    },
    {
      id: "2",
      username: "User2",
      password: "UserPass2",
      token: "aeabb98dde7f53034dc8946edb0816f3511dedf2",
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
    { id: "1", name: "Tracy", mobile: "(555)1234-1256", groups:["1","2"] },
    { id: "2", name: "Tina", mobile: "(555)2367-1287", groups:["1","3"] },
    { id: "3", name: "Bill", mobile: "(555)2589-1134", groups:["1","2","3"] },
    { id: "4", name: "Michael", mobile: "(555)3345-2345", groups:[] },
    { id: "5", name: "Jackie", mobile: "(555)1123-1123", groups:[] },
  ],
  groups: [
    { id: "1", name: "Collegue" },
    { id: "2", name: "Friend" },
    { id: "3", name: "Family" },
    { id: "4", name: "Business" },
  ],
  profile: {
    name: "typicode",
  },
};

// Parse args
function args(): {
  auth: boolean;
  file: string;
  port: number;
  host: string;
  path: string;
  return_object: boolean;
  try_server: boolean;
  delay: string;
  static: string[];
} {
  try {
    const { values, positionals } = parseArgs({
      options: {
        auth: {
          type: "boolean",
          short: "a",
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
          short: "P",
          default: "",
        },
        "return-object": {
          type: "boolean",
          short: "o",
        },
        "try-server": {
          type: "boolean",
          short: "t",
        },
        delay: {
          type: "string",
          short: "d",
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
      const pkg = JSON.parse(
        readFileSync(
          fileURLToPath(new URL("../package.json", import.meta.url)),
          "utf-8"
        )
      ) as PackageJson;
      console.log(pkg.version);
      process.exit();
    }

    // Handle --watch
    if (values.watch) {
      console.log(
        chalk.yellow(
          "--watch/-w can be omitted, JSON Server 1+ watches for file changes by default"
        )
      );
    }

    if (values.help || (!values["try-server"] && positionals.length === 0)) {
      help();
      process.exit();
    }
    let path = "";
    if ((values.path as string).length > 0) {
      path = (values.path as string).replace(/\/+$/, "");
      if (!/^\/([a-zA-Z0-9\-/]+)$/.test(path))
        throw new Error("Invalid Path Option!");
    }
    // App args and options
    return {
      auth: values.auth as boolean,
      file: positionals[0] ?? "",
      port: parseInt(values.port as string),
      path,
      try_server: values["try-server"] ?? false,
      return_object: values["return-object"] as boolean,
      host: values.host as string,
      delay: values.delay as string,
      static: values.static as string[],
    };
  } catch (e) {
    if (
      (e as NodeJS.ErrnoException).code === "ERR_PARSE_ARGS_UNKNOWN_OPTION" ||
      (e as NodeJS.ErrnoException).code ===
        "ERR_PARSE_ARGS_INVALID_OPTION_VALUE"
    ) {
      console.log(
        chalk.red((e as NodeJS.ErrnoException).message.split(".")[0])
      );
      help();
      process.exit(1);
    } else {
      throw e;
    }
  }
}

const {
  auth,
  file,
  port,
  host,
  path,
  return_object,
  try_server,
  delay,
  static: staticArr,
} = args();

let data_file = try_server ? "also-json-server-test-db.json5" : file;

if (try_server) {
  try {
    fs.writeFileSync(data_file, JSON5.stringify(test_data, null, 4));
  } catch (err) {
    console.error("Write test db file failed.", err);
    process.exit(1);
  }
}

if (!try_server && !existsSync(data_file)) {
  console.log(chalk.red(`Data file ${data_file} not found`));
  process.exit(1);
}

// Handle empty string JSON file
if (readFileSync(data_file, "utf-8").trim() === "") {
  writeFileSync(data_file, "{}");
}

// Set up database
let adapter: Adapter<Data>;
if (extname(data_file) === ".json5") {
  adapter = new DataFile<Data>(data_file, {
    parse: JSON5.parse,
    stringify: JSON5.stringify,
  });
} else {
  adapter = new JSONFile<Data>(data_file);
}
const observer = new Observer(adapter);

const db = new Low<Data>(observer, {});
await db.read();

// Create app
const app = createApp(
  db,
  { logger: false, static: staticArr },
  auth,
  path,
  return_object,
  delay
);

function logRoutes(data: Data) {
  console.log(chalk.bold("Endpoints:"));
  if (Object.keys(data).length === 0) {
    console.log(
      chalk.gray(`No endpoints found, try adding some data to ${file}`)
    );
    return;
  }
  console.log(
    auth
      ? `POST ${chalk.gray(
          `http://${host}:${port}${path}/${chalk.blue("auth/login")}`
        )}\n`
      : "",
    Object.keys(data)
      .map(
        (key) =>
          `${chalk.gray(`http://${host}:${port}${path}/`)}${chalk.blue(key)}`
      )
      .join("\n")
  );
}

const kaomojis = ["♡⸜(˶˃ ᵕ ˂˶)⸝♡", "♡( ◡‿◡ )", "( ˶ˆ ᗜ ˆ˵ )", "(˶ᵔ ᵕ ᵔ˶)"];

function randomItem(items: string[]): string {
  const index = Math.floor(Math.random() * items.length);
  return items.at(index) ?? "";
}

app.listen(port, () => {
  console.log(
    [
      chalk.bold(`Also JSON Server started on PORT :${port}`),
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
    ].join("\n")
  );
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
          return console.log(
            chalk.red(["", `Error parsing ${file}`, e.message].join("\n"))
          );
        }
        console.log(e);
      });
    }
  });
}
