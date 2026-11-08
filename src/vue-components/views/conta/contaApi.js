/**
 * Grilo Falante: what the account screens call. In the app this is just `contaService`
 * (contract in docs/grilo-design/contas-api.md, section 6).
 *
 * Development only: with `?contaFake=1` in the address the screens talk to a fake account
 * (`contaFake.js`), so every journey can be tried without the server. `?contaFake=0` turns it off.
 * The fake is never part of a production build: the `process.env.NODE_ENV` check below is
 * replaced by webpack and the whole block (with its import) is dropped.
 */
import { contaService } from '../../../js/service/contaService';

const CHAVE_FAKE_LIGADO = 'GRILO_CONTA_FAKE_LIGADO';
const CHAVE_FAKE_APARELHO = 'GRILO_CONTA_FAKE';

const ASSINCRONAS = [
    'cadastrar', 'entrar', 'sair',
    'confirmarEmail', 'reenviarCodigo',
    'esqueciSenha', 'verificarCodigoSenha', 'novaSenha',
    'trocarSenha', 'trocarEmail', 'confirmarTrocaEmail',
    'listarAparelhos', 'desconectarAparelho', 'nomearAparelho',
    'listarCriancas', 'criarCrianca', 'levarParaConta', 'baixarCrianca', 'abrirCrianca',
    'baixarTudo', 'apagarConta'
];

let carregarFake = null;

if (process.env.NODE_ENV !== 'production') {
    if (fakePedido()) {
        carregarFake = import(/* webpackChunkName: "contaFake" */ './contaFake.js').then((m) => m.contaFake);
    }
}

function fakePedido() {
    try {
        let pedido = new URLSearchParams(window.location.search).get('contaFake');
        if (pedido === '0') {
            window.sessionStorage.removeItem(CHAVE_FAKE_LIGADO);
            return false;
        }
        if (pedido) {
            window.sessionStorage.setItem(CHAVE_FAKE_LIGADO, '1');
            return true;
        }
        return window.sessionStorage.getItem(CHAVE_FAKE_LIGADO) === '1';
    } catch (e) {
        return false;
    }
}

function lerContaFake() {
    try {
        let texto = window.localStorage.getItem(CHAVE_FAKE_APARELHO);
        return texto ? JSON.parse(texto) : null;
    } catch (e) {
        return null;
    }
}

/**
 * every rejection becomes {erro, mensagem?, ...}
 */
function normalizarErro(e) {
    if (e && typeof e === 'object' && e.erro) {
        return e;
    }
    if (e && e.name === 'TypeError') {
        return { erro: 'sem_internet' };
    }
    return { erro: 'servidor', causa: e };
}

let contaApi = {
    EVENTO_CONTA_ALTERADA: contaService.EVENTO_CONTA_ALTERADA || 'grilo-conta-alterada',
    EVENTO_SINCRONIZACAO: contaService.EVENTO_SINCRONIZACAO || 'grilo-sincronizacao'
};

contaApi.usandoFake = function () {
    return !!carregarFake;
};

contaApi.temConta = function () {
    if (carregarFake) {
        let conta = lerContaFake();
        return !!(conta && conta.sessao);
    }
    return contaService.temConta();
};

/**
 * {email, nome, emailConfirmado, aparelhoNome, criancas, entrarDeNovo, ...}, never the session itself
 * (the fake drops it too, like contaService.getConta)
 */
contaApi.getConta = function () {
    if (carregarFake) {
        let conta = lerContaFake();
        if (conta) {
            delete conta.sessao;
        }
        return conta;
    }
    return contaService.getConta();
};

/**
 * last known sync state ('em-dia', 'sem-internet', 'entrar-de-novo'...): the event may have gone out before
 * the screen was there
 */
contaApi.estadoSincronizacao = function () {
    if (carregarFake || typeof contaService.estadoSincronizacao !== 'function') {
        return null;
    }
    return contaService.estadoSincronizacao();
};

/**
 * true while this device still has the name the service gave it on its own ("Tablet Android", "iPad"...),
 * so "Preparar o tablet de Ana" can call it "Tablet de Ana"
 */
contaApi.nomeDeAparelhoGenerico = function (nome) {
    if (!nome) {
        return true;
    }
    return !carregarFake && typeof contaService.nomeDoAparelho === 'function' && nome === contaService.nomeDoAparelho();
};

ASSINCRONAS.forEach((nome) => {
    contaApi[nome] = function (...args) {
        let chamada;
        try {
            chamada = carregarFake ? carregarFake.then((fake) => fake[nome](...args)) : Promise.resolve(contaService[nome](...args));
        } catch (e) {
            chamada = Promise.reject(e);
        }
        return chamada.catch((e) => Promise.reject(normalizarErro(e)));
    };
});

export { contaApi };
