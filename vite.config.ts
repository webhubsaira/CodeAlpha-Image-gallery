import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}

function apiDevPlugin(): Plugin {
  return {
    name: 'vite-plugin-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const urlPath = req.url.split('?')[0];

          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            const buffers: Uint8Array[] = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const bodyStr = Buffer.concat(buffers).toString('utf-8');
            try {
              (req as any).body = bodyStr ? JSON.parse(bodyStr) : {};
            } catch {
              (req as any).body = {};
            }
          }

          const queryString = req.url.split('?')[1] || '';
          const urlParams = new URLSearchParams(queryString);
          const queryObj: Record<string, string> = {};
          urlParams.forEach((v, k) => {
            queryObj[k] = v;
          });
          (req as any).query = queryObj;

          try {
            if (urlPath === '/api/images' || urlPath === '/api/images/') {
              const handler = (await import('./api/images')).default;
              await handler(req as any, res as any);
              return;
            }
            if (urlPath === '/api/favorites' || urlPath === '/api/favorites/') {
              const handler = (await import('./api/favorites')).default;
              await handler(req as any, res as any);
              return;
            }
            if (urlPath === '/api/likes' || urlPath === '/api/likes/') {
              const handler = (await import('./api/likes')).default;
              await handler(req as any, res as any);
              return;
            }
            if (urlPath === '/api/init' || urlPath === '/api/init/') {
              const handler = (await import('./api/init')).default;
              await handler(req as any, res as any);
              return;
            }
          } catch (err) {
            console.error('Local API dev plugin error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(err) }));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aistudioMediaPlugin(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
