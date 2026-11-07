/**
 * Grilo Falante: nomes dos perfis guardados neste aparelho.
 * Funções puras (sem banco, sem tela), usadas pela Entrada e testadas com Jest.
 *
 * - O "nome" é o que a família vê ("Cadu", "Maria Clara").
 * - O "usuário" é o identificador interno do perfil offline, no formato exigido pelo app
 *   (constants.USERNAME_REGEX: 3 a 16 caracteres, minúsculas, números, "-" e "_").
 */

const USUARIO_REGEX = /^[a-z0-9][a-z0-9_-]{2,15}$/;
const USUARIO_MAX = 16;
const USUARIO_PADRAO = 'crianca';

// usuários técnicos que não são nome de criança
const USUARIOS_SEM_NOME = ['default-user', 'default', 'local', 'user', 'usuario', 'teste-automatico'];

// sufixos que os backups recebem ao serem salvos (Grilo Falante e o original)
const SUFIXOS_BACKUP = [
    /[_\s.-]*grilo[_\s-]*falante[_\s-]*backup[_\s-]*completo.*$/i,
    /[_\s.-]*grilo[_\s-]*falante.*$/i,
    /[_\s.-]*asterics[_\s-]*(aac|grid)?[_\s-]*(full[_\s-]*)?backup.*$/i,
    /[_\s.-]*asterics.*$/i,
    /[_\s.-]*(full[_\s-]*)?backup.*$/i,
    /[_\s.-]*copia[_\s-]*de[_\s-]*seguranca.*$/i
];

const DATA_HORA = /\d{4}[-_.]?\d{2}[-_.]?\d{2}([_\sT-]+\d{2}[-_:h]?\d{2}([-_:]?\d{2})?)?/g;
const SO_NUMEROS = /^[\d\s_.-]*$/;

function semAcentos(texto) {
    return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * "maria clara" -> "Maria Clara"
 */
function capitalizar(texto) {
    return String(texto || '')
        .toLocaleLowerCase('pt-BR')
        .replace(/(^|\s)(\S)/g, (m, espaco, letra) => espaco + letra.toLocaleUpperCase('pt-BR'));
}

/**
 * Sugere o nome da criança a partir do nome do arquivo de backup.
 * Exemplos:
 *   "cadu-grilo-falante-2026-11-07.grd"                       -> "Cadu"
 *   "cadu_2026-11-07_14-30_grilo-falante-backup-completo.grd" -> "Cadu"
 *   "maria_2025-02-01_10-12_asterics-aac-full-backup.grd"     -> "Maria"
 *   "default-user_2025-02-01_10-12_asterics-grid-full-backup.grd" -> ""
 * @param {string} nomeArquivo
 * @return {string} nome sugerido ou "" quando não dá para saber
 */
function sugerirNomeDoArquivo(nomeArquivo) {
    let base = String(nomeArquivo || '').split(/[\\/]/).pop();
    base = base.replace(/\.(grd|obz|obf|json)$/i, '');
    base = base.replace(/\s*\(\d+\)$/, ''); // "cadu (1).grd", cópia baixada de novo
    for (let sufixo of SUFIXOS_BACKUP) {
        base = base.replace(sufixo, '');
    }
    base = base.replace(DATA_HORA, ' ');
    // no formato "usuario_data_tipo" o nome é a primeira parte
    let partes = base.split('_').map((p) => p.trim()).filter((p) => p && !SO_NUMEROS.test(p));
    if (!partes.length) {
        return '';
    }
    let nome = partes[0].replace(/[-.]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!nome || SO_NUMEROS.test(nome) || USUARIOS_SEM_NOME.includes(nome.toLowerCase().replace(/\s/g, '-'))) {
        return '';
    }
    if (nome.toLowerCase() === 'default') {
        return '';
    }
    return capitalizar(nome).slice(0, 40);
}

/**
 * Gera um usuário offline válido e ainda livre a partir do nome da criança.
 *   "Cadu" -> "cadu"; "Zé" -> "ze-1"; "Maria Clara" -> "maria-clara"; "Cadu" (já existe) -> "cadu-2"
 * @param {string} nome
 * @param {string[]} existentes usuários já guardados neste aparelho
 * @return {string}
 */
function nomeParaUsuario(nome, existentes = []) {
    let usados = (existentes || []).map((u) => String(u).toLowerCase());
    let base = semAcentos(nome)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^[-_]+|[-_]+$/g, '')
        .slice(0, USUARIO_MAX)
        .replace(/[-_]+$/g, '');
    if (!base) {
        base = USUARIO_PADRAO;
    }
    if (USUARIOS_SEM_NOME.includes(base) || base.startsWith('default-') || base === 'local-demo-user') {
        base = USUARIO_PADRAO;
    }
    let comNumero = (n) => {
        let fim = '-' + n;
        return base.slice(0, USUARIO_MAX - fim.length).replace(/[-_]+$/g, '') + fim;
    };
    // nomes curtos ("Zé") ganham número já na primeira vez: "ze-1"
    let n = base.length < 3 ? 1 : 0;
    let candidato = n ? comNumero(n) : base;
    while (!USUARIO_REGEX.test(candidato) || usados.includes(candidato)) {
        n = Math.max(2, n + 1);
        if (n > 999) {
            return USUARIO_PADRAO + '-' + Date.now().toString(36).slice(-6);
        }
        candidato = comNumero(n);
    }
    return candidato;
}

/**
 * Nome que aparece no cartão do perfil.
 * @param {string} usuario
 * @param {{nome?: string}} [perfil] dados guardados pela Entrada
 * @param {string} [semNome] texto para perfis sem nome (ex.: "Criança")
 */
function nomeExibicao(usuario, perfil, semNome = '') {
    if (perfil && perfil.nome && String(perfil.nome).trim()) {
        return String(perfil.nome).trim();
    }
    if (!usuario || USUARIOS_SEM_NOME.includes(usuario)) {
        return semNome;
    }
    return capitalizar(String(usuario).replace(/[-_]+\d*$/, '').replace(/[-_]+/g, ' ').trim()) || semNome;
}

/**
 * Primeira letra para o avatar sem foto.
 */
function inicial(nome) {
    let letra = String(nome || '').trim().charAt(0);
    return letra ? letra.toLocaleUpperCase('pt-BR') : '?';
}

// cores de avatar (todas com contraste AA para texto branco)
const CORES_AVATAR = ['#3f8a2a', '#c94a2c', '#12406e', '#3e2a85', '#7a3410', '#2f6b1f', '#9c3d6b', '#0f5c5a'];

/**
 * Cor fixa por perfil (o mesmo usuário tem sempre a mesma cor).
 */
function corDoPerfil(usuario) {
    let s = String(usuario || '');
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return CORES_AVATAR[h % CORES_AVATAR.length];
}

export { sugerirNomeDoArquivo, nomeParaUsuario, nomeExibicao, inicial, corDoPerfil, capitalizar, CORES_AVATAR, USUARIO_REGEX };
