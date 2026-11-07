import { dataService } from './data/dataService';

/**
 * History of spoken sentences and favorite sentences of the current user (child).
 *
 * Every sentence spoken from the sentence bar (collect element) is remembered. Sentences can be marked as
 * favorite, so the child can say "I want water" or "I'm in pain" again with one touch.
 *
 * Stored in MetaData.phraseHistory (user's database, synced to all devices).
 * Only references (element IDs) and texts are stored, not the images, to keep the database small.
 *
 * Entry: {text, items: [{id, text, onlyText}], count, lastUsed, favorite}
 */
let phraseHistoryService = {};

phraseHistoryService.MAX_RECENT = 30; // non-favorite entries kept
phraseHistoryService.MAX_FAVORITES = 60;

let _saveQueue = Promise.resolve();

function normalizeText(text) {
    return (text || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * runs the given modifier function on the history and saves it, sequentially (no lost updates)
 * @param modifyFn function(historyArray) => modified historyArray
 */
function modifyHistory(modifyFn) {
    _saveQueue = _saveQueue.then(async () => {
        let metadata = await dataService.getMetadata();
        if (!metadata) {
            return;
        }
        let history = JSON.parse(JSON.stringify(metadata.phraseHistory || []));
        history = modifyFn(history) || history;
        let favorites = history.filter(e => e.favorite).slice(0, phraseHistoryService.MAX_FAVORITES);
        let recent = history.filter(e => !e.favorite)
            .sort((a, b) => b.lastUsed - a.lastUsed)
            .slice(0, phraseHistoryService.MAX_RECENT);
        metadata.phraseHistory = favorites.concat(recent);
        await dataService.saveMetadata(metadata);
    }).catch(e => {
        log.warn('could not save phrase history', e);
    });
    return _saveQueue;
}

/**
 * remembers a spoken sentence
 * @param items array of {id, text, onlyText} of the elements in the sentence bar
 * @param text the whole spoken text
 */
phraseHistoryService.addPhrase = function (items, text) {
    let key = normalizeText(text);
    if (!key || !items || items.length === 0) {
        return Promise.resolve();
    }
    return modifyHistory(history => {
        let existing = history.find(e => normalizeText(e.text) === key);
        if (existing) {
            existing.count = (existing.count || 1) + 1;
            existing.lastUsed = new Date().getTime();
            existing.items = items;
            existing.text = text.trim();
        } else {
            history.push({
                text: text.trim(),
                items: items,
                count: 1,
                lastUsed: new Date().getTime(),
                favorite: false
            });
        }
        return history;
    });
};

phraseHistoryService.setFavorite = function (text, favorite) {
    let key = normalizeText(text);
    return modifyHistory(history => {
        let existing = history.find(e => normalizeText(e.text) === key);
        if (existing) {
            existing.favorite = !!favorite;
            existing.lastUsed = new Date().getTime();
        }
        return history;
    });
};

phraseHistoryService.removePhrase = function (text) {
    let key = normalizeText(text);
    return modifyHistory(history => history.filter(e => normalizeText(e.text) !== key));
};

/**
 * @returns {Promise<{favorites: Array, recent: Array}>}
 */
phraseHistoryService.getPhrases = async function () {
    await _saveQueue;
    let metadata = await dataService.getMetadata();
    let history = (metadata && metadata.phraseHistory) || [];
    return {
        favorites: history.filter(e => e.favorite).sort((a, b) => (b.count || 0) - (a.count || 0)),
        recent: history.filter(e => !e.favorite).sort((a, b) => b.lastUsed - a.lastUsed)
    };
};

let _elementMapCache = null;
let _elementMapTime = 0;

/**
 * resolves the element references of a history entry to the current grid elements (with images and audio).
 * elements that don't exist anymore are returned as null.
 * @param entries array of history entries
 * @returns {Promise<Array>} array (per entry) of arrays of elements or null
 */
phraseHistoryService.resolveElements = async function (entries) {
    if (!_elementMapCache || new Date().getTime() - _elementMapTime > 10000) {
        let grids = await dataService.getGrids(true);
        _elementMapCache = {};
        for (let grid of grids) {
            for (let element of grid.gridElements || []) {
                _elementMapCache[element.id] = element;
            }
        }
        _elementMapTime = new Date().getTime();
    }
    return entries.map(entry => (entry.items || []).map(item => {
        if (item.onlyText) {
            return null;
        }
        let element = _elementMapCache[item.id];
        return element ? JSON.parse(JSON.stringify(element)) : null;
    }));
};

export { phraseHistoryService };
