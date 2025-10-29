import crypto from 'crypto';

/**
 * Create a JWT (JSON Web Token) for Google OAuth2 authentication
 * This replaces google-auth-library with native Node.js crypto
 */
export function createJWT(credentials) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600; // Token valid for 1 hour

  // JWT Header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  // JWT Claim Set
  const claimSet = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: exp,
    iat: iat,
  };

  // Base64url encode
  const base64urlEncode = (obj) => {
    const json = JSON.stringify(obj);
    return Buffer.from(json)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const encodedHeader = base64urlEncode(header);
  const encodedClaimSet = base64urlEncode(claimSet);
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  // Sign with RSA private key
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  sign.end();

  const signature = sign.sign(credentials.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${signatureInput}.${signature}`;
}
