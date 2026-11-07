import { faixaFrase } from './faixaFrase';

function elem(action, props = {}) {
    return Object.assign({ type: 'ELEMENT_TYPE_NORMAL', label: {}, actions: action ? [action] : [] }, props);
}

const speak = { modelName: 'GridActionCollectElement', action: 'COLLECT_ACTION_SPEAK_CONTINUOUS' };

test('speak button of the global bar becomes "Falar"', () => {
    let visual = faixaFrase.getVisual(elem(speak));
    expect(visual.tipo).toBe(faixaFrase.TIPO_FALAR);
    expect(visual.icone).toBe('volume');
    expect(visual.destaque).toBe(true);
});

test('delete, clear, home and back are recognized', () => {
    expect(faixaFrase.getTipo(elem({ modelName: 'GridActionCollectElement', action: 'COLLECT_ACTION_REMOVE_WORD' }))).toBe(faixaFrase.TIPO_APAGAR);
    expect(faixaFrase.getTipo(elem({ modelName: 'GridActionCollectElement', action: 'COLLECT_ACTION_CLEAR' }))).toBe(faixaFrase.TIPO_LIMPAR);
    expect(faixaFrase.getTipo(elem({ modelName: 'GridActionNavigate', navType: 'navigateToHomeGrid' }))).toBe(faixaFrase.TIPO_INICIO);
    expect(faixaFrase.getTipo(elem({ modelName: 'GridActionNavigate', navType: 'navigateToLastOpenedGrid' }))).toBe(faixaFrase.TIPO_VOLTAR);
});

test('buttons the family changed stay as they are', () => {
    expect(faixaFrase.getTipo(elem(speak, { label: { pt_BR: 'Fala!' } }))).toBe(null);
    expect(faixaFrase.getTipo(elem(speak, { backgroundColor: '#ff0000' }))).toBe(null);
    expect(faixaFrase.getTipo(elem(speak, { actions: [speak, { modelName: 'GridActionSpeak' }] }))).toBe(null);
});

test('normal words and other navigation are no controls', () => {
    expect(faixaFrase.getTipo(elem({ modelName: 'GridActionSpeak' }))).toBe(null);
    expect(faixaFrase.getTipo(elem({ modelName: 'GridActionNavigate', navType: 'navigateToGrid' }))).toBe(null);
    expect(faixaFrase.getTipo(elem(null))).toBe(null);
    expect(faixaFrase.getTipo(elem(speak, { type: 'ELEMENT_TYPE_COLLECT' }))).toBe(null);
    expect(faixaFrase.getTipo(null)).toBe(null);
});

test('empty label texts do not count as own text', () => {
    expect(faixaFrase.getTipo(elem(speak, { label: { pt_BR: '  ', en: '' } }))).toBe(faixaFrase.TIPO_FALAR);
});
