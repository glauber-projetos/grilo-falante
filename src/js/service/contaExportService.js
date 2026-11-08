/**
 * Grilo Falante: "Baixar tudo" da conta.
 *
 * - Uma criança (ou sem conta): o mesmo backup .grd de sempre da criança aberta (dataService.downloadBackupToFile).
 * - Mais de uma criança da conta neste aparelho: um .zip com um .grd por criança. A criança aberta sai pelo caminho
 *   de sempre (dataService.getBackupData); as outras são lidas direto da cópia local (perfis da conta não têm
 *   criptografia), sem trocar a criança que está na tela.
 * Crianças da conta que ainda não foram baixadas neste aparelho ficam de fora (vão em `faltaram`).
 */
import FileSaver from 'file-saver';
import { dataService } from './data/dataService';
import { databaseService } from './data/databaseService';
import { localStorageService } from './data/localStorageService';
import { perfilService } from './perfilService';
import { contaSessao } from './contaSessao';
import { util } from '../util/util';

let contaExportService = {};

function opcoesDoBackup() {
    return {
        exportGlobalGrid: true,
        exportOnlyCurrentLang: false,
        exportDictionaries: true,
        exportUserSettings: true
    };
}

function nomeDoArquivo(texto) {
    let limpo = String(texto || 'crianca')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Za-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return limpo || 'crianca';
}

/**
 * monta o backup (.grd) de um perfil local que não está aberto, lendo o banco do aparelho
 * @return {Promise<{dados: {grids: Array, dictionaries: Array, metadata: object}, naoLidos: number}>}
 */
contaExportService.lerCopiaLocal = async function (usuarioLocal) {
    let PouchDB = window.PouchDB;
    let db = new PouchDB(usuarioLocal);
    let resultado;
    try {
        resultado = await db.allDocs({ include_docs: true });
    } finally {
        try {
            await db.close();
        } catch (e) {
            // nada
        }
    }
    let dados = { grids: [], dictionaries: [], metadata: null };
    let naoLidos = 0;
    for (let linha of resultado.rows || []) {
        let doc = linha.doc;
        if (!doc || doc._deleted || !doc.modelName || !doc.encryptedDataBase64) {
            continue;
        }
        let objeto;
        try {
            objeto = JSON.parse(doc.encryptedDataBase64);
        } catch (e) {
            naoLidos++;
            continue;
        }
        if (objeto && objeto.iv && objeto.ct) {
            naoLidos++; // dado antigo criptografado: só sai pelo caminho de sempre, com a criança aberta
            continue;
        }
        delete objeto._rev;
        if (doc.modelName === 'GridData') {
            dados.grids.push(objeto);
        } else if (doc.modelName === 'Dictionary') {
            dados.dictionaries.push(objeto);
        } else if (doc.modelName === 'MetaData' && !dados.metadata) {
            dados.metadata = objeto;
        }
    }
    dados.metadata = dados.metadata || {};
    return { dados: dados, naoLidos: naoLidos };
};

async function backupDaAberta() {
    let grids = await dataService.getGrids();
    let ids = (grids || []).map((g) => g.id);
    return dataService.getBackupData(ids, opcoesDoBackup());
}

/**
 * @return {Promise<{arquivo: string, criancas: number, faltaram: string[], naoLidos: number}>}
 */
contaExportService.baixarTudo = async function () {
    let conta = contaSessao.ler();
    let aberto = databaseService.getCurrentUsedDatabase();
    let ligadas = conta ? Object.keys(conta.criancas).map((b) => Object.assign({ banco: b }, conta.criancas[b])) : [];
    let aqui = ligadas.filter((c) => c.usuarioLocal && !c.baixando && localStorageService.isDatabaseSynced(c.usuarioLocal));
    let faltaram = ligadas.filter((c) => !aqui.includes(c)).map((c) => c.nome || c.banco);
    if (conta && Array.isArray(conta.listaCriancas)) {
        conta.listaCriancas
            .filter((c) => !conta.criancas[c.banco])
            .forEach((c) => faltaram.push(c.nome || c.banco));
    }

    let usuarios = aqui.map((c) => c.usuarioLocal);
    if (aberto && !usuarios.includes(aberto)) {
        usuarios.unshift(aberto);
    }
    if (usuarios.length === 0) {
        throw { erro: 'nao_encontrado', mensagem: 'Abra o perfil de uma criança para baixar os dados.' };
    }

    if (usuarios.length === 1 && usuarios[0] === aberto) {
        await dataService.downloadBackupToFile();
        return { arquivo: '.grd', criancas: 1, faltaram: faltaram, naoLidos: 0 };
    }

    const JSZip = (await import('jszip')).default;
    let zip = new JSZip();
    let naoLidos = 0;
    let usados = [];
    for (let usuario of usuarios) {
        let dados;
        if (usuario === aberto) {
            dados = await backupDaAberta();
        } else {
            let lido = await contaExportService.lerCopiaLocal(usuario);
            dados = lido.dados;
            naoLidos += lido.naoLidos;
        }
        let perfil = perfilService.getPerfil(usuario);
        let base = nomeDoArquivo((perfil && perfil.nome) || usuario);
        let nome = base;
        for (let n = 2; usados.includes(nome); n++) {
            nome = `${base}-${n}`;
        }
        usados.push(nome);
        zip.file(`${nome}.grd`, JSON.stringify(dados || {}));
    }
    let blob = await zip.generateAsync({ type: 'blob' });
    let arquivo = `grilo-falante-tudo_${util.getCurrentDateTimeString()}.zip`;
    FileSaver.saveAs(blob, arquivo);
    return { arquivo: arquivo, criancas: usuarios.length, faltaram: faltaram, naoLidos: naoLidos };
};

export { contaExportService };
