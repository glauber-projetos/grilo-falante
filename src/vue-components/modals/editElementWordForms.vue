<template>
    <div class="ewf">
        <div class="ewf-intro">
            <img src="app/img/grilo/mascote/grilo-ideia.webp" alt="" aria-hidden="true" class="ewf-intro-grilo"/>
            <p class="g-apoio">{{ $t('gestaoBotaoFormasIntro') }}</p>
        </div>

        <section class="gm-secao">
            <h3><i class="ti ti-plus" aria-hidden="true"></i>{{ $t('gestaoBotaoNovaForma') }}</h3>
            <edit-word-form v-model="newWordForm" :allow-empty="true"></edit-word-form>
            <div class="ewf-direita">
                <button type="button" class="g-btn g-btn-principal" @click="addWordForm()" :disabled="!newWordForm.value">
                    <i class="ti ti-plus" aria-hidden="true"></i>{{ $t('gestaoBotaoAdicionarForma') }}
                </button>
            </div>
        </section>

        <section class="gm-secao">
            <h3>
                <i class="ti ti-abc" aria-hidden="true"></i>{{ $t('gestaoBotaoFormasDesta') }}
                <span v-if="gridElement.wordForms.length > 0" class="g-pilula">{{ gridElement.wordForms.length }}</span>
            </h3>
            <div class="ewf-filtro" v-if="gridElement.wordForms.length > 0">
                <div class="g-campo">
                    <label for="filterLang">{{ $t('gestaoBotaoMostrarIdioma') }}</label>
                    <select id="filterLang" v-model="filterLang">
                        <option :value="null">{{ $t('gestaoBotaoTodosOsIdiomas') }}</option>
                        <option v-if="gridElement.wordForms.some((f) => f.lang === lang.code)" v-for="lang in langs" :value="lang.code">{{lang | extractTranslationAppLang}} ({{ lang.code }})</option>
                    </select>
                </div>
                <button type="button" @click="deleteAll" class="g-btn g-btn-perigo"><i class="ti ti-trash" aria-hidden="true"></i>{{ $t('gestaoBotaoApagarTodas') }}</button>
            </div>
            <ul v-if="gridElement.wordForms.length > 0" class="gm-lista">
                <li v-if="!filterLang || form.lang === filterLang" v-for="(form, index) in gridElement.wordForms" :class="{'ewf-editando': index === editId}">
                    <span v-if="form.lang" class="g-pilula ewf-idioma">{{ form.lang }}</span>
                    <span class="gm-lista-texto">
                        {{ form.value }}
                        <small v-if="form.tags.length" class="ewf-marcas">
                            <span v-for="tag in form.tags" class="g-pilula g-pilula-ok">{{ tag }}</span>
                        </small>
                        <small v-else>{{ $t('gestaoBotaoSemMarcas') }}</small>
                    </span>
                    <span class="ewf-botoes">
                        <button type="button" class="g-btn g-btn-leve g-btn-icone" :aria-pressed="(editId === index).toString()" :aria-label="editId !== index ? $t('gestaoBotaoEditarForma', [form.value]) : $t('gestaoBotaoTerminarEdicao')" :title="editId !== index ? $t('gestaoEditar') : $t('gestaoBotaoTerminarEdicao')" @click="edit(index)">
                            <i :class="editId !== index ? 'ti ti-pencil' : 'ti ti-check'" aria-hidden="true"></i>
                        </button>
                        <button type="button" class="g-btn g-btn-leve g-btn-icone" :aria-label="$t('gestaoBotaoApagarForma', [form.value])" :title="$t('gestaoApagar')" @click="remove(form)"><i class="ti ti-trash" aria-hidden="true"></i></button>
                        <button type="button" class="g-btn g-btn-leve g-btn-icone" :aria-label="$t('gestaoBotaoSubir')" :title="$t('gestaoBotaoSubir')" @click="moveUp(form)"><i class="ti ti-arrow-up" aria-hidden="true"></i></button>
                        <button type="button" class="g-btn g-btn-leve g-btn-icone" :aria-label="$t('gestaoBotaoDescer')" :title="$t('gestaoBotaoDescer')" @click="moveDown(form)"><i class="ti ti-arrow-down" aria-hidden="true"></i></button>
                    </span>
                    <edit-word-form v-if="editId === index" class="ewf-form-item" v-model="gridElement.wordForms[index]"></edit-word-form>
                </li>
            </ul>
            <p v-if="gridElement.wordForms.length === 0" class="gm-vazio"><i class="ti ti-abc" aria-hidden="true"></i>{{ $t('gestaoBotaoNenhumaForma') }}</p>
        </section>

        <details class="gm-avancado">
            <summary>{{ $t('gestaoBotaoCopiarColarPlanilha') }}</summary>
            <div class="gm-avancado-corpo">
                <p class="g-dica">{{ $t('gestaoBotaoPlanilhaDica') }}</p>
                <label class="g-marcar">
                    <input id="importExportGlobally" type="checkbox" v-model="importExportGlobally" @change="overrideAtImport = importExportGlobally ? true : overrideAtImport"/>
                    <span>{{ $t('gestaoBotaoTodasPranchas') }}</span>
                </label>
                <label class="g-marcar">
                    <input id="overrideAtImport" type="checkbox" :disabled="importExportGlobally" v-model="overrideAtImport"/>
                    <span>{{ $t('gestaoBotaoSubstituirFormas') }}</span>
                </label>
                <div class="g-linha ewf-planilha">
                    <button type="button" class="g-btn" @click="importFromClipboard()"><i class="ti ti-file-import" aria-hidden="true"></i>{{ $t('gestaoBotaoColarPlanilha') }}</button>
                    <button type="button" class="g-btn" @click="copyToClipboard()"><i class="ti ti-file-export" aria-hidden="true"></i>{{ $t('gestaoBotaoCopiarPlanilha') }}</button>
                </div>
                <p v-if="currentMsg === msgTypes.WAIT" class="ewf-msg" role="status"><i class="ti ti-loader-2 ewf-gira" aria-hidden="true"></i>{{ $t('gestaoBotaoAguarde') }}</p>
                <p v-if="currentMsg === msgTypes.ERROR_PASTE" class="g-aviso" role="alert">
                    <i class="ti ti-alert-triangle" aria-hidden="true"></i>
                    <span>{{ $t('clipboardContainsNoWordFormsPleaseCopyFrom') }}</span>
                </p>
                <p v-if="currentMsg === msgTypes.SUCCESS_PASTE" class="ewf-msg ewf-ok" role="status">
                    <i class="ti ti-check" aria-hidden="true"></i>
                    <span v-if="gridPasteCount === 0">{{ $t('importedWordForms', {count: msgCount}) }}</span>
                    <span v-if="gridPasteCount > 0">{{ $t('importedWordFormsGrids', {count: msgCount, gridCount: this.gridPasteCount}) }}</span>
                </p>
                <p v-if="currentMsg === msgTypes.SUCCESS_COPY" class="ewf-msg ewf-ok" role="status">
                    <i class="ti ti-check" aria-hidden="true"></i>
                    <span>{{ $t('copiedWordForms', {count: msgCount}) }}</span>
                </p>
            </div>
        </details>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import {helpService} from "../../js/service/helpService";
    import {WordForm} from "../../js/model/WordForm.js";
    import EditWordForm from "../components/editWordForm.vue";
    import {util} from "../../js/util/util.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {dataService} from "../../js/service/data/dataService.js";
    import {constants} from "../../js/util/constants.js";

    export default {
        components: {EditWordForm},
        props: ['gridElement', 'gridData'],
        data: function () {
            return {
                newWordForm: JSON.parse(JSON.stringify(new WordForm())),
                editId: undefined,
                importExportGlobally: false,
                overrideAtImport: false,
                allGrids: null,
                langs: i18nService.getAllLanguages(),
                filterLang: null,
                msgTypes: {
                    WAIT: 'WAIT',
                    SUCCESS_COPY: 'SUCCESS_COPY',
                    SUCCESS_PASTE: 'SUCCESS_PASTE',
                    ERROR_PASTE: 'ERROR_PASTE',
                },
                currentMsg: null,
                msgCount: 0,
                gridPasteCount: 0
            }
        },
        methods: {
            addWordForm() {
                this.gridElement.wordForms.push(this.newWordForm);
                this.newWordForm = JSON.parse(JSON.stringify(new WordForm()));
            },
            deleteAll() {
                if (!confirm(i18nService.t("doYouReallyWantDeleteAllWordForms"))) {
                    return;
                }
                this.gridElement.wordForms = [];
            },
            remove(toRemove) {
                this.gridElement.wordForms = this.gridElement.wordForms.filter(f => f !== toRemove);
            },
            edit(id) {
                this.editId = this.editId === id ? undefined : id;
            },
            moveUp(toMove) {
                let index = this.gridElement.wordForms.indexOf(toMove);
                if (index > 0) {
                    this.exchange(index - 1, index);
                }
            },
            moveDown(toMove) {
                let index = this.gridElement.wordForms.indexOf(toMove);
                if (index < this.gridElement.wordForms.length - 1) {
                    this.exchange(index + 1, index);
                }
            },
            exchange(i1, i2) {
                let temp = this.gridElement.wordForms[i1];
                this.gridElement.wordForms[i1] = this.gridElement.wordForms[i2];
                this.gridElement.wordForms[i2] = temp;
                this.$forceUpdate();
            },
            async importFromClipboard() {
                this.currentMsg = null;
                this.msgCount = this.gridPasteCount = 0;
                let result = await util.getClipboardContent();
                let rows = result.split('\n').filter(row => !!row);
                let colNrValue = 0;
                let colNrLang = 1;
                let colNrTags = 2;
                let colNrBase = 3;
                let colNrPronunciation = 4;
                rows = rows.map(row => row.split('\t'));
                rows = rows.map(row => {
                    row[colNrTags] = row[colNrTags] ? row[colNrTags].split(",").map(tag => tag.trim().toLocaleUpperCase()).filter(tag => !!tag) : null;
                    row[colNrLang] = row[colNrLang] ? row[colNrLang].trim().toLocaleLowerCase() : null;
                    row[colNrPronunciation] = row[colNrPronunciation] ? row[colNrPronunciation].trim() : null;
                    return row;
                });
                let validLangCodes = i18nService.getAllLangCodes();
                rows = rows.filter(row => (!row[colNrLang] || validLangCodes.includes(row[colNrLang])) && row[colNrValue]);
                if (!rows.length) {
                    this.currentMsg = this.msgTypes.ERROR_PASTE;
                    return;
                }
                if (this.overrideAtImport && (this.gridElement.wordForms.length > 0 || this.importExportGlobally)) {
                    if (!confirm(i18nService.t("doYouReallyWantDeleteExistingWordForms"))) {
                        return;
                    }
                }
                let importForms = rows.map(row => {
                    return {
                        lang: row[colNrLang] ? row[colNrLang].toLocaleLowerCase() : undefined,
                        tags: row[colNrTags] ? row[colNrTags] : [],
                        value: row[colNrValue],
                        pronunciation: row[colNrPronunciation],
                        base: this.importExportGlobally ? row[colNrBase] : undefined
                    }
                })
                if (!this.importExportGlobally) {
                    this.gridElement.wordForms = this.overrideAtImport ? [] : this.gridElement.wordForms;
                    this.gridElement.wordForms = this.gridElement.wordForms.concat(importForms);
                    this.msgCount = rows.length;
                } else {
                    this.allGrids = this.allGrids || (await dataService.getGrids(true));
                    let baseMap = {}; // base -> list of word form objects
                    for (let newForm of importForms) {
                        let baseString = newForm.base || "";
                        let bases = baseString.split(";");
                        for (let base of bases) {
                            base = base.trim();
                            baseMap[base] = baseMap[base] || [];
                            baseMap[base].push(newForm);
                        }
                    }
                    let ownGridChanged = false;
                    for (let grid of this.allGrids) {
                        let changedGrid = false;
                        for (let element of grid.gridElements) {
                            let allNewWordForms = new Set();
                            let baseStrings = this.getBaseStringsFromWordForms(element.wordForms);
                            if (!baseStrings.length) {
                                baseStrings = [`${i18nService.getTranslation(element.label)}:${i18nService.getContentLangBase()}`];
                            }
                            for (let baseString of baseStrings) {
                                if (baseMap[baseString]) {
                                    allNewWordForms = new Set([...allNewWordForms, ...baseMap[baseString]]);
                                }
                            }
                            let newArray = Array.from(allNewWordForms);
                            let existingWordForms = element.wordForms || [];
                            let changeCurrentElement = newArray.length > 0 && (existingWordForms.length !== newArray.length || JSON.stringify(existingWordForms) !== JSON.stringify(newArray));
                            changedGrid = changedGrid || changeCurrentElement;
                            if (changeCurrentElement) {
                                element.wordForms = newArray;
                                this.msgCount += newArray.length;
                            }
                        }
                        if (changedGrid) {
                            this.gridPasteCount++;
                            await dataService.saveGrid(grid);
                            if (grid.id === this.gridData.id) {
                                ownGridChanged = true;
                            }
                        }
                    }
                    if (ownGridChanged) {
                        this.$emit('reloadData');
                    }
                }
                this.currentMsg = this.msgTypes.SUCCESS_PASTE;
            },
            async copyToClipboard() {
                this.currentMsg = null;
                this.msgCount = 0;
                let elements = [];
                if (this.importExportGlobally) {
                    this.allGrids = this.allGrids || (await dataService.getGrids(true));
                    for (let grid of this.allGrids) {
                        elements = elements.concat(grid.gridElements);
                    }
                } else {
                    elements = [this.gridElement];
                }
                let copyString = '';
                let alreadyCopied = {}; // base -> tags
                for (let element of elements) {
                    let forms = element.wordForms || [];
                    let baseStrings = this.getBaseStringsFromWordForms(forms);
                    let baseFormsString = baseStrings.join(";");
                    for (let form of forms) {
                        let tags = JSON.stringify(form.tags).replaceAll('"', '').replaceAll("[", "").replaceAll("]", "").replaceAll(",", ", ");
                        let lang = form.lang || '';
                        let pronunciation = form.pronunciation || '';
                        let key = baseFormsString + tags + lang;
                        alreadyCopied[key] = alreadyCopied[key] || [];
                        if (!this.importExportGlobally || (baseFormsString && !alreadyCopied[key].includes(tags))) {
                            alreadyCopied[key].push(tags);
                            copyString += `${form.value}\t${lang}\t${tags}\t${baseFormsString}\t${pronunciation}\n`;
                            this.msgCount++;
                        }
                    }
                }
                util.copyToClipboard(copyString);
                this.currentMsg = this.msgTypes.SUCCESS_COPY;
            },
            /**
             * returns a list of base form strings in form of "<baseForm>:<lang>" from a given list of word forms.
             * @param wordForms
             * @return list of base form strings, e.g. ["sein:de", "be:en", "ser:es", ...]
             */
            getBaseStringsFromWordForms (forms) {
                forms = forms || [];
                let baseForms = forms.filter(form => form.tags.includes(constants.WORDFORM_TAG_BASE));
                return baseForms.map(form => `${form.value}:${form.lang}`);
            }
        },
        mounted() {
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>
.ewf-intro { display: flex; align-items: center; gap: var(--g-e3); margin: 0 0 var(--g-e4); }
.ewf-intro p { margin: 0; }
.ewf-intro-grilo { width: 64px; height: auto; flex: none; }
.ewf-direita { display: flex; justify-content: flex-end; }
.ewf-filtro { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--g-e3); margin-bottom: var(--g-e3); }
.ewf-filtro > .g-campo { flex: 1 1 220px; margin-bottom: 0; }
.ewf-idioma { text-transform: uppercase; }
.ewf-marcas { display: flex !important; flex-wrap: wrap; gap: var(--g-e1); margin-top: var(--g-e1); }
.ewf-botoes { display: flex; flex-wrap: nowrap; gap: 2px; }
.ewf-editando { border-color: var(--g-folha) !important; }
.ewf-form-item { flex: 1 1 100%; padding: var(--g-e3) 0 var(--g-e2); border-top: 1px solid var(--g-borda); }
.ewf-planilha { margin: var(--g-e2) 0 var(--g-e3); }
.ewf-msg { display: flex; align-items: center; gap: var(--g-e2); font-weight: 700; color: var(--g-tinta-2); }
.ewf-ok { color: var(--g-folha-escura); }
.ewf-gira { animation: ewf-girar 1s linear infinite; }
@keyframes ewf-girar { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .ewf-gira { animation: none; } }
</style>
