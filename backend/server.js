import cors from 'cors';
import express from 'express';
import { connectDB } from './config/database.js';
import { PORT } from './config/env.js';
import { startCleanupJob } from './jobs/cleanup.job.js';
import { errorHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);
app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  startCleanupJob();

  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
