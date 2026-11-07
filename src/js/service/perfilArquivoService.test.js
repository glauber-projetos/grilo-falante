import fs from 'fs';
import path from 'path';

jest.mock('./loginService', () => ({
    loginService: {
        getLoggedInUsername: jest.fn(),
        registerOffline: jest.fn(),
        logout: jest.fn(),
        loginStoredUser: jest.fn()
    }
}));

jest.mock('./data/dataService', () => ({
    dataService: {
        normalizeImportData: jest.fn((data) => {
            if (!data || data.length === 0) {
                return {};
            }
            let importData;
            if (Array.isArray(data)) {
                importData = { grids: data };
            } else if (!data.grids && data.id) {
                importData = { grids: [data] };
            } else {
                importData = data;
            }
            importData.grids = importData.grids || [];
            importData.dictionaries = importData.dictionaries || [];
            importData.metadata = importData.metadata || {};
            return importData;
        }),
        convertFileToImportData: jest.fn(),
        importBackupData: jest.fn()
    }
}));

jest.mock('./data/databaseService', () => ({
    databaseService: {
        getCurrentUsedDatabase: jest.fn(),
        deleteDatabase: jest.fn()
    }
}));

jest.mock('./data/localStorageService', () => ({
    localStorageService: {
        getSavedUsers: jest.fn(),
        removeLocalUser: jest.fn(),
        getUserSettings: jest.fn()
    }
}));

// fileUtil real; só o util (que puxa os modelos) é substituído
jest.mock('../util/util', () => ({ util: {} }));

jest.mock('../externals/jquery', () => {
    const trigger = jest.fn();
    const $ = jest.fn(() => ({ trigger: trigger, on: jest.fn() }));
    $.trigger = trigger;
    return { __esModule: true, default: $ };
});

import { perfilArquivoService as servico } from './perfilArquivoService';
import { loginService } from './loginService';
import { dataService } from './data/dataService';
import { databaseService } from './data/databaseService';
import { localStorageService } from './data/localStorageService';
import { perfilService } from './perfilService';
import { constants } from '../util/constants';
import $ from '../externals/jquery';

const RAIZ = path.resolve(__dirname, '../../..');
const ARQ_COMPLETO = 'cadu_2026-11-07_14-30_grilo-falante-backup-completo.grd';

function backupCompleto() {
    return {
        grids: [
            { id: 'grid-1', label: { pt: 'Início' }, gridElements: [] },
            { id: 'grid-2', label: { pt: 'Comer' }, gridElements: [] }
        ],
        dictionaries: [],
        metadata: { id: 'meta', phraseHistory: [{ text: 'quero água' }, { text: 'quero brincar' }] }
    };
}

function arquivo(texto, nome = ARQ_COMPLETO) {
    return new File([texto], nome);
}

function arquivoDoRepo(caminhoRelativo) {
    let caminho = path.join(RAIZ, caminhoRelativo);
    return new File([fs.readFileSync(caminho)], path.basename(caminho));
}

function perfisGuardados() {
    return JSON.parse(window.localStorage.getItem('GRILO_PERFIS') || '{}');
}

async function codigoDoErro(promessa) {
    try {
        await promessa;
    } catch (e) {
        return e.codigo;
    }
    throw new Error('deveria ter lançado erro');
}

beforeEach(() => {
    global.log = { warn: jest.fn(), info: jest.fn(), debug: jest.fn() };
    jest.clearAllMocks();
    window.localStorage.clear();
    localStorageService.getSavedUsers.mockReturnValue([]);
    loginService.getLoggedInUsername.mockReturnValue(null);
    loginService.registerOffline.mockResolvedValue(undefined);
    databaseService.getCurrentUsedDatabase.mockReturnValue(null);
    databaseService.deleteDatabase.mockResolvedValue(undefined);
    dataService.importBackupData.mockResolvedValue(undefined);
});

describe('prepararArquivo', () => {
    test('backup completo do Grilo Falante', async () => {
        let file = arquivo(JSON.stringify(backupCompleto()));
        let r = await servico.prepararArquivo(file);
        expect(r.file).toBe(file);
        expect(r.nomeSugerido).toBe('Cadu');
        expect(r.pranchas).toBe(2);
        expect(r.frases).toBe(2);
        expect(r.dados.grids).toHaveLength(2);
        expect(dataService.normalizeImportData).toHaveBeenCalledTimes(1);
    });

    test('aceita arquivo com BOM', async () => {
        let r = await servico.prepararArquivo(arquivo('﻿' + JSON.stringify(backupCompleto())));
        expect(r.pranchas).toBe(2);
        expect(r.frases).toBe(2);
        expect(r.nomeSugerido).toBe('Cadu');
    });

    test('aceita .json com uma lista de pranchas', async () => {
        let r = await servico.prepararArquivo(arquivo(JSON.stringify(backupCompleto().grids), 'maria-clara.json'));
        expect(r.pranchas).toBe(2);
        expect(r.frases).toBe(0);
        expect(r.nomeSugerido).toBe('Maria Clara');
    });

    test('JSON quebrado -> ERRO_ARQUIVO_INVALIDO', async () => {
        let file = arquivo('{"grids": [ {"id": ');
        expect(await codigoDoErro(servico.prepararArquivo(file))).toBe('ERRO_ARQUIVO_INVALIDO');
        expect(servico.ERRO_ARQUIVO_INVALIDO).toBe('ERRO_ARQUIVO_INVALIDO');
    });

    test('JSON sem grids, metadata nem dictionaries -> inválido', async () => {
        expect(await codigoDoErro(servico.prepararArquivo(arquivo('{"foo": 1, "bar": [1, 2]}')))).toBe('ERRO_ARQUIVO_INVALIDO');
        expect(await codigoDoErro(servico.prepararArquivo(arquivo('[]')))).toBe('ERRO_ARQUIVO_INVALIDO');
        expect(await codigoDoErro(servico.prepararArquivo(arquivo('"texto"')))).toBe('ERRO_ARQUIVO_INVALIDO');
        expect(await codigoDoErro(servico.prepararArquivo(arquivo('null')))).toBe('ERRO_ARQUIVO_INVALIDO');
    });

    test('backup sem pranchas nem palavras -> inválido', async () => {
        let file = arquivo(JSON.stringify({ grids: [], dictionaries: [], metadata: { phraseHistory: [] } }));
        expect(await codigoDoErro(servico.prepararArquivo(file))).toBe('ERRO_ARQUIVO_INVALIDO');
    });

    test('arquivo vazio -> ERRO_ARQUIVO_VAZIO', async () => {
        expect(await codigoDoErro(servico.prepararArquivo(arquivo('')))).toBe('ERRO_ARQUIVO_VAZIO');
        expect(await codigoDoErro(servico.prepararArquivo(null))).toBe('ERRO_ARQUIVO_VAZIO');
    });

    test('formato não .grd vai para convertFileToImportData; falha -> inválido', async () => {
        dataService.convertFileToImportData.mockRejectedValueOnce(new Error('zip ruim'));
        let file = arquivo('nao e zip', 'cadu.obz');
        expect(await codigoDoErro(servico.prepararArquivo(file))).toBe('ERRO_ARQUIVO_INVALIDO');
        expect(dataService.convertFileToImportData).toHaveBeenCalledWith(file);
    });

    test('fixture: backup completo do original (demo-grammar)', async () => {
        let file = arquivoDoRepo('docs/documentation_user/files/demo-grammar_2024-03-18_15-07_asterics-grid-full-backup.grd');
        let r = await servico.prepararArquivo(file);
        expect(r.nomeSugerido).toBe('Demo Grammar');
        expect(r.pranchas).toBe(8);
        expect(r.frases).toBe(0);
        expect(r.dados.dictionaries).toHaveLength(1);
        expect(r.dados.metadata).toBeTruthy();
    });

    test('fixture: app/simple/examples/default.grd (só pranchas)', async () => {
        let file = arquivoDoRepo('app/simple/examples/default.grd');
        let r = await servico.prepararArquivo(file);
        expect(r.nomeSugerido).toBe('');
        expect(r.pranchas).toBe(5);
        expect(r.frases).toBe(0);
        expect(r.dados.dictionaries).toEqual([]);
    });
});

describe('criarPerfilDoArquivo', () => {
    async function preparado() {
        return servico.prepararArquivo(arquivo(JSON.stringify(backupCompleto())));
    }

    test('cria usuário livre, importa e guarda o perfil', async () => {
        localStorageService.getSavedUsers.mockReturnValue(['cadu']);
        dataService.importBackupData.mockImplementation(async (dados, opcoes) => {
            opcoes.progressFn(0);
            opcoes.progressFn(30);
            opcoes.progressFn(75);
            opcoes.progressFn(100);
        });
        let prep = await preparado();
        let progresso = jest.fn();

        let usuario = await servico.criarPerfilDoArquivo(prep, 'Cadu', progresso);

        expect(usuario).toBe('cadu-2');
        expect(loginService.registerOffline).toHaveBeenCalledWith('cadu-2', 'cadu-2');
        expect(dataService.importBackupData).toHaveBeenCalledTimes(1);
        let [dados, opcoes] = dataService.importBackupData.mock.calls[0];
        expect(dados).toBe(prep.dados);
        expect(opcoes).toEqual(expect.objectContaining({
            skipDelete: true,
            filename: ARQ_COMPLETO,
            generateGlobalGrid: false,
            progressFn: expect.any(Function)
        }));
        expect(loginService.registerOffline.mock.invocationCallOrder[0])
            .toBeLessThan(dataService.importBackupData.mock.invocationCallOrder[0]);

        let valores = progresso.mock.calls.map((c) => c[0]);
        expect(valores.length).toBeGreaterThan(2);
        for (let i = 1; i < valores.length; i++) {
            expect(valores[i]).toBeGreaterThanOrEqual(valores[i - 1]);
        }
        valores.forEach((v) => {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(100);
        });
        expect(valores[valores.length - 1]).toBe(100);

        expect(perfisGuardados()['cadu-2']).toEqual(expect.objectContaining({ nome: 'Cadu', foto: null }));
    });

    test('progresso fora da faixa é limitado e funciona sem callback', async () => {
        let progresso = jest.fn();
        dataService.importBackupData.mockImplementation(async (dados, opcoes) => {
            opcoes.progressFn(-10);
            opcoes.progressFn(250);
        });
        await servico.criarPerfilDoArquivo(await preparado(), 'Ana', progresso);
        let valores = progresso.mock.calls.map((c) => c[0]);
        expect(Math.max(...valores)).toBe(100);
        expect(Math.min(...valores)).toBeGreaterThanOrEqual(0);

        await expect(servico.criarPerfilDoArquivo(await preparado(), 'Bia')).resolves.toBe('bia');
    });

    test('usuário logado entra na lista de ocupados', async () => {
        loginService.getLoggedInUsername.mockReturnValue('cadu');
        let usuario = await servico.criarPerfilDoArquivo(await preparado(), 'Cadu');
        expect(usuario).toBe('cadu-2');
    });

    test('importação falha -> ERRO_IMPORTAR e desfaz o perfil', async () => {
        localStorageService.getSavedUsers.mockReturnValue(['cadu']);
        let causa = new Error('banco cheio');
        dataService.importBackupData.mockRejectedValue(causa);
        loginService.getLoggedInUsername.mockReturnValue(null);
        databaseService.getCurrentUsedDatabase.mockReturnValue('cadu-2');
        perfilService.salvarPerfil('cadu', { nome: 'Cadu antigo' });

        let erro;
        try {
            await servico.criarPerfilDoArquivo(await preparado(), 'Cadu', jest.fn());
        } catch (e) {
            erro = e;
        }
        expect(erro).toBeDefined();
        expect(erro.codigo).toBe('ERRO_IMPORTAR');
        expect(erro.causa).toBe(causa);
        expect(loginService.registerOffline).toHaveBeenCalledWith('cadu-2', 'cadu-2');
        expect(loginService.logout).toHaveBeenCalled();
        expect(localStorageService.removeLocalUser).toHaveBeenCalledWith('cadu-2');
        expect(databaseService.deleteDatabase).toHaveBeenCalledWith('cadu-2');
        expect(perfisGuardados()['cadu-2']).toBeUndefined();
        // o outro perfil continua
        expect(perfisGuardados()['cadu']).toEqual(expect.objectContaining({ nome: 'Cadu antigo' }));
        expect(log.warn).toHaveBeenCalled();
    });
});

describe('criarPerfil', () => {
    test('com foto usa a miniatura', async () => {
        let spy = jest.spyOn(perfilService, 'miniatura').mockResolvedValue('data:image/jpeg;base64,MINI');
        let usuario = await servico.criarPerfil('Maria Clara', { foto: 'data:image/png;base64,GRANDE' });
        expect(usuario).toBe('maria-clara');
        expect(spy).toHaveBeenCalledWith('data:image/png;base64,GRANDE');
        expect(perfisGuardados()['maria-clara']).toEqual(expect.objectContaining({ nome: 'Maria Clara', foto: 'data:image/jpeg;base64,MINI' }));
        spy.mockRestore();
    });

    test('sem foto não chama canvas', async () => {
        let spy = jest.spyOn(perfilService, 'miniatura');
        await servico.criarPerfil('Zé');
        expect(spy).not.toHaveBeenCalled();
        expect(perfisGuardados()['ze-1']).toEqual(expect.objectContaining({ nome: 'Zé', foto: null }));
        spy.mockRestore();
    });
});

describe('entrar', () => {
    test('usa loginStoredUser', () => {
        loginService.loginStoredUser.mockReturnValue('ok');
        expect(servico.entrar('cadu')).toBe('ok');
        expect(loginService.loginStoredUser).toHaveBeenCalledWith('cadu', true);
    });
});

describe('removerDoAparelho', () => {
    test('usuário atual: logout, remove e avisa', async () => {
        let configuracoes = { username: 'cadu', type: 'local' };
        localStorageService.getUserSettings.mockReturnValue(configuracoes);
        loginService.getLoggedInUsername.mockReturnValue('cadu');
        perfilService.salvarPerfil('cadu', { nome: 'Cadu' });
        perfilService.salvarPerfil('bia', { nome: 'Bia' });

        await servico.removerDoAparelho('cadu');

        expect(loginService.logout).toHaveBeenCalledTimes(1);
        expect(loginService.logout.mock.invocationCallOrder[0])
            .toBeLessThan(localStorageService.removeLocalUser.mock.invocationCallOrder[0]);
        expect(localStorageService.removeLocalUser).toHaveBeenCalledWith('cadu');
        expect(databaseService.deleteDatabase).toHaveBeenCalledWith('cadu');
        expect(perfisGuardados()['cadu']).toBeUndefined();
        expect(perfisGuardados()['bia']).toBeTruthy();
        expect($).toHaveBeenCalledWith(document);
        expect($.trigger).toHaveBeenCalledWith(constants.EVENT_USER_DELETED, ['cadu', configuracoes]);
    });

    test('outro usuário: não faz logout', async () => {
        loginService.getLoggedInUsername.mockReturnValue('bia');
        await servico.removerDoAparelho('cadu');
        expect(loginService.logout).not.toHaveBeenCalled();
        expect(localStorageService.removeLocalUser).toHaveBeenCalledWith('cadu');
        expect(databaseService.deleteDatabase).toHaveBeenCalledWith('cadu');
        expect($.trigger).toHaveBeenCalledWith('EVENT_USER_DELETED', expect.arrayContaining(['cadu']));
    });

    test('sem usuário não faz nada', async () => {
        await servico.removerDoAparelho('');
        expect(localStorageService.removeLocalUser).not.toHaveBeenCalled();
        expect($.trigger).not.toHaveBeenCalled();
    });
});
