import { MainVue } from '../vue/mainVue';
import { constants } from './constants';
import { i18nService } from '../service/i18nService';

let messageUtil = {};

/**
 * Shows import success message after closing the progress bar
 * @param importData the imported data (with grids and dictionaries arrays)
 * @param onCloseFn callback function to execute when the message box closes
 * @returns Promise that resolves when the message box closes
 */
messageUtil.showImportSuccess = async function(importData, onCloseFn) {
    // Wait for progress bar to close
    await MainVue.showProgressBar(100);

    // Calculate imported counts
    let importedGridsCount = importData && importData.grids ? importData.grids.length : 0;
    let importedDictsCount = importData && importData.dictionaries ? importData.dictionaries.length : 0;

    // Build items list
    let items = [];
    if (importedGridsCount > 0) {
        items.push(i18nService.t(importedGridsCount === 1 ? 'gestaoArquivoImportadaUmaPrancha' : 'gestaoArquivoImportadasPranchas', importedGridsCount));
    }
    if (importedDictsCount > 0) {
        items.push(i18nService.t(importedDictsCount === 1 ? 'gestaoArquivoImportadaUmaLista' : 'gestaoArquivoImportadasListas', importedDictsCount));
    }

    // Show success message box
    return MainVue.showMessageBox({
        type: constants.MODAL_TYPE_SUCCESS,
        header: 'gestaoArquivoImportadoTitulo',
        items: items,
        buttonPreset: constants.BUTTONS_OK,
        onClose: onCloseFn
    });
};

export { messageUtil };
