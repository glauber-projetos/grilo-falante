jest.mock('../externals/jquery.js', () => {
    const trigger = jest.fn();
    const handlers = {};
    const $ = jest.fn(() => ({
        trigger: trigger,
        on: (evento, fn) => {
            handlers[evento] = fn;
        }
    }));
    $.trigger = trigger;
    $.handlers = handlers;
    return { __esModule: true, default: $ };
});

let mockAberto = 'cadu';
jest.mock('./data/databaseService', () => ({
    databaseService: {
        getCurrentUsedDatabase: jest.fn(() => mockAberto),
        religarSync: jest.fn(() => Promise.resolve(true)),
        pararSync: jest.fn(),
        deleteDatabase: jest.fn(),
        closeCurrentDatabase: jest.fn()
    }
}));

import { contaSincronizacao } from './contaSincronizacao';
import { contaSessao } from './contaSessao';
import { databaseService } from './data/databaseService';
import { constants } from '../util/constants';
import $ from '../externals/jquery.js';

const SESSAO = { token: 'tok', password: 'pw', key: 'k1', expira: 1 };

function comConta(extra = {}) {
    window.localStorage.setItem(
        'GRILO_CONTA',
        JSON.stringify(
            Object.assign(
                { email: 'a@x.com', sessao: SESSAO, criancas: { cabc: { usuarioLocal: 'cadu', url: 'https://db.grilo.test/cabc' } } },
                extra
            )
        )
    );
}

function estados() {
    return $.trigger.mock.calls.filter((c) => c[0] === 'grilo-sincronizacao').map((c) => c[1][0].estado);
}

beforeEach(() => {
    jest.useFakeTimers();
    global.log = { warn: jest.fn(), info: jest.fn(), debug: jest.fn(), error: jest.fn() };
    window.localStorage.clear();
    window.localStorage.setItem('GRILO_PERFIS', '{"cadu":{"nome":"Cadu"}}');
    window.localStorage.setItem('SYNCED_DBS_LIST_KEY', '["cadu"]');
    constants.HAS_CUSTOM_LOGIN_SERVER = true;
    constants.LOGIN_SERVER_URL = 'https://login.grilo.test';
    global.fetch = jest.fn();
    mockAberto = 'cadu';
    jest.clearAllMocks();
    comConta();
    contaSincronizacao.iniciar();
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
});

describe('401 do servidor na sincronização', () => {
    test('não apaga nada, marca "entrar de novo" e para de tentar', () => {
        $.handlers[constants.EVENT_DB_CONNECTION_LOST]({}, { status: 401, name: 'unauthorized' }, 'cadu');
        expect(estados()).toEqual(['entrar-de-novo']);
        let conta = contaSessao.ler();
        expect(conta.entrarDeNovo).toBe(true);
        expect(conta.sessao).toEqual(SESSAO);
        expect(conta.criancas.cabc.usuarioLocal).toBe('cadu');
        expect(window.localStorage.getItem('GRILO_PERFIS')).toBe('{"cadu":{"nome":"Cadu"}}');
        expect(window.localStorage.getItem('SYNCED_DBS_LIST_KEY')).toBe('["cadu"]');
        expect(databaseService.deleteDatabase).not.toHaveBeenCalled();
        expect(databaseService.closeCurrentDatabase).not.toHaveBeenCalled();
        jest.advanceTimersByTime(60 * 60 * 1000);
        expect(databaseService.religarSync).not.toHaveBeenCalled();
    });

    test('depois do 401, os estados do PouchDB não tiram o aviso', () => {
        $.handlers[constants.EVENT_DB_CONNECTION_LOST]({}, { status: 401 }, 'cadu');
        $.handlers[constants.EVENT_DB_SYNC_STATE_CHANGE]({}, constants.DB_SYNC_STATE_SYNCED);
        expect(estados()).toEqual(['entrar-de-novo']);
        expect(contaSessao.getEstadoSincronizacao()).toBe('entrar-de-novo');
    });
});

describe('sem internet', () => {
    test('avisa "sem-internet" e tenta de novo sozinho com a sessão no endereço', async () => {
        $.handlers[constants.EVENT_DB_CONNECTION_LOST]({}, { status: 0 }, 'cadu');
        expect(estados()).toEqual(['sem-internet']);
        expect(databaseService.religarSync).not.toHaveBeenCalled();
        jest.advanceTimersByTime(10 * 1000);
        expect(databaseService.religarSync).toHaveBeenCalledWith('cadu', 'https://tok:pw@db.grilo.test/cabc');
        expect(databaseService.deleteDatabase).not.toHaveBeenCalled();
    });

    test('estados do PouchDB viram enviando / em-dia', () => {
        $.handlers[constants.EVENT_DB_SYNC_STATE_CHANGE]({}, constants.DB_SYNC_STATE_SYNCINC);
        $.handlers[constants.EVENT_DB_SYNC_STATE_CHANGE]({}, constants.DB_SYNC_STATE_SYNCED);
        expect(estados()).toEqual(['enviando', 'em-dia']);
    });

    test('perfil só deste aparelho: nada de eventos da conta', () => {
        mockAberto = 'outro';
        $.handlers[constants.EVENT_DB_CONNECTION_LOST]({}, { status: 0 }, 'outro');
        $.handlers[constants.EVENT_DB_SYNC_STATE_CHANGE]({}, constants.DB_SYNC_STATE_SYNCED);
        expect(estados()).toEqual([]);
        jest.advanceTimersByTime(60 * 60 * 1000);
        expect(databaseService.religarSync).not.toHaveBeenCalled();
    });

    test('trocar de criança cancela a tentativa pendente', () => {
        $.handlers[constants.EVENT_DB_CONNECTION_LOST]({}, { status: 0 }, 'cadu');
        $.handlers[constants.EVENT_USER_CHANGING]({});
        jest.advanceTimersByTime(60 * 60 * 1000);
        expect(databaseService.religarSync).not.toHaveBeenCalled();
    });
});

describe('religar e parar', () => {
    test('religar não faz nada quando precisa entrar de novo', async () => {
        comConta({ entrarDeNovo: true });
        await expect(contaSincronizacao.religar()).resolves.toBe(false);
        expect(databaseService.religarSync).not.toHaveBeenCalled();
    });

    test('parar só para a sincronização (cópia local fica)', () => {
        contaSincronizacao.parar();
        expect(databaseService.pararSync).toHaveBeenCalled();
        expect(databaseService.closeCurrentDatabase).not.toHaveBeenCalled();
        expect(databaseService.deleteDatabase).not.toHaveBeenCalled();
    });
});
