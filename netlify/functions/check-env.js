// Environment variable health check endpoint
exports.handler = async (event, context) => {
  const envVars = {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? `SET (${process.env.GOOGLE_API_KEY.substring(0, 10)}...)` : 'NOT SET',
    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || 'NOT SET',
    GOOGLE_CLOUD_LOCATION: process.env.GOOGLE_CLOUD_LOCATION || 'NOT SET',
    GOOGLE_APPLICATION_CREDENTIALS_JSON: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'SET' : 'NOT SET',
    USE_IMAGEN_3: process.env.USE_IMAGEN_3 || 'false (default)'
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      environment: envVars,
      status: 'healthy',
      nodeVersion: process.version,
      deployContext: process.env.CONTEXT || 'production'
    }, null, 2)
  };
};
