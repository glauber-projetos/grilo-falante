// Grilo Falante: o perfil da conta abre e continua com a cópia local quando o servidor não responde ou recusa a sessão.
jest.mock('../../externals/jquery.js', () => {
    const trigger = jest.fn();
    const $ = jest.fn(() => ({ trigger: trigger, on: jest.fn() }));
    $.trigger = trigger;
    return { __esModule: true, default: $ };
});

jest.mock(
    'PouchDB',
    () => {
        function PouchDB(nome) {
            this.nome = nome;
            PouchDB.criados.push(nome);
        }
        PouchDB.criados = [];
        PouchDB.falhaRemota = null;
        PouchDB.destruidos = [];
        PouchDB.prototype.info = function () {
            if (/^https?:/.test(this.nome) && PouchDB.falhaRemota) {
                return Promise.reject(PouchDB.falhaRemota);
            }
            return Promise.resolve({ doc_count: 1 });
        };
        PouchDB.prototype.close = jest.fn(() => Promise.resolve());
        PouchDB.prototype.destroy = function () {
            PouchDB.destruidos.push(this.nome);
            return Promise.resolve();
        };
        PouchDB.prototype.sync = function () {
            let emissor = { on: () => emissor, cancel: jest.fn() };
            PouchDB.syncs = (PouchDB.syncs || 0) + 1;
            return emissor;
        };
        return { __esModule: true, default: PouchDB };
    },
    { virtual: true }
);

jest.mock('./localStorageService', () => ({
    localStorageService: {
        isDatabaseSynced: jest.fn(() => true),
        markSyncedDatabase: jest.fn()
    }
}));
jest.mock('./encryptionService', () => ({ encryptionService: { resetEncryptionProperties: jest.fn() } }));

import PouchDB from 'PouchDB';
import $ from '../../externals/jquery.js';
import { PouchDbAdapter } from './pouchDbAdapter';
import { localStorageService } from './localStorageService';
import { constants } from '../../util/constants';

const URL = 'https://tok:pw@db.grilo.test/cabc';

function perdas() {
    return $.trigger.mock.calls.filter((c) => c[0] === constants.EVENT_DB_CONNECTION_LOST).map((c) => c[1]);
}

beforeEach(() => {
    global.log = { warn: jest.fn(), info: jest.fn(), debug: jest.fn(), error: jest.fn() };
    PouchDB.falhaRemota = null;
    PouchDB.criados = [];
    PouchDB.destruidos = [];
    PouchDB.syncs = 0;
    localStorageService.isDatabaseSynced.mockReturnValue(true);
    jest.clearAllMocks();
});

test('com internet: abre o local e liga a sincronização', async () => {
    let adapter = new PouchDbAdapter('cadu', URL, false, false, jest.fn());
    await adapter.init();
    expect(PouchDB.criados).toEqual(['cadu', URL]);
    expect(adapter.isSyncEnabled()).toBe(true);
    expect(adapter.getDbToUse().nome).toBe('cadu');
});

test('sem internet: o perfil abre com a cópia local e avisa a perda de conexão', async () => {
    PouchDB.falhaRemota = { status: 0, name: 'fetch error' };
    let adapter = new PouchDbAdapter('cadu', URL, false, false, jest.fn());
    await expect(adapter.init()).resolves.toBeDefined();
    await Promise.resolve();
    expect(adapter.getDbToUse().nome).toBe('cadu');
    expect(adapter.isSyncEnabled()).toBe(false);
    expect(perdas()).toEqual([[{ status: 0, name: 'fetch error' }, 'cadu']]);
});

test('401: abre com a cópia local, manda o erro adiante e não apaga nada', async () => {
    PouchDB.falhaRemota = { status: 401, name: 'unauthorized' };
    let adapter = new PouchDbAdapter('cadu', URL, false, false, jest.fn());
    await adapter.init();
    await Promise.resolve();
    expect(adapter.getDbToUse().nome).toBe('cadu');
    expect(perdas()[0][0].status).toBe(401);
    expect(PouchDB.destruidos).toEqual([]);
    expect(localStorageService.markSyncedDatabase).not.toHaveBeenCalled();
});

test('cópia local incompleta: continua como antes (precisa do servidor)', async () => {
    localStorageService.isDatabaseSynced.mockReturnValue(false);
    PouchDB.falhaRemota = { status: 0 };
    let adapter = new PouchDbAdapter('cadu', URL, false, false, jest.fn());
    await expect(adapter.init()).rejects.toEqual({ status: 0 });
});

test('startSync com sessão nova troca o endereço remoto sem fechar o local', async () => {
    let adapter = new PouchDbAdapter('cadu', URL, false, false, jest.fn());
    await adapter.init();
    let novo = 'https://tok2:pw2@db.grilo.test/cabc';
    await adapter.startSync(novo);
    expect(PouchDB.criados).toEqual(['cadu', URL, novo]);
    expect(adapter.getDbToUse().nome).toBe('cadu');
    expect(adapter.isSyncEnabled()).toBe(true);
});

test('startSync sem internet não rejeita (segue com o local)', async () => {
    let adapter = new PouchDbAdapter('cadu', null, false, false, jest.fn());
    await adapter.init();
    PouchDB.falhaRemota = { status: 0 };
    await expect(adapter.startSync(URL)).resolves.toBeUndefined();
    expect(adapter.getDbToUse().nome).toBe('cadu');
    expect(perdas().length).toBe(1);
});

test('stopSync para e fecha só o remoto', async () => {
    let adapter = new PouchDbAdapter('cadu', URL, false, false, jest.fn());
    await adapter.init();
    adapter.stopSync();
    expect(adapter.isSyncEnabled()).toBe(false);
    expect(adapter.getDbToUse().nome).toBe('cadu');
    expect(PouchDB.destruidos).toEqual([]);
});
