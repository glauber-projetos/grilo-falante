import { offlineVoiceService as s } from './offlineVoiceService.js';

const NATIVE = 'VOICE_TYPE_NATIVE';
const RV = 'VOICE_TYPE_RESPONSIVEVOICE';
const DEFAULT = 'VOICE_DEVICE_DEFAULT';
const opts = (storage) => ({ nativeType: NATIVE, deviceDefaultId: DEFAULT, storage: storage });

function memoryStorage() {
    let data = {};
    return {
        getItem: k => (k in data ? data[k] : null),
        setItem: (k, v) => { data[k] = String(v); }
    };
}

function voice(id, langFull, local, type = NATIVE) {
    return { id: id, name: id, lang: langFull.split('-')[0], langFull: langFull, local: local, type: type };
}

test('getPlatform', () => {
    expect(s.getPlatform('Mozilla/5.0 (Linux; Android 11; SM-T225) AppleWebKit/537.36 Chrome/120 Safari/537.36')).toBe('android');
    expect(s.getPlatform('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('ios');
    expect(s.getPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows');
    expect(s.getPlatform('Mozilla/5.0 (X11; Linux x86_64)')).toBe('other');
    expect(s.getPlatform('')).toBe('other');
});

test('isPtBrVoice / isPortugueseVoice', () => {
    expect(s.isPtBrVoice(voice('a', 'pt-br', true))).toBe(true);
    expect(s.isPtBrVoice({ langFull: 'pt_BR' })).toBe(true);
    expect(s.isPtBrVoice(voice('b', 'pt-pt', true))).toBe(false);
    expect(s.isPtBrVoice(null)).toBe(false);
    expect(s.isPortugueseVoice(voice('b', 'pt-pt', true))).toBe(true);
    expect(s.isPortugueseVoice({ lang: 'pt' })).toBe(true);
    expect(s.isPortugueseVoice(voice('c', 'en-us', true))).toBe(false);
});

test('getNativePtBrVoices - only device voices, local ones first, no placeholder', () => {
    let voices = [
        voice('Google online', 'pt-br', false),
        voice('Brazilian Portuguese Female', 'pt-br', false, RV),
        voice(DEFAULT, 'pt-br', true),
        voice('Google local', 'pt-br', true),
        voice('Portugal', 'pt-pt', true)
    ];
    expect(s.getNativePtBrVoices(voices, NATIVE, DEFAULT).map(v => v.id)).toEqual(['Google local', 'Google online']);
});

test('getStatus - missing', () => {
    let st = s.getStatus([voice('en', 'en-us', true), voice('rv', 'pt-br', false, RV)], opts(memoryStorage()));
    expect(st.status).toBe(s.STATUS_MISSING);
    expect(st.bestVoice).toBe(null);
});

test('getStatus - only a voice from Portugal', () => {
    let st = s.getStatus([voice('pt', 'pt-pt', true)], opts(memoryStorage()));
    expect(st.status).toBe(s.STATUS_ONLY_OTHER_PORTUGUESE);
    expect(st.bestVoice.id).toBe('pt');
});

test('getStatus - online only / probably offline', () => {
    expect(s.getStatus([voice('net', 'pt-br', false)], opts(memoryStorage())).status).toBe(s.STATUS_ONLINE_ONLY);
    let st = s.getStatus([voice('net', 'pt-br', false), voice('loc', 'pt-br', true)], opts(memoryStorage()));
    expect(st.status).toBe(s.STATUS_PROBABLY_OFFLINE);
    expect(st.bestVoice.id).toBe('loc');
});

test('recordSampleResult - only a voice heard while offline is confirmed', () => {
    let storage = memoryStorage();
    let voices = [voice('net', 'pt-br', false), voice('loc', 'pt-br', true)];

    expect(s.recordSampleResult('net', { started: true }, true, storage)).toBe(false); // online: proves nothing
    expect(s.recordSampleResult('net', { started: false }, false, storage)).toBe(false); // didn't speak
    expect(s.recordSampleResult('net', { started: null }, false, storage)).toBe(false); // unknown
    expect(s.getStatus(voices, opts(storage)).status).toBe(s.STATUS_PROBABLY_OFFLINE);

    expect(s.recordSampleResult('net', { started: true }, false, storage)).toBe(true);
    expect(s.recordSampleResult('net', { started: true }, false, storage)).toBe(true); // no duplicates
    expect(s.getConfirmedVoiceIds(storage)).toEqual(['net']);
    let st = s.getStatus(voices, opts(storage));
    expect(st.status).toBe(s.STATUS_CONFIRMED);
    expect(st.bestVoice.id).toBe('net');

    s.forgetVoice('net', storage);
    expect(s.getConfirmedVoiceIds(storage)).toEqual([]);
});

test('getConfirmedVoiceIds - robust against broken storage', () => {
    expect(s.getConfirmedVoiceIds(null)).toEqual([]);
    expect(s.getConfirmedVoiceIds({ getItem: () => '{broken' })).toEqual([]);
    expect(s.getConfirmedVoiceIds({ getItem: () => '{"a":1}' })).toEqual([]);
    expect(s.getConfirmedVoiceIds({ getItem: () => '["a", 3]' })).toEqual(['a']);
    let throwing = { getItem: () => '[]', setItem: () => { throw new Error('full'); } };
    expect(() => s.recordSampleResult('x', { started: true }, false, throwing)).not.toThrow();
});
