/**
 * Grilo Falante: acompanha a sincronização da criança da conta que está aberta.
 *
 * - traduz o estado do PouchDB para o evento `grilo-sincronizacao` {estado: "enviando"|"em-dia"|"sem-internet"|"entrar-de-novo"}
 * - sem internet: continua com a cópia local e tenta de novo sozinho (com espera crescente, e logo que a internet volta)
 * - 401/403 do servidor: NUNCA apaga nada; marca "entrar de novo", para de tentar e segue offline
 * - ao abrir o app com internet: POST /auth/refresh
 *
 * Carregado pelo loginService (que abre o app), para já estar ouvindo antes da primeira criança abrir.
 */
import $ from '../externals/jquery.js';
import { constants } from '../util/constants';
import { databaseService } from './data/databaseService';
import { contaSessao } from './contaSessao';

let contaSincronizacao = {};

const ESPERAS_SEGUNDOS = [10, 30, 60, 120, 300, 600];

let _iniciado = false;
let _tentativa = 0;
let _relogio = null;

function usuarioAberto() {
    return databaseService.getCurrentUsedDatabase();
}

/**
 * @return {string|null} o banco da criança da conta que está aberta, ou null
 */
contaSincronizacao.bancoAberto = function () {
    return contaSessao.bancoDoUsuario(usuarioAberto());
};

function pararTentativas() {
    if (_relogio) {
        clearTimeout(_relogio);
        _relogio = null;
    }
}

function agendarTentativa() {
    pararTentativas();
    let espera = ESPERAS_SEGUNDOS[Math.min(_tentativa, ESPERAS_SEGUNDOS.length - 1)];
    _tentativa++;
    _relogio = setTimeout(() => {
        _relogio = null;
        contaSincronizacao.religar();
    }, espera * 1000);
}

/**
 * liga (ou religa) a sincronização da criança aberta, com a sessão atual
 * @return {Promise<boolean>}
 */
contaSincronizacao.religar = function () {
    let usuario = usuarioAberto();
    let banco = contaSessao.bancoDoUsuario(usuario);
    let conta = contaSessao.ler();
    if (!banco || !conta || conta.entrarDeNovo) {
        return Promise.resolve(false);
    }
    let url = contaSessao.urlComSessao(banco);
    if (!url) {
        return Promise.resolve(false);
    }
    return databaseService.religarSync(usuario, url).catch((e) => {
        log.warn('contaSincronizacao: could not restart sync', e);
        return false;
    });
};

/**
 * para a sincronização da criança aberta (sair da conta, apagar a conta). A cópia local continua.
 */
contaSincronizacao.parar = function () {
    pararTentativas();
    _tentativa = 0;
    try {
        databaseService.pararSync();
    } catch (e) {
        log.warn('contaSincronizacao: could not stop sync', e);
    }
};

/**
 * erro vindo do PouchDB (ou null) para a criança aberta
 */
contaSincronizacao.conexaoPerdida = function (erro, nomeDoBanco) {
    let usuario = nomeDoBanco || usuarioAberto();
    if (!contaSessao.ehDaConta(usuario) || usuario !== usuarioAberto()) {
        return;
    }
    let status = erro && (erro.status || erro.statusCode);
    if (status === 401 || status === 403) {
        pararTentativas();
        contaSessao.sessaoRecusada();
        return;
    }
    contaSessao.avisarSincronizacao(contaSessao.ESTADO_SEM_INTERNET);
    agendarTentativa();
};

contaSincronizacao.estadoMudou = function (estadoPouch) {
    if (!contaSessao.ehDaConta(usuarioAberto())) {
        return;
    }
    let conta = contaSessao.ler();
    if (conta && conta.entrarDeNovo) {
        return;
    }
    if (estadoPouch === constants.DB_SYNC_STATE_SYNCINC) {
        contaSessao.avisarSincronizacao(contaSessao.ESTADO_ENVIANDO);
    } else if (estadoPouch === constants.DB_SYNC_STATE_SYNCED) {
        _tentativa = 0;
        contaSessao.avisarSincronizacao(contaSessao.ESTADO_EM_DIA);
    }
};

/**
 * renova a sessão e, se deu certo, religa a sincronização da criança aberta
 */
contaSincronizacao.aoFicarOnline = async function () {
    if (!contaSessao.getSessao()) {
        return;
    }
    let renovada = await contaSessao.renovar();
    if (renovada) {
        _tentativa = 0;
        await contaSincronizacao.religar();
    }
};

contaSincronizacao.iniciar = function () {
    if (_iniciado) {
        return;
    }
    _iniciado = true;
    try {
        $(document).on(constants.EVENT_DB_CONNECTION_LOST, function (e, erro, nomeDoBanco) {
            contaSincronizacao.conexaoPerdida(erro, nomeDoBanco);
        });
        $(document).on(constants.EVENT_DB_SYNC_STATE_CHANGE, function (e, estado) {
            contaSincronizacao.estadoMudou(estado);
        });
        $(document).on(constants.EVENT_USER_CHANGING, function () {
            pararTentativas();
            _tentativa = 0;
        });
    } catch (e) {
        // sem jQuery (testes)
    }
    try {
        window.addEventListener('online', () => {
            contaSincronizacao.aoFicarOnline();
        });
    } catch (e) {
        // sem window
    }
    // ao abrir o app com internet: /auth/refresh
    if (contaSessao.getSessao() && !(typeof navigator !== 'undefined' && navigator.onLine === false)) {
        contaSincronizacao.aoFicarOnline();
    }
};

export { contaSincronizacao };
