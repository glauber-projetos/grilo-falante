/**
 * Grilo Falante: conta da família (contrato em docs/grilo-design/contas-api.md, seção 6).
 *
 * ESBOÇO: as assinaturas já são as finais; os corpos ainda respondem {erro: "nao_implementado"}.
 */

const CHAVE = 'GRILO_CONTA';

function naoImplementado() {
    return Promise.reject({ erro: 'nao_implementado', mensagem: 'Ainda não está pronto.' });
}

function lerConta() {
    try {
        let texto = window.localStorage.getItem(CHAVE);
        return texto ? JSON.parse(texto) : null;
    } catch (e) {
        return null;
    }
}

let contaService = {};

contaService.EVENTO_CONTA_ALTERADA = 'grilo-conta-alterada';
contaService.EVENTO_SINCRONIZACAO = 'grilo-sincronizacao';

contaService.temConta = function () {
    let conta = lerConta();
    return !!(conta && conta.sessao);
};
contaService.getConta = function () {
    return lerConta();
};

contaService.cadastrar = function ({ email, senha, nome, aparelho } = {}) { return naoImplementado(); };
contaService.entrar = function ({ email, senha, aparelho } = {}) { return naoImplementado(); };
contaService.sair = function () { return naoImplementado(); };

contaService.confirmarEmail = function (codigo) { return naoImplementado(); };
contaService.reenviarCodigo = function () { return naoImplementado(); };

contaService.esqueciSenha = function (email) { return naoImplementado(); };
contaService.verificarCodigoSenha = function (email, codigo) { return naoImplementado(); };
contaService.novaSenha = function ({ email, chave, senha, desconectarOutros } = {}) { return naoImplementado(); };

contaService.trocarSenha = function ({ senhaAtual, senhaNova, desconectarOutros } = {}) { return naoImplementado(); };
contaService.trocarEmail = function ({ emailNovo, senha } = {}) { return naoImplementado(); };
contaService.confirmarTrocaEmail = function (codigo) { return naoImplementado(); };

contaService.listarAparelhos = function () { return naoImplementado(); };
contaService.desconectarAparelho = function (id) { return naoImplementado(); };
contaService.nomearAparelho = function (nome) { return naoImplementado(); };

contaService.listarCriancas = function () { return naoImplementado(); };
contaService.criarCrianca = function (nome) { return naoImplementado(); };
contaService.levarParaConta = function (usuarioLocal, nome, onProgresso) { return naoImplementado(); };
contaService.baixarCrianca = function (banco, onProgresso) { return naoImplementado(); };
contaService.abrirCrianca = function (banco) { return naoImplementado(); };

contaService.baixarTudo = function () { return naoImplementado(); };
contaService.apagarConta = function (senha) { return naoImplementado(); };

export { contaService };
