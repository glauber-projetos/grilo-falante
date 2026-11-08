// Grilo Falante: trocar de criança não sai da conta, e as crianças da conta abrem como perfis locais sincronizados.
jest.mock('../externals/jquery.js', () => {
    const trigger = jest.fn();
    const $ = jest.fn(() => ({ trigger: trigger, on: jest.fn() }));
    $.trigger = trigger;
    return { __esModule: true, default: $ };
});
jest.mock('superlogin-client', () => ({
    __esModule: true,
    default: { configure: jest.fn(), logout: jest.fn(), login: jest.fn(), register: jest.fn(), getSession: jest.fn() }
}));
jest.mock('../router', () => ({ Router: { toMain: jest.fn(), toLogin: jest.fn() } }));
jest.mock('./webradioService.js', () => ({ webradioService: { stop: jest.fn() } }));
jest.mock('../vue/mainVue.js', () => ({ MainVue: { clearTooltip: jest.fn() } }));
jest.mock('../util/util.js', () => ({ util: { sleep: jest.fn(), getRandom: jest.fn(() => 1) } }));
jest.mock('./data/encryptionService', () => ({ encryptionService: { getUserPasswordHash: jest.fn((s) => 'h' + s) } }));
jest.mock('./contaSincronizacao', () => ({ contaSincronizacao: { iniciar: jest.fn() } }));

let mockAberto = null;
jest.mock('./data/databaseService', () => ({
    databaseService: {
        initForUser: jest.fn((u) => {
            mockAberto = u;
            return Promise.resolve();
        }),
        closeCurrentDatabase: jest.fn(() => {
            mockAberto = null;
        }),
        getCurrentUsedDatabase: jest.fn(() => mockAberto),
        registerForUser: jest.fn((u) => {
            mockAberto = u;
            return Promise.resolve();
        })
    }
}));

let mockLocais = ['bia', 'cadu'];
let mockSincronizados = ['bia', 'cadu'];
jest.mock('./data/localStorageService', () => ({
    localStorageService: {
        getSavedOnlineUsers: jest.fn(() => ['antigo']),
        getSavedLocalUsers: jest.fn(() => mockLocais),
        isDatabaseSynced: jest.fn((u) => mockSincronizados.includes(u)),
        setAutologinUser: jest.fn(),
        setLastActiveUser: jest.fn(),
        saveUserPassword: jest.fn(),
        getUserSettings: jest.fn(() => ({ password: 'hash-antigo' }))
    }
}));

import superlogin from 'superlogin-client';
import { loginService } from './loginService';
import { databaseService } from './data/databaseService';
import { constants } from '../util/constants';

const SESSAO = { token: 'tok', password: 'pw', key: 'k1', expira: 1 };

function comConta(extra = {}) {
    window.localStorage.setItem(
        'GRILO_CONTA',
        JSON.stringify(
            Object.assign(
                {
                    email: 'a@x.com',
                    sessao: SESSAO,
                    criancas: {
                        cabc: { usuarioLocal: 'cadu', url: 'https://db.grilo.test/cabc' },
                        cdef: { usuarioLocal: 'bia', url: 'https://db.grilo.test/cdef' }
                    }
                },
                extra
            )
        )
    );
}

beforeEach(() => {
    global.log = { warn: jest.fn(), info: jest.fn(), debug: jest.fn(), error: jest.fn() };
    window.localStorage.clear();
    constants.HAS_CUSTOM_LOGIN_SERVER = true;
    constants.LOGIN_SERVER_URL = 'https://login.grilo.test';
    mockAberto = null;
    mockLocais = ['bia', 'cadu'];
    mockSincronizados = ['bia', 'cadu'];
    jest.clearAllMocks();
});

test('criança da conta abre como perfil local (usuário = senha) com a URL de sincronização com sessão', async () => {
    comConta();
    await loginService.loginStoredUser('cadu', true);
    expect(databaseService.initForUser).toHaveBeenCalledWith('cadu', 'cadu', 'https://tok:pw@db.grilo.test/cabc');
});

test('trocar de criança fecha o banco, mas não chama superlogin.logout', async () => {
    comConta();
    await loginService.loginStoredUser('cadu', true);
    await loginService.loginStoredUser('bia', true);
    expect(databaseService.closeCurrentDatabase).toHaveBeenCalled();
    expect(databaseService.initForUser).toHaveBeenLastCalledWith('bia', 'bia', 'https://tok:pw@db.grilo.test/cdef');
    expect(superlogin.logout).not.toHaveBeenCalled();
    // a sessão da conta continua no aparelho
    expect(JSON.parse(window.localStorage.getItem('GRILO_CONTA')).sessao).toEqual(SESSAO);
});

test('trocar de uma conta antiga para uma criança também não chama superlogin.logout', async () => {
    comConta();
    superlogin.login.mockResolvedValue({ userDBs: { db: 'https://x/db' } });
    mockSincronizados.push('antigo');
    await loginService.loginStoredUser('antigo', true);
    await loginService.loginStoredUser('cadu', true);
    expect(superlogin.logout).not.toHaveBeenCalled();
});

test('perfil só deste aparelho abre sem sincronização', async () => {
    mockLocais.push('ze');
    comConta();
    await loginService.loginStoredUser('ze', true);
    expect(databaseService.initForUser).toHaveBeenCalledWith('ze', 'ze', undefined);
});

test('"entrar de novo" (401): abre só com a cópia local, sem tentar o servidor', async () => {
    comConta({ entrarDeNovo: true });
    await loginService.loginStoredUser('cadu', true);
    expect(databaseService.initForUser).toHaveBeenCalledWith('cadu', 'cadu', undefined);
});

test('cópia ainda incompleta neste aparelho: abre só local', async () => {
    mockSincronizados = [];
    comConta();
    await loginService.loginStoredUser('cadu', true);
    expect(databaseService.initForUser).toHaveBeenCalledWith('cadu', 'cadu', undefined);
});

test('criar perfil novo (registerOffline) também não sai de nenhuma sessão', async () => {
    comConta();
    await loginService.registerOffline('novo', 'novo');
    expect(superlogin.logout).not.toHaveBeenCalled();
});

test('logout() (sair de uma conta antiga) continua chamando superlogin.logout', async () => {
    superlogin.login.mockResolvedValue({ userDBs: { db: 'https://x/db' } });
    await loginService.loginHashedPassword('antigo', 'hash-antigo', true);
    loginService.logout();
    expect(superlogin.logout).toHaveBeenCalledWith('antigo');
});
