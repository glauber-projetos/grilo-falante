import {
    WORDS, TOPICS, PRIORITY, NEVER_HIDDEN, LAYOUTS, AGE_SUGGESTIONS, SIZE_MEDIUM, AGE_4_6
} from './starterBoardData';

/**
 * Builds the starter board of the setup wizard (Grilo Falante): a main board with core words and
 * folders for 5 topics, each with its own board.
 *
 * AAC rule: every button has a fixed place. Younger children start with some core words hidden;
 * a hidden button keeps its place (the cell stays empty in child mode), so showing it later never
 * moves another button.
 *
 * The model classes are passed in (GridData, GridElement, GridImage, GridActionNavigate), so this
 * module stays independent of the database and easy to test.
 */
let starterBoard = {};

starterBoard.ARASAAC_AUTHOR = 'ARASAAC - CC (BY-NC-SA)';
starterBoard.ARASAAC_LICENSE_URL = 'https://arasaac.org/terms-of-use';

/**
 * returns the suggestions (size, hidden share, child voice) for an age group
 */
starterBoard.getAgeSuggestion = function (ageGroup) {
    return AGE_SUGGESTIONS[ageGroup] || AGE_SUGGESTIONS[AGE_4_6];
};

/**
 * returns the layout (rows of keys) for a size
 */
starterBoard.getLayout = function (size) {
    return LAYOUTS[size] || LAYOUTS[SIZE_MEDIUM];
};

starterBoard.isTopic = function (key) {
    return !!TOPICS[key];
};

/**
 * returns the word keys of a layout that start hidden for the given age group:
 * the words with the lowest priority, never "eu" and never topics (folders).
 * @param size
 * @param ageGroup
 * @return {string[]}
 */
starterBoard.getHiddenKeys = function (size, ageGroup) {
    let share = starterBoard.getAgeSuggestion(ageGroup).hiddenShare || 0;
    let words = starterBoard.getLayout(size).flat().filter((key) => key && !starterBoard.isTopic(key));
    let count = Math.round(words.length * share);
    if (count <= 0) {
        return [];
    }
    let candidates = words
        .filter((key) => !NEVER_HIDDEN.includes(key))
        .sort((a, b) => priorityOf(b) - priorityOf(a));
    return candidates.slice(0, count);
};

/**
 * returns how many buttons are visible on the main board at the start
 */
starterBoard.getVisibleCount = function (size, ageGroup) {
    let all = starterBoard.getLayout(size).flat().filter(Boolean);
    return all.length - starterBoard.getHiddenKeys(size, ageGroup).length;
};

/**
 * builds all grids of the starter board
 * @param options
 * @param options.childName name of the child, used for the board name and the "eu" button (optional)
 * @param options.childPhoto photo of the child (data URL), used for the "eu" button (optional)
 * @param options.ageGroup see starterBoardData AGE_*
 * @param options.size see starterBoardData SIZE_*
 * @param options.lang content language, e.g. "pt_BR"
 * @param options.boardName name of the main board, e.g. "Prancha do Cadu"
 * @param images map key -> {arasaacId, data}, see starterBoardImages.json
 * @param models {GridData, GridElement, GridImage, GridActionNavigate}
 * @return {{grids: Array, mainGrid: Object}}
 */
starterBoard.build = function (options, images, models) {
    let lang = options.lang || 'pt_BR';
    let size = options.size || starterBoard.getAgeSuggestion(options.ageGroup).size;
    let layout = starterBoard.getLayout(size);
    let columns = Math.max(...layout.map((row) => row.length));
    let hiddenKeys = starterBoard.getHiddenKeys(size, options.ageGroup);
    let { GridData, GridElement, GridImage, GridActionNavigate } = models;

    function label(text) {
        let result = {};
        result[lang] = text;
        return result;
    }

    function image(key) {
        let img = images[key];
        if (!img) {
            return new GridImage();
        }
        return new GridImage({
            data: img.data,
            author: starterBoard.ARASAAC_AUTHOR,
            authorURL: starterBoard.ARASAAC_LICENSE_URL
        });
    }

    function wordElement(key, x, y) {
        let word = WORDS[key];
        let props = {
            x: x,
            y: y,
            label: label(word.label),
            image: image(key),
            colorCategory: word.category,
            hidden: hiddenKeys.includes(key)
        };
        if (key === 'eu' && options.childPhoto) {
            props.image = new GridImage({ data: options.childPhoto, fit: GridImage.FIT_COVER });
        }
        return new GridElement(props);
    }

    // topic boards
    let topicGrids = {};
    for (let [topicKey, topic] of Object.entries(TOPICS)) {
        let elements = topic.words.map((key, i) => wordElement(key, i % columns, Math.floor(i / columns)));
        topicGrids[topicKey] = new GridData({
            label: label(topic.label),
            minColumnCount: columns,
            rowCount: Math.ceil(topic.words.length / columns),
            gridElements: elements
        });
    }

    // main board
    let mainElements = [];
    layout.forEach((row, y) => {
        row.forEach((key, x) => {
            if (!key) {
                return;
            }
            if (starterBoard.isTopic(key)) {
                let topic = TOPICS[key];
                mainElements.push(new GridElement({
                    x: x,
                    y: y,
                    label: label(topic.label),
                    image: image(topic.image),
                    actions: [new GridActionNavigate({
                        navType: GridActionNavigate.NAV_TYPES.TO_GRID,
                        toGridId: topicGrids[key].id
                    })]
                }));
            } else {
                mainElements.push(wordElement(key, x, y));
            }
        });
    });
    let boardName = options.boardName || (options.childName ? `Prancha de ${options.childName}` : 'Prancha inicial');
    let mainGrid = new GridData({
        label: label(boardName),
        minColumnCount: columns,
        rowCount: layout.length,
        gridElements: mainElements
    });
    return {
        mainGrid: mainGrid,
        grids: [mainGrid].concat(Object.values(topicGrids))
    };
};

/**
 * returns all image keys used by the starter board (for checking that all pictograms are present)
 */
starterBoard.getAllImageKeys = function () {
    let keys = new Set(Object.keys(WORDS));
    Object.values(TOPICS).forEach((topic) => keys.add(topic.image));
    return Array.from(keys);
};

function priorityOf(key) {
    let index = PRIORITY.indexOf(key);
    return index === -1 ? PRIORITY.length : index;
}

export { starterBoard };
