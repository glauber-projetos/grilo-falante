/**
 * Grilo Falante: how long the adult holds the "Responsável" button to leave the child mode.
 *
 * Chosen in Ajustes > "Modo Criança e segurança". Kept on this device only (localStorage),
 * like "reduce motion": it doesn't change the profile data or the .grd backup.
 */
let unlockHoldService = {};

unlockHoldService.STORAGE_KEY = 'GRILO_UNLOCK_HOLD_MS';
unlockHoldService.DEFAULT_MS = 3000;
unlockHoldService.OPTIONS_MS = [2000, 3000, 5000];

function getStorage() {
    try {
        return window.localStorage;
    } catch (e) {
        return null;
    }
}

/**
 * @return {number} hold time in ms (one of OPTIONS_MS)
 */
unlockHoldService.getHoldMs = function () {
    let storage = getStorage();
    let value = storage ? parseInt(storage.getItem(unlockHoldService.STORAGE_KEY)) : NaN;
    return unlockHoldService.OPTIONS_MS.includes(value) ? value : unlockHoldService.DEFAULT_MS;
};

/**
 * @param ms hold time in ms, invalid values go back to the default
 * @return {number} the saved value
 */
unlockHoldService.setHoldMs = function (ms) {
    let value = parseInt(ms);
    value = unlockHoldService.OPTIONS_MS.includes(value) ? value : unlockHoldService.DEFAULT_MS;
    let storage = getStorage();
    if (storage) {
        storage.setItem(unlockHoldService.STORAGE_KEY, String(value));
    }
    return value;
};

export { unlockHoldService };
