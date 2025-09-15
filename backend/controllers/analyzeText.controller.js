import Bytez from 'bytez.js';
import redisClient from '../redisClient.js';
import crypto from 'crypto';
import dotenv from 'dotenv'

dotenv.config({
  path:'./.env'
}
)
// console.log(process.env.Bytez_Key)
const sdk = new Bytez(process.env.Bytez_Key);
const model = sdk.model('mohsenfayyaz/toxicity-classifier');

const MAX_RETRIES = 5;
let lastBytezCall = Promise.resolve();

async function runModelWithRetry(text, retries = 0) {
  lastBytezCall = lastBytezCall.then(() => attemptRun(text, retries));
  return lastBytezCall;
}

async function attemptRun(text, retries) {
  try {
    // Pass an object { text } as required by Bytez API
    const { error, output } = await model.run({ text });
    if (error) throw new Error(error);
    return output;
  } catch (err) {
    const msg = (err && err.message) || (typeof err === 'string' ? err : 'Unknown error');
    if (msg.includes('your plan allows for 1 concurrency') && retries < MAX_RETRIES) {
      const backoff = Math.pow(2, retries) * 200;
      console.warn(`Bytez concurrency limit hit. Retry #${retries + 1} in ${backoff}ms`);
      await new Promise(res => setTimeout(res, backoff));
      return attemptRun(text, retries + 1);
    }
    console.error('Bytez error:', err);
    throw err;
  }
}

const analyzeComment = async (req, res) => {
  let { text } = req.body;

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Valid text is required' });
  }

  // Normalize text to avoid encoding issues (important for emails)
  text = text.normalize('NFC').trim();

  console.log('Received moderation request:', text);

  try {
    const cacheKey = 'moderation:' + crypto.createHash('sha256').update(text).digest('hex');

    console.log('Checking Redis cache ...');
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      console.log('Cache hit, sending response.');
      return res.json(JSON.parse(cachedResult));
    }

    console.log('Cache miss. Calling Bytez...');
    const output = await runModelWithRetry(text);
    console.log('Received output from Bytez:', output);

    // Handle output as array or single object safely
    let maxScore = 0;
    if (Array.isArray(output)) {
      output.forEach(item => {
        if (item.label?.toLowerCase() === 'toxic' && typeof item.score === 'number') {
          maxScore = Math.max(maxScore, item.score);
        }
      });
    } else if (output && output.label?.toLowerCase() === 'toxic' && typeof output.score === 'number') {
      maxScore = output.score;
    }

    const rating = Math.max(1, Math.round(maxScore * 10));
    const result = {
      rating,
      message: rating > 7 ? 'Something fishy detected' : 'Content seems normal',
      output,
    };

    console.log('Caching result in Redis...');
    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 300 });

    console.log('Sending response.');
    return res.json(result);

  } catch (err) {
    console.error('Error in analyzeComment:', err, err.stack || '');
    return res.status(500).json({ error: (err && err.message) || 'Internal error' });
  }
};

const testBytez = async (req, res) => {
  let { text } = req.body;

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Valid text is required' });
  }

  // Normalize text to avoid encoding issues
  text = text.normalize('NFC').trim();

  try {
    const { error, output } = await model.run({ text });
    if (error) return res.status(500).json({ error });

    return res.json({ output });
  } catch (err) {
    console.error('Error in testBytez:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};

export { analyzeComment, testBytez };
