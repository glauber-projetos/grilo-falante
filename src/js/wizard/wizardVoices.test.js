import { pickWizardVoices } from './wizardVoices';

const N = 'VOICE_TYPE_NATIVE';
const R = 'VOICE_TYPE_RESPONSIVEVOICE';

test('only Brazilian voices when there is one, device voices first, no "device default"', () => {
    let voices = [
        { id: 'VOICE_DEVICE_DEFAULT', lang: 'pt', type: N },
        { id: 'rv-br', lang: 'pt', langFull: 'pt-BR', type: R },
        { id: 'pt-pt', lang: 'pt', langFull: 'pt-PT', type: N },
        { id: 'daniel', lang: 'pt', langFull: 'pt-BR', type: N },
        { id: 'en', lang: 'en', langFull: 'en-US', type: N },
        { id: 'maria', lang: 'pt', langFull: 'pt-BR', type: N }
    ];
    expect(pickWizardVoices(voices).map((v) => v.id)).toEqual(['daniel', 'maria', 'rv-br']);
});

test('Portuguese from Portugal when there is no Brazilian voice', () => {
    let voices = [{ id: 'pt-pt', lang: 'pt', langFull: 'pt-PT', type: N }, { id: 'de', lang: 'de', type: N }];
    expect(pickWizardVoices(voices).map((v) => v.id)).toEqual(['pt-pt']);
});

test('at most 4 voices and empty list without Portuguese', () => {
    let many = Array.from({ length: 7 }, (_, i) => ({ id: 'v' + i, lang: 'pt', langFull: 'pt_BR', type: N }));
    expect(pickWizardVoices(many).length).toBe(4);
    expect(pickWizardVoices([{ id: 'en', lang: 'en', type: N }])).toEqual([]);
    expect(pickWizardVoices(null)).toEqual([]);
});
