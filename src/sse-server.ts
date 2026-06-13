#!/usr/bin/env node
/**
 * ASTRA MCP Server — SSE Transport
 * © 2026 Christophe Jean Legros — Geneva
 *
 * HTTP + Server-Sent Events transport for web-based MCP clients.
 * Listens on configurable port (default 9002).
 *
 * Architecture note: Each SSE client connection creates a separate
 * MCP server instance sharing the same singleton state. This is by
 * design — the MCP spec models each client as an independent session.
 * The SNN simulation loop runs once (guarded by isRunning check) and
 * its state is shared across all sessions via the singleton stores.
 *
 * Usage:
 *   ASTRA_SSE_PORT=9002 node dist/sse-server.js
 */

import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createAstraServer } from './server.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.ASTRA_SSE_PORT || '9002', 10);
const HOST = process.env.ASTRA_SSE_HOST || '0.0.0.0';

async function main(): Promise<void> {
  const app = express();

  // CORS for browser-based MCP clients
  app.use((_req, res, next) => {
    const allowedOrigin = process.env.ASTRA_CORS_ORIGIN || '*';
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });

  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      server: 'astra-mcp-server',
      version: '2.0.0',
      transport: 'sse',
      activeSessions: transports.size,
      uptime: process.uptime(),
    });
  });

  // SSE endpoint — one transport per client connection
  const transports = new Map<string, SSEServerTransport>();

  app.get('/sse', async (req, res) => {
    logger.info({ ip: req.ip }, 'New SSE client connection');

    // Each client gets its own server instance but shares singleton state
    const server = createAstraServer();
    const transport = new SSEServerTransport('/messages', res);

    const sessionId = transport.sessionId;
    transports.set(sessionId, transport);

    res.on('close', () => {
      logger.info({ sessionId }, 'SSE client disconnected');
      transports.delete(sessionId);
    });

    await server.connect(transport);
    logger.info({ sessionId, activeSessions: transports.size }, 'SSE transport connected');
  });

  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);

    if (!transport) {
      res.status(404).json({ error: 'Session not found', sessionId });
      return;
    }

    await transport.handlePostMessage(req, res);
  });

  // Start server
  app.listen(PORT, HOST, () => {
    logger.info({ host: HOST, port: PORT }, `ASTRA MCP Server (SSE) listening`);
    logger.info(`SSE endpoint: http://${HOST}:${PORT}/sse`);
    logger.info(`Messages endpoint: http://${HOST}:${PORT}/messages`);
  });
}

main().catch((error) => {
  logger.fatal({ error }, 'Fatal error starting ASTRA SSE server');
  process.exit(1);
});
