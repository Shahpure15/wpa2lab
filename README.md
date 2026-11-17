# WPA2 4-Way Handshake & Offline Dictionary Attack Lab

> **IEEE 802.11i Guided Educational Simulator & Cryptographic Key Derivation Lab**  
> *100% Client-Side WebCrypto API &bull; React &bull; Tailwind CSS &bull; Vite &bull; Zero Backend Dependencies*

---

## 📌 Overview

This interactive lab demonstrates the internal mechanics of the **IEEE 802.11i WPA2-PSK 4-Way Handshake**, the **Deauthentication injection attack**, and the **Offline Dictionary Attack** (as utilized by tools like `hashcat -m 22000` and `aircrack-ng`).

It guides users through a focused, step-by-step workflow:
1. **Setup:** Target AP BSSID, Client STA MAC, SSID, and Passphrase configuration.
2. **4-Way Handshake:** Live EAPOL-Key frame exchange with animated vector topology and an interactive **Derivation Pipeline** (Passphrase &rarr; PMK &rarr; PTK &rarr; KCK/KEK/TK &rarr; MIC).
3. **Deauth & Capture:** RF management frame injection simulation (Reason 7), client disconnection, automatic reassociation, and sniffing of EAPOL Messages 1 & 2 into the capture buffer.
4. **Offline Dictionary Crack:** High-speed client-side dictionary attack executing genuine `window.crypto.subtle` PBKDF2 (4,096 iterations), PRF-512, and HMAC-SHA1 calculations against candidate passwords.
5. **Security Defenses:** Interactive toggles for **802.11w Protected Management Frames (PMF)** and **WPA3-SAE Dragonfly Handshake**, demonstrating how modern standards neutralize these attacks.
6. **Real-World Tooling:** Complete reference mapping lab mechanics to production penetration testing tools (`airodump-ng`, `aireplay-ng`, `hcxpcapngtool`, `hashcat`).
7. **Viva / Exam Preparation:** 8 technical deep-dive Q&A pairs covering protocol rationale, salting mechanics, and transition mode risks.

---

## 🔐 Cryptographic Engine Specifications

All cryptographic values are calculated dynamically using the native browser `window.crypto.subtle` WebCrypto API:

- **PMK (Pairwise Master Key):**
  $$\text{PMK} = \text{PBKDF2}(\text{HMAC-SHA1}, \text{Passphrase}, \text{SSID}, 4096, 256\text{ bits})$$
- **PTK (Pairwise Transient Key):**
  $$\text{PTK} = \text{PRF-512}(\text{PMK}, \text{"Pairwise key expansion"}, \min(\text{AA}, \text{SPA}) \parallel \max(\text{AA}, \text{SPA}) \parallel \min(\text{ANonce}, \text{SNonce}) \parallel \max(\text{ANonce}, \text{SNonce}))$$
- **PTK Slices (384 bits used):**
  - **KCK (Key Confirmation Key):** Bytes `[0..15]` (128-bit) &bull; Computes and verifies EAPOL MIC
  - **KEK (Key Encryption Key):** Bytes `[16..31]` (128-bit) &bull; Encrypts GTK in EAPOL Msg 3
  - **TK (Temporal Key):** Bytes `[32..47]` (128-bit) &bull; Used for AES-128-CCMP unicast payload encryption
- **EAPOL Message 2 MIC:**
  $$\text{MIC} = \text{HMAC-SHA1}(\text{KCK}, \text{EAPOL\_Frame\_Zeroed\_MIC})[0..15]$$

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- npm or yarn

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/Shahpure15/wpa2lab.git
cd wpa2lab

# Install dependencies
npm install

# Start Vite local development server
npm run dev
```

Open your browser at `http://localhost:5173/` (or port indicated in the terminal).

### Production Build

```bash
npm run build
npm run preview
```

---

## 🛠 Project Structure

```
wpa2lab/
├── src/
│   ├── components/
│   │   ├── CompletedSummaryStrip.jsx # Session progress ribbon
│   │   ├── StepCapture.jsx           # Step 3: Deauth & Sniff
│   │   ├── StepCrack.jsx             # Step 4: Offline Dictionary Attack
│   │   ├── StepDefense.jsx           # Step 5: PMF, WPA3 & Viva Prep
│   │   ├── StepHandshake.jsx         # Step 2: 4-Way EAPOL & Derivation Pipeline
│   │   ├── StepSetup.jsx             # Step 1: Network Parameters
│   │   ├── StepTools.jsx             # Step 6: Real-World Tooling Mapping
│   │   ├── Stepper.jsx               # Horizontal step navigator
│   │   ├── TopologySVG.jsx           # Vector RF topology canvas
│   │   └── ui.jsx                   # Theme-aware UI primitives
│   ├── crypto/
│   │   └── engine.js                 # Pure WebCrypto IEEE 802.11i cryptographic engine
│   ├── state/
│   │   ├── AppContext.jsx            # State provider & reducer
│   │   └── appState.js               # Global application state shape
│   ├── App.jsx                       # 2-Tier navigation & layout
│   ├── index.css                     # Design tokens & Space Grotesk / JetBrains Mono fonts
│   └── main.jsx
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## ⚠️ Disclaimer

This application is strictly an **educational simulation** for studying network security, cryptography, and wireless protocols. It runs entirely inside the browser sandboxed environment using synthetic nonces and frames, without accessing live radio interfaces or capturing physical RF traffic.
