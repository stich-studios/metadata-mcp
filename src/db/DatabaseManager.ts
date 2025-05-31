import { knex, Knex } from "knex";
import config, { validateConfig } from "../config";

/**
 * Manages the database connection and provides methods to interact with video metadata.
 */
export class DatabaseManager {
  private _db: Knex;
  private _isConnected = false;
  private static _instance: DatabaseManager;

  /**
   * Creates an instance of DatabaseManager. Does not connect to the database immediately.
   *
   * @param connectionConfig Optional Knex configuration object to override default connection settings.
   */
  private constructor(connectionConfig?: Knex.Config) {
    // ensure all necessary env variables are set.
    validateConfig();

    this._db = knex({
      client: config.dbClient,
      connection: {
        host: config.dbHost,
        port: parseInt(config.dbPort, 10),
        database: config.dbName,
        user: config.dbUser,
        password: config.dbPassword,
      },
      ...connectionConfig,
    });
  }

  /**
   * Gets the singleton instance of DatabaseManager.
   * @param connectionConfig Optional Knex configuration object to override default connection settings.
   * @returns The singleton instance of DatabaseManager.
   */
  public static getInstance(connectionConfig?: Knex.Config): DatabaseManager {
    if (!DatabaseManager._instance) {
      DatabaseManager._instance = new DatabaseManager(connectionConfig);
    }
    return DatabaseManager._instance;
  }

  /**
   * Connects to the database and verifies the connection.
   */
  async connect(): Promise<void> {
    try {
      await this._db.raw("SELECT 1");
      console.log("Database connected successfully");
      this._isConnected = true;
    } catch (error) {
      console.error("Database connection failed:", error);
      this._isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnects from the database.
   */
  async disconnect(): Promise<void> {
    await this._db.destroy();
    console.log("Database disconnected");
  }

  get conn(): Knex {
    if (!this._db) {
      throw new Error(
        "Database connection is not initialized. Call connect() first."
      );
    }

    if (!this._isConnected) {
      throw new Error("Database is not connected. Call connect() first.");
    }

    return this._db;
  }
}
