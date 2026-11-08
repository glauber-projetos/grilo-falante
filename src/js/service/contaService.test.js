jest.mock('../externals/jquery.js', () => {
    const trigger = jest.fn();
    const $ = jest.fn(() => ({ trigger: trigger, on: jest.fn() }));
    $.trigger = trigger;
    return { __esModule: true, default: $ };
});

jest.mock('./contaSincronizacao', () => ({
    contaSincronizacao: { religar: jest.fn(() => Promise.resolve(true)), parar: jest.fn() }
}));

jest.mock('./contaCriancasService', () => ({
    contaCriancasService: {
        criarPerfilDaCrianca: jest.fn(() => Promise.resolve('ana')),
        ligarPerfil: jest.fn(),
        enviar: jest.fn(() => Promise.resolve()),
        baixar: jest.fn(() => Promise.resolve('ana')),
        abrir: jest.fn(() => Promise.resolve('ana')),
        aplicarLista: jest.fn(),
        completarLista: jest.fn((l) => l)
    }
}));

jest.mock('./contaExportService', () => ({
    contaExportService: { baixarTudo: jest.fn(() => Promise.resolve({ criancas: 1 })) }
}));

jest.mock('./data/localStorageService', () => ({
    localStorageService: { getSavedLocalUsers: jest.fn(() => ['cadu']) }
}));

import { contaService } from './contaService';
import { contaSessao } from './contaSessao';
import { contaSincronizacao } from './contaSincronizacao';
import { contaCriancasService } from './contaCriancasService';
import { contaExportService } from './contaExportService';
import { constants } from '../util/constants';
import $ from '../externals/jquery.js';

const SERVIDOR = 'https://login.grilo.test';
const SESSAO = { token: 'tok', password: 'pw', key: 'k1', expira: 1 };
const CONTA = { email: 'ana@x.com', nome: 'Ana', tipo: 'familia', emailConfirmado: false };

function resposta(status, corpo) {
    return Promise.resolve({
        ok: status >= 200 && status < 300,
        status: status,
        text: () => Promise.resolve(corpo === undefined ? '' : JSON.stringify(corpo))
    });
}

function ultimoPedido() {
    let [url, opcoes] = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    return { url, metodo: opcoes.method, corpo: opcoes.body ? JSON.parse(opcoes.body) : undefined, cabecalhos: opcoes.headers };
}

function comConta(extra = {}) {
    window.localStorage.setItem(
        'GRILO_CONTA',
        JSON.stringify(Object.assign({}, CONTA, { sessao: SESSAO, aparelhoNome: 'Tablet', criancas: {} }, extra))
    );
}

function eventos(nome) {
    return $.trigger.mock.calls.filter((c) => c[0] === nome).map((c) => c[1][0]);
}

beforeEach(() => {
    global.log = { warn: jest.fn(), info: jest.fn(), debug: jest.fn(), error: jest.fn() };
    window.localStorage.clear();
    constants.HAS_CUSTOM_LOGIN_SERVER = true;
    constants.LOGIN_SERVER_URL = SERVIDOR + '/';
    global.fetch = jest.fn(() => resposta(200, {}));
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
    jest.clearAllMocks();
});

describe('leitura síncrona', () => {
    test('sem GRILO_CONTA: temConta false, getConta null', () => {
        expect(contaService.temConta()).toBe(false);
        expect(contaService.getConta()).toBe(null);
    });

    test('getConta nunca mostra a sessão', () => {
        comConta();
        expect(contaService.temConta()).toBe(true);
        expect(contaService.getConta()).toMatchObject({ email: 'ana@x.com', aparelhoNome: 'Tablet' });
        expect(contaService.getConta().sessao).toBeUndefined();
    });
});

describe('rotas sem sessão', () => {
    test('cadastrar manda o corpo do contrato e guarda a sessão', async () => {
        global.fetch.mockReturnValueOnce(resposta(201, { sessao: SESSAO, conta: CONTA }));
        let conta = await contaService.cadastrar({ email: ' Ana@X.com ', senha: 'segredo123', nome: 'Ana', aparelho: 'Tablet da Ana' });
        let p = ultimoPedido();
        expect(p.url).toBe(SERVIDOR + '/conta/cadastro');
        expect(p.metodo).toBe('POST');
        expect(p.corpo).toEqual({
            email: 'ana@x.com',
            senha: 'segredo123',
            nome: 'Ana',
            tipo: 'familia',
            consentimento: { versao: 1 },
            aparelho: 'Tablet da Ana'
        });
        expect(p.cabecalhos.Authorization).toBeUndefined();
        expect(conta).toMatchObject({ email: 'ana@x.com', aparelhoNome: 'Tablet da Ana', criancas: {} });
        let guardada = JSON.parse(window.localStorage.getItem('GRILO_CONTA'));
        expect(guardada.sessao).toEqual(SESSAO);
        expect(eventos('grilo-conta-alterada').length).toBeGreaterThan(0);
    });

    test('entrar com a mesma conta mantém as crianças ligadas e religa a sincronização', async () => {
        comConta({ criancas: { cabc: { usuarioLocal: 'cadu', nome: 'Cadu', papel: 'dono' } }, entrarDeNovo: true });
        global.fetch.mockReturnValueOnce(resposta(200, { sessao: Object.assign({}, SESSAO, { token: 'novo' }), conta: CONTA }));
        await contaService.entrar({ email: 'ana@x.com', senha: 'segredo123', aparelho: 'Tablet' });
        let p = ultimoPedido();
        expect(p.url).toBe(SERVIDOR + '/conta/entrar');
        expect(p.corpo).toEqual({ email: 'ana@x.com', senha: 'segredo123', aparelho: 'Tablet' });
        let guardada = JSON.parse(window.localStorage.getItem('GRILO_CONTA'));
        expect(guardada.criancas.cabc.usuarioLocal).toBe('cadu');
        expect(guardada.entrarDeNovo).toBe(false);
        expect(guardada.sessao.token).toBe('novo');
        expect(contaSincronizacao.religar).toHaveBeenCalled();
    });

    test('entrar com outra conta: as cópias locais viram "só neste aparelho"', async () => {
        comConta({ criancas: { cabc: { usuarioLocal: 'cadu' } } });
        global.fetch.mockReturnValueOnce(resposta(200, { sessao: Object.assign({}, SESSAO, { key: 'outra' }), conta: CONTA }));
        await contaService.entrar({ email: 'b@x.com', senha: 'segredo123' });
        expect(JSON.parse(window.localStorage.getItem('GRILO_CONTA')).criancas).toEqual({});
        expect(contaSincronizacao.parar).toHaveBeenCalled();
    });

    test('esqueci, verificar e nova senha', async () => {
        global.fetch.mockReturnValueOnce(resposta(200, { ok: true }));
        await expect(contaService.esqueciSenha('Ana@x.com')).resolves.toEqual({ ok: true });
        expect(ultimoPedido()).toMatchObject({ url: SERVIDOR + '/conta/senha/esqueci', corpo: { email: 'ana@x.com' } });

        global.fetch.mockReturnValueOnce(resposta(200, { chave: 'ch' }));
        await expect(contaService.verificarCodigoSenha('ana@x.com', ' 123456 ')).resolves.toEqual({ chave: 'ch' });
        expect(ultimoPedido()).toMatchObject({ url: SERVIDOR + '/conta/senha/verificar', corpo: { email: 'ana@x.com', codigo: '123456' } });

        global.fetch.mockReturnValueOnce(resposta(200, { sessao: SESSAO, conta: CONTA }));
        await contaService.novaSenha({ email: 'ana@x.com', chave: 'ch', senha: 'novasenha1', desconectarOutros: true, aparelho: 'Tablet' });
        expect(ultimoPedido()).toMatchObject({
            url: SERVIDOR + '/conta/senha/nova',
            corpo: { email: 'ana@x.com', chave: 'ch', senha: 'novasenha1', desconectarOutros: true, aparelho: 'Tablet' }
        });
        expect(contaService.temConta()).toBe(true);
    });
});

describe('rotas com sessão', () => {
    beforeEach(() => comConta());

    test('mandam Authorization: Bearer token:password', async () => {
        global.fetch.mockReturnValueOnce(resposta(200, { esperarSegundos: 60 }));
        await expect(contaService.reenviarCodigo()).resolves.toEqual({ esperarSegundos: 60 });
        let p = ultimoPedido();
        expect(p.url).toBe(SERVIDOR + '/conta/email/reenviar');
        expect(p.cabecalhos.Authorization).toBe('Bearer tok:pw');
    });

    test('confirmarEmail atualiza a conta guardada', async () => {
        global.fetch.mockReturnValueOnce(resposta(200, Object.assign({}, CONTA, { emailConfirmado: true })));
        let conta = await contaService.confirmarEmail('123456');
        expect(ultimoPedido()).toMatchObject({ url: SERVIDOR + '/conta/email/confirmar', corpo: { codigo: '123456' } });
        expect(conta.emailConfirmado).toBe(true);
        expect(contaService.getConta().emailConfirmado).toBe(true);
    });

    test('trocar senha e e-mail', async () => {
        await contaService.trocarSenha({ senhaAtual: 'a', senhaNova: 'b', desconectarOutros: false });
        expect(ultimoPedido()).toMatchObject({
            url: SERVIDOR + '/conta/senha/trocar',
            corpo: { senhaAtual: 'a', senhaNova: 'b', desconectarOutros: false }
        });
        await contaService.trocarEmail({ emailNovo: 'Novo@x.com', senha: 'a' });
        expect(ultimoPedido()).toMatchObject({ url: SERVIDOR + '/conta/email/trocar', corpo: { emailNovo: 'novo@x.com', senha: 'a' } });
        global.fetch.mockReturnValueOnce(resposta(200, Object.assign({}, CONTA, { email: 'novo@x.com' })));
        await contaService.confirmarTrocaEmail('654321');
        expect(ultimoPedido()).toMatchObject({ url: SERVIDOR + '/conta/email/trocar/confirmar', corpo: { codigo: '654321' } });
        expect(contaService.getConta().email).toBe('novo@x.com');
        // a sessão deste aparelho continua
        expect(contaService.temConta()).toBe(true);
    });

    test('aparelhos', async () => {
        let lista = [{ id: 'a1', nome: 'Tablet', ultimoUso: 1, esteAparelho: true }];
        global.fetch.mockReturnValueOnce(resposta(200, lista));
        await expect(contaService.listarAparelhos()).resolves.toEqual(lista);
        expect(ultimoPedido()).toMatchObject({ url: SERVIDOR + '/conta/aparelhos', metodo: 'GET' });

        global.fetch.mockReturnValueOnce(resposta(204));
        await expect(contaService.desconectarAparelho('a/1')).resolves.toBe(null);
        expect(ultimoPedido()).toMatchObject({ url: SERVIDOR + '/conta/aparelhos/a%2F1', metodo: 'DELETE' });

        await contaService.nomearAparelho(' Tablet da sala ');
        expect(ultimoPedido()).toMatchObject({ url: SERVIDOR + '/conta/aparelho', corpo: { nome: 'Tablet da sala' } });
        expect(contaService.getConta().aparelhoNome).toBe('Tablet da sala');
    });

    test('crianças: listar, criar, levar, baixar, abrir', async () => {
        let crianca = { banco: 'cabc', nome: 'Cadu', papel: 'dono', status: 'familia', url: 'https://db.grilo.test/cabc' };
        global.fetch.mockReturnValueOnce(resposta(200, [crianca]));
        await expect(contaService.listarCriancas()).resolves.toEqual([crianca]);
        expect(ultimoPedido()).toMatchObject({ url: SERVIDOR + '/conta/criancas', metodo: 'GET' });
        expect(contaCriancasService.aplicarLista).toHaveBeenCalledWith([crianca]);

        global.fetch.mockReturnValueOnce(resposta(201, crianca));
        let criada = await contaService.criarCrianca(' Cadu ');
        expect(ultimoPedido()).toMatchObject({ url: SERVIDOR + '/conta/criancas', metodo: 'POST', corpo: { nome: 'Cadu' } });
        expect(contaCriancasService.criarPerfilDaCrianca).toHaveBeenCalledWith(crianca);
        expect(criada).toMatchObject({ banco: 'cabc', usuarioLocal: 'ana' });

        global.fetch.mockReturnValueOnce(resposta(201, crianca));
        let progresso = jest.fn();
        await contaService.levarParaConta('cadu', 'Cadu', progresso);
        expect(contaCriancasService.ligarPerfil).toHaveBeenCalledWith('cabc', 'cadu', crianca);
        expect(contaCriancasService.enviar).toHaveBeenCalledWith('cadu', 'cabc', progresso);

        await contaService.baixarCrianca('cabc', progresso);
        expect(contaCriancasService.baixar).toHaveBeenCalledWith(expect.objectContaining({ banco: 'cabc', nome: 'Cadu' }), progresso);

        await contaService.abrirCrianca('cabc');
        expect(contaCriancasService.abrir).toHaveBeenCalledWith('cabc');
    });

    test('levarParaConta de novo com o mesmo perfil não cria outra criança', async () => {
        comConta({ criancas: { cabc: { usuarioLocal: 'cadu', nome: 'Cadu' } } });
        await contaService.levarParaConta('cadu', 'Cadu');
        expect(global.fetch).not.toHaveBeenCalled();
        expect(contaCriancasService.enviar).toHaveBeenCalledWith('cadu', 'cabc', undefined);
    });

    test('levarParaConta recusa perfil que não está no aparelho', async () => {
        await expect(contaService.levarParaConta('nao-existe', 'X')).rejects.toMatchObject({ erro: 'nao_encontrado' });
    });

    test('baixarTudo usa o serviço de exportação', async () => {
        await contaService.baixarTudo();
        expect(contaExportService.baixarTudo).toHaveBeenCalled();
    });

    test('sair: avisa o servidor, apaga só GRILO_CONTA e para a sincronização', async () => {
        window.localStorage.setItem('GRILO_PERFIS', '{"cadu":{"nome":"Cadu"}}');
        global.fetch.mockReturnValueOnce(resposta(204));
        await contaService.sair();
        expect(ultimoPedido()).toMatchObject({ url: SERVIDOR + '/conta/sair', metodo: 'POST' });
        expect(window.localStorage.getItem('GRILO_CONTA')).toBe(null);
        expect(window.localStorage.getItem('GRILO_PERFIS')).not.toBe(null);
        expect(contaSincronizacao.parar).toHaveBeenCalled();
    });

    test('sair funciona sem internet', async () => {
        global.fetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')));
        await contaService.sair();
        expect(contaService.temConta()).toBe(false);
    });

    test('apagarConta manda a senha e apaga só GRILO_CONTA', async () => {
        global.fetch.mockReturnValueOnce(resposta(204));
        await contaService.apagarConta('segredo123');
        expect(ultimoPedido()).toMatchObject({ url: SERVIDOR + '/conta', metodo: 'DELETE', corpo: { senha: 'segredo123' } });
        expect(contaService.temConta()).toBe(false);
    });

    test('apagarConta com senha errada mantém a conta', async () => {
        global.fetch.mockReturnValueOnce(resposta(401, { erro: 'nao_autorizado', mensagem: 'Senha errada.' }));
        await expect(contaService.apagarConta('x')).rejects.toMatchObject({ erro: 'nao_autorizado', mensagem: 'Senha errada.' });
        expect(contaService.temConta()).toBe(true);
    });
});

describe('erros', () => {
    test('erro do servidor chega como veio, com o status', async () => {
        global.fetch.mockReturnValueOnce(
            resposta(400, { erro: 'dados_invalidos', mensagem: 'Confira.', campos: { senha: 'A senha precisa ter pelo menos 8 letras ou números.' } })
        );
        await expect(contaService.cadastrar({ email: 'a@x.com', senha: '1', nome: 'A' })).rejects.toEqual({
            erro: 'dados_invalidos',
            mensagem: 'Confira.',
            campos: { senha: 'A senha precisa ter pelo menos 8 letras ou números.' },
            status: 400
        });
        expect(contaService.temConta()).toBe(false);
    });

    test('código errado traz tentativasRestantes', async () => {
        comConta();
        global.fetch.mockReturnValueOnce(resposta(400, { erro: 'codigo_errado', mensagem: 'Errado.', tentativasRestantes: 3 }));
        await expect(contaService.confirmarEmail('000000')).rejects.toMatchObject({ erro: 'codigo_errado', tentativasRestantes: 3 });
    });

    test('resposta sem JSON vira erro pelo status, com mensagem pronta', async () => {
        global.fetch.mockReturnValueOnce(
            Promise.resolve({ ok: false, status: 429, text: () => Promise.resolve('<html>') })
        );
        await expect(contaService.entrar({ email: 'a@x.com', senha: 'x' })).rejects.toMatchObject({
            erro: 'muitas_tentativas',
            status: 429,
            mensagem: expect.any(String)
        });
        global.fetch.mockReturnValueOnce(Promise.resolve({ ok: false, status: 503, text: () => Promise.resolve('') }));
        await expect(contaService.esqueciSenha('a@x.com')).rejects.toMatchObject({ erro: 'servidor', status: 503 });
    });

    test('sem internet (fetch falha) -> sem_internet', async () => {
        global.fetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')));
        await expect(contaService.entrar({ email: 'a@x.com', senha: 'x' })).rejects.toEqual({
            erro: 'sem_internet',
            mensagem: expect.any(String)
        });
    });

    test('aparelho offline -> sem_internet sem tentar a rede', async () => {
        Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
        await expect(contaService.esqueciSenha('a@x.com')).rejects.toMatchObject({ erro: 'sem_internet' });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('listarCriancas sem internet traz a última lista guardada', async () => {
        comConta({ listaCriancas: [{ banco: 'cabc', nome: 'Cadu' }] });
        global.fetch.mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')));
        await expect(contaService.listarCriancas()).rejects.toMatchObject({
            erro: 'sem_internet',
            criancas: [{ banco: 'cabc', nome: 'Cadu' }]
        });
    });

    test('rota com sessão sem conta -> nao_autorizado, sem pedir nada', async () => {
        await expect(contaService.listarAparelhos()).rejects.toMatchObject({ erro: 'nao_autorizado' });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('401 numa rota com sessão: não apaga nada, marca "entrar de novo" e avisa', async () => {
        comConta({ criancas: { cabc: { usuarioLocal: 'cadu' } } });
        global.fetch.mockReturnValueOnce(resposta(401, { erro: 'nao_autorizado', mensagem: 'Sessão encerrada.' }));
        await expect(contaService.listarCriancas()).rejects.toMatchObject({ erro: 'nao_autorizado', status: 401 });
        let guardada = JSON.parse(window.localStorage.getItem('GRILO_CONTA'));
        expect(guardada.sessao).toEqual(SESSAO);
        expect(guardada.criancas.cabc.usuarioLocal).toBe('cadu');
        expect(guardada.entrarDeNovo).toBe(true);
        expect(contaService.temConta()).toBe(true);
        expect(eventos('grilo-sincronizacao')).toContainEqual({ estado: 'entrar-de-novo' });
        expect(contaService.estadoSincronizacao()).toBe('entrar-de-novo');
    });

    test('401 ao entrar (senha errada) não marca "entrar de novo"', async () => {
        global.fetch.mockReturnValueOnce(resposta(401, { erro: 'nao_autorizado', mensagem: 'E-mail ou senha errados.' }));
        await expect(contaService.entrar({ email: 'a@x.com', senha: 'x' })).rejects.toMatchObject({ erro: 'nao_autorizado' });
        expect(eventos('grilo-sincronizacao')).toEqual([]);
    });
});

describe('endereços e renovação', () => {
    test('URL de sincronização usa a url do servidor e a sessão', () => {
        comConta({ criancas: { cabc: { usuarioLocal: 'cadu', url: 'https://db.grilo.test/cabc' } } });
        expect(contaSessao.urlComSessao('cabc')).toBe('https://tok:pw@db.grilo.test/cabc');
    });

    test('sem url guardada: db. no lugar de login.', () => {
        comConta();
        expect(contaSessao.urlDoBanco('cxyz')).toBe('https://db.grilo.test/cxyz');
        expect(contaSessao.urlComSessao('cxyz')).toBe('https://tok:pw@db.grilo.test/cxyz');
    });

    test('renovar: /auth/refresh com a sessão, guarda a nova validade', async () => {
        comConta({ entrarDeNovo: true });
        global.fetch.mockReturnValueOnce(resposta(200, { token: 'tok', expires: 999 }));
        await expect(contaSessao.renovar()).resolves.toBe(true);
        let p = ultimoPedido();
        expect(p.url).toBe(SERVIDOR + '/auth/refresh');
        expect(p.cabecalhos.Authorization).toBe('Bearer tok:pw');
        let guardada = JSON.parse(window.localStorage.getItem('GRILO_CONTA'));
        expect(guardada.sessao).toEqual(Object.assign({}, SESSAO, { expira: 999 }));
        expect(guardada.entrarDeNovo).toBe(false);
    });

    test('renovar com 401: guarda tudo e marca "entrar de novo"; sem internet: nada muda', async () => {
        comConta();
        global.fetch.mockReturnValueOnce(resposta(401, { erro: 'nao_autorizado' }));
        await expect(contaSessao.renovar()).resolves.toBe(false);
        expect(JSON.parse(window.localStorage.getItem('GRILO_CONTA')).entrarDeNovo).toBe(true);
        expect(contaService.temConta()).toBe(true);

        comConta();
        global.fetch.mockImplementationOnce(() => Promise.reject(new TypeError('offline')));
        await expect(contaSessao.renovar()).resolves.toBe(false);
        expect(JSON.parse(window.localStorage.getItem('GRILO_CONTA')).entrarDeNovo).toBeUndefined();
    });
});
