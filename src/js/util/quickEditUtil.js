import { GridActionAudio } from '../model/GridActionAudio';
import { GridImage } from '../model/GridImage';

/**
 * Small, safe changes of a single grid element, used by the quick edit panel (Grilo Falante):
 * photo, own voice recording, text and hide/show.
 *
 * All functions work on plain (JSON) grid elements and never change the position (x, y)
 * or size of the element: in AAC, buttons must never move by themselves.
 */
let quickEditUtil = {};

quickEditUtil.MAX_RECORD_MS = 10000;

/**
 * returns the label of the element in the given language
 */
quickEditUtil.getLabel = function (element, lang) {
    if (!element || !element.label) {
        return '';
    }
    return element.label[lang] || '';
};

/**
 * sets the label (text) of the element in the given language
 */
quickEditUtil.setLabel = function (element, text, lang) {
    element.label = Object.assign({}, element.label || {});
    element.label[lang] = (text || '').trim();
    return element;
};

/**
 * sets a photo (base64 data URL) as image of the element, filling the whole cell
 */
quickEditUtil.setPhoto = function (element, base64) {
    element.image = JSON.parse(JSON.stringify(new GridImage({
        data: base64,
        fit: GridImage.FIT_COVER
    })));
    return element;
};

/**
 * returns the recorded audio action of the element, or null
 */
quickEditUtil.getAudioAction = function (element) {
    let actions = (element && element.actions) || [];
    return actions.find((a) => a.modelName === GridActionAudio.getModelName() && a.dataBase64) || null;
};

quickEditUtil.hasAudio = function (element) {
    return !!quickEditUtil.getAudioAction(element);
};

/**
 * sets an own voice recording for the element. If the element has a recording, the app plays it
 * instead of speaking the label (see actionService.doActions).
 * @param element
 * @param recording {base64, mimeType, durationMs}
 */
quickEditUtil.setAudio = function (element, recording) {
    element.actions = (element.actions || []).filter((a) => a.modelName !== GridActionAudio.getModelName());
    let action = new GridActionAudio({
        dataBase64: recording.base64,
        mimeType: recording.mimeType,
        durationMs: recording.durationMs || null
    });
    element.actions.push(JSON.parse(JSON.stringify(action)));
    return element;
};

/**
 * removes the own voice recording, so the label is spoken again
 */
quickEditUtil.removeAudio = function (element) {
    element.actions = (element.actions || []).filter((a) => a.modelName !== GridActionAudio.getModelName());
    return element;
};

/**
 * hides or shows the element. A hidden element keeps its place: the cell stays empty in child mode.
 */
quickEditUtil.setHidden = function (element, hidden) {
    element.hidden = !!hidden;
    return element;
};

/**
 * replaces the element with the given id in the grid by the given element
 * @return {boolean} true if replaced
 */
quickEditUtil.replaceElement = function (gridData, element) {
    let index = gridData.gridElements.findIndex((e) => e.id === element.id);
    if (index === -1) {
        return false;
    }
    let original = gridData.gridElements[index];
    // position and size always stay as they are
    element.x = original.x;
    element.y = original.y;
    element.width = original.width;
    element.height = original.height;
    gridData.gridElements.splice(index, 1, element);
    return true;
};

export { quickEditUtil };
