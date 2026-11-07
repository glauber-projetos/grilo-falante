/**
 * Phrase bar controls (Grilo Falante).
 *
 * The buttons around the phrase bar (speak, delete last word, clear, home, back) are normal grid elements
 * with a single action. If the family did not give them an own text or color, the board draws them in the
 * new style: a Tabler icon and a short word ("Falar" in coral). Nothing in the data changes: position,
 * size, actions and image stay exactly as they are.
 */
let faixaFrase = {};

// model names / values, see GridActionCollectElement and GridActionNavigate
const COLLECT = 'GridActionCollectElement';
const NAVIGATE = 'GridActionNavigate';

faixaFrase.TIPO_FALAR = 'falar';
faixaFrase.TIPO_APAGAR = 'apagar';
faixaFrase.TIPO_APAGAR_LETRA = 'apagarLetra';
faixaFrase.TIPO_LIMPAR = 'limpar';
faixaFrase.TIPO_INICIO = 'inicio';
faixaFrase.TIPO_VOLTAR = 'voltar';
faixaFrase.TIPO_FRASES = 'frases';

const COLLECT_TYPES = {
    COLLECT_ACTION_SPEAK: faixaFrase.TIPO_FALAR,
    COLLECT_ACTION_SPEAK_CONTINUOUS: faixaFrase.TIPO_FALAR,
    COLLECT_ACTION_SPEAK_CLEAR: faixaFrase.TIPO_FALAR,
    COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR: faixaFrase.TIPO_FALAR,
    COLLECT_ACTION_REMOVE_WORD: faixaFrase.TIPO_APAGAR,
    COLLECT_ACTION_REMOVE_CHAR: faixaFrase.TIPO_APAGAR_LETRA,
    COLLECT_ACTION_CLEAR: faixaFrase.TIPO_LIMPAR,
    COLLECT_ACTION_PHRASE_HISTORY: faixaFrase.TIPO_FRASES
};

const NAV_TYPES = {
    navigateToHomeGrid: faixaFrase.TIPO_INICIO,
    navigateToLastOpenedGrid: faixaFrase.TIPO_VOLTAR
};

const VISUAL = {};
VISUAL[faixaFrase.TIPO_FALAR] = { icone: 'volume', texto: 'pranchaFalar', destaque: true };
VISUAL[faixaFrase.TIPO_APAGAR] = { icone: 'backspace', texto: 'pranchaApagar' };
VISUAL[faixaFrase.TIPO_APAGAR_LETRA] = { icone: 'letter-x', texto: 'pranchaApagarLetra' };
VISUAL[faixaFrase.TIPO_LIMPAR] = { icone: 'trash', texto: 'pranchaLimpar' };
VISUAL[faixaFrase.TIPO_INICIO] = { icone: 'home', texto: 'pranchaPranchaInicial' };
VISUAL[faixaFrase.TIPO_VOLTAR] = { icone: 'arrow-back-up', texto: 'pranchaVoltar' };
VISUAL[faixaFrase.TIPO_FRASES] = { icone: 'star', texto: 'pranchaFrases' };

function hasOwnText(element) {
    let label = element.label;
    if (!label) {
        return false;
    }
    if (typeof label === 'string') {
        return !!label.trim();
    }
    return Object.values(label).some((text) => typeof text === 'string' && !!text.trim());
}

/**
 * returns the type of phrase bar control of the element, or null if it is a normal button
 * (or if the family gave it an own text or color, then it stays as the family made it)
 * @param element grid element (plain object or model)
 * @return {string|null} one of faixaFrase.TIPO_*
 */
faixaFrase.getTipo = function (element) {
    if (!element || (element.type && element.type !== 'ELEMENT_TYPE_NORMAL')) {
        return null;
    }
    let actions = element.actions || [];
    if (actions.length !== 1 || hasOwnText(element) || element.backgroundColor) {
        return null;
    }
    let action = actions[0];
    if (action.modelName === COLLECT) {
        return COLLECT_TYPES[action.action] || null;
    }
    if (action.modelName === NAVIGATE) {
        return NAV_TYPES[action.navType] || null;
    }
    return null;
};

/**
 * returns how the control is drawn: {tipo, icone, texto (i18n key), destaque} or null
 */
faixaFrase.getVisual = function (element) {
    let tipo = faixaFrase.getTipo(element);
    return tipo ? Object.assign({ tipo: tipo }, VISUAL[tipo]) : null;
};

export { faixaFrase };
