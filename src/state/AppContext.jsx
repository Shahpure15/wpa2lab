import { createContext, useContext, useReducer, useCallback } from 'react';
import { INITIAL_STATE, STEPS } from './appState';
import { generateRandomBytes } from '../crypto/engine';

// ── Reducer ─────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.key]: action.value };

    case 'SET_CRYPTO':
      return { ...state, crypto: { ...state.crypto, ...action.payload } };

    case 'SET_HANDSHAKE_STEP':
      return { ...state, handshakeStep: action.step };

    case 'SET_CAPTURED':
      return { ...state, capturedHandshake: action.payload };

    case 'REGEN_NONCES': {
      const aN = generateRandomBytes(32);
      const sN = generateRandomBytes(32);
      return { ...state, _aNonce: aN, _sNonce: sN };
    }

    case 'SET_CRACKER':
      return { ...state, cracker: { ...state.cracker, ...action.payload } };

    case 'SET_WORDLIST':
      return { ...state, wordlist: action.payload };

    case 'ADVANCE_STEP': {
      const next = action.step;
      const completed = new Set(state.completedSteps);
      completed.add(state.activeStep);
      return { ...state, activeStep: next, completedSteps: completed };
    }

    case 'JUMP_STEP':
      return { ...state, activeStep: action.step };

    case 'RESET_FROM': {
      // Reset everything from a given step forward
      const s = action.step;
      const completed = new Set([...state.completedSteps].filter(x => x < s));
      return {
        ...state,
        activeStep: s,
        completedSteps: completed,
        ...(s <= STEPS.HANDSHAKE && { handshakeStep: 0 }),
        ...(s <= STEPS.CAPTURE  && { capturedHandshake: null }),
        ...(s <= STEPS.CRACK    && {
          cracker: { ...INITIAL_STATE.cracker }
        }),
      };
    }

    default:
      return state;
  }
}

// ── Context ─────────────────────────────────────────────────────────
const AppContext = createContext(null);

const initState = {
  ...INITIAL_STATE,
  _aNonce: generateRandomBytes(32),
  _sNonce: generateRandomBytes(32),
};

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initState);

  const setField    = useCallback((key, value) => dispatch({ type: 'SET_FIELD', key, value }), []);
  const setCrypto   = useCallback((payload)    => dispatch({ type: 'SET_CRYPTO', payload }), []);
  const advanceStep = useCallback((step)       => dispatch({ type: 'ADVANCE_STEP', step }), []);
  const jumpStep    = useCallback((step)       => dispatch({ type: 'JUMP_STEP', step }), []);
  const resetFrom   = useCallback((step)       => dispatch({ type: 'RESET_FROM', step }), []);
  const regenNonces = useCallback(()           => dispatch({ type: 'REGEN_NONCES' }), []);
  const setHandshakeStep = useCallback((step)  => dispatch({ type: 'SET_HANDSHAKE_STEP', step }), []);
  const setCaptured = useCallback((payload)    => dispatch({ type: 'SET_CAPTURED', payload }), []);
  const setCracker  = useCallback((payload)    => dispatch({ type: 'SET_CRACKER', payload }), []);
  const setWordlist = useCallback((payload)    => dispatch({ type: 'SET_WORDLIST', payload }), []);

  return (
    <AppContext.Provider value={{
      state, dispatch,
      setField, setCrypto, advanceStep, jumpStep, resetFrom, regenNonces,
      setHandshakeStep, setCaptured, setCracker, setWordlist,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
