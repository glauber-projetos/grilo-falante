// Grilo Falante: as crianças da conta são perfis LOCAIS, sem criptografia, mesmo sincronizando com o servidor.
jest.mock('../../externals/jquery.js', () => {
    const trigger = jest.fn();
    const $ = jest.fn(() => ({ trigger: trigger, on: jest.fn() }));
    $.trigger = trigger;
    return { __esModule: true, default: $ };
});
jest.mock('../urlParamService', () => ({ urlParamService: { shouldResetDatabase: jest.fn(() => false) } }));
jest.mock('../../model/MetaData', () => ({ MetaData: { getIdPrefix: () => 'meta-data-' } }));
jest.mock('./convertServiceDb', () => ({ convertServiceDb: {} }));
jest.mock('../../util/util', () => ({ util: {} }));
jest.mock('./encryptionService', () => ({ encryptionService: { setEncryptionProperties: jest.fn() } }));

let mockAberto = null;
jest.mock('./pouchDbService', () => ({
    pouchDbService: {
        getOpenedDatabaseName: jest.fn(() => mockAberto),
        isSyncEnabled: jest.fn(() => false),
        initDatabase: jest.fn((nome) => {
            mockAberto = nome;
            return Promise.resolve();
        }),
        allArray: jest.fn(() => Promise.resolve([{ id: 'meta-data-1' }])),
        stopSync: jest.fn()
    }
}));
jest.mock('./localStorageService', () => ({
    localStorageService: { getSavedLocalUsers: jest.fn(() => ['cadu']) }
}));

import { databaseService } from './databaseService';
import { encryptionService } from './encryptionService';
import { pouchDbService } from './pouchDbService';

const URL = 'https://tok:pw@db.grilo.test/cabc';

beforeEach(() => {
    global.log = { warn: jest.fn(), info: jest.fn(), debug: jest.fn(), error: jest.fn() };
    mockAberto = null;
    jest.clearAllMocks();
});

test('criança da conta: sincroniza com o servidor e usa o caminho sem criptografia (_isLocalUser)', async () => {
    await databaseService.initForUser('cadu', 'cadu', URL);
    expect(pouchDbService.initDatabase).toHaveBeenCalledWith('cadu', URL, undefined);
    expect(encryptionService.setEncryptionProperties).toHaveBeenCalledWith('cadu', ['meta-data-1'], true);
});

test('religarSync só mexe no banco aberto e não troca de usuário', async () => {
    await databaseService.initForUser('cadu', 'cadu');
    jest.clearAllMocks();
    await expect(databaseService.religarSync('outro', URL)).resolves.toBe(false);
    expect(pouchDbService.initDatabase).not.toHaveBeenCalled();
    await expect(databaseService.religarSync('cadu', URL)).resolves.toBe(true);
    expect(pouchDbService.initDatabase).toHaveBeenCalledWith('cadu', URL);
    // sem reiniciar o perfil (as pranchas na tela continuam)
    expect(encryptionService.setEncryptionProperties).not.toHaveBeenCalled();
});

test('pararSync só para a sincronização', () => {
    databaseService.pararSync();
    expect(pouchDbService.stopSync).toHaveBeenCalled();
});
