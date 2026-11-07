import { starterBoard } from './starterBoard';
import { WORDS, TOPICS, LAYOUTS, AGE_2_3, AGE_4_6, AGE_7_10, AGE_11, SIZE_LARGE, SIZE_MEDIUM, SIZE_SMALL } from './starterBoardData';
import images from './starterBoardImages.json';

let idCounter = 0;
class GridImage {
    constructor(p = {}) { Object.assign(this, p); }
}
GridImage.FIT_COVER = 'cover';
class GridElement {
    constructor(p = {}) { Object.assign(this, { id: 'el-' + (++idCounter), hidden: false, actions: [{ modelName: 'GridActionSpeak' }] }, p); }
}
class GridData {
    constructor(p = {}) { Object.assign(this, { id: 'grid-' + (++idCounter) }, p); }
}
class GridActionNavigate {
    constructor(p = {}) { Object.assign(this, { modelName: 'GridActionNavigate' }, p); }
}
GridActionNavigate.NAV_TYPES = { TO_GRID: 'navigateToGrid' };
const models = { GridData, GridElement, GridImage, GridActionNavigate };

function build(opts) {
    return starterBoard.build(Object.assign({ lang: 'pt_BR' }, opts), images, models);
}

test('every word and topic has a pictogram stored in the app', () => {
    for (let key of starterBoard.getAllImageKeys()) {
        expect(images[key]).toBeDefined();
        expect(images[key].data.startsWith('data:image/png;base64,')).toBe(true);
    }
});

test('every key in the layouts is a known word or topic, and no place is used twice', () => {
    for (let [size, layout] of Object.entries(LAYOUTS)) {
        let keys = layout.flat();
        expect(new Set(keys).size).toBe(keys.length);
        keys.forEach((key) => expect(WORDS[key] || TOPICS[key]).toBeTruthy());
        // all 5 topics are on every main board
        Object.keys(TOPICS).forEach((t) => expect(keys).toContain(t));
    }
});

test('sizes have 12, 20 and 30 buttons', () => {
    expect(LAYOUTS[SIZE_LARGE].flat().length).toBe(12);
    expect(LAYOUTS[SIZE_MEDIUM].flat().length).toBe(20);
    expect(LAYOUTS[SIZE_SMALL].flat().length).toBe(30);
});

test('younger children start with fewer words, "eu" and folders are never hidden', () => {
    let hiddenSmallKids = starterBoard.getHiddenKeys(SIZE_LARGE, AGE_2_3);
    expect(hiddenSmallKids.length).toBe(2);
    let hiddenMedium = starterBoard.getHiddenKeys(SIZE_MEDIUM, AGE_4_6);
    expect(hiddenMedium.length).toBe(3);
    expect(starterBoard.getHiddenKeys(SIZE_MEDIUM, AGE_7_10)).toEqual([]);
    expect(starterBoard.getHiddenKeys(SIZE_SMALL, AGE_11)).toEqual([]);
    for (let key of hiddenSmallKids.concat(hiddenMedium)) {
        expect(key).not.toBe('eu');
        expect(starterBoard.isTopic(key)).toBe(false);
    }
    // the most important words stay visible
    expect(hiddenMedium).not.toContain('quero');
    expect(hiddenMedium).not.toContain('acabou');
    expect(starterBoard.getVisibleCount(SIZE_MEDIUM, AGE_4_6)).toBe(17);
});

test('main board: fixed positions from the layout, hidden words keep their place', () => {
    let result = build({ size: SIZE_MEDIUM, ageGroup: AGE_4_6, childName: 'Cadu' });
    let main = result.mainGrid;
    expect(main.label.pt_BR).toBe('Prancha de Cadu');
    expect(main.minColumnCount).toBe(5);
    expect(main.rowCount).toBe(4);
    expect(main.gridElements.length).toBe(20);
    LAYOUTS[SIZE_MEDIUM].forEach((row, y) => row.forEach((key, x) => {
        let elem = main.gridElements.find((e) => e.x === x && e.y === y);
        expect(elem).toBeDefined();
    }));
    let hidden = main.gridElements.filter((e) => e.hidden);
    expect(hidden.length).toBe(3);
    // building again with an older age shows the same words at the same places
    let older = build({ size: SIZE_MEDIUM, ageGroup: AGE_7_10 }).mainGrid;
    let pos = (g) => g.gridElements.map((e) => `${e.label.pt_BR}@${e.x},${e.y}`).sort();
    expect(pos(older)).toEqual(pos(main));
    expect(older.gridElements.filter((e) => e.hidden).length).toBe(0);
});

test('folders open their topic board and don\'t speak', () => {
    let result = build({ size: SIZE_LARGE, ageGroup: AGE_2_3 });
    expect(result.grids.length).toBe(6);
    let folders = result.mainGrid.gridElements.filter((e) => e.actions.some((a) => a.modelName === 'GridActionNavigate'));
    expect(folders.length).toBe(5);
    for (let folder of folders) {
        expect(folder.actions.length).toBe(1);
        let target = result.grids.find((g) => g.id === folder.actions[0].toGridId);
        expect(target).toBeDefined();
        expect(target.minColumnCount).toBe(4);
        expect(target.gridElements.every((e) => e.x < 4)).toBe(true);
    }
});

test('the photo of the child is used for "eu", pictograms carry the ARASAAC credit', () => {
    let result = build({ size: SIZE_SMALL, ageGroup: AGE_11, childPhoto: 'data:image/jpeg;base64,FOTO' });
    let eu = result.mainGrid.gridElements.find((e) => e.label.pt_BR === 'eu');
    expect(eu.image.data).toBe('data:image/jpeg;base64,FOTO');
    expect(eu.image.fit).toBe('cover');
    let quero = result.mainGrid.gridElements.find((e) => e.label.pt_BR === 'quero');
    expect(quero.image.author).toContain('ARASAAC');
    expect(quero.image.data.startsWith('data:image/png')).toBe(true);
    expect(quero.colorCategory).toBe('CC_VERB');
});

test('without name the board gets a neutral name', () => {
    expect(build({ size: SIZE_MEDIUM }).mainGrid.label.pt_BR).toBe('Prancha inicial');
});
