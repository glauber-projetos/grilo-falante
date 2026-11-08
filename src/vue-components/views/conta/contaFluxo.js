/**
 * Grilo Falante: what the account screens remember while the family goes from one step to the next
 * (the e-mail being confirmed, the child being sent to the account, ...) and where to go after signing in.
 * Kept in memory; the small text parts also in sessionStorage, so a reload in the middle does not lose them.
 */
import { Router } from '../../../js/router';
import { databaseService } from '../../../js/service/data/databaseService';
import { localStorageService } from '../../../js/service/data/localStorageService';
import { dataService } from '../../../js/service/data/dataService';
import { perfilService } from '../../../js/service/perfilService';
import { contaApi } from './contaApi';

const CHAVE = 'GRILO_CONTA_FLUXO';
const CHAVE_SEM_CONTA = 'GRILO_SEM_CONTA_ESCOLHIDO';
const GUARDAR = ['email', 'emailNovo', 'trocaNoCadastro', 'pendente', 'ultimaCrianca', 'voltarDados', 'voltarNova', 'senhaOk', 'emailApagado', 'rascunho'];

let fluxo = {
    email: '', // e-mail typed in the last form (code screens show it)
    emailNovo: '', // when changing the account's e-mail
    trocaNoCadastro: false, // the e-mail is changed right after creating the account (typo)
    chaveSenha: null, // from verificarCodigoSenha, only in memory
    pendente: null, // {acao: 'levar', usuario, nome}: after creating the account or signing in, send this profile
    trabalho: null, // for the progress screen: {tipo: 'arquivo'|'levar', ...} or {tipo: 'baixar', criancas: [...]}
    ultimaCrianca: '', // name shown on "pronto" and "preparar"
    voltarDados: '', // where "Como cuidamos dos dados" goes back to
    voltarNova: '', // where "Nova criança" goes back to
    senhaOk: null, // {derrubou, depois: 'entrar'|'conta'}
    emailApagado: '',
    rascunho: null, // {email, nome, aceite} of the create-account form
    aviso: '' // short message to show on the next account screen
};

try {
    let salvo = JSON.parse(window.sessionStorage.getItem(CHAVE) || 'null');
    if (salvo) {
        GUARDAR.forEach((k) => {
            if (salvo[k] !== undefined) {
                fluxo[k] = salvo[k];
            }
        });
    }
} catch (e) {
    // no sessionStorage: memory only
}

function salvar() {
    try {
        let copia = {};
        GUARDAR.forEach((k) => (copia[k] = fluxo[k]));
        window.sessionStorage.setItem(CHAVE, JSON.stringify(copia));
    } catch (e) {
        // ignore
    }
}

let contaFluxo = {};

contaFluxo.estado = fluxo;

contaFluxo.set = function (mudancas) {
    Object.assign(fluxo, mudancas);
    salvar();
};

/**
 * "#conta/criar" etc.; "familia" is the "Conta da família" screen ("#conta")
 */
contaFluxo.ir = function (tela, options) {
    Router.to(tela === 'familia' ? '#conta' : '#conta/' + tela, options);
};

contaFluxo.escolheuSemConta = function () {
    try {
        return window.sessionStorage.getItem(CHAVE_SEM_CONTA) === '1';
    } catch (e) {
        return false;
    }
};

contaFluxo.marcarSemConta = function () {
    try {
        window.sessionStorage.setItem(CHAVE_SEM_CONTA, '1');
    } catch (e) {
        // ignore
    }
};

function usuariosNoAparelho() {
    let usuarios = localStorageService.getSavedUsers();
    let atual = databaseService.getCurrentUsedDatabase();
    if (atual && !usuarios.includes(atual)) {
        usuarios = usuarios.concat([atual]);
    }
    return usuarios;
}

/**
 * {banco: {usuarioLocal, nome, papel}} of this device, only the children whose copy is on this device
 * (a download that stopped halfway, `baixando`, doesn't count: it still has to finish)
 */
contaFluxo.criancasNoAparelho = function () {
    let conta = contaApi.getConta();
    let usuarios = usuariosNoAparelho();
    let resultado = {};
    Object.entries((conta && conta.criancas) || {}).forEach(([banco, k]) => {
        if (k && k.usuarioLocal && !k.baixando && usuarios.includes(k.usuarioLocal)) {
            resultado[banco] = k;
        }
    });
    return resultado;
};

/**
 * true, if the profile belongs to the family account (its boards are kept there)
 */
contaFluxo.usuarioNaConta = function (usuario) {
    let conta = contaApi.getConta();
    if (!usuario || !conta || !contaApi.temConta()) {
        return false;
    }
    return Object.values(conta.criancas || {}).some((k) => k && k.usuarioLocal === usuario);
};

/**
 * profiles of this device that are only here (not in the account), as cards {usuario, nome, inicial, foto, cor}
 */
contaFluxo.perfisSoNoAparelho = function () {
    return usuariosNoAparelho()
        .filter((u) => !contaFluxo.usuarioNaConta(u))
        .map((u) => perfilService.cartao(u, 'Sem nome'));
};

/**
 * the child's board, not the adult home (for "Abrir a prancha de Ana")
 */
contaFluxo.abrirPrancha = async function () {
    let metadata = await dataService.getMetadata();
    let id = metadata ? metadata.homeGridId || metadata.lastOpenedGridId : null;
    if (id) {
        return Router.toGrid(id);
    }
    Router.toMain();
};

/**
 * After signing in (or after "Senha nova" signed this device in): families with one child go straight
 * to that child; children not yet on this device are downloaded first; with two or more children,
 * or with profiles that are only on this device, the existing "Quem vai falar hoje?" list stays.
 */
contaFluxo.seguirDepoisDeEntrar = async function () {
    let conta = contaApi.getConta() || {};
    if (!conta.emailConfirmado) {
        contaApi.reenviarCodigo().catch(() => {});
        fluxo.email = conta.email || fluxo.email;
        salvar();
        return contaFluxo.ir('codigo', { noHistory: true });
    }
    if (fluxo.pendente && fluxo.pendente.acao === 'levar') {
        // the profile may already be in this account (signed in again after "Desconectar"): don't send it twice
        if (!contaFluxo.usuarioNaConta(fluxo.pendente.usuario)) {
            return contaFluxo.comecarLevar(fluxo.pendente.usuario, fluxo.pendente.nome);
        }
        contaFluxo.set({ pendente: null });
    }
    let criancas;
    try {
        criancas = await contaApi.listarCriancas();
    } catch (e) {
        // without internet the service still gives the last list it knew
        criancas = (e && e.criancas) || Object.entries(conta.criancas || {}).map(([banco, k]) => ({ banco: banco, nome: k.nome }));
    }
    if (!criancas.length) {
        return contaFluxo.ir('crianca', { noHistory: true });
    }
    let noAparelho = contaFluxo.criancasNoAparelho();
    let faltam = criancas.filter((k) => !noAparelho[k.banco]);
    if (faltam.length) {
        fluxo.trabalho = { tipo: 'baixar', criancas: faltam, totalNaConta: criancas.length };
        return contaFluxo.ir('baixando', { noHistory: true });
    }
    let soAqui = contaFluxo.perfisSoNoAparelho();
    if (criancas.length === 1 && !soAqui.length) {
        await contaApi.abrirCrianca(criancas[0].banco);
        return Router.toMain();
    }
    Router.to('#welcome', { noHistory: true });
};

/**
 * after the e-mail of a new account is confirmed
 */
contaFluxo.seguirDepoisDeConfirmar = function () {
    if (fluxo.pendente && fluxo.pendente.acao === 'levar') {
        return contaFluxo.comecarLevar(fluxo.pendente.usuario, fluxo.pendente.nome);
    }
    contaFluxo.ir('crianca', { noHistory: true });
};

/**
 * sends a profile that is only on this device to the account (progress screen)
 */
contaFluxo.comecarLevar = function (usuario, nome) {
    fluxo.trabalho = { tipo: 'levar', usuario: usuario, nome: nome };
    contaFluxo.set({ pendente: null, ultimaCrianca: nome });
    contaFluxo.ir('enviando', { noHistory: true });
};

export { contaFluxo };
