import { assert } from "console";
import dotenv from "dotenv";
export interface EnvConfig {
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dbClient: string;
}

dotenv.config();

const config: EnvConfig = {
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: process.env.DB_PORT || "5432",
  dbName: process.env.DB_NAME || "mydb",
  dbUser: process.env.DB_USER || "user",
  dbPassword: process.env.DB_PASSWORD || "password",
  dbClient: process.env.DB_CLIENT || "pg",
};

export const validateConfig = () => {
  assert(config.dbHost, "DB_HOST is required");
  assert(config.dbPort, "DB_PORT is required");
  assert(config.dbName, "DB_NAME is required");
  assert(config.dbUser, "DB_USER is required");
  assert(config.dbPassword, "DB_PASSWORD is required");
  assert(config.dbClient, "DB_CLIENT is required");
  return true;
};

export default config;
