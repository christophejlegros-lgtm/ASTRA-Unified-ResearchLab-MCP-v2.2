#!/usr/bin/env node
/**
 * ASTRA MCP Server — Streamable HTTP Transport
 * © 2026 Christophe Jean Legros — Geneva
 *
 * Modern stateless HTTP transport per MCP spec 2025-11-25.
 * Supports both streaming (SSE) and non-streaming responses.
 *
 * Architecture note: Each HTTP session creates a separate MCP server
 * instance sharing the same singleton state. This is by design — the
 * MCP spec models each client as an independent session. The SNN
 * simulation loop runs once (guarded by isRunning check) and its
 * state is shared across all sessions via the singleton stores.
 *
 * Usage:
 *   ASTRA_HTTP_PORT=9003 node dist/http-server.js
 */

import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createAstraServer } from './server.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.ASTRA_HTTP_PORT || '9003', 10);
const HOST = process.env.ASTRA_HTTP_HOST || '0.0.0.0';

async function main(): Promise<void> {
  const app = express();

  app.use((_req, res, next) => {
    const allowedOrigin = process.env.ASTRA_CORS_ORIGIN || '*';
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');
    res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
    if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });

  app.use(express.json());

  // Session management
  const sessions = new Map<string, { server: ReturnType<typeof createAstraServer>; transport: StreamableHTTPServerTransport }>();

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      server: 'astra-mcp-server',
      version: '2.0.0',
      transport: 'streamable-http',
      activeSessions: sessions.size,
      uptime: process.uptime(),
    });
  });

  // MCP endpoint — handles all JSON-RPC traffic
  app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    // Existing session?
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res);
      return;
    }

    // New session — each client gets its own server instance but shares singleton state
    const server = createAstraServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (newSessionId) => {
        logger.info({ sessionId: newSessionId }, 'New Streamable HTTP session');
        sessions.set(newSessionId, { server, transport });
      },
    });

    // Clean up on close
    transport.onclose = () => {
      const sid = [...sessions.entries()].find(([_, v]) => v.transport === transport)?.[0];
      if (sid) {
        sessions.delete(sid);
        logger.info({ sessionId: sid, activeSessions: sessions.size }, 'Session closed');
      }
    };

    await server.connect(transport);
    await transport.handleRequest(req, res);
  });

  // GET for SSE streaming from server → client
  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(404).json({ error: 'Session not found. Send POST /mcp first.' });
      return;
    }
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
  });

  // DELETE for session termination
  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
    sessions.delete(sessionId);
    logger.info({ sessionId, activeSessions: sessions.size }, 'Session deleted via DELETE');
  });

  app.listen(PORT, HOST, () => {
    logger.info({ host: HOST, port: PORT }, `ASTRA MCP Server (Streamable HTTP) listening`);
    logger.info(`MCP endpoint: http://${HOST}:${PORT}/mcp`);
  });
}

main().catch((error) => {
  logger.fatal({ error }, 'Fatal error starting ASTRA HTTP server');
  process.exit(1);
});
