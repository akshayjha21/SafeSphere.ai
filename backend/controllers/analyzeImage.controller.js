// controllers/imageModerationController.js
import axios from 'axios';

const API_USER = '672530004';       // your Sightengine API user
const API_SECRET = 'Jn2ZVJUjhtbxYYrxrLgzeKfx8mq2ZJwe';  // your secret

const THRESHOLD = 0.3;  // minimum probability to flag a type as detected

const analyzeImage = async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    const response = await axios.get('https://api.sightengine.com/1.0/check.json', {
      params: {
        url: imageUrl,
        models: 'nudity-2.1,weapon,scam,gore-2.0,genai,violence,self-harm,offensive-2.0',
        api_user: API_USER,
        api_secret: API_SECRET,
      },
    });

    const data = response.data;

    if (data.status !== 'success') {
      return res.status(500).json({ error: 'Sightengine API error', details: data });
    }

    // Calculate content scores
    const nudityProb = data.nudity?.none ? 1 - data.nudity.none : 0;
    const violenceProb = data.violence?.prob || 0;
    const goreProb = data.gore?.prob || 0;
    const selfHarmProb = data["self-harm"]?.prob || 0;
    const weaponProb = data.weapon?.classes ? Math.max(...Object.values(data.weapon.classes)) : 0;

    // Correct offensive probability: max over all numeric offensive subcategory values
    const offensiveData = data.offensive || {};
    const offensiveScores = Object.values(offensiveData).filter(v => typeof v === 'number');
    const offensiveProb = offensiveScores.length > 0 ? Math.max(...offensiveScores) : 0;

    // Map highest content probability to rating 1-10 scale
    const maxProb = Math.max(nudityProb, violenceProb, goreProb, selfHarmProb, weaponProb, offensiveProb);
    const rating = Math.max(1, Math.round(maxProb * 10));

    // Determine detected content types exceeding threshold
    const detectedTypes = [];
    if (nudityProb >= THRESHOLD) detectedTypes.push('Nudity');
    if (violenceProb >= THRESHOLD) detectedTypes.push('Violence');
    if (goreProb >= THRESHOLD) detectedTypes.push('Gore');
    if (selfHarmProb >= THRESHOLD) detectedTypes.push('Self-Harm');
    if (weaponProb >= THRESHOLD) detectedTypes.push('Weapon');
    if (offensiveProb >= THRESHOLD) detectedTypes.push('Offensive');

    const message = detectedTypes.length > 0 ?
      `Detected content: ${detectedTypes.join(', ')}` :
      'Image seems normal';

    res.json({
      rating,
      contentTypes: detectedTypes,
      message,
      data,
    });
  } catch (error) {
    console.error('Sightengine API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Image moderation failed' });
  }
};

export { analyzeImage };
