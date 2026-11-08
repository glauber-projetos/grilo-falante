/**
 * Grilo Falante: a parte "baixa" da conta da família, sem dependências pesadas.
 *
 * - guarda e lê `localStorage.GRILO_CONTA` (contrato em docs/grilo-design/contas-api.md, seção 6)
 * - monta a URL de sincronização de cada criança: https://<token>:<password>@db.<domínio>/<banco>
 * - conversa com o servidor de contas (fetch) e traduz os erros para {erro, mensagem}
 * - renova a sessão (/auth/refresh) ao abrir o app com internet
 *
 * O loginService importa este módulo (para abrir as crianças da conta com sincronização); por isso ele não
 * importa nada que dependa do loginService.
 *
 * GRILO_CONTA = { email, nome, tipo, emailConfirmado, sessao: {token, password, key, expira}, aparelhoNome,
 *                 entrarDeNovo?: bool, criancas: { <banco>: { usuarioLocal, nome, papel, url } } }
 * `entrarDeNovo` fica true quando o servidor respondeu 401: nada é apagado, o app segue com a cópia local.
 */
import $ from '../externals/jquery.js';
import { constants } from '../util/constants';

const CHAVE = 'GRILO_CONTA';
// banco -> perfil local de cada conta que já saiu deste aparelho, por key do servidor:
// GRILO_CONTA_LIGACOES = { <key>: { <banco>: { usuarioLocal, nome, papel, url } } }
// Sobrevive a sair(): quem entra de novo com a MESMA conta reaproveita as cópias locais (não baixa outra).
// Outra conta nunca adota essas cópias. Enquanto ninguém entra, os perfis são só deste aparelho.
const CHAVE_LIGACOES = 'GRILO_CONTA_LIGACOES';
const TEMPO_LIMITE_MS = 20000;

let contaSessao = {};

contaSessao.CHAVE = CHAVE;
contaSessao.CHAVE_LIGACOES = CHAVE_LIGACOES;
contaSessao.EVENTO_CONTA_ALTERADA = 'grilo-conta-alterada';
contaSessao.EVENTO_SINCRONIZACAO = 'grilo-sincronizacao';

contaSessao.ESTADO_ENVIANDO = 'enviando';
contaSessao.ESTADO_EM_DIA = 'em-dia';
contaSessao.ESTADO_SEM_INTERNET = 'sem-internet';
contaSessao.ESTADO_ENTRAR_DE_NOVO = 'entrar-de-novo';

contaSessao.MENSAGEM_SEM_INTERNET =
    'Sem internet agora. Tente de novo quando o aparelho estiver conectado. Suas pranchas no aparelho estão seguras.';
contaSessao.MENSAGEM_SERVIDOR =
    'Não conseguimos falar com o servidor agora. Tente de novo daqui a pouco. Suas pranchas no aparelho estão seguras.';
contaSessao.MENSAGEM_ENTRAR_DE_NOVO = 'Entre de novo para guardar as mudanças.';

let _ultimoEstado = null;

function avisar(evento, dados) {
    try {
        $(document).trigger(evento, dados === undefined ? [] : [dados]);
    } catch (e) {
        // sem jQuery (testes): nada a avisar
    }
}

// ---------- GRILO_CONTA ----------

contaSessao.ler = function () {
    try {
        let texto = window.localStorage.getItem(CHAVE);
        let dados = texto ? JSON.parse(texto) : null;
        if (!dados || typeof dados !== 'object') {
            return null;
        }
        dados.criancas = dados.criancas && typeof dados.criancas === 'object' ? dados.criancas : {};
        return dados;
    } catch (e) {
        return null;
    }
};

/**
 * grava a conta inteira e avisa as telas (grilo-conta-alterada)
 */
contaSessao.gravar = function (conta, semAviso) {
    try {
        if (conta) {
            window.localStorage.setItem(CHAVE, JSON.stringify(conta));
        } else {
            window.localStorage.removeItem(CHAVE);
        }
    } catch (e) {
        log.warn('contaSessao: could not save GRILO_CONTA', e);
    }
    if (!semAviso) {
        avisar(contaSessao.EVENTO_CONTA_ALTERADA, conta ? contaSessao.resumo(conta) : null);
    }
};

/**
 * muda alguns campos da conta (lê, junta e grava)
 */
contaSessao.atualizar = function (campos, semAviso) {
    let conta = contaSessao.ler();
    if (!conta) {
        return null;
    }
    Object.assign(conta, campos || {});
    contaSessao.gravar(conta, semAviso);
    return conta;
};

contaSessao.apagar = function () {
    contaSessao.gravar(null);
};

/**
 * o que as telas podem ver (sem a sessão)
 */
contaSessao.resumo = function (conta) {
    conta = conta || contaSessao.ler();
    if (!conta) {
        return null;
    }
    let copia = JSON.parse(JSON.stringify(conta));
    delete copia.sessao;
    return copia;
};

contaSessao.getSessao = function () {
    let conta = contaSessao.ler();
    return conta && conta.sessao && conta.sessao.token ? conta.sessao : null;
};

// ---------- crianças da conta neste aparelho ----------

/**
 * @return {string|null} o banco da conta ligado a este perfil local, ou null se o perfil é só deste aparelho
 */
contaSessao.bancoDoUsuario = function (usuarioLocal) {
    let conta = contaSessao.ler();
    if (!conta || !usuarioLocal) {
        return null;
    }
    let banco = Object.keys(conta.criancas).find((b) => conta.criancas[b] && conta.criancas[b].usuarioLocal === usuarioLocal);
    return banco || null;
};

contaSessao.ehDaConta = function (usuarioLocal) {
    return !!contaSessao.bancoDoUsuario(usuarioLocal);
};

contaSessao.getCrianca = function (banco) {
    let conta = contaSessao.ler();
    return conta && conta.criancas[banco] ? conta.criancas[banco] : null;
};

contaSessao.guardarCrianca = function (banco, dados) {
    let conta = contaSessao.ler();
    if (!conta || !banco) {
        return;
    }
    conta.criancas[banco] = Object.assign({}, conta.criancas[banco] || {}, dados || {});
    contaSessao.gravar(conta);
};

contaSessao.esquecerCrianca = function (banco) {
    let conta = contaSessao.ler();
    if (!conta || !conta.criancas[banco]) {
        return;
    }
    delete conta.criancas[banco];
    contaSessao.gravar(conta);
};

/**
 * o perfil local saiu do aparelho: a criança continua na conta, só deixa de ter cópia aqui
 */
contaSessao.esquecerUsuarioLocal = function (usuarioLocal) {
    let banco = contaSessao.bancoDoUsuario(usuarioLocal);
    if (banco) {
        contaSessao.esquecerCrianca(banco);
    }
};

// ---------- ligações guardadas depois de sair ----------

function lerLigacoes() {
    try {
        let dados = JSON.parse(window.localStorage.getItem(CHAVE_LIGACOES) || '{}');
        return dados && typeof dados === 'object' ? dados : {};
    } catch (e) {
        return {};
    }
}

function gravarLigacoes(dados) {
    try {
        if (Object.keys(dados).length === 0) {
            window.localStorage.removeItem(CHAVE_LIGACOES);
        } else {
            window.localStorage.setItem(CHAVE_LIGACOES, JSON.stringify(dados));
        }
    } catch (e) {
        log.warn('contaSessao: could not save GRILO_CONTA_LIGACOES', e);
    }
}

/**
 * guarda as crianças ligadas de uma conta que está saindo deste aparelho
 */
contaSessao.guardarLigacoes = function (key, criancas) {
    if (!key || !criancas || Object.keys(criancas).length === 0) {
        return;
    }
    let dados = lerLigacoes();
    dados[key] = Object.assign({}, dados[key] || {}, JSON.parse(JSON.stringify(criancas)));
    gravarLigacoes(dados);
};

/**
 * devolve (e tira da lista) as crianças que esta conta tinha ligado neste aparelho
 * @return {object} { <banco>: {usuarioLocal, ...} } (vazio se não houver)
 */
contaSessao.recuperarLigacoes = function (key) {
    let dados = lerLigacoes();
    let criancas = key && dados[key] ? dados[key] : {};
    if (key && dados[key]) {
        delete dados[key];
        gravarLigacoes(dados);
    }
    return criancas;
};

contaSessao.descartarLigacoes = function (key) {
    contaSessao.recuperarLigacoes(key);
};

/**
 * um perfil local foi ligado a uma conta: nenhuma outra conta guardada aponta mais para ele
 */
contaSessao.soltarUsuarioLocal = function (usuarioLocal) {
    let dados = lerLigacoes();
    let mudou = false;
    for (let key of Object.keys(dados)) {
        for (let banco of Object.keys(dados[key] || {})) {
            if (dados[key][banco] && dados[key][banco].usuarioLocal === usuarioLocal) {
                delete dados[key][banco];
                mudou = true;
            }
        }
        if (dados[key] && Object.keys(dados[key]).length === 0) {
            delete dados[key];
            mudou = true;
        }
    }
    if (mudou) {
        gravarLigacoes(dados);
    }
};

// ---------- endereços ----------

contaSessao.getServidor = function () {
    let url = constants.HAS_CUSTOM_LOGIN_SERVER
        ? constants.LOGIN_SERVER_URL
        : constants.IS_ENVIRONMENT_PROD || constants.FORCE_CONNECT_DB
        ? 'https://login1.couchdb.asterics-foundation.org'
        : `http://${window.location.hostname}:3000`;
    return String(url || '').replace(/\/+$/, '');
};

/**
 * endereço do banco da criança, sem sessão. Usa a `url` que o servidor devolveu; se faltar, troca
 * `login.` por `db.` no endereço do servidor de contas.
 */
contaSessao.urlDoBanco = function (banco, urlDoServidor) {
    if (urlDoServidor) {
        return String(urlDoServidor).replace(/\/+$/, '');
    }
    let guardada = contaSessao.getCrianca(banco);
    if (guardada && guardada.url) {
        return String(guardada.url).replace(/\/+$/, '');
    }
    let servidor = contaSessao.getServidor();
    let base = servidor.replace(/^(https?:\/\/)login\./, '$1db.');
    return `${base}/${banco}`;
};

/**
 * @return {string|null} https://<token>:<password>@db.<domínio>/<banco>, ou null sem sessão
 */
contaSessao.urlComSessao = function (banco, urlDoServidor) {
    let sessao = contaSessao.getSessao();
    if (!sessao || !banco) {
        return null;
    }
    let url = contaSessao.urlDoBanco(banco, urlDoServidor);
    let credenciais = `${encodeURIComponent(sessao.token)}:${encodeURIComponent(sessao.password)}@`;
    return url.replace(/^(https?:\/\/)/, `$1${credenciais}`);
};

// ---------- estado da sincronização ----------

contaSessao.avisarSincronizacao = function (estado) {
    _ultimoEstado = estado;
    avisar(contaSessao.EVENTO_SINCRONIZACAO, { estado: estado });
};

contaSessao.getEstadoSincronizacao = function () {
    let conta = contaSessao.ler();
    if (conta && conta.entrarDeNovo) {
        return contaSessao.ESTADO_ENTRAR_DE_NOVO;
    }
    return _ultimoEstado;
};

/**
 * o servidor disse que a sessão não vale mais. Não apaga nada: marca a conta, para de tentar e avisa.
 */
contaSessao.sessaoRecusada = function () {
    let conta = contaSessao.ler();
    if (conta && !conta.entrarDeNovo) {
        conta.entrarDeNovo = true;
        contaSessao.gravar(conta);
    }
    contaSessao.avisarSincronizacao(contaSessao.ESTADO_ENTRAR_DE_NOVO);
};

// ---------- servidor ----------

function semInternet() {
    return { erro: 'sem_internet', mensagem: contaSessao.MENSAGEM_SEM_INTERNET };
}

function estaOffline() {
    try {
        return typeof navigator !== 'undefined' && navigator.onLine === false;
    } catch (e) {
        return false;
    }
}

/**
 * Faz um pedido ao servidor de contas.
 * @param {string} metodo GET, POST, PATCH, DELETE
 * @param {string} caminho ex.: /conta/entrar
 * @param {object} [corpo]
 * @param {{comSessao?: boolean}} [opcoes] comSessao: manda Authorization: Bearer <token>:<password>
 * @return {Promise<*>} o JSON da resposta (ou null em 204); rejeita com {erro, mensagem, ...}
 */
contaSessao.pedir = async function (metodo, caminho, corpo, opcoes = {}) {
    if (estaOffline()) {
        throw semInternet();
    }
    let cabecalhos = { Accept: 'application/json' };
    if (corpo !== undefined) {
        cabecalhos['Content-Type'] = 'application/json';
    }
    if (opcoes.comSessao) {
        let sessao = contaSessao.getSessao();
        if (!sessao) {
            throw { erro: 'nao_autorizado', mensagem: contaSessao.MENSAGEM_ENTRAR_DE_NOVO };
        }
        cabecalhos.Authorization = `Bearer ${sessao.token}:${sessao.password}`;
    }
    let controle = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let relogio = controle ? setTimeout(() => controle.abort(), TEMPO_LIMITE_MS) : null;
    let resposta;
    try {
        resposta = await fetch(contaSessao.getServidor() + caminho, {
            method: metodo,
            headers: cabecalhos,
            body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
            signal: controle ? controle.signal : undefined
        });
    } catch (e) {
        throw semInternet();
    } finally {
        if (relogio) {
            clearTimeout(relogio);
        }
    }
    let dados = null;
    if (resposta.status !== 204) {
        try {
            let texto = await resposta.text();
            dados = texto ? JSON.parse(texto) : null;
        } catch (e) {
            dados = null;
        }
    }
    if (resposta.ok) {
        return dados;
    }
    let erro = dados && dados.erro ? dados : { erro: codigoPorStatus(resposta.status) };
    erro.status = resposta.status;
    erro.mensagem = erro.mensagem || MENSAGENS[erro.erro] || contaSessao.MENSAGEM_SERVIDOR;
    if (resposta.status === 401 && opcoes.comSessao) {
        contaSessao.sessaoRecusada();
        if (!dados || !dados.mensagem) {
            erro.mensagem = contaSessao.MENSAGEM_ENTRAR_DE_NOVO;
        }
    }
    throw erro;
};

// usadas só quando o servidor não manda `mensagem` (textos de contas-textos.md, seção 5)
const MENSAGENS = {
    email_em_uso: 'Já existe uma conta com esse e-mail. Toque em "Entrar" para usar essa conta.',
    codigo_errado: 'Esse código está errado ou venceu. Confira ou peça um código novo.',
    codigo_vencido: 'Esse código está errado ou venceu. Confira ou peça um código novo.',
    muitas_tentativas: 'Muitas tentativas. Espere 5 minutos e tente de novo.',
    nao_autorizado: 'E-mail ou senha errados. Confira e tente de novo.'
};

function codigoPorStatus(status) {
    switch (status) {
        case 400:
            return 'dados_invalidos';
        case 401:
            return 'nao_autorizado';
        case 403:
            return 'proibido';
        case 404:
            return 'nao_encontrado';
        case 409:
            return 'email_em_uso';
        case 410:
            return 'codigo_vencido';
        case 429:
            return 'muitas_tentativas';
        default:
            return 'servidor';
    }
}

/**
 * POST /auth/refresh ao abrir o app com internet. Sem internet: não faz nada. 401: marca "entrar de novo"
 * (sem apagar nada). Nunca rejeita.
 * @return {Promise<boolean>} true se a sessão foi renovada
 */
contaSessao.renovar = async function () {
    if (!contaSessao.getSessao()) {
        return false;
    }
    try {
        let resposta = await contaSessao.pedir('POST', '/auth/refresh', undefined, { comSessao: true });
        let conta = contaSessao.ler();
        if (conta && conta.sessao) {
            let expira = resposta && (resposta.expira || resposta.expires);
            if (expira) {
                conta.sessao.expira = expira;
            }
            if (resposta && resposta.token && resposta.password) {
                conta.sessao.token = resposta.token;
                conta.sessao.password = resposta.password;
            }
            conta.entrarDeNovo = false;
            contaSessao.gravar(conta, true);
        }
        return true;
    } catch (e) {
        if (e && e.erro === 'sem_internet') {
            contaSessao.avisarSincronizacao(contaSessao.ESTADO_SEM_INTERNET);
        }
        return false;
    }
};

export { contaSessao };
