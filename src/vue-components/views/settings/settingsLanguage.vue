<template>
    <div class="aj-idioma">
        <div class="aj-duas">
            <div class="g-campo">
                <label for="inLanguage">{{ $t('ajustesIdiomaApp') }}</label>
                <select id="inLanguage" v-model="appSettings.appLang" @change="saveAppSettings(appSettings)">
                    <option value="">{{ $t('ajustesIdiomaAutomatico') }}</option>
                    <option v-for="lang in allLanguages.filter(langObject => appLanguages.includes(langObject.code))" :value="lang.code">{{ lang | extractTranslationAppLang }}</option>
                </select>
                <p class="g-dica">{{ $t('ajustesIdiomaAppDica') }}</p>
            </div>
            <div class="g-campo">
                <label for="contentLang">{{ $t('ajustesIdiomaPranchas') }}</label>
                <select id="contentLang" v-model="userSettingsLocal.contentLang" @change="saveUserSettings()">
                    <option :value="undefined">{{ $t('ajustesIdiomaAutomatico') }}</option>
                    <option v-for="lang in selectLanguages" :value="lang.code">{{ lang | extractTranslationAppLang }} ({{ lang.code }})</option>
                </select>
                <p class="g-dica">{{ $t('ajustesIdiomaPranchasDica') }}</p>
            </div>
        </div>
        <label class="g-marcar">
            <input id="selectAllLanguages" type="checkbox" v-model="selectAllLanguages" @change="showAllLangsChanged()"/>
            <span>{{ $t('ajustesIdiomaMostrarTodos') }}</span>
        </label>
    </div>
</template>

<script>
    import { i18nService } from "../../../js/service/i18nService";
    import { dataService } from "../../../js/service/data/dataService";
    import { localStorageService } from "../../../js/service/data/localStorageService";
    import { util } from "../../../js/util/util";
    import { gridUtil } from '../../../js/util/gridUtil';
    import { settingsSaveMixin } from './settingsSaveMixin';

    let KEY_SETTINGS_SHOW_ALL_CONTENTLANGS = "KEY_SETTINGS_SHOW_ALL_CONTENTLANGS";

    /**
     * Ajustes > Idioma: language of the app (appSettings.appLang) and of the boards (userSettingsLocal.contentLang).
     * Emits "idioma-pranchas" after the language of the boards changed (the voice list depends on it).
     */
    export default {
        props: ["userSettingsLocal", "metadata", "appSettings"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                selectAllLanguages: JSON.parse(localStorageService.get(KEY_SETTINGS_SHOW_ALL_CONTENTLANGS)) || false,
                gridLanguages: [],
                appLanguages: i18nService.getAppLanguages(),
                allLanguages: i18nService.getAllLanguages()
            }
        },
        computed: {
            selectLanguages() {
                if (!this.allLanguages || !this.gridLanguages) {
                    return [];
                }
                if (this.selectAllLanguages) {
                    return this.allLanguages;
                }
                return this.allLanguages.filter(langObject => this.gridLanguages.includes(langObject.code));
            }
        },
        methods: {
            saveUserSettings() {
                this.$emit("changing");
                util.debounce(async () => {
                    await this.saveUserSettingsLocal(this.userSettingsLocal, 0); // method from mixin
                    this.$emit('idioma-pranchas');
                }, 300, 'SAVE_USERSETTINGS_IDIOMA');
            },
            showAllLangsChanged() {
                localStorageService.save(KEY_SETTINGS_SHOW_ALL_CONTENTLANGS, this.selectAllLanguages);
                if (!this.selectLanguages.map(e => e.code).includes(this.userSettingsLocal.contentLang)) {
                    this.userSettingsLocal.contentLang = undefined;
                    this.saveUserSettings();
                }
            }
        },
        async mounted() {
            let grids = await dataService.getGrids(false, true);
            this.gridLanguages = gridUtil.getGridsLangs(grids);
        }
    }
</script>
