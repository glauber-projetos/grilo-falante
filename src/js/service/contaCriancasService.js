/**
 * Grilo Falante: as crianças da conta da família neste aparelho.
 *
 * Cada criança da conta é um perfil LOCAL (sem senha, sem criptografia: caminho `_isLocalUser`) que sincroniza
 * com o banco da criança no servidor (https://<token>:<password>@db.<domínio>/<banco>).
 * A ligação "banco da conta -> perfil local" fica em GRILO_CONTA.criancas (ver contaSessao).
 *
 * "Cópia local completa" = o banco local está marcado como sincronizado (localStorageService.markSyncedDatabase):
 * - perfil criado aqui ou levado para a conta: a cópia local é a verdade, já nasce completa e a sincronização envia;
 * - criança baixada de outro aparelho: só fica completa quando a primeira descida termina.
 * Nada aqui apaga dados locais.
 */
import { loginService } from './loginService';
import { perfilArquivoService } from './perfilArquivoService';
import { perfilService } from './perfilService';
import { nomeParaUsuario } from './perfilNomes';
import { databaseService } from './data/databaseService';
import { localStorageService } from './data/localStorageService';
import { contaSessao } from './contaSessao';
import { contaSincronizacao } from './contaSincronizacao';

let contaCriancasService = {};

const LOTE = 10; // documentos por pedido: as pranchas levam as fotos dentro, e o aparelho pode ser simples

function getPouchDB() {
    let PouchDB = typeof window !== 'undefined' ? window.PouchDB : null;
    if (!PouchDB) {
        throw { erro: 'servidor', mensagem: contaSessao.MENSAGEM_SERVIDOR };
    }
    return PouchDB;
}

function semInternet() {
    return { erro: 'sem_internet', mensagem: contaSessao.MENSAGEM_SEM_INTERNET };
}

/**
 * traduz um erro do PouchDB (replicação) para {erro, mensagem}. 401/403 marcam "entrar de novo".
 */
function erroDaReplicacao(e) {
    let status = e && (e.status || e.statusCode);
    if (status === 401 || status === 403) {
        contaSessao.sessaoRecusada();
        return { erro: 'nao_autorizado', mensagem: contaSessao.MENSAGEM_ENTRAR_DE_NOVO, status: status };
    }
    if (status >= 500) {
        return { erro: 'servidor', mensagem: contaSessao.MENSAGEM_SERVIDOR, status: status };
    }
    return semInternet();
}

/**
 * copia documentos de um banco para outro, uma vez, contando o progresso
 * @return {Promise<{docs_written: number}>}
 */
function copiar(origem, destino, total, aoAvancar) {
    let PouchDB = getPouchDB();
    return new Promise((resolve, reject) => {
        let feitos = 0;
        PouchDB.replicate(origem, destino, { batch_size: LOTE, retry: false })
            .on('change', (info) => {
                feitos = info && typeof info.docs_written === 'number' ? info.docs_written : feitos;
                aoAvancar(Math.min(feitos, total));
            })
            .on('denied', (e) => {
                log.warn('contaCriancasService: document denied', e);
            })
            .on('complete', (info) => resolve(info))
            .on('error', (e) => reject(e));
    });
}

function existentes() {
    let lista = localStorageService.getSavedUsers() || [];
    let aberto = databaseService.getCurrentUsedDatabase();
    if (aberto) {
        lista = lista.concat([aberto]);
    }
    let conta = contaSessao.ler();
    if (conta) {
        Object.values(conta.criancas).forEach((c) => c && c.usuarioLocal && lista.push(c.usuarioLocal));
    }
    return lista;
}

/**
 * escolhe um nome de usuário local livre (e sem banco antigo com esse nome no aparelho)
 */
async function usuarioLivre(nome) {
    let PouchDB = getPouchDB();
    let usados = existentes();
    for (let i = 0; i < 10; i++) {
        let candidato = nomeParaUsuario(nome, usados);
        let db = new PouchDB(candidato);
        let info = await db.info();
        await db.close();
        if (!info || !info.doc_count) {
            return candidato;
        }
        usados.push(candidato);
    }
    return nomeParaUsuario(nome + '-' + Date.now().toString(36).slice(-4), usados);
}

/**
 * @return {{usuarioLocal: string, completa: boolean}|null} a cópia desta criança neste aparelho
 */
contaCriancasService.nesteAparelho = function (banco) {
    let c = contaSessao.getCrianca(banco);
    if (!c || !c.usuarioLocal) {
        return null;
    }
    let completa = !c.baixando && localStorageService.isDatabaseSynced(c.usuarioLocal);
    return { usuarioLocal: c.usuarioLocal, completa: completa };
};

/**
 * liga um perfil local a uma criança da conta. A cópia local é tratada como completa (ela é a verdade).
 */
contaCriancasService.ligarPerfil = function (banco, usuarioLocal, crianca = {}) {
    contaSessao.soltarUsuarioLocal(usuarioLocal);
    contaSessao.guardarCrianca(banco, {
        usuarioLocal: usuarioLocal,
        nome: crianca.nome || (perfilService.getPerfil(usuarioLocal) || {}).nome || '',
        papel: crianca.papel || 'dono',
        url: crianca.url || contaSessao.urlDoBanco(banco)
    });
    localStorageService.markSyncedDatabase(usuarioLocal);
};

/**
 * Cria um perfil local novo para uma criança que acabou de ser criada na conta, abre e liga a sincronização.
 * @param crianca resposta do servidor (POST /conta/criancas)
 * @return {Promise<string>} o usuário local
 */
contaCriancasService.criarPerfilDaCrianca = async function (crianca) {
    let usuario = await perfilArquivoService.criarPerfil(crianca.nome);
    contaCriancasService.ligarPerfil(crianca.banco, usuario, crianca);
    await contaSincronizacao.religar();
    return usuario;
};

/**
 * Envia tudo o que está no perfil local para o banco da criança (já criado e ligado). Não apaga nada local.
 * @param {function({enviados: number, total: number})} [onProgresso]
 */
contaCriancasService.enviar = async function (usuarioLocal, banco, onProgresso) {
    onProgresso = onProgresso || (() => {});
    let url = contaSessao.urlComSessao(banco);
    if (!url) {
        throw { erro: 'nao_autorizado', mensagem: contaSessao.MENSAGEM_ENTRAR_DE_NOVO };
    }
    let PouchDB = getPouchDB();
    let local = new PouchDB(usuarioLocal);
    let remoto = new PouchDB(url, { skip_setup: true });
    let total = 0;
    try {
        let info = await local.info();
        total = info && info.doc_count ? info.doc_count : 0;
        onProgresso({ enviados: 0, total: total });
        await copiar(local, remoto, total, (n) => onProgresso({ enviados: n, total: total }));
        onProgresso({ enviados: total, total: total });
    } catch (e) {
        log.warn('contaCriancasService: upload stopped', e);
        throw erroDaReplicacao(e);
    } finally {
        try {
            remoto.close();
        } catch (e) {
            // nada
        }
    }
    // a criança aberta é esta: liga a sincronização contínua
    if (databaseService.getCurrentUsedDatabase() === usuarioLocal) {
        await contaSincronizacao.religar();
    }
};

/**
 * Primeira vez num aparelho novo: cria o perfil local e baixa tudo do banco da criança.
 * Se a descida parar no meio (sem internet), tentar de novo continua de onde parou, no mesmo perfil.
 * @param crianca {banco, nome, papel, url}
 * @param {function({recebidos: number, total: number})} [onProgresso]
 * @return {Promise<string>} o usuário local (ainda não aberto)
 */
contaCriancasService.baixar = async function (crianca, onProgresso) {
    onProgresso = onProgresso || (() => {});
    let banco = crianca.banco;
    let ja = contaCriancasService.nesteAparelho(banco);
    if (ja && ja.completa) {
        return ja.usuarioLocal;
    }
    let url = contaSessao.urlComSessao(banco, crianca.url);
    if (!url) {
        throw { erro: 'nao_autorizado', mensagem: contaSessao.MENSAGEM_ENTRAR_DE_NOVO };
    }
    let usuario = ja ? ja.usuarioLocal : await usuarioLivre(crianca.nome);
    contaSessao.guardarCrianca(banco, {
        usuarioLocal: usuario,
        nome: crianca.nome || '',
        papel: crianca.papel || 'dono',
        url: crianca.url || contaSessao.urlDoBanco(banco),
        baixando: true
    });
    let PouchDB = getPouchDB();
    let remoto = new PouchDB(url, { skip_setup: true });
    let local = new PouchDB(usuario);
    try {
        let info = await remoto.info();
        let total = info && info.doc_count ? info.doc_count : 0;
        onProgresso({ recebidos: 0, total: total });
        await copiar(remoto, local, total, (n) => onProgresso({ recebidos: n, total: total }));
        onProgresso({ recebidos: total, total: total });
    } catch (e) {
        log.warn('contaCriancasService: download stopped', e);
        throw erroDaReplicacao(e);
    } finally {
        try {
            remoto.close();
            local.close();
        } catch (e) {
            // nada
        }
    }
    // pronto: vira um perfil local deste aparelho, ligado à conta
    localStorageService.saveUserPassword(usuario, '');
    if (!perfilService.getPerfil(usuario)) {
        perfilService.salvarPerfil(usuario, { nome: crianca.nome || '' });
    }
    localStorageService.markSyncedDatabase(usuario);
    contaSessao.guardarCrianca(banco, { baixando: false });
    return usuario;
};

/**
 * Abre a criança (já neste aparelho) e liga a sincronização. Trocar de criança não sai da conta.
 */
contaCriancasService.abrir = async function (banco) {
    let aqui = contaCriancasService.nesteAparelho(banco);
    if (!aqui || !aqui.completa) {
        throw { erro: 'nao_baixada', mensagem: 'Essa criança ainda não foi baixada neste aparelho.' };
    }
    await loginService.loginStoredUser(aqui.usuarioLocal, true);
    if (databaseService.getCurrentUsedDatabase() === aqui.usuarioLocal) {
        await contaSincronizacao.religar();
    }
    return aqui.usuarioLocal;
};

/**
 * Atualiza a ligação com a lista que veio do servidor:
 * - nome, papel e endereço das crianças;
 * - criança que saiu da conta: o perfil local fica, só neste aparelho (para de sincronizar).
 */
contaCriancasService.aplicarLista = function (lista) {
    let conta = contaSessao.ler();
    if (!conta) {
        return;
    }
    let bancos = (lista || []).map((c) => c.banco);
    let mudou = false;
    for (let crianca of lista || []) {
        let ligada = conta.criancas[crianca.banco];
        if (ligada) {
            ligada.nome = crianca.nome;
            ligada.papel = crianca.papel;
            ligada.url = crianca.url || ligada.url;
            mudou = true;
        }
    }
    let saiu = Object.keys(conta.criancas).filter((b) => !bancos.includes(b));
    let aberto = databaseService.getCurrentUsedDatabase();
    for (let banco of saiu) {
        if (conta.criancas[banco] && conta.criancas[banco].usuarioLocal === aberto) {
            contaSincronizacao.parar();
        }
        delete conta.criancas[banco];
        mudou = true;
    }
    conta.listaCriancas = lista || [];
    contaSessao.gravar(conta, !mudou);
};

/**
 * a lista do servidor com o que este aparelho sabe de cada criança
 */
contaCriancasService.completarLista = function (lista) {
    return (lista || []).map((c) => {
        let aqui = contaCriancasService.nesteAparelho(c.banco);
        return Object.assign({}, c, {
            usuarioLocal: aqui ? aqui.usuarioLocal : null,
            nesteAparelho: !!(aqui && aqui.completa)
        });
    });
};

export { contaCriancasService };
