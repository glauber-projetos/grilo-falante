/**
 * Offline voice check: is there a Brazilian Portuguese (pt-BR) voice on this device, and does it work without internet?
 *
 * Browsers can't tell for sure if a voice needs the internet: "localService" is only a hint (Android Chrome reports
 * most Google voices as local, even if the voice data is not downloaded). So we combine:
 * 1) the hint (voice.local, see voiceUtil.isVoiceOffline()),
 * 2) a real test: if a sample sentence was spoken while the device was offline, this voice is saved as "confirmed".
 *
 * The functions get their dependencies (voices, storage, userAgent, online state) as parameters, so they can be tested.
 */

const KEY_CONFIRMED_OFFLINE_VOICES = 'GF_VOICES_CONFIRMED_OFFLINE';

const STATUS_CONFIRMED = 'STATUS_CONFIRMED'; // pt-BR voice was heard while offline
const STATUS_PROBABLY_OFFLINE = 'STATUS_PROBABLY_OFFLINE'; // pt-BR voice says it's local, not tested offline yet
const STATUS_ONLINE_ONLY = 'STATUS_ONLINE_ONLY'; // only pt-BR voices that need the internet
const STATUS_ONLY_OTHER_PORTUGUESE = 'STATUS_ONLY_OTHER_PORTUGUESE'; // e.g. only a voice from Portugal
const STATUS_MISSING = 'STATUS_MISSING'; // no Portuguese voice at all

let offlineVoiceService = {};

offlineVoiceService.STATUS_CONFIRMED = STATUS_CONFIRMED;
offlineVoiceService.STATUS_PROBABLY_OFFLINE = STATUS_PROBABLY_OFFLINE;
offlineVoiceService.STATUS_ONLINE_ONLY = STATUS_ONLINE_ONLY;
offlineVoiceService.STATUS_ONLY_OTHER_PORTUGUESE = STATUS_ONLY_OTHER_PORTUGUESE;
offlineVoiceService.STATUS_MISSING = STATUS_MISSING;

/**
 * @param userAgent (optional) defaults to navigator.userAgent
 * @return {'android'|'ios'|'windows'|'other'}
 */
offlineVoiceService.getPlatform = function(userAgent = getUserAgent()) {
    let ua = (userAgent || '').toLowerCase();
    if (ua.includes('android')) {
        return 'android';
    }
    if (/iphone|ipad|ipod/.test(ua) || (ua.includes('macintosh') && ua.includes('mobile'))) {
        return 'ios';
    }
    if (ua.includes('windows')) {
        return 'windows';
    }
    return 'other';
};

/**
 * true, if the given voice (format of speechService.getVoices()) speaks Brazilian Portuguese.
 */
offlineVoiceService.isPtBrVoice = function(voice) {
    let langFull = normalizeLang(voice && (voice.langFull || voice.lang));
    return langFull === 'pt-br';
};

/**
 * true, if the given voice speaks any kind of Portuguese.
 */
offlineVoiceService.isPortugueseVoice = function(voice) {
    let lang = normalizeLang(voice && (voice.langFull || voice.lang));
    return lang === 'pt' || lang.startsWith('pt-');
};

/**
 * returns the device's own (native) pt-BR voices, voices that work without internet first.
 * Voices of the type "responsive voice" or external voices always need the internet and are not included.
 * @param voices array of voices like speechService.getVoices()
 * @param nativeType the value of constants.VOICE_TYPE_NATIVE
 * @param deviceDefaultId the value of constants.VOICE_DEVICE_DEFAULT (this placeholder is ignored)
 */
offlineVoiceService.getNativePtBrVoices = function(voices, nativeType, deviceDefaultId) {
    return (voices || [])
        .filter(v => v && v.type === nativeType && v.id !== deviceDefaultId && offlineVoiceService.isPtBrVoice(v))
        .sort((a, b) => (a.local === b.local ? 0 : a.local ? -1 : 1));
};

/**
 * overall pt-BR voice state of this device.
 * @param voices array of voices like speechService.getVoices()
 * @param options.nativeType constants.VOICE_TYPE_NATIVE
 * @param options.deviceDefaultId constants.VOICE_DEVICE_DEFAULT
 * @param options.storage (optional) defaults to window.localStorage
 * @return {{status: string, bestVoice: object|null, ptBrVoices: object[], confirmedIds: string[]}}
 */
offlineVoiceService.getStatus = function(voices, options = {}) {
    let ptBrVoices = offlineVoiceService.getNativePtBrVoices(voices, options.nativeType, options.deviceDefaultId);
    let confirmedIds = offlineVoiceService.getConfirmedVoiceIds(options.storage);
    let confirmed = ptBrVoices.filter(v => confirmedIds.includes(v.id));
    let local = ptBrVoices.filter(v => v.local);
    let result = { status: STATUS_MISSING, bestVoice: null, ptBrVoices: ptBrVoices, confirmedIds: confirmedIds };
    if (confirmed.length > 0) {
        result.status = STATUS_CONFIRMED;
        result.bestVoice = confirmed[0];
    } else if (local.length > 0) {
        result.status = STATUS_PROBABLY_OFFLINE;
        result.bestVoice = local[0];
    } else if (ptBrVoices.length > 0) {
        result.status = STATUS_ONLINE_ONLY;
        result.bestVoice = ptBrVoices[0];
    } else {
        let otherPortuguese = (voices || []).filter(v => v && v.type === options.nativeType && v.id !== options.deviceDefaultId && offlineVoiceService.isPortugueseVoice(v));
        if (otherPortuguese.length > 0) {
            result.status = STATUS_ONLY_OTHER_PORTUGUESE;
            result.bestVoice = otherPortuguese[0];
        }
    }
    return result;
};

/**
 * saves the result of "listen to a sample". If the voice was really heard while the device had no internet, it is
 * remembered as working offline.
 * @param voiceId
 * @param sampleResult result of speechService.speakSample(), {started: boolean|null}
 * @param online navigator.onLine at the time of the test
 * @param storage (optional) defaults to window.localStorage
 * @return {boolean} true, if the voice is now confirmed to work offline
 */
offlineVoiceService.recordSampleResult = function(voiceId, sampleResult, online, storage = getStorage()) {
    if (!voiceId || !sampleResult || sampleResult.started !== true || online) {
        return false;
    }
    let ids = offlineVoiceService.getConfirmedVoiceIds(storage);
    if (!ids.includes(voiceId)) {
        ids.push(voiceId);
        writeIds(ids, storage);
    }
    return true;
};

/**
 * removes a voice from the confirmed list, e.g. if speaking failed while offline.
 */
offlineVoiceService.forgetVoice = function(voiceId, storage = getStorage()) {
    let ids = offlineVoiceService.getConfirmedVoiceIds(storage).filter(id => id !== voiceId);
    writeIds(ids, storage);
};

offlineVoiceService.getConfirmedVoiceIds = function(storage = getStorage()) {
    if (!storage) {
        return [];
    }
    try {
        let parsed = JSON.parse(storage.getItem(KEY_CONFIRMED_OFFLINE_VOICES) || '[]');
        return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : [];
    } catch (e) {
        return [];
    }
};

function writeIds(ids, storage) {
    if (!storage) {
        return;
    }
    try {
        storage.setItem(KEY_CONFIRMED_OFFLINE_VOICES, JSON.stringify(ids));
    } catch (e) {
        // storage full or blocked: the check is only a convenience
    }
}

function normalizeLang(lang) {
    return String(lang || '').toLowerCase().replace('_', '-');
}

function getUserAgent() {
    return typeof navigator !== 'undefined' ? navigator.userAgent : '';
}

function getStorage() {
    try {
        return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
    } catch (e) {
        return null;
    }
}

export { offlineVoiceService };
