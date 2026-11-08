jest.mock('../externals/jquery.js', () => {
    const trigger = jest.fn();
    const $ = jest.fn(() => ({ trigger: trigger, on: jest.fn() }));
    $.trigger = trigger;
    return { __esModule: true, default: $ };
});
jest.mock('../externals/jquery', () => {
    const trigger = jest.fn();
    const $ = jest.fn(() => ({ trigger: trigger, on: jest.fn() }));
    $.trigger = trigger;
    return { __esModule: true, default: $ };
});

jest.mock('./loginService', () => ({
    loginService: { loginStoredUser: jest.fn(() => Promise.resolve()) }
}));
jest.mock('./perfilArquivoService', () => ({
    perfilArquivoService: { criarPerfil: jest.fn(() => Promise.resolve('cadu')) }
}));
jest.mock('./contaSincronizacao', () => ({
    contaSincronizacao: { religar: jest.fn(() => Promise.resolve(true)), parar: jest.fn() }
}));

let mockAberto = null;
jest.mock('./data/databaseService', () => ({
    databaseService: {
        getCurrentUsedDatabase: jest.fn(() => mockAberto),
        deleteDatabase: jest.fn()
    }
}));

// localStorageService de verdade (lê e grava no localStorage do jsdom)
jest.mock('../model/SettingsApp.js', () => ({ SettingsApp: function (d) { Object.assign(this, d || {}); } }));
jest.mock('../model/SettingsUserLocal.js', () => ({ SettingsUserLocal: function (d) { Object.assign(this, d || {}); } }));

import { contaCriancasService } from './contaCriancasService';
import { contaSessao } from './contaSessao';
import { contaSincronizacao } from './contaSincronizacao';
import { loginService } from './loginService';
import { perfilService } from './perfilService';
import { localStorageService } from './data/localStorageService';
import { databaseService } from './data/databaseService';
import { constants } from '../util/constants';
import { criarPouchFalso } from './contaTesteUtil';

const SESSAO = { token: 'tok', password: 'pw', key: 'k1', expira: 1 };
const CRIANCA = { banco: 'cabc', nome: 'Cadu', papel: 'dono', status: 'familia', url: 'https://db.grilo.test/cabc' };
let fake;

function comConta(extra = {}) {
    window.localStorage.setItem(
        'GRILO_CONTA',
        JSON.stringify(Object.assign({ email: 'a@x.com', sessao: SESSAO, criancas: {} }, extra))
    );
}

function docs(n) {
    return Array.from({ length: n }, (_, i) => ({ _id: 'grid-' + i, modelName: 'GridData', encryptedDataBase64: '{}' }));
}

beforeEach(() => {
    global.log = { warn: jest.fn(), info: jest.fn(), debug: jest.fn(), error: jest.fn() };
    window.localStorage.clear();
    constants.HAS_CUSTOM_LOGIN_SERVER = true;
    constants.LOGIN_SERVER_URL = 'https://login.grilo.test';
    fake = criarPouchFalso();
    window.PouchDB = fake.PouchDB;
    mockAberto = null;
    jest.clearAllMocks();
});

describe('criar criança', () => {
    test('cria um perfil LOCAL, liga à conta como cópia completa e liga a sincronização', async () => {
        comConta();
        let usuario = await contaCriancasService.criarPerfilDaCrianca(CRIANCA);
        expect(usuario).toBe('cadu');
        expect(contaSessao.getCrianca('cabc')).toEqual({ usuarioLocal: 'cadu', nome: 'Cadu', papel: 'dono', url: CRIANCA.url });
        expect(localStorageService.isDatabaseSynced('cadu')).toBe(true);
        expect(contaSincronizacao.religar).toHaveBeenCalled();
    });
});

describe('levar para a conta', () => {
    test('envia tudo com progresso e mantém a cópia local', async () => {
        comConta();
        localStorageService.saveUserPassword('cadu', '');
        fake.bancos['cadu'] = docs(3);
        contaCriancasService.ligarPerfil('cabc', 'cadu', CRIANCA);
        let progresso = jest.fn();
        await contaCriancasService.enviar('cadu', 'cabc', progresso);
        expect(progresso.mock.calls.map((c) => c[0])).toEqual([
            { enviados: 0, total: 3 },
            { enviados: 1, total: 3 },
            { enviados: 2, total: 3 },
            { enviados: 3, total: 3 },
            { enviados: 3, total: 3 }
        ]);
        expect(fake.bancos['https://db.grilo.test/cabc'].length).toBe(3);
        expect(fake.bancos['cadu'].length).toBe(3);
        // usa a sessão no endereço
        expect(fake.abertos).toContain('https://tok:pw@db.grilo.test/cabc');
        // continua um perfil local (sem senha, sem criptografia)
        expect(localStorageService.isSavedLocalUser('cadu')).toBe(true);
    });

    test('a criança aberta passa a sincronizar ao terminar', async () => {
        comConta();
        mockAberto = 'cadu';
        fake.bancos['cadu'] = docs(1);
        contaCriancasService.ligarPerfil('cabc', 'cadu', CRIANCA);
        await contaCriancasService.enviar('cadu', 'cabc');
        expect(contaSincronizacao.religar).toHaveBeenCalled();
    });

    test('sem internet no meio: rejeita sem_internet, a cópia local e a ligação continuam', async () => {
        comConta();
        fake.bancos['cadu'] = docs(4);
        contaCriancasService.ligarPerfil('cabc', 'cadu', CRIANCA);
        fake.pararDepoisDe = 2;
        await expect(contaCriancasService.enviar('cadu', 'cabc')).rejects.toMatchObject({ erro: 'sem_internet' });
        expect(fake.bancos['cadu'].length).toBe(4);
        expect(contaSessao.bancoDoUsuario('cadu')).toBe('cabc');
        expect(databaseService.deleteDatabase).not.toHaveBeenCalled();
    });

    test('401 no envio: marca "entrar de novo" e não apaga nada', async () => {
        comConta();
        fake.bancos['cadu'] = docs(2);
        contaCriancasService.ligarPerfil('cabc', 'cadu', CRIANCA);
        fake.recusar = 401;
        await expect(contaCriancasService.enviar('cadu', 'cabc')).rejects.toMatchObject({ erro: 'nao_autorizado' });
        expect(fake.bancos['cadu'].length).toBe(2);
        expect(contaSessao.ler().entrarDeNovo).toBe(true);
        expect(contaSessao.ler().sessao).toEqual(SESSAO);
    });
});

describe('baixar criança (aparelho novo)', () => {
    test('baixa com progresso para um perfil local novo, sem senha', async () => {
        comConta();
        fake.bancos['https://db.grilo.test/cabc'] = docs(2);
        let progresso = jest.fn();
        let usuario = await contaCriancasService.baixar(CRIANCA, progresso);
        expect(usuario).toBe('cadu');
        expect(progresso.mock.calls.map((c) => c[0])).toEqual([
            { recebidos: 0, total: 2 },
            { recebidos: 1, total: 2 },
            { recebidos: 2, total: 2 },
            { recebidos: 2, total: 2 }
        ]);
        expect(fake.bancos['cadu'].length).toBe(2);
        expect(localStorageService.getSavedLocalUsers()).toContain('cadu');
        expect(localStorageService.isSavedLocalUser('cadu')).toBe(true);
        expect(localStorageService.isDatabaseSynced('cadu')).toBe(true);
        expect(perfilService.getPerfil('cadu').nome).toBe('Cadu');
        expect(contaCriancasService.nesteAparelho('cabc')).toEqual({ usuarioLocal: 'cadu', completa: true });
    });

    test('não usa o nome de um banco local que já tem dados', async () => {
        comConta();
        fake.bancos['cadu'] = docs(1); // banco antigo esquecido no aparelho
        fake.bancos['https://db.grilo.test/cabc'] = docs(1);
        let usuario = await contaCriancasService.baixar(CRIANCA);
        expect(usuario).not.toBe('cadu');
        expect(fake.bancos['cadu'].length).toBe(1);
    });

    test('parou no meio: fica incompleta (não abre com sincronização) e tentar de novo continua no mesmo perfil', async () => {
        comConta();
        fake.bancos['https://db.grilo.test/cabc'] = docs(3);
        fake.pararDepoisDe = 1;
        await expect(contaCriancasService.baixar(CRIANCA)).rejects.toMatchObject({ erro: 'sem_internet' });
        expect(contaCriancasService.nesteAparelho('cabc')).toEqual({ usuarioLocal: 'cadu', completa: false });
        expect(localStorageService.getSavedUsers()).not.toContain('cadu');
        await expect(contaCriancasService.abrir('cabc')).rejects.toMatchObject({ erro: 'nao_baixada' });

        fake.pararDepoisDe = undefined;
        let usuario = await contaCriancasService.baixar(CRIANCA);
        expect(usuario).toBe('cadu');
        expect(fake.bancos['cadu'].length).toBe(3);
        expect(contaCriancasService.nesteAparelho('cabc').completa).toBe(true);
    });
});

describe('abrir e lista', () => {
    test('abrir usa o login de perfil local e religa a sincronização', async () => {
        comConta({ criancas: { cabc: { usuarioLocal: 'cadu', nome: 'Cadu' } } });
        localStorageService.markSyncedDatabase('cadu');
        loginService.loginStoredUser.mockImplementation(() => {
            mockAberto = 'cadu';
            return Promise.resolve();
        });
        await expect(contaCriancasService.abrir('cabc')).resolves.toBe('cadu');
        expect(loginService.loginStoredUser).toHaveBeenCalledWith('cadu', true);
        expect(contaSincronizacao.religar).toHaveBeenCalled();
    });

    test('criança que saiu da conta: o perfil local fica, só neste aparelho', () => {
        comConta({ criancas: { cabc: { usuarioLocal: 'cadu' }, cdef: { usuarioLocal: 'bia' } } });
        mockAberto = 'bia';
        contaCriancasService.aplicarLista([CRIANCA]);
        expect(contaSessao.getCrianca('cdef')).toBe(null);
        expect(contaSessao.getCrianca('cabc').nome).toBe('Cadu');
        expect(contaSincronizacao.parar).toHaveBeenCalled();
        expect(databaseService.deleteDatabase).not.toHaveBeenCalled();
    });

    test('completarLista diz o que já está neste aparelho', () => {
        comConta({ criancas: { cabc: { usuarioLocal: 'cadu' } } });
        localStorageService.markSyncedDatabase('cadu');
        expect(contaCriancasService.completarLista([CRIANCA, { banco: 'cdef', nome: 'Bia' }])).toEqual([
            Object.assign({}, CRIANCA, { usuarioLocal: 'cadu', nesteAparelho: true }),
            { banco: 'cdef', nome: 'Bia', usuarioLocal: null, nesteAparelho: false }
        ]);
    });

    test('remover o perfil do aparelho esquece só a ligação (a criança continua na conta)', () => {
        comConta({ criancas: { cabc: { usuarioLocal: 'cadu' } } });
        localStorageService.saveUserPassword('cadu', '');
        localStorageService.removeLocalUser('cadu');
        expect(contaSessao.ler().criancas).toEqual({});
        expect(contaSessao.getSessao()).toEqual(SESSAO);
    });
});
