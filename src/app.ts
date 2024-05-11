import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

import { App, Request, Response } from "@tinyhttp/app";
import { cors } from "@tinyhttp/cors";
import { Eta } from "eta";
import { Low } from "lowdb";
import { json } from "milliparsec";
import sirv from "sirv";

import { Data, isItem, Service } from "./service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env["NODE_ENV"] === "production";

const randInt = (min:number, max:number) => Math.floor(Math.random() * (max - min + 1)) + min;


export type AppOptions = {
  logger?: boolean;
  static?: string[];
};

const eta = new Eta({
  views: join(__dirname, "../views"),
  cache: isProduction,
});

export function createApp(
  db: Low<Data>,
  options: AppOptions = {},
  auth: boolean,
  path: string,
  return_object: boolean,
  delay: string
) {
  // Create service
  const service = new Service(db);
  service.return_object = return_object

  // Create app
  const app = new App();

 

    
  app.use((_req, _res, next)=>{
    let sleep_time = 0
    if(delay && delay==="auto"){
      sleep_time = randInt(300,1000)
    }
    else{
      sleep_time = parseInt(delay)?parseInt(delay):0
    }
    setTimeout(next,sleep_time)
  })



  app.use((req, res, next) => {
    const canGoThrough = req.url.includes("/auth/login") || req.url==="/";
    if (canGoThrough) {
      next();
      return;
    }
    if(auth){
      const token = extractToken(req) as string;
    
      if (!token) {
        unauthorizedResponse(res);
        return;
      }
    
      // Check token validity
      const retv = service.checkToken(token);
      
      if (!retv["result"]) {
        unauthorizedResponse(res);
        return;
      }
      
      // Authorized
      service.user = retv["user"];
      next();
    }
    else{
      delete req.query["_token"]
      next()
    }   
  });
  
  function extractToken(req: Request) {
    const bearerToken = req.headers.authorization;
    
    if (bearerToken && bearerToken.split(" ").length > 1) {
      return bearerToken.split(" ")[1];
    }
    
    const queryToken = req.query["_token"];
    if (queryToken) {
      delete req.query["_token"];
      return queryToken;
    }
    
    return null;
  }
  
  function unauthorizedResponse(res: Response) {
    res.status(401).send({
      code: 401,
      msg: "Unauthorized",
    });
  }
  

  // Static files
  app.use(sirv("public", { dev: !isProduction }));
  options.static
    ?.map((path) => (isAbsolute(path) ? path : join(process.cwd(), path)))
    .forEach((dir) => app.use(sirv(dir, { dev: !isProduction })));

  // CORS
  app.use(cors()).options("*", cors());

  // Body parser
  app.use(json());

  app.post(`${path}/auth/login`, (req, res, _next) => {
    console.log(req.body);
    const username = req.body["username"]
    const password = req.body["password"]
    const retv = service.login(username,password)
    if(retv["result"]){
      res.send({
        status_code: 200,
        user: retv["user"],
      })
    }
    else{
      res.send({
        status_code: 401,
        msg: "Unauthorized"
      });
    }
    
  });

  app.get("/", (_req, res) =>
    res.send(eta.render("index.html", { data: db.data, path }))
  );

  app.get(`${path}/:name`, (req, res, next) => {
    const { name = "" } = req.params;
    const query = Object.fromEntries(
      Object.entries(req.query)
        .map(([key, value]) => {
          if (
            ["_start", "_end", "_limit", "_page", "_per_page"].includes(key) &&
            typeof value === "string"
          ) {
            return [key, parseInt(value)];
          } else {
            return [key, value];
          }
        })
        .filter(([_, value]) => !Number.isNaN(value))
    );
    res.locals["data"] = service.find(name, query);
    next();
  });

  app.get(`${path}/:name/:id`, (req, res, next) => {
    const { name = "", id = "" } = req.params;
    res.locals["data"] = service.findById(name, id, req.query);
    next();
  });

  app.post(`${path}/:name`, async (req, res, next) => {
    const { name = "" } = req.params;
    if (isItem(req.body)) {
      res.locals["data"] = await service.create(name, req.body);
    }
    next();
  });

  app.put(`${path}/:name`, async (req, res, next) => {
    const { name = "" } = req.params;
    if (isItem(req.body)) {
      res.locals["data"] = await service.update(name, req.body);
    }
    next();
  });

  app.put(`${path}/:name/:id`, async (req, res, next) => {
    const { name = "", id = "" } = req.params;
    if (isItem(req.body)) {
      res.locals["data"] = await service.updateById(name, id, req.body);
    }
    next();
  });

  app.patch(`${path}/:name`, async (req, res, next) => {
    const { name = "" } = req.params;
    if (isItem(req.body)) {
      res.locals["data"] = await service.patch(name, req.body);
    }
    next();
  });

  app.patch(`${path}/:name/:id`, async (req, res, next) => {
    const { name = "", id = "" } = req.params;
    if (isItem(req.body)) {
      res.locals["data"] = await service.patchById(name, id, req.body);
    }
    next();
  });

  app.delete(`${path}/:name/:id`, async (req, res, next) => {
    const { name = "", id = "" } = req.params;
    res.locals["data"] = await service.destroyById(
      name,
      id,
      req.query["_dependent"]
    );
    next();
  });

  app.use(`${path}/:name`, (req, res) => {
    const { data } = res.locals;
    if (data === undefined) {
      res.sendStatus(404);
    } else {
      if (req.method === "POST") res.status(201);
      res.json(data);
    }
  });

  return app;
}
