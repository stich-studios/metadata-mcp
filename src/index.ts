import express from "express";
import { Server } from "./server.js";
import { DatabaseManager } from "./db/DatabaseManager.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";

dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith("--mode="));
const mode = modeArg ? modeArg.split("=")[1] : process.env.MCP_MODE || "stdio";

const db = DatabaseManager.getInstance();

async function startHttpServer() {
  console.log("Starting HTTP MCP Server...");

  await db.connect();
  console.log("Database connected successfully");

  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req: express.Request, res: express.Response) => {
    try {
      const srv: Server = new Server(db);
      await srv.initialize();

      const transport: StreamableHTTPServerTransport =
        new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });

      res.on("close", () => {
        console.log("Request closed");
        transport.close();
        srv.shutdown();
      });

      await srv.server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", async (req: express.Request, res: express.Response) => {
    console.log("Received GET MCP request");
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      })
    );
  });

  app.delete("/mcp", async (req: express.Request, res: express.Response) => {
    console.log("Received DELETE MCP request");
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      })
    );
  });

  // Health check endpoint
  app.get("/health", (req: express.Request, res: express.Response) => {
    res.json({
      status: "ok",
      mode: "http",
      timestamp: new Date().toISOString(),
    });
  });

  const PORT = process.env.PORT || 8181;
  app.listen(PORT, () => {
    console.log(`MCP HTTP Server listening on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
  });
}

async function startStdioServer() {
  console.error("Starting stdio MCP Server...");

  try {
    await db.connect();
    console.error("Database connected successfully");

    const server = new Server(db);
    await server.initialize();

    const transport = new StdioServerTransport();
    await server.server.connect(transport);

    console.error("Video Metadata MCP Server running on stdio");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.error("Shutting down...");
      await server.shutdown();
      await db.disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.error("Shutting down...");
      await server.shutdown();
      await db.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start stdio server:", error);
    process.exit(1);
  }
}

async function main() {
  try {
    if (mode === "stdio") {
      await startStdioServer();
    } else if (mode === "http") {
      await startHttpServer();
    } else {
      console.error(`Unknown mode: ${mode}. Use 'http' or 'stdio'`);
      console.error("Usage: node index.js --mode=http|stdio");
      console.error("Or set MCP_MODE environment variable");
      process.exit(1);
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch(console.error);
