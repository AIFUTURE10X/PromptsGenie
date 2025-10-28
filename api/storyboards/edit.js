export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { storyboardId, frameIndex, newDescription, frames } = req.body;

    if (!storyboardId || typeof frameIndex !== 'number' || typeof newDescription !== 'string' || !Array.isArray(frames)) {
      return res.status(400).json({
        error: 'Invalid edit request. Must include storyboardId, frameIndex (number), newDescription (string), and frames array.'
      });
    }

    if (frameIndex < 0 || frameIndex >= frames.length) {
      return res.status(400).json({ error: 'Frame index out of bounds.' });
    }

    // Update the frame description
    const updatedFrames = [...frames];
    updatedFrames[frameIndex] = {
      ...updatedFrames[frameIndex],
      description: newDescription
    };

    // Return the updated storyboard
    res.status(200).json({
      storyboardId,
      frames: updatedFrames
    });
  } catch (error) {
    console.error('Storyboard edit failed:', error);
    res.status(500).json({ error: error.message });
  }
}
