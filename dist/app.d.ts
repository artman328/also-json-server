import { App, Request, Response } from "@tinyhttp/app";
import { Low } from "lowdb";
import { Data } from "./service.js";
export type AppOptions = {
    logger?: boolean;
    static?: string[];
};
export declare function createApp(db: Low<Data>, options: AppOptions | undefined, auth: boolean, path: string, object: boolean): App<Request, Response<unknown>>;
