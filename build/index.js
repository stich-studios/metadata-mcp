"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_js_1 = require("./server.js");
const DatabaseManager_js_1 = require("./db/DatabaseManager.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Parse command line arguments
const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith("--mode="));
const mode = modeArg ? modeArg.split("=")[1] : process.env.MCP_MODE || "stdio";
const db = DatabaseManager_js_1.DatabaseManager.getInstance();
async function startHttpServer() {
    console.log("Starting HTTP MCP Server...");
    await db.connect();
    console.log("Database connected successfully");
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.post("/mcp", async (req, res) => {
        try {
            const srv = new server_js_1.Server(db);
            await srv.initialize();
            const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
            });
            res.on("close", () => {
                console.log("Request closed");
                transport.close();
                srv.shutdown();
            });
            await srv.server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        }
        catch (error) {
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
    app.get("/mcp", async (req, res) => {
        console.log("Received GET MCP request");
        res.writeHead(405).end(JSON.stringify({
            jsonrpc: "2.0",
            error: {
                code: -32000,
                message: "Method not allowed.",
            },
            id: null,
        }));
    });
    app.delete("/mcp", async (req, res) => {
        console.log("Received DELETE MCP request");
        res.writeHead(405).end(JSON.stringify({
            jsonrpc: "2.0",
            error: {
                code: -32000,
                message: "Method not allowed.",
            },
            id: null,
        }));
    });
    // Health check endpoint
    app.get("/health", (req, res) => {
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
        const server = new server_js_1.Server(db);
        await server.initialize();
        const transport = new stdio_js_1.StdioServerTransport();
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
    }
    catch (error) {
        console.error("Failed to start stdio server:", error);
        process.exit(1);
    }
}
async function main() {
    try {
        if (mode === "stdio") {
            await startStdioServer();
        }
        else if (mode === "http") {
            await startHttpServer();
        }
        else {
            console.error(`Unknown mode: ${mode}. Use 'http' or 'stdio'`);
            console.error("Usage: node index.js --mode=http|stdio");
            console.error("Or set MCP_MODE environment variable");
            process.exit(1);
        }
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
main().catch(console.error);
