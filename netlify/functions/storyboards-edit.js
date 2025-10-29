exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { storyboardId, frameIndex, newDescription, frames } = JSON.parse(event.body);

    if (!storyboardId || typeof frameIndex !== 'number' || typeof newDescription !== 'string' || !Array.isArray(frames)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid edit request. Must include storyboardId, frameIndex (number), newDescription (string), and frames array.'
        })
      };
    }

    if (frameIndex < 0 || frameIndex >= frames.length) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Frame index out of bounds.' })
      };
    }

    // Update the frame description
    const updatedFrames = [...frames];
    updatedFrames[frameIndex] = {
      ...updatedFrames[frameIndex],
      description: newDescription
    };

    // Return the updated storyboard
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        storyboardId,
        frames: updatedFrames
      })
    };
  } catch (error) {
    console.error('Storyboard edit failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
