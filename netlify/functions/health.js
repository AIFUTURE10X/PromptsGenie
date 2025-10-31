exports.handler = async (event, context) => {
  // Check all required environment variables
  const envCheck = {
    GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
    GOOGLE_CLOUD_PROJECT_ID: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
    GOOGLE_CLOUD_LOCATION: !!process.env.GOOGLE_CLOUD_LOCATION,
    GOOGLE_APPLICATION_CREDENTIALS_JSON: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  };

  const allConfigured = Object.values(envCheck).every(v => v === true);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify({
      status: allConfigured ? 'ok' : 'missing_env_vars',
      timestamp: new Date().toISOString(),
      environment: {
        ...envCheck,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID ?
          process.env.GOOGLE_CLOUD_PROJECT_ID.substring(0, 10) + '...' :
          'NOT_SET'
      },
      message: allConfigured ?
        'All environment variables configured' :
        'Missing required environment variables - check Netlify dashboard'
    })
  };
};
