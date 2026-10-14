import express from 'express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { api } from './routes/api.js';
import { errorHandler } from './middleware/error-handler.js';
import { seedDemo } from './database/seed.js';

const root = fileURLToPath(new URL('..', import.meta.url));
export const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api', api);
app.use(express.static(join(root, 'client')));
app.get('*splat', (req, res) => res.sendFile(join(root, 'client', 'index.html')));
app.use(errorHandler);
seedDemo();
