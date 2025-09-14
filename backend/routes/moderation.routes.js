// routes/moderationRoutes.js
import express from 'express';
import { analyzeComment,testBytez } from '../controllers/analyzeText.controller.js';
import {  analyzeImage } from '../controllers/analyzeImage.controller.js'; // Make sure this import is correct

const router = express.Router();

router.post('/analyzeComment', analyzeComment);
router.post('/analyzeImage', analyzeImage); // This line must point to the image controller
router.post('/testBytez', testBytez);


export default router;
