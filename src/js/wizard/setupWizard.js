import { starterBoard } from './starterBoard';
import { GridData } from '../model/GridData';
import { GridElement } from '../model/GridElement';
import { GridImage } from '../model/GridImage';
import { GridActionNavigate } from '../model/GridActionNavigate';
import { dataService } from '../service/data/dataService';
import { localStorageService } from '../service/data/localStorageService';
import { voiceProfileService } from '../service/voiceProfileService';
import { i18nService } from '../service/i18nService';
import { gridUtil } from '../util/gridUtil';

/**
 * Saves the result of the setup wizard (Grilo Falante): voice and starter board.
 * Nothing that exists is deleted: the starter board is added and becomes the home board.
 */
let setupWizard = {};

// pictograms of the global bar (see gridUtil.generateGlobalGrid), stored in the app for offline use
const GLOBAL_ICON_KEYS = { 38222: 'g_home', 38249: 'g_back', 38221: 'g_speak', 38200: 'g_backspace', 38202: 'g_clear' };

setupWizard.loadImages = async function () {
    let module = await import(/* webpackChunkName: "starterBoardImages" */ './starterBoardImages.json');
    return module.default || module;
};

/**
 * saves the chosen voice on this device and in the profile of the child
 * @param voiceId
 * @param rate speaking rate (1 = normal)
 */
setupWizard.saveVoice = async function (voiceId, rate = 1) {
    if (!voiceId) {
        return;
    }
    let userSettings = localStorageService.getUserSettings();
    userSettings.voiceConfig = userSettings.voiceConfig || {};
    userSettings.voiceConfig.preferredVoice = voiceId;
    userSettings.voiceConfig.voiceRate = rate;
    userSettings.voiceConfig.voicePitch = 1;
    localStorageService.saveUserSettings(userSettings);
    await voiceProfileService.saveToProfile(userSettings.voiceConfig);
};

/**
 * creates and saves the starter board and makes it the home board
 * @param options see starterBoard.build()
 * @return {Promise<GridData>} the main grid
 */
setupWizard.createStarterBoard = async function (options) {
    let images = await setupWizard.loadImages();
    options = Object.assign({ lang: i18nService.getContentLang() }, options);
    let result = starterBoard.build(options, images, { GridData, GridElement, GridImage, GridActionNavigate });
    let toSave = result.grids.slice();

    let metadata = await dataService.getMetadata();
    let existingGlobal = metadata.globalGridId ? await dataService.getGlobalGrid(true) : null;
    if (!existingGlobal) {
        let globalGrid = gridUtil.generateGlobalGrid(options.lang);
        useStoredIcons(globalGrid, images);
        toSave.unshift(globalGrid);
        metadata.globalGridId = globalGrid.id;
    }
    await dataService.saveGrids(toSave);
    metadata.globalGridActive = true;
    metadata.homeGridId = result.mainGrid.id;
    metadata.lastOpenedGridId = result.mainGrid.id;
    await dataService.saveMetadata(metadata);
    return result.mainGrid;
};

function useStoredIcons(globalGrid, images) {
    for (let element of globalGrid.gridElements) {
        let url = element.image && element.image.url ? element.image.url : '';
        let match = url.match(/pictograms\/(\d+)/);
        let key = match ? GLOBAL_ICON_KEYS[match[1]] : null;
        if (key && images[key]) {
            element.image = new GridImage({
                data: images[key].data,
                author: starterBoard.ARASAAC_AUTHOR,
                authorURL: starterBoard.ARASAAC_LICENSE_URL
            });
        }
    }
}

export { setupWizard };
