// Global application state shape
export const STEPS = {
  SETUP: 0,
  HANDSHAKE: 1,
  CAPTURE: 2,
  CRACK: 3,
  DEFENSE: 4,
  TOOLS: 5,
};

export const DEFAULT_WORDLIST = [
  '12345678', 'password', 'qwerty123', 'admin123', 'welcome1',
  '123456789', 'letmein123', 'football', 'india123', 'pune2026',
  'mitaoe123', 'wifi12345', 'changeme', 'dragon123', 'master123',
  'sunshine', 'princess', 'password123', 'shadow123', 'superman',
  'trustno1', '1234567890', 'passw0rd', 'qwertyuiop', 'student123',
  'college123', 'network123', 'cybersec',
];

export const INITIAL_STATE = {
  // ---- Step 1 ----
  ssid: 'MITAOE_WiFi_Lab',
  passphrase: 'password123',
  apMac: 'AA:BB:CC:11:22:33',
  staMac: 'DE:AD:BE:EF:44:55',
  attackerMac: '13:37:BA:AD:F0:0D',

  // ---- Step 2 ----
  handshakeStep: 0,       // 0=idle, 1-4=message index

  // ---- Crypto (populated after derivation) ----
  crypto: {
    pmkHex: '', kckHex: '', kekHex: '', tkHex: '',
    aNonceHex: '', sNonceHex: '', micHex: '', eapolHex: '',
  },

  // ---- Step 3 ----
  capturedHandshake: null,  // {ssid,apMac,staMac,aNonceHex,sNonceHex,micHex,eapolHex}

  // ---- Step 4 ----
  wordlist: DEFAULT_WORDLIST,
  cracker: {
    running: false, done: false, found: false,
    tested: 0, total: 0, currentWord: '',
    computedMic: '', crackedPass: '', elapsed: 0,
  },

  // ---- Step 5 ----
  pmfEnabled: false,
  wpa3Enabled: false,

  // ---- UI ----
  activeStep: STEPS.SETUP,
  completedSteps: new Set(),
};
