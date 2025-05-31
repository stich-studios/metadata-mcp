"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = void 0;
const console_1 = require("console");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    dbHost: process.env.DB_HOST || "localhost",
    dbPort: process.env.DB_PORT || "5432",
    dbName: process.env.DB_NAME || "mydb",
    dbUser: process.env.DB_USER || "user",
    dbPassword: process.env.DB_PASSWORD || "password",
    dbClient: process.env.DB_CLIENT || "pg",
};
const validateConfig = () => {
    (0, console_1.assert)(config.dbHost, "DB_HOST is required");
    (0, console_1.assert)(config.dbPort, "DB_PORT is required");
    (0, console_1.assert)(config.dbName, "DB_NAME is required");
    (0, console_1.assert)(config.dbUser, "DB_USER is required");
    (0, console_1.assert)(config.dbPassword, "DB_PASSWORD is required");
    (0, console_1.assert)(config.dbClient, "DB_CLIENT is required");
    return true;
};
exports.validateConfig = validateConfig;
exports.default = config;
