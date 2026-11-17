// ============================================================
// WPA2 / IEEE 802.11i Cryptographic Engine — real WebCrypto
// ============================================================

/** Parse colon-separated MAC (AA:BB:CC:11:22:33) or raw hex string → Uint8Array */
export function hexToBytes(hex) {
  if (!hex) return new Uint8Array(0);
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Uint8Array → lowercase hex string */
export function bytesToHex(arr, sep = '') {
  if (!arr) return '';
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(sep)
    .toLowerCase();
}

/** Concatenate any number of Uint8Arrays */
export function concatBytes(...arrays) {
  const len = arrays.reduce((s, a) => s + (a?.length ?? 0), 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) {
    if (a?.length) { out.set(a, off); off += a.length; }
  }
  return out;
}

/** Lexicographical compare: returns -1 | 0 | 1 (used for Min/Max MACs & Nonces) */
export function compareBytesLexicographical(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return a.length < b.length ? -1 : a.length > b.length ? 1 : 0;
}

/** Secure random 32 bytes for ANonce / SNonce */
export function generateRandomBytes(length = 32) {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ---- PMK: PBKDF2-HMAC-SHA1 ----------------------------------------
export async function derivePMK(passphrase, ssid) {
  const passBytes = new TextEncoder().encode(passphrase);
  const ssidBytes = new TextEncoder().encode(ssid);
  const km = await crypto.subtle.importKey('raw', passBytes, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: ssidBytes, iterations: 4096, hash: 'SHA-1' },
    km, 256
  );
  return new Uint8Array(bits);
}

// ---- PTK: IEEE 802.11i PRF-512 ------------------------------------
export async function derivePTK(pmkBytes, apMacBytes, staMacBytes, aNonce, sNonce) {
  const cmpMac   = compareBytesLexicographical(apMacBytes, staMacBytes);
  const minMac   = cmpMac <= 0 ? apMacBytes  : staMacBytes;
  const maxMac   = cmpMac <= 0 ? staMacBytes : apMacBytes;
  const cmpNonce = compareBytesLexicographical(aNonce, sNonce);
  const minNonce = cmpNonce <= 0 ? aNonce : sNonce;
  const maxNonce = cmpNonce <= 0 ? sNonce : aNonce;

  const label = new TextEncoder().encode('Pairwise key expansion');
  const data  = concatBytes(minMac, maxMac, minNonce, maxNonce);
  const hmacKey = await crypto.subtle.importKey(
    'raw', pmkBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );

  const digests = [];
  for (let i = 0; i < 4; i++) {
    const input = concatBytes(label, new Uint8Array([0x00]), data, new Uint8Array([i]));
    digests.push(new Uint8Array(await crypto.subtle.sign('HMAC', hmacKey, input)));
  }

  const ptk = concatBytes(...digests).slice(0, 64);
  return {
    ptk,
    kck:     ptk.slice(0, 16),
    kek:     ptk.slice(16, 32),
    tk:      ptk.slice(32, 48),
    micRxTx: ptk.slice(48, 64),
  };
}

// ---- EAPOL-Key Message 2 frame (99 bytes) --------------------------
export function buildEapolMsg2(sNonce) {
  const f = new Uint8Array(99);
  f[0] = 0x01; f[1] = 0x03;              // 802.1X ver + Key type
  f[2] = 0x00; f[3] = 0x5f;              // body length 95
  f[4] = 0x02;                           // RSN descriptor
  f[5] = 0x01; f[6] = 0x0a;             // key info
  f[7] = 0x00; f[8] = 0x10;             // key length 16
  f[16] = 0x01;                          // replay counter LSB = 1
  f.set(sNonce, 17);                     // SNonce at [17..48]
  // [49..80] = zeroed IV/RSC, [81..96] = zeroed MIC, [97..98] = 0
  return f;
}

// ---- MIC: HMAC-SHA1(KCK, EAPOL_frame)[0..15] ----------------------
export async function computeMIC(kckBytes, eapolFrame) {
  const frame = new Uint8Array(eapolFrame);
  for (let i = 81; i <= 96; i++) frame[i] = 0x00; // zero MIC field before signing
  const key = await crypto.subtle.importKey(
    'raw', kckBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, frame);
  const mic = new Uint8Array(sig).slice(0, 16);
  return { bytes: mic, hex: bytesToHex(mic) };
}

// ---- Full derivation pipeline ---------------------------------------
export async function deriveAll({ ssid, passphrase, apMac, staMac, aNonce, sNonce }) {
  const pmk  = await derivePMK(passphrase, ssid);
  const ptk  = await derivePTK(pmk, hexToBytes(apMac), hexToBytes(staMac), aNonce, sNonce);
  const eapol = buildEapolMsg2(sNonce);
  const mic  = await computeMIC(ptk.kck, eapol);
  return {
    pmkHex:   bytesToHex(pmk),
    kckHex:   bytesToHex(ptk.kck),
    kekHex:   bytesToHex(ptk.kek),
    tkHex:    bytesToHex(ptk.tk),
    aNonceHex: bytesToHex(aNonce),
    sNonceHex: bytesToHex(sNonce),
    micHex:   mic.hex,
    eapolHex: bytesToHex(eapol),
  };
}

// ---- Validate MAC address format -----------------------------------
export function isValidMac(mac) {
  return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac.trim());
}
