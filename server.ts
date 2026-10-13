/**
 * PYQVerse Application Server & Reverse Proxy
 * 
 * In production Vercel deployments, the React SPA is served directly via Vercel CDN
 * and connects directly to the standalone FastAPI backend via VITE_API_URL.
 * 
 * For local development (`npm run dev`) or containerized hosting (`node server.ts`),
 * this Express server serves the Vite frontend and acts as a lightweight reverse-proxy
 * forwarding all `/api/*` traffic to the authoritative FastAPI backend.
 * 
 * No mock data stores or competing business logic reside here.
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || 'http://127.0.0.1:8000';

app.use(express.json({ limit: '10mb' }));

// Authoritative FastAPI Reverse Proxy Middleware
app.use('/api', async (req: Request, res: Response) => {
  try {
    const upstreamBase = FASTAPI_URL.replace(/\/+$/, '');
    const targetUrl = `${upstreamBase}${req.originalUrl}`;
    
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === 'string' && k.toLowerCase() !== 'host' && k.toLowerCase() !== 'content-length') {
        headers[k] = v;
      }
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
      headers['content-type'] = 'application/json';
    }

    const backendRes = await fetch(targetUrl, fetchOptions);
    res.status(backendRes.status);
    
    backendRes.headers.forEach((val, key) => {
      if (key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, val);
      }
    });

    const data = await backendRes.text();
    res.send(data);
  } catch (err: any) {
    res.status(502).json({
      error: 'Bad Gateway: Authoritative FastAPI backend service is unreachable.',
      detail: `Failed to proxy request to FastAPI backend at ${FASTAPI_URL}. Ensure the backend service is running.`,
      upstream: FASTAPI_URL,
    });
  }
});

// Mount Vite middleware (development) or static files (production)
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`PYQVerse Application Server running at http://localhost:${PORT}`);
    console.log(`Authoritative FastAPI upstream: ${FASTAPI_URL}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
