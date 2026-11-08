/**
 * Grilo Falante: conta da família (contrato em docs/grilo-design/contas-api.md, seção 6).
 *
 * Todas as funções (menos temConta e getConta) devolvem Promise e rejeitam com o objeto de erro do servidor
 * ({erro, mensagem, ...}) ou com {erro: "sem_internet", mensagem}.
 *
 * Eventos jQuery em `document`:
 * - `grilo-conta-alterada` (dados: a conta sem a sessão, ou null ao sair)
 * - `grilo-sincronizacao` ({estado: "enviando"|"em-dia"|"sem-internet"|"entrar-de-novo"})
 *
 * A sessão nunca vence sozinha (o servidor só derruba quando a pessoa pede). Se o servidor responder 401, nada é
 * apagado: o app segue com as cópias locais e mostra "Entre de novo para guardar as mudanças" (getConta().entrarDeNovo).
 */
import { contaSessao } from './contaSessao';
import { contaSincronizacao } from './contaSincronizacao';
import { contaCriancasService } from './contaCriancasService';
import { contaExportService } from './contaExportService';
import { localStorageService } from './data/localStorageService';

let contaService = {};

contaService.EVENTO_CONTA_ALTERADA = contaSessao.EVENTO_CONTA_ALTERADA;
contaService.EVENTO_SINCRONIZACAO = contaSessao.EVENTO_SINCRONIZACAO;
contaService.ESTADO_ENVIANDO = contaSessao.ESTADO_ENVIANDO;
contaService.ESTADO_EM_DIA = contaSessao.ESTADO_EM_DIA;
contaService.ESTADO_SEM_INTERNET = contaSessao.ESTADO_SEM_INTERNET;
contaService.ESTADO_ENTRAR_DE_NOVO = contaSessao.ESTADO_ENTRAR_DE_NOVO;

const pedir = contaSessao.pedir;
const comSessao = { comSessao: true };

function limparEmail(email) {
    return String(email || '')
        .trim()
        .toLowerCase();
}

/**
 * nome sugerido para este aparelho quando a tela não manda nenhum
 */
contaService.nomeDoAparelho = function () {
    let ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    if (/iPad|Macintosh.*Mobile/i.test(ua)) {
        return 'iPad';
    }
    if (/Android/i.test(ua)) {
        return 'Tablet Android';
    }
    return 'Este aparelho';
};

/**
 * guarda a sessão que o servidor mandou ({sessao, conta}). Se for a mesma conta de antes (mesma key), as
 * crianças ligadas continuam; se for outra conta, as cópias locais viram perfis só deste aparelho.
 */
function guardarSessao(resposta, aparelhoNome) {
    let antes = contaSessao.ler();
    let sessao = resposta && resposta.sessao;
    let dados = (resposta && resposta.conta) || {};
    if (!sessao || !sessao.token) {
        throw { erro: 'servidor', mensagem: contaSessao.MENSAGEM_SERVIDOR };
    }
    let mesmaConta = antes && antes.sessao && antes.sessao.key && antes.sessao.key === sessao.key;
    if (antes && !mesmaConta && antes.sessao && antes.sessao.key) {
        // outra conta entrando sem sair antes: a anterior guarda as suas ligações para quando voltar
        contaSessao.guardarLigacoes(antes.sessao.key, antes.criancas);
    }
    // a mesma conta que já saiu deste aparelho reaproveita as cópias locais (não baixa uma segunda cópia)
    let guardadas = contaSessao.recuperarLigacoes(sessao.key);
    let conta = {
        email: dados.email,
        nome: dados.nome,
        tipo: dados.tipo || 'familia',
        emailConfirmado: !!dados.emailConfirmado,
        sessao: { token: sessao.token, password: sessao.password, key: sessao.key, expira: sessao.expira },
        aparelhoNome: aparelhoNome || (mesmaConta && antes.aparelhoNome) || contaService.nomeDoAparelho(),
        criancas: Object.assign({}, guardadas, mesmaConta ? antes.criancas : {}),
        entrarDeNovo: false
    };
    if (mesmaConta && antes.listaCriancas) {
        conta.listaCriancas = antes.listaCriancas;
    }
    if (antes && !mesmaConta) {
        contaSincronizacao.parar();
    }
    contaSessao.gravar(conta);
    // sessão nova: a criança aberta volta a sincronizar com ela
    contaSincronizacao.religar();
    return contaSessao.resumo(conta);
}

function atualizarDados(dados) {
    if (!dados) {
        return contaSessao.resumo();
    }
    let campos = {};
    ['email', 'nome', 'tipo', 'profissao'].forEach((k) => {
        if (dados[k] !== undefined) {
            campos[k] = dados[k];
        }
    });
    if (dados.emailConfirmado !== undefined) {
        campos.emailConfirmado = !!dados.emailConfirmado;
    }
    return contaSessao.resumo(contaSessao.atualizar(campos));
}

// ---------- leitura (síncrona) ----------

contaService.temConta = function () {
    let conta = contaSessao.ler();
    return !!(conta && conta.sessao && conta.sessao.token);
};

/**
 * @return {object|null} {email, nome, tipo, emailConfirmado, aparelhoNome, criancas, entrarDeNovo, listaCriancas}
 *         (sem a sessão)
 */
contaService.getConta = function () {
    return contaSessao.resumo();
};

/**
 * @return {string|null} último estado de sincronização conhecido (o evento pode ter saído antes da tela abrir)
 */
contaService.estadoSincronizacao = function () {
    return contaSessao.getEstadoSincronizacao();
};

// ---------- entrar e sair ----------

contaService.cadastrar = async function ({ email, senha, nome, aparelho } = {}) {
    aparelho = aparelho || contaService.nomeDoAparelho();
    let resposta = await pedir('POST', '/conta/cadastro', {
        email: limparEmail(email),
        senha: senha,
        nome: String(nome || '').trim(),
        tipo: 'familia',
        consentimento: { versao: 1 },
        aparelho: aparelho
    });
    return guardarSessao(resposta, aparelho);
};

contaService.entrar = async function ({ email, senha, aparelho } = {}) {
    aparelho = aparelho || contaService.nomeDoAparelho();
    let resposta = await pedir('POST', '/conta/entrar', { email: limparEmail(email), senha: senha, aparelho: aparelho });
    return guardarSessao(resposta, aparelho);
};

/**
 * Sai da conta neste aparelho. Funciona sem internet. As cópias locais das crianças continuam (só neste aparelho).
 */
contaService.sair = async function () {
    let antes = contaSessao.ler();
    if (antes && antes.sessao && antes.sessao.key) {
        contaSessao.guardarLigacoes(antes.sessao.key, antes.criancas);
    }
    if (contaService.temConta()) {
        try {
            await pedir('POST', '/conta/sair', undefined, comSessao);
        } catch (e) {
            log.info('contaService: could not end session on server', e && e.erro);
        }
    }
    contaSincronizacao.parar();
    contaSessao.apagar();
};

// ---------- e-mail ----------

contaService.confirmarEmail = async function (codigo) {
    let conta = await pedir('POST', '/conta/email/confirmar', { codigo: String(codigo || '').trim() }, comSessao);
    return atualizarDados(conta);
};

contaService.reenviarCodigo = function () {
    return pedir('POST', '/conta/email/reenviar', undefined, comSessao);
};

/**
 * GET /conta: atualiza os dados guardados (ex.: e-mail confirmado em outro aparelho)
 */
contaService.atualizarConta = async function () {
    let conta = await pedir('GET', '/conta', undefined, comSessao);
    return atualizarDados(conta);
};

// ---------- esqueci a senha ----------

contaService.esqueciSenha = function (email) {
    return pedir('POST', '/conta/senha/esqueci', { email: limparEmail(email) });
};

contaService.verificarCodigoSenha = function (email, codigo) {
    return pedir('POST', '/conta/senha/verificar', { email: limparEmail(email), codigo: String(codigo || '').trim() });
};

contaService.novaSenha = async function ({ email, chave, senha, desconectarOutros, aparelho } = {}) {
    aparelho = aparelho || (contaSessao.ler() || {}).aparelhoNome || contaService.nomeDoAparelho();
    let resposta = await pedir('POST', '/conta/senha/nova', {
        email: limparEmail(email),
        chave: chave,
        senha: senha,
        desconectarOutros: !!desconectarOutros,
        aparelho: aparelho
    });
    return guardarSessao(resposta, aparelho);
};

// ---------- trocar senha e e-mail ----------

contaService.trocarSenha = async function ({ senhaAtual, senhaNova, desconectarOutros } = {}) {
    let resposta = await pedir(
        'POST',
        '/conta/senha/trocar',
        { senhaAtual: senhaAtual, senhaNova: senhaNova, desconectarOutros: !!desconectarOutros },
        comSessao
    );
    if (resposta && resposta.sessao) {
        guardarSessao(resposta, (contaSessao.ler() || {}).aparelhoNome);
    }
    return resposta;
};

/**
 * Funciona também antes de confirmar o primeiro e-mail (corrigir erro de digitação logo depois do cadastro).
 */
contaService.trocarEmail = async function ({ emailNovo, senha } = {}) {
    emailNovo = limparEmail(emailNovo);
    let resposta = await pedir('POST', '/conta/email/trocar', { emailNovo: emailNovo, senha: senha }, comSessao);
    contaSessao.atualizar({ emailPendente: emailNovo }, true);
    return resposta;
};

/**
 * O código chegou no e-mail novo, então o e-mail novo fica confirmado (mesmo se a conta ainda não estava).
 */
contaService.confirmarTrocaEmail = async function (codigo) {
    let conta = await pedir('POST', '/conta/email/trocar/confirmar', { codigo: String(codigo || '').trim() }, comSessao);
    let atual = contaSessao.ler();
    let pendente = atual ? atual.emailPendente : undefined;
    if (atual && pendente !== undefined) {
        delete atual.emailPendente;
        contaSessao.gravar(atual, true);
    }
    let dados = Object.assign({}, conta || {});
    dados.email = dados.email || pendente;
    dados.emailConfirmado = true;
    return atualizarDados(dados);
};

// ---------- aparelhos ----------

contaService.listarAparelhos = function () {
    return pedir('GET', '/conta/aparelhos', undefined, comSessao);
};

contaService.desconectarAparelho = function (id) {
    return pedir('DELETE', '/conta/aparelhos/' + encodeURIComponent(id), undefined, comSessao);
};

contaService.nomearAparelho = async function (nome) {
    nome = String(nome || '').trim();
    await pedir('POST', '/conta/aparelho', { nome: nome }, comSessao);
    contaSessao.atualizar({ aparelhoNome: nome });
};

// ---------- crianças ----------

/**
 * @return {Promise<Array>} as crianças da conta, cada uma com `usuarioLocal` e `nesteAparelho` (cópia completa aqui).
 *         Sem internet: rejeita com {erro: "sem_internet", mensagem, criancas: <a última lista guardada>}.
 */
contaService.listarCriancas = async function () {
    let lista;
    try {
        lista = await pedir('GET', '/conta/criancas', undefined, comSessao);
    } catch (e) {
        if (e && e.erro === 'sem_internet') {
            let guardada = (contaSessao.ler() || {}).listaCriancas || [];
            e.criancas = contaCriancasService.completarLista(guardada);
        }
        throw e;
    }
    lista = Array.isArray(lista) ? lista : [];
    contaCriancasService.aplicarLista(lista);
    return contaCriancasService.completarLista(lista);
};

function guardarNaLista(crianca) {
    let conta = contaSessao.ler();
    if (!conta || !crianca) {
        return;
    }
    let lista = (conta.listaCriancas || []).filter((c) => c.banco !== crianca.banco);
    lista.push(crianca);
    contaSessao.atualizar({ listaCriancas: lista }, true);
}

/**
 * cria a criança na conta, o perfil local, abre e liga a sincronização
 * @return {Promise<object>} crianca + {usuarioLocal}
 */
contaService.criarCrianca = async function (nome) {
    let crianca = await pedir('POST', '/conta/criancas', { nome: String(nome || '').trim() }, comSessao);
    guardarNaLista(crianca);
    let usuario = await contaCriancasService.criarPerfilDaCrianca(crianca);
    return Object.assign({}, crianca, { usuarioLocal: usuario, nesteAparelho: true });
};

/**
 * PATCH /conta/criancas/:banco (fora da seção 6; para a tela de editar o nome)
 */
contaService.renomearCrianca = async function (banco, nome) {
    let crianca = await pedir('PATCH', '/conta/criancas/' + encodeURIComponent(banco), { nome: String(nome || '').trim() }, comSessao);
    let ligada = contaSessao.getCrianca(banco);
    if (ligada) {
        contaSessao.guardarCrianca(banco, { nome: crianca.nome });
    }
    guardarNaLista(crianca);
    return crianca;
};

/**
 * Leva um perfil "só neste aparelho" para a conta: cria a criança na conta e envia tudo. A cópia local continua.
 * Se o envio parar no meio, a criança já fica ligada e a sincronização termina sozinha depois; chamar de novo com o
 * mesmo perfil continua o envio (não cria outra criança).
 * @param {function({enviados: number, total: number})} [onProgresso]
 */
contaService.levarParaConta = async function (usuarioLocal, nome, onProgresso) {
    if (!usuarioLocal || !localStorageService.getSavedLocalUsers().includes(usuarioLocal)) {
        throw { erro: 'nao_encontrado', mensagem: 'Esse perfil não está neste aparelho.' };
    }
    let banco = contaSessao.bancoDoUsuario(usuarioLocal);
    let crianca;
    if (banco) {
        crianca = Object.assign({ banco: banco }, contaSessao.getCrianca(banco));
    } else {
        crianca = await pedir('POST', '/conta/criancas', { nome: String(nome || '').trim() }, comSessao);
        guardarNaLista(crianca);
        contaCriancasService.ligarPerfil(crianca.banco, usuarioLocal, crianca);
    }
    await contaCriancasService.enviar(usuarioLocal, crianca.banco, onProgresso);
    return Object.assign({}, crianca, { usuarioLocal: usuarioLocal, nesteAparelho: true });
};

/**
 * Primeira vez num aparelho: baixa a criança da conta para um perfil local novo (não abre).
 * @param {function({recebidos: number, total: number})} [onProgresso]
 * @return {Promise<string>} o usuário local
 */
contaService.baixarCrianca = async function (banco, onProgresso) {
    let conta = contaSessao.ler();
    if (!conta) {
        throw { erro: 'nao_autorizado', mensagem: contaSessao.MENSAGEM_ENTRAR_DE_NOVO };
    }
    let crianca = (conta.listaCriancas || []).find((c) => c.banco === banco) || conta.criancas[banco];
    if (!crianca) {
        let lista = await contaService.listarCriancas();
        crianca = lista.find((c) => c.banco === banco);
    }
    if (!crianca) {
        throw { erro: 'nao_encontrado', mensagem: 'Essa criança não está na conta.' };
    }
    return contaCriancasService.baixar(Object.assign({ banco: banco }, crianca), onProgresso);
};

/**
 * abre a criança (já baixada neste aparelho) e liga a sincronização. Não sai da conta.
 * @return {Promise<string>} o usuário local aberto; rejeita com {erro: "nao_baixada"} se falta baixar
 */
contaService.abrirCrianca = function (banco) {
    return contaCriancasService.abrir(banco);
};

// ---------- dados e conta ----------

contaService.baixarTudo = function () {
    return contaExportService.baixarTudo();
};

/**
 * Apaga a conta e os bancos das crianças no servidor. As cópias neste aparelho continuam, só neste aparelho.
 */
contaService.apagarConta = async function (senha) {
    await pedir('DELETE', '/conta', { senha: senha }, comSessao);
    // os bancos sumiram do servidor: as cópias locais ficam só neste aparelho, sem ligação guardada
    contaSessao.descartarLigacoes(((contaSessao.ler() || {}).sessao || {}).key);
    contaSincronizacao.parar();
    contaSessao.apagar();
};

export { contaService };
