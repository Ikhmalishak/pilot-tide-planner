import express from 'express';
import cors from 'cors';
import { tideIndicatorRoutes } from './routes/tide-indicators';
import { hourlyLevelRoutes } from './routes/hourly-levels';
import { ruleProfileRoutes } from './routes/rule-profiles';
import { navigationRoutes } from './routes/navigation';
import { dashboardRoutes } from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/tide-indicators', tideIndicatorRoutes);
app.use('/api/hourly-levels', hourlyLevelRoutes);
app.use('/api/rule-profiles', ruleProfileRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Pilot Tide Planner API is running' });
});

app.listen(PORT, () => {
  console.log(`Pilot Tide Planner API running on http://localhost:${PORT}`);
});

export default app;
