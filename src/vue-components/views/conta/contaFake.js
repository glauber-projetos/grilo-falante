/**
 * Grilo Falante: FAKE family account, for development only (turned on with `?contaFake=1`, see contaApi.js).
 * Same functions and same error objects as `contaService` (docs/grilo-design/contas-api.md), but the "server"
 * lives in this browser's localStorage. The children it creates or "downloads" are real local profiles, so
 * the app can be used normally afterwards.
 *
 * Ready-made account: maria@exemplo.com.br with the child "Ana" (any password with 8+ characters,
 * except "senhaerrada"). Values that show the error states:
 * - e-mail ja@exemplo.com.br when creating: e-mail already has an account
 * - e-mail semnet@exemplo.com.br: no internet; servidor@exemplo.com.br: server down;
 *   muitas@exemplo.com.br when signing in: too many tries
 * - password "senhaerrada": wrong password
 * - code 000000: wrong code; 111111: expired code; 999999: too many tries
 * The device is also "offline" when the browser says so (navigator.onLine === false).
 */
import $ from '../../../js/externals/jquery';
import { perfilArquivoService } from '../../../js/service/perfilArquivoService';
import { localStorageService } from '../../../js/service/data/localStorageService';
import { databaseService } from '../../../js/service/data/databaseService';
import { dataService } from '../../../js/service/data/dataService';
import { setupWizard } from '../../../js/wizard/setupWizard';
import { AGE_4_6, SIZE_MEDIUM } from '../../../js/wizard/starterBoardData';

const CHAVE_SERVIDOR = 'GRILO_CONTA_FAKE_SERVIDOR';
const CHAVE_APARELHO = 'GRILO_CONTA_FAKE';
// which local profile is which child of the account, kept on the device after signing out
const CHAVE_VINCULOS = 'GRILO_CONTA_FAKE_VINCULOS';
const DIA = 24 * 60 * 60 * 1000;
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MSG = {
    sem_internet: 'Sem internet agora. Confira a conexão e tente de novo. Suas pranchas no aparelho estão seguras.',
    sem_internet_cadastro: 'Sem internet agora. Para criar a conta você precisa estar conectado. Depois, o app funciona sem internet.',
    servidor: 'Não conseguimos falar com o servidor agora. Tente de novo daqui a pouco. Suas pranchas no aparelho estão seguras.',
    email_invalido: 'Esse e-mail parece estar errado. Confira se tem o @ e o final, como .com.',
    email_em_uso: 'Já existe uma conta com esse e-mail. Toque em "Entrar" para usar essa conta.',
    senha_curta: 'A senha precisa ter pelo menos 8 letras ou números.',
    nao_autorizado: 'E-mail ou senha errados. Confira e tente de novo.',
    senha_atual: 'A senha atual não confere. Confira e tente de novo.',
    muitas_tentativas: 'Muitas tentativas. Espere 5 minutos e tente de novo.',
    codigo_errado: 'Esse código está errado ou venceu. Confira ou peça um código novo.',
    email_nao_confirmado: 'Falta confirmar o e-mail. Digite o código que mandamos.',
    nao_encontrado: 'Não encontramos essa criança na conta.'
};

function espera(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function falha(erro, mensagem, extras) {
    return Object.assign({ erro: erro, mensagem: mensagem || MSG[erro] || MSG.servidor }, extras || {});
}

function hex(n) {
    let s = '';
    for (let i = 0; i < n; i++) {
        s += Math.floor(Math.random() * 16).toString(16);
    }
    return s;
}

function ler(chave) {
    try {
        let texto = window.localStorage.getItem(chave);
        return texto ? JSON.parse(texto) : null;
    } catch (e) {
        return null;
    }
}

function gravar(chave, valor) {
    if (valor === null) {
        window.localStorage.removeItem(chave);
    } else {
        window.localStorage.setItem(chave, JSON.stringify(valor));
    }
}

function servidor() {
    let s = ler(CHAVE_SERVIDOR);
    if (!s) {
        let agora = Date.now();
        s = {
            contas: {
                'maria@exemplo.com.br': {
                    semente: true,
                    senha: 'girassol24',
                    nome: 'Maria',
                    emailConfirmado: true,
                    criadoEm: agora - 90 * DIA,
                    senhaTrocadaEm: agora - 60 * DIA,
                    criancas: [{ banco: 'c' + hex(32), nome: 'Ana' }],
                    aparelhos: [{ id: 'a' + hex(8), nome: 'Tablet antigo', ultimoUso: agora - 21 * DIA }]
                }
            }
        };
        gravar(CHAVE_SERVIDOR, s);
    }
    return s;
}

function aparelho() {
    return ler(CHAVE_APARELHO);
}

function avisarMudanca() {
    $(document).trigger('grilo-conta-alterada');
}

function contaPublica(email, c) {
    return { email: email, emailConfirmado: !!c.emailConfirmado, nome: c.nome || '', tipo: 'familia', criadoEm: c.criadoEm, senhaTrocadaEm: c.senhaTrocadaEm };
}

function criancaPublica(banco, nome, ultimaMudanca) {
    return { banco: banco, nome: nome, papel: 'dono', status: 'familia', url: 'https://db.exemplo/' + banco, ultimaMudanca: ultimaMudanca || Date.now() };
}

async function rede(email, cadastro) {
    await espera(450);
    if (!window.navigator.onLine || email === 'semnet@exemplo.com.br') {
        throw falha('sem_internet', cadastro ? MSG.sem_internet_cadastro : MSG.sem_internet);
    }
    if (email === 'servidor@exemplo.com.br') {
        throw falha('servidor');
    }
}

/** the account of this device, with its "server" record */
function minha() {
    let ap = aparelho();
    if (!ap || !ap.sessao) {
        throw falha('nao_autorizado', 'Entre de novo na conta.');
    }
    let s = servidor();
    let c = s.contas[ap.email];
    if (!c) {
        gravar(CHAVE_APARELHO, null);
        avisarMudanca();
        throw falha('nao_autorizado', 'Esta conta não existe mais. Entre com outra conta.');
    }
    return { s, c, ap };
}

function conferirCodigo(codigo) {
    if (codigo === '000000') {
        throw falha('codigo_errado', null, { tentativasRestantes: 4 });
    }
    if (codigo === '111111') {
        throw falha('codigo_vencido', MSG.codigo_errado);
    }
    if (codigo === '999999') {
        throw falha('muitas_tentativas', null, { esperarSegundos: 300 });
    }
    if (!/^\d{6}$/.test(String(codigo || ''))) {
        throw falha('dados_invalidos', 'O código tem 6 números.');
    }
}

function senhaConfere(c, senha) {
    if (senha === 'senhaerrada') {
        return false;
    }
    return c.semente ? String(senha || '').length >= 8 : c.senha === senha;
}

/** signs this device in, like the server's {sessao, conta} */
function conectar(s, email, c, nomeAparelho) {
    let id = 'a' + hex(8);
    c.aparelhos = (c.aparelhos || []).concat([{ id: id, nome: nomeAparelho || '', ultimoUso: Date.now() }]);
    gravar(CHAVE_SERVIDOR, s);
    let anterior = aparelho();
    let vinculos = ler(CHAVE_VINCULOS) || {};
    let criancas = anterior && anterior.email === email ? anterior.criancas || {} : {};
    Object.entries(vinculos[email] || {}).forEach(([banco, k]) => {
        if (!criancas[banco] && (c.criancas || []).some((x) => x.banco === banco) && usuarioLocalExiste(k.usuarioLocal)) {
            criancas[banco] = k;
        }
    });
    let sessao = { token: hex(16), password: hex(16), key: hex(12), expira: Date.now() + 5 * 365 * DIA };
    gravar(CHAVE_APARELHO, Object.assign(contaPublica(email, c), { sessao: sessao, aparelhoId: id, aparelhoNome: nomeAparelho || '', criancas: criancas }));
    avisarMudanca();
    return { sessao: sessao, conta: contaPublica(email, c) };
}

function atualizarAparelho(mudancas) {
    let ap = aparelho();
    if (ap) {
        gravar(CHAVE_APARELHO, Object.assign(ap, mudancas));
        avisarMudanca();
    }
}

function usuarioLocalExiste(usuario) {
    return !!usuario && localStorageService.getSavedUsers().includes(usuario);
}

async function abrirLocal(usuario) {
    if (databaseService.getCurrentUsedDatabase() !== usuario) {
        await perfilArquivoService.entrar(usuario);
    }
}

async function progressoFalso(total, unidade, onProgresso, chave) {
    let passos = 20;
    for (let i = 1; i <= passos; i++) {
        await espera(120);
        let n = Math.min(total, Math.round((total * i) / passos));
        if (onProgresso) {
            // like contaService: no unit (it counts documents), so the screens show a percentage
            onProgresso({ [chave]: n, total: total });
        }
    }
}

let contaFake = {};

contaFake.cadastrar = async function ({ email, senha, nome, aparelho: nomeAparelho } = {}) {
    email = String(email || '').trim().toLowerCase();
    await rede(email, true);
    let campos = {};
    if (!EMAIL_OK.test(email)) {
        campos.email = MSG.email_invalido;
    }
    if (String(senha || '').length < 8) {
        campos.senha = MSG.senha_curta;
    }
    if (Object.keys(campos).length) {
        throw falha('dados_invalidos', 'Confira os campos marcados.', { campos: campos });
    }
    let s = servidor();
    if (email === 'ja@exemplo.com.br' || s.contas[email]) {
        throw falha('email_em_uso');
    }
    let agora = Date.now();
    let c = { senha: senha, nome: nome || '', emailConfirmado: false, criadoEm: agora, senhaTrocadaEm: agora, criancas: [], aparelhos: [] };
    s.contas[email] = c;
    return conectar(s, email, c, nomeAparelho);
};

contaFake.entrar = async function ({ email, senha, aparelho: nomeAparelho } = {}) {
    email = String(email || '').trim().toLowerCase();
    await rede(email);
    if (email === 'muitas@exemplo.com.br') {
        throw falha('muitas_tentativas', null, { esperarSegundos: 300 });
    }
    let s = servidor();
    let c = s.contas[email];
    if (!c || !senhaConfere(c, senha)) {
        throw falha('nao_autorizado');
    }
    return conectar(s, email, c, nomeAparelho);
};

contaFake.sair = async function () {
    await espera(300);
    let ap = aparelho();
    if (ap) {
        let s = servidor();
        let c = s.contas[ap.email];
        if (c) {
            c.aparelhos = (c.aparelhos || []).filter((a) => a.id !== ap.aparelhoId);
            gravar(CHAVE_SERVIDOR, s);
        }
        let vinculos = ler(CHAVE_VINCULOS) || {};
        vinculos[ap.email] = Object.assign({}, vinculos[ap.email] || {}, ap.criancas || {});
        gravar(CHAVE_VINCULOS, vinculos);
    }
    gravar(CHAVE_APARELHO, null);
    avisarMudanca();
};

contaFake.confirmarEmail = async function (codigo) {
    let { s, c, ap } = minha();
    await rede(ap.email);
    conferirCodigo(codigo);
    c.emailConfirmado = true;
    gravar(CHAVE_SERVIDOR, s);
    atualizarAparelho({ emailConfirmado: true });
    return contaPublica(ap.email, c);
};

contaFake.reenviarCodigo = async function () {
    let { ap } = minha();
    await rede(ap.email);
    return { esperarSegundos: 60 };
};

contaFake.esqueciSenha = async function (email) {
    email = String(email || '').trim().toLowerCase();
    await rede(email);
    if (!EMAIL_OK.test(email)) {
        throw falha('dados_invalidos', MSG.email_invalido, { campos: { email: MSG.email_invalido } });
    }
    return { ok: true };
};

contaFake.verificarCodigoSenha = async function (email, codigo) {
    email = String(email || '').trim().toLowerCase();
    await rede(email);
    conferirCodigo(codigo);
    if (!servidor().contas[email]) {
        throw falha('codigo_errado', null, { tentativasRestantes: 4 });
    }
    return { chave: 'k' + hex(16) };
};

contaFake.novaSenha = async function ({ email, chave, senha, desconectarOutros, aparelho: nomeAparelho } = {}) {
    email = String(email || '').trim().toLowerCase();
    await rede(email);
    if (!chave) {
        throw falha('codigo_vencido', 'O código venceu. Peça um código novo.');
    }
    if (String(senha || '').length < 8) {
        throw falha('dados_invalidos', MSG.senha_curta, { campos: { senha: MSG.senha_curta } });
    }
    let s = servidor();
    let c = s.contas[email];
    if (!c) {
        throw falha('codigo_vencido', 'O código venceu. Peça um código novo.');
    }
    c.senha = senha;
    delete c.semente;
    c.senhaTrocadaEm = Date.now();
    if (desconectarOutros) {
        c.aparelhos = [];
    }
    return conectar(s, email, c, nomeAparelho);
};

contaFake.trocarSenha = async function ({ senhaAtual, senhaNova, desconectarOutros } = {}) {
    let { s, c, ap } = minha();
    await rede(ap.email);
    if (!senhaConfere(c, senhaAtual)) {
        throw falha('nao_autorizado', MSG.senha_atual, { campos: { senhaAtual: MSG.senha_atual } });
    }
    if (String(senhaNova || '').length < 8) {
        throw falha('dados_invalidos', MSG.senha_curta, { campos: { senhaNova: MSG.senha_curta } });
    }
    c.senha = senhaNova;
    delete c.semente;
    c.senhaTrocadaEm = Date.now();
    if (desconectarOutros) {
        c.aparelhos = (c.aparelhos || []).filter((a) => a.id === ap.aparelhoId);
    }
    gravar(CHAVE_SERVIDOR, s);
    return {};
};

contaFake.trocarEmail = async function ({ emailNovo, senha } = {}) {
    let { s, c, ap } = minha();
    emailNovo = String(emailNovo || '').trim().toLowerCase();
    await rede(emailNovo);
    if (!EMAIL_OK.test(emailNovo)) {
        throw falha('dados_invalidos', MSG.email_invalido, { campos: { emailNovo: MSG.email_invalido } });
    }
    if (!senhaConfere(c, senha)) {
        throw falha('nao_autorizado', MSG.senha_atual, { campos: { senha: MSG.senha_atual } });
    }
    if (emailNovo === 'ja@exemplo.com.br' || s.contas[emailNovo]) {
        throw falha('email_em_uso', 'Já existe uma conta com esse e-mail. Use outro e-mail.');
    }
    c.emailNovo = emailNovo;
    gravar(CHAVE_SERVIDOR, s);
    return {};
};

contaFake.confirmarTrocaEmail = async function (codigo) {
    let { s, c, ap } = minha();
    await rede(ap.email);
    conferirCodigo(codigo);
    let novo = c.emailNovo;
    if (!novo) {
        throw falha('codigo_vencido', 'O código venceu. Comece a troca de novo.');
    }
    delete c.emailNovo;
    c.emailConfirmado = true;
    delete s.contas[ap.email];
    s.contas[novo] = c;
    gravar(CHAVE_SERVIDOR, s);
    atualizarAparelho({ email: novo, emailConfirmado: true });
    return contaPublica(novo, c);
};

contaFake.listarAparelhos = async function () {
    let { c, ap } = minha();
    await rede(ap.email);
    return (c.aparelhos || []).map((a) => ({
        id: a.id,
        nome: a.nome,
        ultimoUso: a.id === ap.aparelhoId ? Date.now() : a.ultimoUso,
        esteAparelho: a.id === ap.aparelhoId
    }));
};

contaFake.desconectarAparelho = async function (id) {
    let { s, c, ap } = minha();
    await rede(ap.email);
    c.aparelhos = (c.aparelhos || []).filter((a) => a.id !== id);
    gravar(CHAVE_SERVIDOR, s);
};

contaFake.nomearAparelho = async function (nome) {
    let { s, c, ap } = minha();
    await rede(ap.email);
    let meu = (c.aparelhos || []).find((a) => a.id === ap.aparelhoId);
    if (meu) {
        meu.nome = nome;
        gravar(CHAVE_SERVIDOR, s);
    }
    atualizarAparelho({ aparelhoNome: nome });
};

contaFake.listarCriancas = async function () {
    let { c, ap } = minha();
    await rede(ap.email);
    return (c.criancas || []).map((k) => criancaPublica(k.banco, k.nome, k.ultimaMudanca));
};

function exigirConfirmado(c) {
    if (!c.emailConfirmado) {
        throw falha('email_nao_confirmado');
    }
}

function guardarCrianca(s, c, banco, nome, usuarioLocal) {
    c.criancas = (c.criancas || []).filter((k) => k.banco !== banco).concat([{ banco: banco, nome: nome, ultimaMudanca: Date.now() }]);
    gravar(CHAVE_SERVIDOR, s);
    let ap = aparelho();
    let criancas = Object.assign({}, ap.criancas || {});
    criancas[banco] = { usuarioLocal: usuarioLocal, nome: nome, papel: 'dono' };
    atualizarAparelho({ criancas: criancas });
}

contaFake.criarCrianca = async function (nome) {
    let { s, c, ap } = minha();
    await rede(ap.email);
    exigirConfirmado(c);
    let banco = 'c' + hex(32);
    let usuario = await perfilArquivoService.criarPerfil(nome);
    guardarCrianca(s, c, banco, nome, usuario);
    return criancaPublica(banco, nome);
};

contaFake.levarParaConta = async function (usuarioLocal, nome, onProgresso) {
    let { s, c, ap } = minha();
    await rede(ap.email);
    exigirConfirmado(c);
    await abrirLocal(usuarioLocal);
    let grids = await dataService.getGrids(false, true);
    let imagens = 0;
    (grids || []).forEach((g) => (g.gridElements || []).forEach((e) => {
        if (e && e.image && (e.image.data || e.image.url)) {
            imagens++;
        }
    }));
    await progressoFalso(Math.max(1, imagens), 'imagens', onProgresso, 'enviados');
    let banco = 'c' + hex(32);
    guardarCrianca(s, c, banco, nome, usuarioLocal);
    return criancaPublica(banco, nome);
};

contaFake.baixarCrianca = async function (banco, onProgresso) {
    let { c, ap } = minha();
    await rede(ap.email);
    let k = (c.criancas || []).find((x) => x.banco === banco);
    if (!k) {
        throw falha('nao_encontrado');
    }
    let ja = (ap.criancas || {})[banco];
    if (ja && usuarioLocalExiste(ja.usuarioLocal)) {
        return criancaPublica(banco, k.nome);
    }
    let usuario = await perfilArquivoService.criarPerfil(k.nome);
    await setupWizard.createStarterBoard({ childName: k.nome, ageGroup: AGE_4_6, size: SIZE_MEDIUM, boardName: 'Prancha de ' + k.nome });
    await progressoFalso(30, 'pranchas', onProgresso, 'recebidos');
    let criancas = Object.assign({}, aparelho().criancas || {});
    criancas[banco] = { usuarioLocal: usuario, nome: k.nome, papel: 'dono' };
    atualizarAparelho({ criancas: criancas });
    return criancaPublica(banco, k.nome);
};

contaFake.abrirCrianca = async function (banco) {
    let ap = aparelho();
    let k = ap && ap.criancas ? ap.criancas[banco] : null;
    if (!k || !usuarioLocalExiste(k.usuarioLocal)) {
        throw falha('nao_encontrado', 'Esta criança ainda não está neste aparelho.');
    }
    await abrirLocal(k.usuarioLocal);
};

contaFake.baixarTudo = async function () {
    let { ap } = minha();
    await rede(ap.email);
    await espera(900);
    // the real one gives a .grd (or .zip); the fake only pretends, so nothing lands in Downloads while testing
    return { arquivo: 'grilo-falante-copia.grd', fake: true };
};

contaFake.apagarConta = async function (senha) {
    let { s, c, ap } = minha();
    await rede(ap.email);
    if (!senhaConfere(c, senha)) {
        throw falha('nao_autorizado', MSG.senha_atual, { campos: { senha: MSG.senha_atual } });
    }
    delete s.contas[ap.email];
    gravar(CHAVE_SERVIDOR, s);
    let vinculos = ler(CHAVE_VINCULOS) || {};
    delete vinculos[ap.email];
    gravar(CHAVE_VINCULOS, vinculos);
    gravar(CHAVE_APARELHO, null);
    avisarMudanca();
};

/** development helper: forget the fake server and this device's fake account */
contaFake.zerar = function () {
    gravar(CHAVE_SERVIDOR, null);
    gravar(CHAVE_APARELHO, null);
    gravar(CHAVE_VINCULOS, null);
    avisarMudanca();
};

if (typeof window !== 'undefined') {
    window.contaFake = contaFake;
}

export { contaFake };
