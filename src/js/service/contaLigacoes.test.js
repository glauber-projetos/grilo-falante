// Grilo Falante: "Desconectar este aparelho" e entrar de novo com a mesma conta não baixa uma segunda cópia;
// outra conta nunca adota as cópias da primeira. E trocar o e-mail antes de confirmar o primeiro.
jest.mock('../externals/jquery.js', () => {
    const $ = jest.fn(() => ({ trigger: jest.fn(), on: jest.fn() }));
    return { __esModule: true, default: $ };
});
jest.mock('../externals/jquery', () => {
    const $ = jest.fn(() => ({ trigger: jest.fn(), on: jest.fn() }));
    return { __esModule: true, default: $ };
});
jest.mock('./loginService', () => ({ loginService: { loginStoredUser: jest.fn(() => Promise.resolve()) } }));
jest.mock('./perfilArquivoService', () => ({ perfilArquivoService: { criarPerfil: jest.fn(() => Promise.resolve('cadu')) } }));
jest.mock('./contaSincronizacao', () => ({
    contaSincronizacao: { religar: jest.fn(() => Promise.resolve(true)), parar: jest.fn() }
}));
jest.mock('./contaExportService', () => ({ contaExportService: { baixarTudo: jest.fn() } }));
jest.mock('./data/databaseService', () => ({
    databaseService: { getCurrentUsedDatabase: jest.fn(() => null), deleteDatabase: jest.fn() }
}));
jest.mock('../model/SettingsApp.js', () => ({ SettingsApp: function (d) { Object.assign(this, d || {}); } }));
jest.mock('../model/SettingsUserLocal.js', () => ({ SettingsUserLocal: function (d) { Object.assign(this, d || {}); } }));

import { contaService } from './contaService';
import { contaSessao } from './contaSessao';
import { contaCriancasService } from './contaCriancasService';
import { localStorageService } from './data/localStorageService';
import { constants } from '../util/constants';
import { criarPouchFalso } from './contaTesteUtil';

const SERVIDOR = 'https://login.grilo.test';
const CRIANCA = { banco: 'cabc', nome: 'Cadu', papel: 'dono', status: 'familia', url: 'https://db.grilo.test/cabc' };
let fake;

function sessao(key) {
    return { token: 'tok-' + key, password: 'pw', key: key, expira: 1 };
}

function resposta(status, corpo) {
    return Promise.resolve({
        ok: status >= 200 && status < 300,
        status: status,
        text: () => Promise.resolve(corpo === undefined ? '' : JSON.stringify(corpo))
    });
}

// servidor de mentira: entrar devolve a conta da key pedida; /conta/criancas devolve a Cadu só para a key k1
function servidor() {
    global.fetch = jest.fn((url, opcoes) => {
        let caminho = url.replace(SERVIDOR, '');
        let corpo = opcoes.body ? JSON.parse(opcoes.body) : {};
        let auth = (opcoes.headers || {}).Authorization || '';
        if (caminho === '/conta/entrar') {
            let key = corpo.email === 'ana@x.com' ? 'k1' : 'k2';
            return resposta(200, { sessao: sessao(key), conta: { email: corpo.email, nome: 'X', tipo: 'familia', emailConfirmado: true } });
        }
        if (caminho === '/conta/criancas') {
            return resposta(200, auth.includes('tok-k1') ? [CRIANCA] : []);
        }
        if (caminho === '/conta/sair' || caminho === '/conta') {
            return resposta(204);
        }
        return resposta(200, {});
    });
}

async function anaComCaduNoTablet() {
    await contaService.entrar({ email: 'ana@x.com', senha: 'segredo123' });
    localStorageService.saveUserPassword('cadu', '');
    fake.bancos['cadu'] = [{ _id: 'grid-1' }];
    contaCriancasService.ligarPerfil('cabc', 'cadu', CRIANCA);
}

beforeEach(() => {
    global.log = { warn: jest.fn(), info: jest.fn(), debug: jest.fn(), error: jest.fn() };
    window.localStorage.clear();
    constants.HAS_CUSTOM_LOGIN_SERVER = true;
    constants.LOGIN_SERVER_URL = SERVIDOR;
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
    fake = criarPouchFalso();
    window.PouchDB = fake.PouchDB;
    jest.clearAllMocks();
    servidor();
});

describe('desconectar e entrar de novo', () => {
    test('sem conta, a cópia local continua como "só neste aparelho"', async () => {
        await anaComCaduNoTablet();
        await contaService.sair();
        expect(contaService.temConta()).toBe(false);
        expect(contaSessao.bancoDoUsuario('cadu')).toBe(null);
        expect(localStorageService.getSavedLocalUsers()).toContain('cadu');
        expect(fake.bancos['cadu'].length).toBe(1);
    });

    test('a mesma conta reaproveita a cópia local: listar diz que está no aparelho e baixar não cria outra', async () => {
        await anaComCaduNoTablet();
        await contaService.sair();
        await contaService.entrar({ email: 'ana@x.com', senha: 'segredo123' });
        expect(contaSessao.bancoDoUsuario('cadu')).toBe('cabc');
        let lista = await contaService.listarCriancas();
        expect(lista).toEqual([Object.assign({}, CRIANCA, { usuarioLocal: 'cadu', nesteAparelho: true })]);
        await expect(contaService.baixarCrianca('cabc')).resolves.toBe('cadu');
        expect(Object.keys(fake.bancos).filter((b) => !/^https?:/.test(b))).toEqual(['cadu']);
        expect(localStorageService.getSavedLocalUsers()).toEqual(['cadu']);
        expect(window.localStorage.getItem('GRILO_CONTA_LIGACOES')).toBe(null);
    });

    test('outra conta não adota a cópia; quando a primeira volta, ela continua ligada', async () => {
        await anaComCaduNoTablet();
        await contaService.sair();
        await contaService.entrar({ email: 'bia@x.com', senha: 'segredo123' });
        expect(contaSessao.bancoDoUsuario('cadu')).toBe(null);
        expect(await contaService.listarCriancas()).toEqual([]);
        await contaService.sair();
        await contaService.entrar({ email: 'ana@x.com', senha: 'segredo123' });
        expect(contaSessao.bancoDoUsuario('cadu')).toBe('cabc');
    });

    test('outra conta entrando sem sair antes: a primeira guarda as ligações', async () => {
        await anaComCaduNoTablet();
        await contaService.entrar({ email: 'bia@x.com', senha: 'segredo123' });
        expect(contaSessao.bancoDoUsuario('cadu')).toBe(null);
        await contaService.entrar({ email: 'ana@x.com', senha: 'segredo123' });
        expect(contaSessao.bancoDoUsuario('cadu')).toBe('cabc');
    });

    test('levar o perfil para outra conta solta a ligação antiga', async () => {
        await anaComCaduNoTablet();
        await contaService.sair();
        await contaService.entrar({ email: 'bia@x.com', senha: 'segredo123' });
        contaCriancasService.ligarPerfil('cnova', 'cadu', { banco: 'cnova', nome: 'Cadu' });
        expect(JSON.parse(window.localStorage.getItem('GRILO_CONTA_LIGACOES') || '{}')).toEqual({});
    });

    test('apagar a conta não guarda ligação nenhuma', async () => {
        await anaComCaduNoTablet();
        await contaService.apagarConta('segredo123');
        expect(window.localStorage.getItem('GRILO_CONTA_LIGACOES')).toBe(null);
        await contaService.entrar({ email: 'ana@x.com', senha: 'segredo123' });
        expect(contaSessao.bancoDoUsuario('cadu')).toBe(null);
    });

    test('tirar o perfil do aparelho também esquece a ligação guardada', async () => {
        await anaComCaduNoTablet();
        await contaService.sair();
        localStorageService.removeLocalUser('cadu');
        await contaService.entrar({ email: 'ana@x.com', senha: 'segredo123' });
        expect(contaSessao.bancoDoUsuario('cadu')).toBe(null);
    });
});

describe('corrigir o e-mail logo depois do cadastro', () => {
    function contaNaoConfirmada() {
        window.localStorage.setItem(
            'GRILO_CONTA',
            JSON.stringify({ email: 'ana@x.con', nome: 'Ana', emailConfirmado: false, sessao: sessao('k1'), criancas: {} })
        );
    }

    test('trocarEmail funciona antes de confirmar e confirmarTrocaEmail deixa o e-mail novo confirmado', async () => {
        contaNaoConfirmada();
        global.fetch = jest.fn(() => resposta(200, {}));
        await contaService.trocarEmail({ emailNovo: 'Ana@X.com', senha: 'segredo123' });
        expect(global.fetch.mock.calls[0][0]).toBe(SERVIDOR + '/conta/email/trocar');
        // o servidor responde sem emailConfirmado: o código do e-mail novo já confirma
        global.fetch = jest.fn(() => resposta(200, { email: 'ana@x.com', nome: 'Ana', tipo: 'familia' }));
        let conta = await contaService.confirmarTrocaEmail('123456');
        expect(conta).toMatchObject({ email: 'ana@x.com', emailConfirmado: true });
        expect(contaService.getConta()).toMatchObject({ email: 'ana@x.com', emailConfirmado: true });
        expect(contaService.getConta().emailPendente).toBeUndefined();
    });

    test('resposta vazia do servidor: usa o e-mail pedido', async () => {
        contaNaoConfirmada();
        global.fetch = jest.fn(() => resposta(200, {}));
        await contaService.trocarEmail({ emailNovo: 'ana@x.com', senha: 'segredo123' });
        global.fetch = jest.fn(() => resposta(204));
        await contaService.confirmarTrocaEmail('123456');
        expect(contaService.getConta()).toMatchObject({ email: 'ana@x.com', emailConfirmado: true });
    });

    test('código errado: nada muda', async () => {
        contaNaoConfirmada();
        global.fetch = jest.fn(() => resposta(200, {}));
        await contaService.trocarEmail({ emailNovo: 'ana@x.com', senha: 'segredo123' });
        global.fetch = jest.fn(() => resposta(400, { erro: 'codigo_errado', mensagem: 'Errado.', tentativasRestantes: 4 }));
        await expect(contaService.confirmarTrocaEmail('000000')).rejects.toMatchObject({ erro: 'codigo_errado' });
        expect(contaService.getConta()).toMatchObject({ email: 'ana@x.con', emailConfirmado: false });
    });
});
