/**
 * Grilo Falante: contas antigas (login do AsTeRICS / superlogin, com senha guardada no aparelho).
 *
 * "Guardar só neste aparelho": copia tudo da conta antiga (a cópia que já está no aparelho) para um perfil
 * LOCAL novo (sem senha, sem criptografia). Não usa a internet, não fala com o servidor antigo e não apaga
 * a conta antiga: ela continua no aparelho até a família escolher removê-la.
 * Depois, o perfil novo pode ir para a conta da família com contaService.levarParaConta().
 */
import { loginService } from './loginService';
import { perfilArquivoService } from './perfilArquivoService';
import { perfilService } from './perfilService';
import { dataService } from './data/dataService';
import { databaseService } from './data/databaseService';
import { localStorageService } from './data/localStorageService';

let migracaoContaAntiga = {};

/**
 * @return {Array<{usuario: string, nome: string, completa: boolean}>} contas antigas guardadas neste aparelho.
 *         `completa` = a cópia no aparelho está inteira (só essas podem ser guardadas sem internet).
 */
migracaoContaAntiga.listar = function () {
    return (localStorageService.getSavedOnlineUsers() || []).map((usuario) => {
        let perfil = perfilService.getPerfil(usuario);
        return {
            usuario: usuario,
            nome: (perfil && perfil.nome) || usuario,
            completa: localStorageService.isDatabaseSynced(usuario)
        };
    });
};

migracaoContaAntiga.temContaAntiga = function () {
    return migracaoContaAntiga.listar().length > 0;
};

/**
 * Copia a conta antiga para um perfil local novo e abre o perfil novo.
 * @param {string} usuarioAntigo
 * @param {string} [nome] nome da criança no perfil novo (padrão: o nome da conta antiga)
 * @param {function(number)} [onProgresso] porcentagem 0 a 100
 * @return {Promise<string>} o usuário local novo (já aberto)
 *         rejeita com {erro: "nao_encontrado"} (não é uma conta antiga deste aparelho) ou
 *         {erro: "incompleta"} (a cópia no aparelho não está inteira: entre uma vez com internet)
 */
migracaoContaAntiga.guardarSoNesteAparelho = async function (usuarioAntigo, nome, onProgresso) {
    onProgresso = onProgresso || (() => {});
    let antigas = localStorageService.getSavedOnlineUsers() || [];
    if (!usuarioAntigo || !antigas.includes(usuarioAntigo)) {
        throw { erro: 'nao_encontrado', mensagem: 'Essa conta não está guardada neste aparelho.' };
    }
    if (!localStorageService.isDatabaseSynced(usuarioAntigo)) {
        throw {
            erro: 'incompleta',
            mensagem: 'As pranchas dessa conta ainda não estão todas neste aparelho. Entre uma vez com internet e tente de novo.'
        };
    }
    let configuracoes = localStorageService.getUserSettings(usuarioAntigo);
    let senhaGuardada = configuracoes.password;
    let perfilAntigo = perfilService.getPerfil(usuarioAntigo) || {};
    nome = nome || perfilAntigo.nome || usuarioAntigo;

    // 1. abre a cópia antiga só no aparelho (sem servidor, sem superlogin) e lê tudo
    onProgresso(5);
    loginService.fecharPerfil();
    localStorageService.setAutologinUser(usuarioAntigo);
    await databaseService.initForUser(usuarioAntigo, senhaGuardada);
    let grids = await dataService.getGrids();
    let dados = await dataService.getBackupData(
        (grids || []).map((g) => g.id),
        { exportGlobalGrid: true, exportOnlyCurrentLang: false, exportDictionaries: true, exportUserSettings: true }
    );
    onProgresso(30);

    // 2. perfil local novo com o mesmo conteúdo
    let usuario = await perfilArquivoService.criarPerfil(nome);
    try {
        if (dados) {
            await dataService.importBackupData(dados, {
                skipDelete: true,
                progressFn: (p) => onProgresso(Math.round(30 + Math.min(100, Math.max(0, p)) * 0.65))
            });
        }
    } catch (e) {
        log.warn('migracaoContaAntiga: import failed', e);
        await perfilArquivoService.desfazerPerfil(usuario);
        throw { erro: 'servidor', mensagem: 'Não conseguimos copiar as pranchas. Nada foi apagado. Tente de novo.' };
    }

    // 3. ajustes locais (voz, idioma...) e foto vão junto; a senha e o nome de usuário não
    let copia = JSON.parse(JSON.stringify(configuracoes || {}));
    delete copia.password;
    delete copia.username;
    localStorageService.saveUserSettings(copia, usuario);
    if (perfilAntigo.foto) {
        perfilService.salvarPerfil(usuario, { foto: perfilAntigo.foto });
    }
    onProgresso(100);
    return usuario;
};

export { migracaoContaAntiga };
