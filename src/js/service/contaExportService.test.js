jest.mock('../externals/jquery.js', () => {
    const $ = jest.fn(() => ({ trigger: jest.fn(), on: jest.fn() }));
    return { __esModule: true, default: $ };
});
jest.mock('../externals/jquery', () => {
    const $ = jest.fn(() => ({ trigger: jest.fn(), on: jest.fn() }));
    return { __esModule: true, default: $ };
});
jest.mock('file-saver', () => ({ __esModule: true, default: { saveAs: jest.fn() } }));
jest.mock('../util/util', () => ({ util: { getCurrentDateTimeString: () => '2026-11-07_10-00' } }));
jest.mock('./data/dataService', () => ({
    dataService: {
        downloadBackupToFile: jest.fn(() => Promise.resolve()),
        getGrids: jest.fn(() => Promise.resolve([{ id: 'g1' }])),
        getBackupData: jest.fn(() => Promise.resolve({ grids: [{ id: 'g1', aberta: true }], dictionaries: [], metadata: {} }))
    }
}));
let mockAberto = 'cadu';
jest.mock('./data/databaseService', () => ({
    databaseService: { getCurrentUsedDatabase: jest.fn(() => mockAberto) }
}));
jest.mock('./data/localStorageService', () => ({
    localStorageService: { isDatabaseSynced: jest.fn(() => true) }
}));

import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { contaExportService } from './contaExportService';
import { dataService } from './data/dataService';
import { criarPouchFalso } from './contaTesteUtil';

let fake;

function comConta(criancas, lista) {
    window.localStorage.setItem(
        'GRILO_CONTA',
        JSON.stringify({ email: 'a@x.com', sessao: { token: 't', password: 'p' }, criancas: criancas, listaCriancas: lista })
    );
}

beforeEach(() => {
    global.log = { warn: jest.fn(), info: jest.fn(), debug: jest.fn(), error: jest.fn() };
    window.localStorage.clear();
    fake = criarPouchFalso();
    window.PouchDB = fake.PouchDB;
    mockAberto = 'cadu';
    jest.clearAllMocks();
});

test('sem conta: o backup .grd de sempre da criança aberta', async () => {
    await expect(contaExportService.baixarTudo()).resolves.toMatchObject({ criancas: 1, arquivo: '.grd' });
    expect(dataService.downloadBackupToFile).toHaveBeenCalled();
    expect(FileSaver.saveAs).not.toHaveBeenCalled();
});

test('uma criança na conta: também o .grd de sempre', async () => {
    comConta({ cabc: { usuarioLocal: 'cadu', nome: 'Cadu' } });
    await contaExportService.baixarTudo();
    expect(dataService.downloadBackupToFile).toHaveBeenCalled();
});

test('mais de uma: zip com um .grd por criança, sem trocar a criança aberta', async () => {
    comConta(
        { cabc: { usuarioLocal: 'cadu', nome: 'Cadu' }, cdef: { usuarioLocal: 'bia', nome: 'Bia' } },
        [{ banco: 'cabc' }, { banco: 'cdef' }, { banco: 'cxyz', nome: 'Zé' }]
    );
    window.localStorage.setItem('GRILO_PERFIS', JSON.stringify({ cadu: { nome: 'Cadu' }, bia: { nome: 'Bia Souza' } }));
    fake.bancos['bia'] = [
        { _id: 'grid-1', modelName: 'GridData', encryptedDataBase64: JSON.stringify({ id: 'grid-1', label: { pt: 'Início' } }) },
        { _id: 'dict-1', modelName: 'Dictionary', encryptedDataBase64: JSON.stringify({ id: 'dict-1' }) },
        { _id: 'meta-1', modelName: 'MetaData', encryptedDataBase64: JSON.stringify({ id: 'meta-1', locked: false }) },
        { _id: 'velho', modelName: 'GridData', encryptedDataBase64: JSON.stringify({ iv: 'x', ct: 'y', cipher: 'aes' }) }
    ];
    let resultado = await contaExportService.baixarTudo();
    expect(resultado).toMatchObject({ criancas: 2, faltaram: ['Zé'], naoLidos: 1, arquivo: 'grilo-falante-tudo_2026-11-07_10-00.zip' });
    expect(dataService.downloadBackupToFile).not.toHaveBeenCalled();
    let [blob, nome] = FileSaver.saveAs.mock.calls[0];
    expect(nome).toBe('grilo-falante-tudo_2026-11-07_10-00.zip');
    let zip = await JSZip.loadAsync(blob);
    expect(Object.keys(zip.files).sort()).toEqual(['Bia-Souza.grd', 'Cadu.grd']);
    let bia = JSON.parse(await zip.file('Bia-Souza.grd').async('string'));
    expect(bia).toEqual({
        grids: [{ id: 'grid-1', label: { pt: 'Início' } }],
        dictionaries: [{ id: 'dict-1' }],
        metadata: { id: 'meta-1', locked: false }
    });
    let cadu = JSON.parse(await zip.file('Cadu.grd').async('string'));
    expect(cadu.grids[0].aberta).toBe(true);
});

test('nenhuma criança aberta nem baixada: avisa', async () => {
    mockAberto = null;
    await expect(contaExportService.baixarTudo()).rejects.toMatchObject({ erro: 'nao_encontrado' });
});
