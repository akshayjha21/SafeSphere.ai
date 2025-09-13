// controllers/moderationController.js
import Bytez from 'bytez.js';

const sdk = new Bytez('08a8135b3fef6350fda0e1c0103f1441'); // Bytez free API key
const model = sdk.model('mohsenfayyaz/toxicity-classifier');

const analyzeComment = async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const { error, output } = await model.run(text);

    if (error) {
      console.error('Bytez model error:', error);
      return res.status(500).json({ error: 'Model processing error' });
    }

    // The output array contains objects like: [{ label: 'Toxic', score: 0.99974 }]
    // Find the highest toxicity score in the array
    let maxScore = 0;
    output.forEach(item => {
      if (item.label?.toLowerCase() === 'toxic' && typeof item.score === 'number') {
        maxScore = Math.max(maxScore, item.score);
      }
    });

    // Map toxicity probability (0-1) to a rating (1-10)
    const rating = Math.max(1, Math.round(maxScore * 10));

    return res.json({
      rating,
      message: rating >  7? 'Something fishy detected' : 'Content seems normal',
      output,
    });
  } catch (err) {
    console.error('Error in analyzeComment:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};

export { analyzeComment };
