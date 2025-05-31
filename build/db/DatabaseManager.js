"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const knex_1 = require("knex");
const config_1 = __importStar(require("../config"));
/**
 * Manages the database connection and provides methods to interact with video metadata.
 */
class DatabaseManager {
    _db;
    _isConnected = false;
    static _instance;
    /**
     * Creates an instance of DatabaseManager. Does not connect to the database immediately.
     *
     * @param connectionConfig Optional Knex configuration object to override default connection settings.
     */
    constructor(connectionConfig) {
        // ensure all necessary env variables are set.
        (0, config_1.validateConfig)();
        this._db = (0, knex_1.knex)({
            client: config_1.default.dbClient,
            connection: {
                host: config_1.default.dbHost,
                port: parseInt(config_1.default.dbPort, 10),
                database: config_1.default.dbName,
                user: config_1.default.dbUser,
                password: config_1.default.dbPassword,
            },
            ...connectionConfig,
        });
    }
    /**
     * Gets the singleton instance of DatabaseManager.
     * @param connectionConfig Optional Knex configuration object to override default connection settings.
     * @returns The singleton instance of DatabaseManager.
     */
    static getInstance(connectionConfig) {
        if (!DatabaseManager._instance) {
            DatabaseManager._instance = new DatabaseManager(connectionConfig);
        }
        return DatabaseManager._instance;
    }
    /**
     * Connects to the database and verifies the connection.
     */
    async connect() {
        try {
            await this._db.raw("SELECT 1");
            console.log("Database connected successfully");
            this._isConnected = true;
        }
        catch (error) {
            console.error("Database connection failed:", error);
            this._isConnected = false;
            throw error;
        }
    }
    /**
     * Disconnects from the database.
     */
    async disconnect() {
        await this._db.destroy();
        console.log("Database disconnected");
    }
    get conn() {
        if (!this._db) {
            throw new Error("Database connection is not initialized. Call connect() first.");
        }
        if (!this._isConnected) {
            throw new Error("Database is not connected. Call connect() first.");
        }
        return this._db;
    }
}
exports.DatabaseManager = DatabaseManager;
