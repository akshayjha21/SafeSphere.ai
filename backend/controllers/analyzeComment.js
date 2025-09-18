import Bytez from 'bytez.js';
import redisClient from '../redisClient.js';
import crypto from 'crypto';

const sdk = new Bytez();
const model = sdk.model('mohsenfayyaz/toxicity-classifier');

const MAX_RETRIES = 5;
let lastBytezCall = Promise.resolve();

async function runModelWithRetry(text, retries = 0) {
  lastBytezCall = lastBytezCall.then(() => attemptRun(text, retries));
  return lastBytezCall;
}

async function attemptRun(text, retries) {
  try {
    const { error, output } = await model.run({ text });
    if (error) throw new Error(error);
    return output;
  } catch (err) {
    const msg = (err && err.message) || (typeof err === 'string' ? err : 'Unknown error');
    if (msg.includes('your plan allows for 1 concurrency') && retries < MAX_RETRIES) {
      const backoff = Math.pow(2, retries) * 200;
      await new Promise(res => setTimeout(res, backoff));
      return attemptRun(text, retries + 1);
    }
    throw err;
  }
}

export const analyzeComments = async (req, res) => {
  let { commentText } = req.body;
  if (typeof commentText !== 'string' || !commentText.trim()) {
    return res.status(400).json({ error: 'Valid commentText is required' });
  }
  commentText = commentText.normalize('NFC').trim();

  try {
    const cacheKey = 'comment-moderation:' + crypto.createHash('sha256').update(commentText).digest('hex');
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return res.json(JSON.parse(cachedResult));
    }
    const output = await runModelWithRetry(commentText);

    let maxScore = 0;
    if (Array.isArray(output)) {
      for (const item of output) {
        if (item.label?.toLowerCase() === 'toxic' && typeof item.score === 'number') {
          maxScore = Math.max(maxScore, item.score);
        }
      }
    } else if (output && output.label?.toLowerCase() === 'toxic' && typeof output.score === 'number') {
      maxScore = output.score;
    }

    const rating = Math.max(1, Math.round(maxScore * 10));
    const result = {
      rating,
      message: rating > 7 ? 'Potential toxicity detected' : 'Comment seems normal',
      output,
    };

    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 300 });

    return res.json(result);
  } catch (err) {
    console.error('Error in analyzeComment:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
