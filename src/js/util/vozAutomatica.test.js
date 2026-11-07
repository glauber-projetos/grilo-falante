import { vozAutomatica } from './vozAutomatica.js';

const PADRAO = 'VOICE_DEVICE_DEFAULT';
const padrao = { id: PADRAO, name: 'Automática', type: 'native', ref: undefined };
const google = { id: 'google-pt', name: 'Google português do Brasil', ref: { localService: false } };
const daniel = { id: 'ms-daniel', name: 'Microsoft Daniel', ref: { localService: true } };
const maria = { id: 'ms-maria', name: 'Microsoft Maria', ref: { localService: true } };

describe('vozAutomatica.ordenar', () => {
    test('device voice comes before the internet voice and the placeholder', () => {
        let r = vozAutomatica.ordenar([padrao, google, daniel], PADRAO);
        expect(r.map((v) => v.id)).toEqual(['ms-daniel', 'google-pt', PADRAO]);
    });

    test('keeps the browser order inside each group', () => {
        let r = vozAutomatica.ordenar([google, maria, daniel], PADRAO);
        expect(r.map((v) => v.id)).toEqual(['ms-maria', 'ms-daniel', 'google-pt']);
    });

    test('only an internet voice: it is still used before the placeholder', () => {
        let r = vozAutomatica.ordenar([padrao, google], PADRAO);
        expect(r[0].id).toBe('google-pt');
    });

    test('voices without the browser object use the "local" flag', () => {
        let externa = { id: 'piper', name: 'Piper', ref: {}, local: true };
        let r = vozAutomatica.ordenar([google, externa], PADRAO);
        expect(r[0].id).toBe('piper');
    });

    test('empty list', () => {
        expect(vozAutomatica.ordenar(null, PADRAO)).toEqual([]);
    });
});
