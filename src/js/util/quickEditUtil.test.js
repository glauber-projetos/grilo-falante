import { quickEditUtil } from './quickEditUtil';

jest.mock('../model/GridActionAudio', () => {
    class GridActionAudio {
        constructor(props) {
            Object.assign(this, { id: 'grid-action-audio-' + Math.random(), modelName: 'GridActionAudio' }, props);
        }
        static getModelName() {
            return 'GridActionAudio';
        }
    }
    return { GridActionAudio };
});
jest.mock('../model/GridImage', () => {
    class GridImage {
        constructor(props) {
            Object.assign(this, { modelName: 'GridImage' }, props);
        }
    }
    GridImage.FIT_COVER = 'cover';
    return { GridImage };
});

function element(props = {}) {
    return Object.assign({
        id: 'e1', x: 2, y: 1, width: 1, height: 1,
        label: { pt_BR: 'água', en: 'water' },
        image: { data: null },
        hidden: false,
        actions: [{ modelName: 'GridActionSpeak', id: 'a1' }]
    }, props);
}

test('setLabel changes only the given language and trims', () => {
    let e = quickEditUtil.setLabel(element(), '  suco ', 'pt_BR');
    expect(e.label.pt_BR).toBe('suco');
    expect(e.label.en).toBe('water');
    expect(quickEditUtil.getLabel(e, 'pt_BR')).toBe('suco');
    expect(quickEditUtil.getLabel(e, 'de')).toBe('');
});

test('setPhoto sets the image data and fills the cell', () => {
    let e = quickEditUtil.setPhoto(element(), 'data:image/jpeg;base64,AAA');
    expect(e.image.data).toBe('data:image/jpeg;base64,AAA');
    expect(e.image.fit).toBe('cover');
});

test('setAudio adds one recording and keeps the other actions', () => {
    let e = element();
    quickEditUtil.setAudio(e, { base64: 'AAA', mimeType: 'audio/webm', durationMs: 1200 });
    quickEditUtil.setAudio(e, { base64: 'BBB', mimeType: 'audio/webm', durationMs: 900 });
    let audios = e.actions.filter(a => a.modelName === 'GridActionAudio');
    expect(audios.length).toBe(1);
    expect(audios[0].dataBase64).toBe('BBB');
    expect(audios[0].durationMs).toBe(900);
    expect(e.actions.some(a => a.modelName === 'GridActionSpeak')).toBe(true);
    expect(quickEditUtil.hasAudio(e)).toBe(true);
});

test('removeAudio removes the recording', () => {
    let e = element();
    quickEditUtil.setAudio(e, { base64: 'AAA', mimeType: 'audio/webm' });
    quickEditUtil.removeAudio(e);
    expect(quickEditUtil.hasAudio(e)).toBe(false);
    expect(e.actions.length).toBe(1);
});

test('an empty audio action does not count as recording', () => {
    let e = element({ actions: [{ modelName: 'GridActionAudio', dataBase64: '' }] });
    expect(quickEditUtil.hasAudio(e)).toBe(false);
});

test('setHidden hides and shows without moving the element', () => {
    let e = quickEditUtil.setHidden(element(), true);
    expect(e.hidden).toBe(true);
    expect(e.x).toBe(2);
    expect(e.y).toBe(1);
    quickEditUtil.setHidden(e, false);
    expect(e.hidden).toBe(false);
});

test('replaceElement never changes position or size', () => {
    let grid = { gridElements: [element(), element({ id: 'e2', x: 3 })] };
    let changed = element({ x: 0, y: 0, width: 3, height: 2, hidden: true });
    expect(quickEditUtil.replaceElement(grid, changed)).toBe(true);
    let saved = grid.gridElements[0];
    expect(saved.hidden).toBe(true);
    expect([saved.x, saved.y, saved.width, saved.height]).toEqual([2, 1, 1, 1]);
    expect(grid.gridElements[1].id).toBe('e2');
});

test('replaceElement returns false for unknown elements', () => {
    let grid = { gridElements: [element()] };
    expect(quickEditUtil.replaceElement(grid, element({ id: 'x' }))).toBe(false);
    expect(grid.gridElements.length).toBe(1);
});
