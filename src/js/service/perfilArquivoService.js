/**
 * Grilo Falante: criar perfil neste aparelho, em um passo.
 *
 * 1. "Abrir perfil de um arquivo": a família escolhe o backup (.grd do Grilo Falante ou o backup completo
 *    do original), o app sugere o nome, cria o usuário offline (sem senha), importa tudo (pranchas, fotos,
 *    frases, palavras e configurações) e entra no perfil.
 * 2. "Nova criança": cria o usuário offline a partir do nome digitado no assistente.
 *
 * O formato do .grd e a importação são os mesmos de sempre (dataService.importBackupData).
 */
import { loginService } from './loginService';
import { dataService } from './data/dataService';
import { databaseService } from './data/databaseService';
import { localStorageService } from './data/localStorageService';
import { fileUtil } from '../util/fileUtil';
import { constants } from '../util/constants';
import $ from '../externals/jquery';
import { perfilService } from './perfilService';
import { sugerirNomeDoArquivo, nomeParaUsuario } from './perfilNomes';

let perfilArquivoService = {};

perfilArquivoService.ERRO_ARQUIVO_VAZIO = 'ERRO_ARQUIVO_VAZIO';
perfilArquivoService.ERRO_ARQUIVO_INVALIDO = 'ERRO_ARQUIVO_INVALIDO';
perfilArquivoService.ERRO_IMPORTAR = 'ERRO_IMPORTAR';

const EXTENSOES = ['.grd', '.obz', '.obf', '.zip', '.json', '.txt'];

perfilArquivoService.EXTENSOES = EXTENSOES;

function erro(codigo, causa) {
    let e = new Error(codigo);
    e.codigo = codigo;
    e.causa = causa;
    return e;
}

/**
 * lê o .grd (aceita arquivo com BOM, salvo pelo Bloco de Notas)
 */
async function lerGrd(file) {
    let texto = await fileUtil.readFileContent(file);
    if (!texto) {
        throw erro(perfilArquivoService.ERRO_ARQUIVO_VAZIO);
    }
    texto = String(texto).replace(/^﻿/, '');
    let dados;
    try {
        dados = JSON.parse(texto);
    } catch (e) {
        throw erro(perfilArquivoService.ERRO_ARQUIVO_INVALIDO, e);
    }
    let ehLista = Array.isArray(dados) && dados.length > 0;
    let ehPrancha = dados && !Array.isArray(dados) && dados.id && dados.gridElements;
    let ehBackup = dados && !Array.isArray(dados) && (dados.grids || dados.metadata || dados.dictionaries);
    if (!ehLista && !ehPrancha && !ehBackup) {
        throw erro(perfilArquivoService.ERRO_ARQUIVO_INVALIDO);
    }
    return dataService.normalizeImportData(dados);
}

/**
 * Lê o arquivo escolhido e prepara a importação, sem criar nada ainda.
 * @param {File} file
 * @return {Promise<{file: File, dados: object, nomeSugerido: string, pranchas: number, frases: number}>}
 * @throws Error com .codigo = ERRO_ARQUIVO_VAZIO | ERRO_ARQUIVO_INVALIDO
 */
perfilArquivoService.prepararArquivo = async function (file) {
    if (!file) {
        throw erro(perfilArquivoService.ERRO_ARQUIVO_VAZIO);
    }
    let dados;
    if (fileUtil.isGrdFile(file) || /\.json$/i.test(file.name || '')) {
        dados = await lerGrd(file);
    } else {
        try {
            dados = await dataService.convertFileToImportData(file);
        } catch (e) {
            throw erro(perfilArquivoService.ERRO_ARQUIVO_INVALIDO, e);
        }
    }
    let pranchas = dados && dados.grids ? dados.grids.length : 0;
    if (!dados || (!pranchas && !(dados.dictionaries || []).length)) {
        throw erro(perfilArquivoService.ERRO_ARQUIVO_INVALIDO);
    }
    let frases = dados.metadata && Array.isArray(dados.metadata.phraseHistory) ? dados.metadata.phraseHistory.length : 0;
    return {
        file: file,
        dados: dados,
        nomeSugerido: sugerirNomeDoArquivo(file.name),
        pranchas: pranchas,
        frases: frases
    };
};

/**
 * Cria um usuário offline novo (sem senha) e entra nele. O banco já está pronto quando a promessa resolve.
 * @param {string} nome nome da criança, como a família escreveu
 * @param {{foto?: string|null}} [opcoes]
 * @return {Promise<string>} o usuário criado
 */
perfilArquivoService.criarPerfil = async function (nome, opcoes = {}) {
    let existentes = localStorageService.getSavedUsers();
    let atual = loginService.getLoggedInUsername();
    if (atual) {
        existentes = existentes.concat([atual]);
    }
    let usuario = nomeParaUsuario(nome, existentes);
    await loginService.registerOffline(usuario, usuario);
    let foto = opcoes.foto ? await perfilService.miniatura(opcoes.foto) : null;
    perfilService.salvarPerfil(usuario, { nome: nome || '', foto: foto });
    return usuario;
};

/**
 * Desfaz um perfil que não terminou de ser criado (ex.: a importação falhou).
 */
perfilArquivoService.desfazerPerfil = async function (usuario) {
    if (!usuario) {
        return;
    }
    try {
        if (loginService.getLoggedInUsername() === usuario || databaseService.getCurrentUsedDatabase() === usuario) {
            loginService.logout();
        }
        localStorageService.removeLocalUser(usuario);
        perfilService.removerPerfil(usuario);
        await databaseService.deleteDatabase(usuario);
    } catch (e) {
        log.warn('perfilArquivoService: could not undo profile', e);
    }
};

/**
 * Cria o perfil e importa o arquivo preparado, num passo só.
 * @param {object} preparado resultado de prepararArquivo()
 * @param {string} nome nome da criança
 * @param {function(number)} [progresso] recebe a porcentagem (0 a 100)
 * @return {Promise<string>} o usuário criado (já aberto)
 * @throws Error com .codigo = ERRO_IMPORTAR (o perfil incompleto é apagado)
 */
perfilArquivoService.criarPerfilDoArquivo = async function (preparado, nome, progresso) {
    progresso = progresso || (() => {});
    progresso(5);
    let usuario = await perfilArquivoService.criarPerfil(nome);
    progresso(15);
    try {
        await dataService.importBackupData(preparado.dados, {
            skipDelete: true,
            filename: preparado.file && preparado.file.name ? preparado.file.name : '',
            generateGlobalGrid: fileUtil.isObzFile(preparado.file),
            progressFn: (p) => progresso(Math.round(15 + (Math.min(100, Math.max(0, p)) * 0.85)))
        });
    } catch (e) {
        log.warn('perfilArquivoService: import failed', e);
        await perfilArquivoService.desfazerPerfil(usuario);
        throw erro(perfilArquivoService.ERRO_IMPORTAR, e);
    }
    progresso(100);
    return usuario;
};

/**
 * Entra num perfil guardado neste aparelho (sem ir para outra tela).
 */
perfilArquivoService.entrar = function (usuario) {
    return loginService.loginStoredUser(usuario, true);
};

/**
 * Apaga um perfil deste aparelho (usuário offline e banco).
 * Para contas online, só esquece a conta neste aparelho; os dados no servidor continuam.
 */
perfilArquivoService.removerDoAparelho = async function (usuario) {
    if (!usuario) {
        return;
    }
    let configuracoes = localStorageService.getUserSettings(usuario);
    if (loginService.getLoggedInUsername() === usuario) {
        loginService.logout();
    }
    localStorageService.removeLocalUser(usuario);
    perfilService.removerPerfil(usuario);
    await databaseService.deleteDatabase(usuario);
    $(document).trigger(constants.EVENT_USER_DELETED, [usuario, configuracoes]);
};

export { perfilArquivoService };
