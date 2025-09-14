import express from 'express';
import moderationRoutes from './routes/moderation.routes.js';
import cors from 'cors';
import './redisClient.js'; // import to initialize Redis client connection

const app = express();
app.use(express.json());
app.use(cors());

app.use('/moderation', moderationRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Moderation API running on port ${PORT}`);
});
