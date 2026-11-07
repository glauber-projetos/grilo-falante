/**
 * Grilo Falante: rosto e nome de cada perfil guardado neste aparelho.
 *
 * Os dados das pranchas ficam no banco de cada usuário (só abre depois de entrar). Para a tela
 * "Quem vai falar hoje?" mostrar o nome e a foto ANTES de entrar, a Entrada guarda um resumo
 * pequeno no localStorage, numa chave própria (não mexe em AG_USER_SETTINGS):
 *   GRILO_PERFIS = { "<usuario>": { nome: "Cadu", foto: "data:image/jpeg;base64,...", criadoEm: 1730000000000 } }
 * A foto é uma miniatura (até ~160 px) para não ocupar espaço.
 */
import { nomeExibicao, inicial, corDoPerfil } from './perfilNomes';
import $ from '../externals/jquery';

// mesmo valor de MainVue.EVENT_PERFIL_ALTERADO: o topo e o Início atualizam nome e foto
const EVENT_PERFIL_ALTERADO = 'grilo-perfil-alterado';

function avisar() {
    try {
        $(document).trigger(EVENT_PERFIL_ALTERADO);
    } catch (e) {
        // sem jQuery (testes): nada a avisar
    }
}

const CHAVE = 'GRILO_PERFIS';
const FOTO_LADO = 160;

let perfilService = {};

function ler() {
    try {
        let texto = window.localStorage.getItem(CHAVE);
        let dados = texto ? JSON.parse(texto) : {};
        return dados && typeof dados === 'object' ? dados : {};
    } catch (e) {
        return {};
    }
}

function gravar(dados) {
    try {
        window.localStorage.setItem(CHAVE, JSON.stringify(dados));
        return true;
    } catch (e) {
        // localStorage cheio: tenta de novo sem as fotos deste perfil
        return false;
    }
}

/**
 * @param {string} usuario
 * @return {{nome?: string, foto?: string, criadoEm?: number}|null}
 */
perfilService.getPerfil = function (usuario) {
    return ler()[usuario] || null;
};

/**
 * guarda (ou atualiza) nome e foto de um perfil
 * @param {string} usuario
 * @param {{nome?: string, foto?: string|null}} dados
 */
perfilService.salvarPerfil = function (usuario, dados = {}) {
    if (!usuario) {
        return;
    }
    let todos = ler();
    let atual = todos[usuario] || { criadoEm: Date.now() };
    if (dados.nome !== undefined) {
        atual.nome = String(dados.nome || '').trim().slice(0, 40);
    }
    if (dados.foto !== undefined) {
        atual.foto = dados.foto || null;
    }
    todos[usuario] = atual;
    if (!gravar(todos) && atual.foto) {
        atual.foto = null;
        gravar(todos);
    }
    avisar();
};

perfilService.removerPerfil = function (usuario) {
    let todos = ler();
    if (todos[usuario]) {
        delete todos[usuario];
        gravar(todos);
        avisar();
    }
};

/**
 * Monta o que o cartão do perfil precisa.
 * @param {string} usuario
 * @param {string} semNome texto para perfis sem nome
 * @return {{usuario: string, nome: string, foto: string|null, inicial: string, cor: string}}
 */
perfilService.cartao = function (usuario, semNome) {
    let perfil = perfilService.getPerfil(usuario);
    let nome = nomeExibicao(usuario, perfil, semNome);
    return {
        usuario: usuario,
        nome: nome,
        foto: perfil && perfil.foto ? perfil.foto : null,
        inicial: inicial(nome),
        cor: corDoPerfil(usuario)
    };
};

/**
 * Reduz uma foto (data URL) para miniatura quadrada, para o avatar.
 * @param {string} dataUrl
 * @return {Promise<string|null>}
 */
perfilService.miniatura = function (dataUrl) {
    if (!dataUrl || typeof document === 'undefined') {
        return Promise.resolve(null);
    }
    return new Promise((resolve) => {
        let img = new Image();
        img.onload = () => {
            try {
                let lado = Math.min(img.naturalWidth, img.naturalHeight);
                let canvas = document.createElement('canvas');
                canvas.width = FOTO_LADO;
                canvas.height = FOTO_LADO;
                let ctx = canvas.getContext('2d');
                ctx.drawImage(img, (img.naturalWidth - lado) / 2, (img.naturalHeight - lado) / 2, lado, lado, 0, 0, FOTO_LADO, FOTO_LADO);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            } catch (e) {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
    });
};

export { perfilService };
