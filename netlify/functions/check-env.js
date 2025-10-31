// Enhanced environment variable checker with deep diagnostics
exports.handler = async (event, context) => {
  // Check all GOOGLE-prefixed variables
  const allGoogleVars = Object.keys(process.env)
    .filter(key => key.startsWith('GOOGLE'))
    .reduce((obj, key) => {
      obj[key] = process.env[key] ? `SET (${process.env[key].substring(0, 20)}...)` : 'NOT SET';
      return obj;
    }, {});

  // Specific checks with detailed info
  const envVars = {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? `SET (${process.env.GOOGLE_API_KEY.substring(0, 10)}...)` : 'NOT SET',
    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || 'NOT SET',
    GOOGLE_CLOUD_LOCATION: process.env.GOOGLE_CLOUD_LOCATION || 'NOT SET',
    GOOGLE_APPLICATION_CREDENTIALS_JSON: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? `SET (${process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON.substring(0, 50)}...)` : 'NOT SET',
    USE_IMAGEN_3: process.env.USE_IMAGEN_3 || 'NOT SET (defaults to false)'
  };

  // Type checks
  const typeChecks = {
    GOOGLE_CLOUD_PROJECT_ID_type: typeof process.env.GOOGLE_CLOUD_PROJECT_ID,
    GOOGLE_CLOUD_PROJECT_ID_length: process.env.GOOGLE_CLOUD_PROJECT_ID ? process.env.GOOGLE_CLOUD_PROJECT_ID.length : 0,
    GOOGLE_CLOUD_PROJECT_ID_truthiness: !!process.env.GOOGLE_CLOUD_PROJECT_ID
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      specificChecks: envVars,
      allGoogleVariables: allGoogleVars,
      typeChecks: typeChecks,
      totalEnvVars: Object.keys(process.env).length,
      nodeVersion: process.version,
      platform: process.platform,
      deployContext: process.env.CONTEXT || 'unknown'
    }, null, 2)
  };
};
