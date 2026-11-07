/**
 * Chooses the voices offered in the setup wizard (Grilo Falante), so families see a short list:
 * - only Portuguese voices; if there is any Brazilian voice, only Brazilian voices
 * - voices installed on the device first (they work without internet), then online voices
 * - the generic "device default voice" entry is left out
 * - at most 4 voices
 */
const VOICE_TYPE_NATIVE = 'VOICE_TYPE_NATIVE';
const VOICE_DEVICE_DEFAULT = 'VOICE_DEVICE_DEFAULT';
const MAX_VOICES = 4;

function langOf(voice) {
    return (voice.langFull || voice.lang || '').toLowerCase().replace('_', '-');
}

function isPortuguese(voice) {
    return langOf(voice).startsWith('pt');
}

function isBrazilian(voice) {
    let lang = langOf(voice);
    return lang === 'pt-br' || lang === 'br';
}

function pickWizardVoices(voices, max = MAX_VOICES) {
    let candidates = (voices || []).filter((v) => v && v.id !== VOICE_DEVICE_DEFAULT && isPortuguese(v));
    if (candidates.some(isBrazilian)) {
        candidates = candidates.filter(isBrazilian);
    }
    let rank = (v) => (v.type === VOICE_TYPE_NATIVE ? 0 : 1);
    return candidates
        .map((v, i) => ({ v, i }))
        .sort((a, b) => rank(a.v) - rank(b.v) || a.i - b.i)
        .map((e) => e.v)
        .slice(0, max);
}

export { pickWizardVoices, isBrazilian };
