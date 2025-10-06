const crypto = require('crypto');

// Utility to create and verify HMAC signatures for QR payloads
// Uses a server-side secret to prevent tampering and forgery

const getSecret = () => {
  // Prefer dedicated secret; fallback to JWT secret; finally a hard fallback only for dev
  return process.env.QR_SIGNING_SECRET || process.env.JWT_SECRET || 'dev_qr_signing_secret_change_me';
};

function signPayload(payloadObject) {
  const secret = getSecret();
  const payloadWithoutSig = { ...payloadObject };
  delete payloadWithoutSig.sig;
  const serialized = JSON.stringify(payloadWithoutSig);
  const hmac = crypto.createHmac('sha256', secret).update(serialized).digest('hex');
  return hmac;
}

function attachSignature(payloadObject) {
  const sig = signPayload(payloadObject);
  return { ...payloadObject, sig };
}

function verifySignature(payloadObject) {
  if (!payloadObject || typeof payloadObject !== 'object' || !payloadObject.sig) {
    return false;
  }
  const expected = signPayload(payloadObject);
  // Use timing-safe compare
  const a = Buffer.from(expected);
  const b = Buffer.from(payloadObject.sig);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  signPayload,
  attachSignature,
  verifySignature
};


