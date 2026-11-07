import $ from '../externals/jquery.js';
import { constants } from '../util/constants';
import { dataService } from './data/dataService';
import { localStorageService } from './data/localStorageService';

/**
 * Keeps the voice settings (voice, pitch, rate, second voice, ...) in the user's profile (MetaData),
 * which is stored in the user's database and synced to all devices of this user (child).
 *
 * Before, voice settings were only stored in localStorage of the current device, so the
 * child's voice was lost on another tablet or after clearing the browser data.
 *
 * - saveToProfile(): called when the voice settings are changed by the user in the settings
 * - on user change or synced metadata update: the profile's voice settings are applied to this device
 */
let voiceProfileService = {};

const VOICE_KEYS = ['preferredVoice', 'secondVoice', 'voiceLangIsTextLang', 'voicePitch', 'voiceRate', 'waitForSpeechToFinish'];

function normalize(voiceConfig) {
    let result = {};
    voiceConfig = voiceConfig || {};
    for (let key of VOICE_KEYS) {
        if (voiceConfig[key] !== undefined && voiceConfig[key] !== null) {
            result[key] = voiceConfig[key];
        }
    }
    return result;
}

/**
 * saves the given voice settings to the profile of the current user
 * @param voiceConfig
 * @returns {Promise<void>}
 */
voiceProfileService.saveToProfile = async function (voiceConfig) {
    let metadata = await dataService.getMetadata();
    if (!metadata) {
        return;
    }
    let newConfig = normalize(voiceConfig);
    if (JSON.stringify(normalize(metadata.voiceConfig)) === JSON.stringify(newConfig)) {
        return;
    }
    metadata.voiceConfig = newConfig;
    await dataService.saveMetadata(metadata);
};

/**
 * applies the voice settings of the profile to this device, if there are any
 * @param metadata optional, current metadata
 */
voiceProfileService.applyFromProfile = async function (metadata) {
    metadata = metadata || (await dataService.getMetadata());
    if (!metadata || !metadata.voiceConfig || Object.keys(metadata.voiceConfig).length === 0) {
        return;
    }
    let userSettings = localStorageService.getUserSettings() || {};
    let profileConfig = normalize(metadata.voiceConfig);
    let localConfig = normalize(userSettings.voiceConfig);
    if (JSON.stringify(profileConfig) === JSON.stringify(localConfig)) {
        return;
    }
    let newLocal = Object.assign({}, userSettings.voiceConfig || {});
    VOICE_KEYS.forEach(key => delete newLocal[key]); // profile replaces all voice settings, e.g. "automatic voice" = no preferredVoice
    localStorageService.saveUserSettings({ voiceConfig: Object.assign(newLocal, profileConfig) });
};

$(document).on(constants.EVENT_USER_CHANGED, () => {
    voiceProfileService.applyFromProfile().catch(e => log.warn('could not apply voice profile', e));
});
$(document).on(constants.EVENT_METADATA_UPDATED, (event, metadata) => {
    voiceProfileService.applyFromProfile(metadata).catch(e => log.warn('could not apply voice profile', e));
});

export { voiceProfileService };
