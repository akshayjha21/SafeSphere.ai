// app.js

import express from 'express';
import moderationRoutes from './routes/moderation.routes.js';
import cors from 'cors';
const app = express();
app.use(express.json());
app.use(cors())

// Mount moderation API routes under /moderation
app.use('/moderation', moderationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Moderation API running on port ${PORT}`);
});
