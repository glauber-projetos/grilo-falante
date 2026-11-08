/**
 * Grilo Falante: messages of the account screens that depend on an error code.
 * The server already sends `mensagem` ready for the screen (docs/grilo-design/contas-textos.md, section 5);
 * these are only used when it does not (no internet, server down, or before the server exists).
 */

export const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PADRAO = {
    sem_internet: 'Sem internet agora. Confira a conexão e tente de novo. Suas pranchas no aparelho estão seguras.',
    servidor: 'Não conseguimos falar com o servidor agora. Tente de novo daqui a pouco. Suas pranchas no aparelho estão seguras.',
    nao_autorizado: 'E-mail ou senha errados. Confira e tente de novo.',
    email_em_uso: 'Já existe uma conta com esse e-mail. Toque em "Entrar" para usar essa conta.',
    codigo_errado: 'Esse código está errado ou venceu. Confira ou peça um código novo.',
    codigo_vencido: 'Esse código está errado ou venceu. Confira ou peça um código novo.',
    muitas_tentativas: 'Muitas tentativas. Espere 5 minutos e tente de novo.',
    email_nao_confirmado: 'Falta confirmar o e-mail. Digite o código que mandamos.',
    dados_invalidos: 'Confira os campos marcados.',
    nao_encontrado: 'Não encontramos isso na conta.',
    proibido: 'Esta conta não pode fazer isso.'
};

export const TEXTO_NAO_PRONTO = 'As contas ainda não estão prontas neste app. Por enquanto, use sem conta: depois dá para levar tudo para a conta, sem perder nada.';

/**
 * text for the screen from an error object {erro, mensagem}
 */
export function mensagemDe(e) {
    if (!e) {
        return PADRAO.servidor;
    }
    if (e.erro === 'nao_implementado') {
        return TEXTO_NAO_PRONTO;
    }
    if (e.mensagem) {
        return e.mensagem;
    }
    return PADRAO[e.erro] || PADRAO.servidor;
}

export function textoEmailInvalido() {
    return 'Esse e-mail parece estar errado. Confira se tem o @ e o final, como .com.';
}

export function textoSenhaCurta(senha) {
    let faltam = 8 - String(senha || '').length;
    return 'A senha precisa ter pelo menos 8 letras ou números.' + (faltam > 0 && faltam < 8 ? (faltam === 1 ? ' Falta 1.' : ' Faltam ' + faltam + '.') : '');
}

/**
 * "agora", "há 3 dias", "há 2 meses"
 */
export function haQuanto(ms) {
    if (!ms) {
        return '';
    }
    let s = Math.max(0, (Date.now() - ms) / 1000);
    let min = s / 60, h = min / 60, d = h / 24;
    if (min < 5) return 'agora';
    if (h < 1) return 'há ' + Math.round(min) + ' minutos';
    if (d < 1) return Math.round(h) === 1 ? 'há 1 hora' : 'há ' + Math.round(h) + ' horas';
    if (d < 2) return 'ontem';
    if (d < 14) return 'há ' + Math.round(d) + ' dias';
    if (d < 60) return 'há ' + Math.round(d / 7) + ' semanas';
    if (d < 365) return 'há ' + Math.round(d / 30) + ' meses';
    return Math.round(d / 365) === 1 ? 'há 1 ano' : 'há ' + Math.round(d / 365) + ' anos';
}

/**
 * "Ana", "Ana e Pedro", "Ana, Pedro e Lia"
 */
export function juntarNomes(nomes) {
    nomes = (nomes || []).filter(Boolean);
    if (nomes.length <= 1) {
        return nomes[0] || '';
    }
    return nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1];
}
