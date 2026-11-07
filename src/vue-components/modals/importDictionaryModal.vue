<template>
    <gestao-modal :titulo="$t('gestaoPalavrasTrazerTitulo')" :subtitulo="$t('gestaoPalavrasTrazerSubtitulo')" icone="file-import" @close="$emit('close')">
        <div class="gm-escolhas" role="group" :aria-label="$t('gestaoPalavrasDeOnde')">
            <button type="button" class="gm-escolha" :aria-pressed="(importType === c.SELECT_ONLINE).toString()" @click="importType = c.SELECT_ONLINE">
                <i class="ti ti-books" aria-hidden="true"></i>
                <span>{{ $t('gestaoPalavrasListasProntas') }}</span>
                <small>{{ $t('gestaoPalavrasListasProntasDica') }}</small>
            </button>
            <button type="button" class="gm-escolha" :aria-pressed="(importType === c.SELECT_FILE).toString()" @click="importType = c.SELECT_FILE">
                <i class="ti ti-file-upload" aria-hidden="true"></i>
                <span>{{ $t('gestaoPalavrasDeArquivo') }}</span>
                <small>{{ $t('gestaoPalavrasDeArquivoDica') }}</small>
            </button>
        </div>

        <div v-show="importType === c.SELECT_ONLINE" class="g-campo">
            <label for="selectDict">{{ $t('gestaoPalavrasQualLista') }}</label>
            <select id="selectDict" v-model="selectedOption">
                <option disabled selected hidden :value="null">{{ $t('gestaoPalavrasEscolhaUma') }}</option>
                <option v-for="(option, index) in options" :value="option" :key="index">{{ option.name }}</option>
            </select>
            <span class="g-dica" v-if="!selectedOption || selectedOption.type !== c.OPTION_TYPE_GITHUB_FREQUENCYWORDS">{{ $t('gestaoPalavrasPortuguesNoApp') }}</span>
            <span class="g-dica" v-show="selectedOption && selectedOption.type === c.OPTION_TYPE_GITHUB_FREQUENCYWORDS">
                <i class="ti ti-world" aria-hidden="true"></i> {{ $t('gestaoPalavrasPrecisaInternet') }}
                {{ $t('thanksToHermitDaveForSupplyingDataForThis') }}
                <a href="https://github.com/hermitdave/FrequencyWords" target="_blank" rel="noopener">Github.com</a>
            </span>
        </div>

        <div v-show="importType === c.SELECT_FILE">
            <label class="pa-arquivo" for="fileInput" :class="{'pa-arquivo-pronto': !!selectedFile}">
                <input id="fileInput" class="g-oculto-leitor" type="file" accept=".json" @change="onFileSelect"/>
                <i :class="selectedFile ? 'ti ti-file-check' : 'ti ti-file-upload'" aria-hidden="true"></i>
                <span class="pa-arquivo-texto">
                    <strong>{{ selectedFile ? selectedFile.name : $t('gestaoArquivoTocarParaEscolher') }}</strong>
                    <small>{{ selectedFile ? $t('gestaoArquivoTrocarArquivo') : $t('gestaoPalavrasArquivoJson') }}</small>
                </span>
            </label>
        </div>

        <div v-show="!!error" class="g-aviso pa-erro" role="alert">
            <i class="ti ti-alert-triangle" aria-hidden="true"></i>
            <span>{{error | translate}}</span>
        </div>

        <template #rodape>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :disabled="loading || importType === c.SELECT_ONLINE && !selectedOption || importType === c.SELECT_FILE && !selectedFile">
                <i :class="loading ? 'ti ti-loader-2 pa-girar' : 'ti ti-check'" aria-hidden="true"></i>{{ loading ? $t('gestaoPalavrasTrazendo') : $t('gestaoPalavrasTrazerBotao') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import Predictionary from 'predictionary';
    import {i18nService} from "../../js/service/i18nService";
    import GestaoModal from './gestaoModal.vue';
    import {Dictionary} from "../../js/model/Dictionary.js";
    import {modelUtil} from "../../js/util/modelUtil.js";

    let c = {};
    c.OPTION_TYPE_PREDEFINED = 'OPTION_TYPE_PREDEFINED'
    c.OPTION_TYPE_GITHUB_FREQUENCYWORDS = 'OPTION_TYPE_GITHUB_FREQUENCYWORDS';
    c.SELECT_FILE = 'SELECT_FILE';
    c.SELECT_ONLINE = 'SELECT_ONLINE';

    let githubFrequencyWordsURL = 'https://api.github.com/repos/klues/FrequencyWords/contents';
    let githubFrequencyWordsURLRaw = 'https://raw.githubusercontent.com/klues/FrequencyWords/master';

    export default {
        components: {GestaoModal},
        props: ['dicts'],
        data: function () {
            return {
                importType: c.SELECT_ONLINE,
                options: [{
                    name: i18nService.t('astericsGridGermanDefault'),
                    downloadUrl: 'https://raw.githubusercontent.com/asterics/Asterics-AAC/master/app/dictionaries/default_de.json',
                    type: c.OPTION_TYPE_PREDEFINED,
                    lang: "de"
                }, {
                    name: i18nService.t('astericsGridEnglishDefault'),
                    downloadUrl: 'https://raw.githubusercontent.com/asterics/Asterics-AAC/master/app/dictionaries/default_en.json',
                    type: c.OPTION_TYPE_PREDEFINED,
                    lang: "en"
                }, {
                    // shipped with the app (works offline), 20.000 frequent Brazilian Portuguese words, filtered for children
                    name: i18nService.t('astericsGridPortugueseDefault'),
                    downloadUrl: 'app/dictionaries/default_pt.json',
                    type: c.OPTION_TYPE_PREDEFINED,
                    lang: "pt"
                }],
                selectedOption: null,
                selectedFile: null,
                c: c,
                error: null,
                loading: false,
                console: console
            }
        },
        methods: {
            save() {
                let thiz = this;
                this.error = '';
                this.loading = true;
                let existingNames = this.dicts.map(dict => dict.dictionaryKey);
                if (this.importType === c.SELECT_ONLINE) {
                    let predictionary = Predictionary.instance();
                    let dictData;
                    this.requestDict(this.selectedOption.downloadUrl, this.selectedOption.downloadUrl2).then(data => {
                        if (this.selectedOption.type === c.OPTION_TYPE_GITHUB_FREQUENCYWORDS) {
                            predictionary.parseWords(data, {
                                elementSeparator: '\n',
                                rankIsIndex: true
                            });
                            dictData = predictionary.dictionaryToJSON();
                        } else if (this.selectedOption.type === c.OPTION_TYPE_PREDEFINED) {
                            dictData = data;
                        }
                        saveDictAndClose(dictData);
                    }).catch(e => {
                        this.error = e;
                        this.loading = false;
                    });
                } else if (this.importType === c.SELECT_FILE) {
                    let reader = new FileReader();
                    reader.onload = function(event) {
                        try {
                            let json = JSON.parse(event.target.result);
                            let key = Object.keys(json)[0];
                            if (json[key].f === undefined || json[key].t === undefined) {
                                throw new Error();
                            } else {
                                saveDictAndClose(event.target.result);
                            }
                        } catch (e) {
                            thiz.error = i18nService.t('theSelectedFileDoesNotContainDict');
                            thiz.loading = false;
                        }
                    };
                    reader.readAsText(this.selectedFile);
                }

                function saveDictAndClose(dictData) {
                    let name = thiz.importType === c.SELECT_ONLINE ? thiz.selectedOption.name : thiz.selectedFile.name.replace('dictionary-', '').replace('.json', '');
                    let dict = new Dictionary({
                        dictionaryKey: modelUtil.getNewName(name, existingNames),
                        data: dictData,
                        isDefault: true,
                        lang: thiz.selectedOption ? thiz.selectedOption.lang : i18nService.getContentLang()
                    });
                    return dataService.saveDictionary(dict).then(() => {
                        thiz.$emit('reload', dict);
                        thiz.$emit('close');
                    });
                }
            },
            onFileSelect(event) {
                this.selectedFile = event.target.files[0];
                this.error = '';
            },
            requestDict(url, secondTryUrl) {
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: url,
                        dataType: 'text',
                        accepts: {
                            text: 'application/vnd.github.v3.raw'
                        }
                    }).then((result) => {
                        return resolve(result);
                    }).fail(() => {
                        if (!secondTryUrl) {
                            return reject(i18nService.t('couldNotDownloadDictCheckInternet'));
                        }
                        log.warn("first try to download dict failed. second try...");
                        this.requestDict(secondTryUrl).then(resolve).catch(reject);
                    });
                });
            }
        },
        mounted() {
            let additionalOptions = JSON.parse('[{"langCode":"af","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/af/af_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/af/af_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ar","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ar/ar_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ar/ar_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"bg","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/bg/bg_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/bg/bg_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"bn","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/bn/bn_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/bn/bn_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"br","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/br/br_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/br/br_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"bs","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/bs/bs_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/bs/bs_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ca","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ca/ca_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ca/ca_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"cs","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/cs/cs_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/cs/cs_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"da","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/da/da_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/da/da_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"de","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/de/de_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/de/de_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"el","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/el/el_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/el/el_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"en","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/en/en_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/en/en_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"eo","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/eo/eo_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/eo/eo_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"es","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/es/es_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/es/es_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"et","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/et/et_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/et/et_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"eu","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/eu/eu_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/eu/eu_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"fa","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/fa/fa_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/fa/fa_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"fi","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/fi/fi_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/fi/fi_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"fr","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/fr/fr_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/fr/fr_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"gl","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/gl/gl_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/gl/gl_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"he","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/he/he_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/he/he_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"hi","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hi/hi_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hi/hi_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"hr","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hr/hr_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hr/hr_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"hu","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hu/hu_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hu/hu_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"hy","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hy/hy_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hy/hy_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"id","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/id/id_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/id/id_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"is","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/is/is_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/is/is_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"it","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/it/it_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/it/it_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ja","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ja/ja_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ja/ja_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ka","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ka/ka_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ka/ka_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"kk","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/kk/kk_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/kk/kk_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ko","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ko/ko_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ko/ko_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"lt","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/lt/lt_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/lt/lt_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"lv","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/lv/lv_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/lv/lv_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"mk","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/mk/mk_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/mk/mk_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ml","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ml/ml_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ml/ml_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ms","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ms/ms_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ms/ms_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"nl","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/nl/nl_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/nl/nl_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"no","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/no/no_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/no/no_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"pl","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/pl/pl_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/pl/pl_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"pt","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/pt/pt_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/pt/pt_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"pt_br","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/pt_br/pt_br_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/pt_br/pt_br_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ro","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ro/ro_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ro/ro_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ru","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ru/ru_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ru/ru_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"si","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/si/si_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/si/si_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"sk","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sk/sk_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sk/sk_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"sl","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sl/sl_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sl/sl_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"sq","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sq/sq_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sq/sq_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"sr","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sr/sr_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sr/sr_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"sv","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sv/sv_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sv/sv_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ta","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ta/ta_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ta/ta_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"te","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/te/te_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/te/te_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"th","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/th/th_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/th/th_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"tl","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/tl/tl_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/tl/tl_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"tr","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/tr/tr_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/tr/tr_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"uk","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/uk/uk_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/uk/uk_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"vi","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/vi/vi_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/vi/vi_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"zh","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/zh/zh_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/zh/zh_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"zh_tw","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/zh_tw/zh_tw_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/zh_tw/zh_tw_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"}]');
            additionalOptions = additionalOptions.map(o => {
                let lang = i18nService.t(`lang.${o.langCode}`);
                o.name = `${lang} (hermitdave@github.com)`;
                o.lang = o.langCode;
                return o;
            })
            additionalOptions.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
            this.options = this.options.concat(additionalOptions);
            //printOptionsJSON('/content/2016');
        }
    }

    function printOptionsJSON(basePath) {
        $.get(githubFrequencyWordsURL + basePath).then(result => {
            result = result.filter(e => e.type === "dir");
            let options = result.map(e => {
                return {
                    langCode: e.name,
                    downloadUrl: `${githubFrequencyWordsURLRaw}/${e.path}/${e.name}_50k.txt`,
                    downloadUrl2: `${githubFrequencyWordsURLRaw}/${e.path}/${e.name}_full.txt`,
                    type: c.OPTION_TYPE_GITHUB_FREQUENCYWORDS
                }
            });
            console.log(`Options for ${basePath}:`);
            console.log(JSON.stringify(options));
        });
    }
</script>

<style scoped>
    .pa-arquivo {
        display: flex; align-items: center; gap: var(--g-e4);
        min-height: 88px; padding: var(--g-e4); margin: 0 0 var(--g-e4);
        border: 2px dashed var(--g-borda-forte); border-radius: var(--g-raio-g);
        background: var(--g-superficie); cursor: pointer; font-weight: 400;
    }
    .pa-arquivo:hover { border-color: var(--g-folha); }
    .pa-arquivo:focus-within { box-shadow: var(--g-foco); }
    .pa-arquivo > .ti { font-size: 36px; color: var(--g-folha-escura); flex: none; }
    .pa-arquivo-pronto { border-style: solid; border-color: var(--g-folha); background: var(--g-folha-clara); }
    .pa-arquivo-texto { display: flex; flex-direction: column; min-width: 0; }
    .pa-arquivo-texto strong { font-size: var(--g-t-grande); overflow-wrap: anywhere; }
    .pa-arquivo-texto small { color: var(--g-tinta-2); font-size: var(--g-t-legenda); }
    .pa-erro { background: var(--g-perigo-claro); color: var(--g-perigo); font-weight: 700; }
    .pa-girar { animation: pa-giro 1s linear infinite; }
    @keyframes pa-giro { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .pa-girar { animation: none; } }
</style>
