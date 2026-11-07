<template>
    <div class="ei" @dragenter="preventDefault" @dragover="preventDefault" @drop="imageDropped">
        <input type="file" id="inputImg" class="ei-arquivo" tabindex="-1" aria-hidden="true" @change="changedImg($event.target)" accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"/>
        <input type="file" id="inputImgCamera" class="ei-arquivo" tabindex="-1" aria-hidden="true" @change="changedImg($event.target)" accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif" capture="environment"/>

        <section class="gm-secao">
            <h3><i class="ti ti-photo" aria-hidden="true"></i>{{ $t('gestaoBotaoImagemAtual') }}</h3>

            <image-cropper v-if="hasImage && showCropper"
                           :src="gridElement.image.data || gridElement.image.url"
                           :cell-aspect="cellAspect"
                           :output-width="cropOutputWidth"
                           @apply="onCropApplied" @cancel="showCropper = false" @error="showCropper = false"/>

            <div v-else class="ei-atual">
                <div class="ei-previa-area">
                    <div v-if="hasImage" class="img-preview-cell" :style="{'aspect-ratio': String(cellAspect)}">
                        <img id="imgPreview" :class="{'cover': previewCover}" :src="gridElement.image.data || gridElement.image.url" :alt="$t('gestaoBotaoImagemAtual')"/>
                    </div>
                    <div v-else class="ei-sem-imagem">
                        <i class="ti ti-photo-off" aria-hidden="true"></i>
                        <span>{{ $t('gestaoBotaoSemImagem') }}</span>
                        <span class="ei-arraste">{{ $t('gestaoBotaoArrasteAqui') }}</span>
                    </div>
                    <p v-if="hasImage && gridElement.image.author" class="g-dica ei-autor">
                        {{ $t('gestaoBotaoFiguraDe') }} <a :href="gridElement.image.authorURL" target="_blank" rel="noopener">{{ gridElement.image.author }}</a>
                    </p>
                </div>

                <div class="ei-acoes">
                    <button type="button" class="g-btn g-btn-grande g-btn-bloco take-photo" @click="abrirArquivo('inputImgCamera')">
                        <i class="ti ti-camera" aria-hidden="true"></i>{{ $t('gestaoBotaoTirarFoto') }}
                    </button>
                    <button type="button" class="g-btn g-btn-grande g-btn-bloco" @click="abrirArquivo('inputImg')">
                        <i class="ti ti-upload" aria-hidden="true"></i>{{ $t('gestaoBotaoEscolherAparelho') }}
                    </button>
                    <button type="button" class="g-btn g-btn-grande g-btn-bloco" @click="focarBusca()">
                        <i class="ti ti-photo-search" aria-hidden="true"></i>{{ $t('gestaoBotaoProcurarFiguraBanco') }}
                    </button>
                    <template v-if="hasImage">
                        <button v-if="canCrop" type="button" class="g-btn g-btn-bloco" @click="showCropper = true">
                            <i class="ti ti-crop" aria-hidden="true"></i>{{ $t('gestaoBotaoEnquadrar') }}
                        </button>
                        <div class="g-campo ei-encaixe">
                            <label for="imageFit">{{ $t('gestaoBotaoComoCabe') }}</label>
                            <select id="imageFit" :value="gridElement.image.fit || ''" @change="$set(gridElement.image, 'fit', $event.target.value)">
                                <option value="">{{ $t('gestaoBotaoCabeAutomatico') }}</option>
                                <option :value="GridImage.FIT_COVER">{{ $t('gestaoBotaoCabePreencher') }}</option>
                                <option :value="GridImage.FIT_CONTAIN">{{ $t('gestaoBotaoCabeInteira') }}</option>
                            </select>
                        </div>
                        <button type="button" class="g-btn g-btn-perigo g-btn-bloco" @click="clearImage">
                            <i class="ti ti-trash" aria-hidden="true"></i>{{ $t('gestaoBotaoTirarImagem') }}
                        </button>
                    </template>
                    <button type="button" class="g-btn g-btn-leve g-btn-bloco" @click="pasteImage()">
                        <i class="ti ti-clipboard" aria-hidden="true"></i>{{ $t('gestaoBotaoColarImagem') }}
                    </button>
                </div>
            </div>
        </section>

        <section class="gm-secao">
            <h3><i class="ti ti-photo-search" aria-hidden="true"></i>{{ $t('gestaoBotaoProcurarFiguraBanco') }}</h3>
            <div class="g-campo">
                <label for="inputSearch">{{ $t('gestaoBotaoBuscarQual') }}</label>
                <div class="gm-campo-linha">
                    <input id="inputSearch" ref="busca" type="search" v-focus v-model="searchText" @input="searchInput(500, $event)" :placeholder="$t('gestaoBotaoBuscarExemplo')" autocomplete="off"/>
                    <button type="button" class="g-btn g-btn-icone" @click="clearSearch" :aria-label="$t('gestaoBotaoLimparBusca')" :title="$t('gestaoBotaoLimparBusca')">
                        <i class="ti ti-x" aria-hidden="true"></i>
                    </button>
                </div>
                <span class="g-dica">{{ $t('gestaoBotaoBuscarDica', [searchProvider ? searchProvider.name : 'ARASAAC']) }}</span>
            </div>
            <button v-if="gridElement.label[i18nService.getContentLang()]" type="button" class="g-btn ei-pelo-texto" @click="searchText = gridElement.label[i18nService.getContentLang()]; searchInput(0);">
                <i class="ti ti-search" aria-hidden="true"></i>{{ $t('gestaoBotaoBuscarPeloTexto', [gridElement.label[i18nService.getContentLang()]]) }}
            </button>

            <ul v-if="searchResults && searchResults.length > 0" class="ei-resultados" :aria-label="$t('gestaoBotaoResultados')">
                <template v-for="(imgElement, index) in searchResults"><li v-if="imgElement.url" :key="index">
                    <button type="button" class="ei-figura" :aria-pressed="(gridElement.image.url === imgElement.url).toString()"
                            :aria-label="$t('gestaoBotaoUsarFigura', [index + 1, imgElement.author || ''])" :title="$t('byAuthor', [imgElement.author])"
                            @click="gridElement.image = imgElement;">
                        <img :src="imgElement.url" alt="" loading="lazy"/>
                        <i v-if="gridElement.image.url === imgElement.url" class="ti ti-check ei-escolhida" aria-hidden="true"></i>
                    </button>
                </li></template>
                <li v-show="hasNextChunk">
                    <button type="button" class="ei-figura ei-mais" @click="searchMore">
                        <i class="ti ti-plus" aria-hidden="true"></i><span>{{ $t('gestaoBotaoMostrarMais') }}</span>
                    </button>
                </li>
            </ul>
            <p v-show="searchLoading" class="ei-estado" role="status"><i class="ti ti-loader-2 ei-gira" aria-hidden="true"></i>{{ $t('gestaoBotaoProcurando') }}</p>
            <p v-show="searchError" class="g-aviso" role="alert"><i class="ti ti-wifi-off" aria-hidden="true"></i><span>{{ $t('gestaoBotaoBuscaFalhou') }}</span></p>
            <div v-show="!searchError && !searchLoading && searchResults && searchResults.length === 0" class="ei-nada">
                <img src="app/img/grilo/mascote/grilo-duvida.webp" alt="" aria-hidden="true" class="ei-nada-grilo"/>
                <p>{{ $t('gestaoBotaoNadaEncontrado') }}</p>
            </div>
        </section>

        <details class="gm-avancado" v-if="searchProvider">
            <summary>{{ $t('gestaoMaisOpcoes') }}</summary>
            <div class="gm-avancado-corpo">
                <div class="gm-grade">
                    <div class="g-campo">
                        <label for="searchProvider">{{ $t('gestaoBotaoBancoFiguras') }}</label>
                        <select id="searchProvider" v-model="searchProvider" @change="searchInput(0); localStorageService.save(EDIT_ELEM_SELECTED_SEARCH_PROVIDER, searchProvider.name)">
                            <option v-for="provider in searchProviders" :value="provider">{{provider.name}}</option>
                        </select>
                        <a class="g-dica" :href="searchProvider.url" target="_blank" rel="noopener">{{ $t('gestaoBotaoSobreBanco', [searchProvider.name]) }} <i class="ti ti-external-link" aria-hidden="true"></i></a>
                    </div>
                    <div class="g-campo" v-if="searchProvider.searchLangs">
                        <label for="searchLang">{{ $t('gestaoBotaoIdiomaBusca') }}</label>
                        <select id="searchLang" v-model="searchLang" @change="searchInput(0); localStorageService.saveJSON(EDIT_ELEM_SEARCH_LANG_PREFIX + searchProvider.name, searchLang)">
                            <option :value="null">{{ $t('gestaoBotaoIdiomaAtual') }}</option>
                            <option v-for="value in searchProvider.searchLangs" :value="value">{{ $t('lang.' + value) }}</option>
                        </select>
                    </div>
                </div>
                <div v-for="option in searchProvider.options">
                    <label class="g-marcar" v-if="option.type === constants.OPTION_TYPES.BOOLEAN">
                        <input :id="searchProvider.name + option.name" type="checkbox" v-model="option.value" @input="searchInput(0)"/>
                        <span>{{$t(searchProvider.name + option.name)}}</span>
                    </label>
                    <div class="g-campo" v-if="option.type === constants.OPTION_TYPES.COLOR">
                        <label :for="searchProvider.name + option.name">{{$t(searchProvider.name + option.name)}}</label>
                        <div class="gm-campo-linha">
                            <input :id="searchProvider.name + option.name" type="color" v-model="option.value" @input="searchInput(0)"/>
                            <button type="button" class="g-btn" :disabled="!option.value" @click="option.value = undefined; searchInput(0);">{{ $t('gestaoBotaoSemCor') }}</button>
                        </div>
                        <span v-if="!option.value" class="g-dica">{{ $t('gestaoBotaoAgoraSemCor') }}</span>
                    </div>
                    <div class="g-campo" v-if="option.type === constants.OPTION_TYPES.SELECT">
                        <label :for="searchProvider.name + option.name">{{$t(searchProvider.name + option.name)}}</label>
                        <select :id="searchProvider.name + option.name" v-model="option.value" @change="searchInput(0)">
                            <option :value="undefined">{{ $t('gestaoBotaoNenhum') }}</option>
                            <option v-for="value in option.options" :value="value">{{ $t(value) }}</option>
                        </select>
                    </div>
                    <div class="g-campo" v-if="option.type === constants.OPTION_TYPES.SELECT_COLORS">
                        <span class="ei-rotulo" :id="'rot-' + searchProvider.name + option.name">{{$t(searchProvider.name + option.name)}}</span>
                        <div class="ei-cores" role="group" :aria-labelledby="'rot-' + searchProvider.name + option.name">
                            <button type="button" class="g-btn ei-cor-nenhuma" :aria-pressed="(option.value === undefined).toString()" @click="option.value = undefined; afterColorChange(); searchInput(0);">{{ $t('gestaoBotaoNenhum') }}</button>
                            <button v-for="(color, index) in option.colors" type="button" class="ei-cor" :aria-label="option.options[index]" :title="option.colors[index]"
                                    :aria-pressed="(option.options[index] === option.value).toString()" :style="`background-color: ${color};`"
                                    @click="option.value = option.options[index]; afterColorChange(); searchInput(0);"></button>
                        </div>
                    </div>
                </div>
            </div>
        </details>
    </div>
</template>

<script>
    import {imageUtil} from './../../js/util/imageUtil';
    import './../../css/modal.css';
    import {helpService} from "../../js/service/helpService";
    import {util} from "../../js/util/util";
    import {constants} from "../../js/util/constants.js";
    import ImageCropper from "../components/imageCropper.vue";
    import {dataService} from "../../js/service/data/dataService";
    import {openSymbolsService} from "../../js/service/pictograms/openSymbolsService.js";
    import {arasaacService} from "../../js/service/pictograms/arasaacService.js";
    import {globalSymbolsService} from "../../js/service/pictograms/globalSymbolsService.js";
    import {GridImage} from "../../js/model/GridImage.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {localStorageService} from "../../js/service/data/localStorageService.js";

    const EDIT_ELEM_SELECTED_SEARCH_PROVIDER = "AG_EDIT_ELEM_SELECTED_SEARCH_PROVIDER";
    const EDIT_ELEM_SEARCH_LANG_PREFIX = "EDIT_ELEM_SEARCH_LANG_";

    export default {
        props: ['gridElement', 'gridData', 'imageSearch'],
        components: {ImageCropper},
        computed: {
            hasImage: function () {
                return this.gridElement && this.gridElement.image && (this.gridElement.image.data || this.gridElement.image.url);
            },
            canCrop() {
                // SVG symbols are vector graphics, cropping them makes no sense
                let img = this.gridElement.image;
                return img && !((img.data || '').startsWith('data:image/svg') || (img.url || '').toLowerCase().split('?')[0].endsWith('.svg'));
            },
            previewCover() {
                return GridImage.shouldCover(this.gridElement.image, this.metadata);
            },
            cropOutputWidth() {
                // enough resolution for sharp display on high-dpi tablets, but small enough for the database
                return Math.min(900, Math.max(400, 2 * (this.elementW || 200)));
            }
        },
        data: function () {
            return {
                searchText: null,
                searchProviders: [arasaacService.getSearchProviderInfo(), globalSymbolsService.getSearchProviderInfo(), openSymbolsService.getSearchProviderInfo()],
                searchProvider: null,
                searchResults: null,
                searchLoading: false,
                searchLang: null,
                searchError: false,
                hasNextChunk: true,
                showCropper: false,
                elementW: 0,
                cellAspect: 1,
                metadata: null,
                GridImage: GridImage,
                constants: constants,
                i18nService: i18nService,
                localStorageService: localStorageService,
                EDIT_ELEM_SELECTED_SEARCH_PROVIDER: EDIT_ELEM_SELECTED_SEARCH_PROVIDER,
                EDIT_ELEM_SEARCH_LANG_PREFIX: EDIT_ELEM_SEARCH_LANG_PREFIX
            }
        },
        watch: {
            searchProvider: {
                handler(newValue, oldValue) {
                    let hasOptions = newValue && newValue.options;
                    if (hasOptions) {
                        if (this.gridElement.image && this.gridElement.image.url && this.gridElement.image.searchProviderName === arasaacService.SEARCH_PROVIDER_NAME) {
                            let newUrl = arasaacService.getUpdatedUrl(this.gridElement.image.url, newValue.options);
                            if(newUrl !== this.gridElement.image.url) {
                                this.gridElement.image.url = newUrl;
                                this.gridElement.image.searchProviderOptions = newValue.options;
                            }
                        }
                    }
                },
                deep: true
            }
        },
        methods: {
            changedImg(input) {
                let thiz = this;
                thiz.clearImage();
                imageUtil.getBase64FromInput(input).then(base64 => {
                    thiz.setBase64(base64);
                });
            },
            async pasteImage() {
                let base64 = await util.getClipboardImageAsBase64();
                this.setBase64(base64);
            },
            imageDropped(event) {
                let thiz = this;
                event.preventDefault();
                this.clearImage();
                if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                    let file = event.dataTransfer.files[0];
                    if (constants.ALLOWED_IMG_MIME_TYPES.includes(file.type)) {
                      $('#inputImg')[0].files = event.dataTransfer.files;
                      this.changedImg($('#inputImg')[0]);
                    } else {
                      console.warn("Unsupported file type dropped:", file.type);
                    }
                } else {
                    let url = event.dataTransfer.getData('URL');
                    imageUtil.urlToBase64(url).then(resultBase64 => {
                        let mimeType = imageUtil.getMimeTypeFromBase64(resultBase64);
                        if (constants.ALLOWED_IMG_MIME_TYPES.includes(mimeType)) {
                          thiz.setBase64(resultBase64);
                        } else {
                          console.warn("Unsupported image type from URL:", mimeType);
                        }
                    });
                }
            },
            async setBase64(base64) {
                if (!base64) {
                    return;
                }
                let originalKb = Math.round(base64.length / 1024);
                if (originalKb > constants.MAX_BASE64_IMAGE_SIZE_KB) {
                    try {
                      let maxWidth = Math.max(2 * this.elementW, 200);
                      let compressed = await imageUtil.compressToSize(base64, maxWidth, constants.MAX_BASE64_IMAGE_SIZE_KB);
                      if (compressed && compressed.length < base64.length) {
                        log.info(`compressed image from ${originalKb}kB to ${Math.round(compressed.length / 1024)}kB`);
                        this.setValidatedBase64(compressed);
                      } else {
                        log.info(`converting not reduced size (now ${Math.round(compressed.length / 1024)}kB), using old image with ${originalKb}kB`);
                        this.setValidatedBase64(base64);
                      }
                    } catch(e) {
                      log.warn(`couldn't compress image below ${constants.MAX_BASE64_IMAGE_SIZE_KB}kB!`);
                      this.clearImage();
                    }
                } else {
                    log.info(`image size is ${Math.round(base64.length / 1024)}kB`);
                    this.setValidatedBase64(base64);
                }
            },
            async onCropApplied(base64) {
                await this.setBase64(base64);
                this.$set(this.gridElement.image, 'fit', GridImage.FIT_COVER);
                this.showCropper = false;
            },
            setValidatedBase64(base64) {
                this.clearImage();
                this.gridElement.image.data = base64;
            },
            clearImage() {
                this.gridElement.image = JSON.parse(JSON.stringify(new GridImage()));
            },
            abrirArquivo(id) {
                // só apresentação: abre o seletor de arquivo/câmera escondido
                let el = document.getElementById(id);
                if (el) el.click();
            },
            focarBusca() {
                // só apresentação: leva até o campo de busca (e já procura pelo texto do botão, se ainda não houver busca)
                let texto = this.gridElement.label && this.gridElement.label[i18nService.getContentLang()];
                if (!this.searchText && texto) {
                    this.searchText = texto;
                    this.searchInput(0);
                }
                let campo = this.$refs.busca;
                if (campo) {
                    campo.focus();
                    if (campo.scrollIntoView) campo.scrollIntoView({block: 'center'});
                }
            },
            preventDefault(event) {
                event.preventDefault();
            },
            openHelp() {
                helpService.openHelp();
            },
            search(keyword) {
                this.searchText = keyword;
                this.searchInput(0);
            },
            afterColorChange() {
                this.$forceUpdate(); // get color change in search option working, if no searchText
                this.$set(this.searchProvider, 'options', JSON.parse(JSON.stringify(this.searchProvider.options))); // trigger watch for color change, don't know why it's needed
            },
            searchInput(debounceTime, event) {
                let thiz = this;
                thiz.searchError = false;
                thiz.searchText = event ? event.target.value : thiz.searchText;
                if (!thiz.searchText) {
                    return;
                }
                debounceTime = debounceTime === undefined ? 500 : debounceTime;
                thiz.searchResults = [];
                thiz.searchLoading = true;
                util.debounce(function () {
                    thiz.searchProvider.service.query(thiz.searchText, thiz.searchProvider.options, thiz.searchLang).then(resultList => {
                        thiz.processSearchResults(resultList);
                    }).catch(() => {
                        thiz.searchError = true;
                        thiz.searchLoading = false;
                    });
                }, debounceTime);
            },
            searchMore() {
                let thiz = this;
                thiz.searchProvider.service.nextChunk().then(resultList => {
                    thiz.processSearchResults(resultList);
                });
            },
            clearSearch() {
                this.searchLoading = false;
                this.searchResults = null;
                this.searchText = "";
            },
            processSearchResults(resultList) {
                let thiz = this;
                thiz.hasNextChunk = thiz.searchProvider.service.hasNextChunk();
                thiz.searchResults = thiz.searchResults.concat(resultList);
                thiz.searchLoading = false;
            }
        },
        mounted() {
            let currentSearchProviderName = this.gridElement.image && this.gridElement.image.searchProviderName;
            let searchProviderToSelect = localStorageService.get(EDIT_ELEM_SELECTED_SEARCH_PROVIDER);
            let currentSearchOptions = currentSearchProviderName === searchProviderToSelect ? this.gridElement.image.searchProviderOptions : null;
            this.searchProvider = this.searchProviders.filter(provider => provider.name === searchProviderToSelect)[0] || this.searchProviders[0];
            if (currentSearchOptions) {
                let currentNames = currentSearchOptions.map(e => e.name);
                for (let i = 0; i < this.searchProvider.options.length; i++) {
                    let index = currentNames.indexOf(this.searchProvider.options[i].name);
                    if (index > -1 && currentSearchOptions[index].value) {
                        this.searchProvider.options[i].value = currentSearchOptions[index].value;
                    }
                }
            }
            this.searchLang = localStorageService.getJSON(EDIT_ELEM_SEARCH_LANG_PREFIX + this.searchProvider.name);
            helpService.setHelpLocation('03_appearance_layout', '#edit-modal');
            let maxElementX = Math.max(...this.gridData.gridElements.map(e => e.x + 1));
            let containerRect = $('#grid-container')[0].getBoundingClientRect();
            this.elementW = Math.round(containerRect.width / maxElementX) * (this.gridElement.width || 1);
            let rowCount = Math.max(this.gridData.rowCount || 1, ...this.gridData.gridElements.map(e => e.y + (e.height || 1)));
            let elementH = containerRect.height / rowCount * (this.gridElement.height || 1);
            let hasLabel = this.gridElement.label && Object.values(this.gridElement.label).some(l => !!l);
            let imageAreaH = elementH * (hasLabel ? 0.75 : 0.95); // part of the cell used by the label
            this.cellAspect = imageAreaH > 0 ? Math.min(3, Math.max(0.33, (this.elementW * 0.95) / imageAreaH)) : 1;
            dataService.getMetadata().then(metadata => {
                this.metadata = metadata;
            });
            if (this.imageSearch) {
                this.search(this.imageSearch);
            }
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
    .ei-arquivo { display: none; }

    .ei-atual { display: flex; flex-wrap: wrap; gap: var(--g-e5); align-items: flex-start; }
    .ei-previa-area { flex: 1 1 240px; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: var(--g-e2); }
    .ei-acoes { flex: 1 1 260px; min-width: 0; display: flex; flex-direction: column; gap: var(--g-e2); }
    .ei-acoes .g-btn { justify-content: flex-start; text-align: left; }
    .ei-encaixe { margin: var(--g-e1) 0; }

    .img-preview-cell {
        position: relative;
        width: 100%;
        max-width: 280px;
        max-height: 320px;
        border: 2px solid var(--g-borda);
        border-radius: var(--g-raio);
        overflow: hidden;
        background: var(--g-superficie);
    }
    #imgPreview {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
    #imgPreview.cover {
        object-fit: cover;
        object-position: center 30%;
    }
    .ei-sem-imagem {
        width: 100%; max-width: 280px; aspect-ratio: 1;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--g-e2);
        border: 2px dashed var(--g-borda-forte); border-radius: var(--g-raio);
        background: var(--g-superficie-2); color: var(--g-tinta-2); text-align: center; padding: var(--g-e4);
        font-weight: 700;
    }
    .ei-sem-imagem .ti { font-size: 48px; color: var(--g-tinta-3); }
    .ei-arraste { font-weight: 400; font-size: var(--g-t-legenda); }
    .ei-autor { margin: 0; text-align: center; }
    .ei-autor a { color: var(--g-folha-escura); }

    .ei-pelo-texto { margin-bottom: var(--g-e4); max-width: 100%; }
    .ei-resultados {
        list-style: none; margin: 0 0 var(--g-e3); padding: 0;
        display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: var(--g-e2);
    }
    .ei-resultados > li { margin: 0; }
    .ei-figura {
        position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--g-e1);
        width: 100%; aspect-ratio: 1; min-height: var(--g-alvo); height: auto;
        margin: 0; padding: var(--g-e1);
        border: 2px solid var(--g-borda); border-radius: var(--g-raio-p);
        background: var(--g-superficie); color: var(--g-folha-escura); cursor: pointer;
        font-family: var(--g-fonte); font-size: var(--g-t-legenda); font-weight: 700; text-transform: none; letter-spacing: 0; line-height: 1.2;
    }
    .ei-figura img { width: 100%; height: 100%; object-fit: contain; }
    .ei-figura:hover { border-color: var(--g-borda-forte); }
    .ei-figura[aria-pressed="true"] { border-color: var(--g-folha); border-width: 3px; background: var(--g-folha-clara); }
    .ei-figura:focus-visible { outline: none; box-shadow: var(--g-foco); }
    .ei-escolhida {
        position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border-radius: 50%;
        display: grid; place-items: center; background: var(--g-folha); color: #fff; font-size: 16px;
    }
    .ei-mais { background: var(--g-folha-clara); border-style: dashed; }
    .ei-mais .ti { font-size: 28px; }
    .ei-nada { display: flex; align-items: center; gap: var(--g-e3); color: var(--g-tinta-2); font-weight: 700; }
    .ei-nada p { margin: 0; }
    .ei-nada-grilo { width: 72px; height: auto; flex: none; }
    .ei-estado { display: flex; align-items: center; gap: var(--g-e2); color: var(--g-tinta-2); font-weight: 700; margin: 0 0 var(--g-e2); }
    .ei-estado .ti { font-size: 1.4em; }
    .ei-gira { animation: ei-girar 1s linear infinite; }
    @keyframes ei-girar { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .ei-gira { animation: none; } }

    .ei-rotulo { font-weight: 700; }
    .ei-cores { display: flex; flex-wrap: wrap; gap: var(--g-e2); }
    .ei-cor {
        width: var(--g-alvo); min-width: var(--g-alvo); height: var(--g-alvo); margin: 0; padding: 0;
        border: 2px solid var(--g-borda-forte); border-radius: var(--g-raio-p); cursor: pointer;
    }
    .ei-cor[aria-pressed="true"], .ei-cor-nenhuma[aria-pressed="true"] { box-shadow: 0 0 0 3px var(--g-superficie), 0 0 0 6px var(--g-folha); }
    .ei-cor:focus-visible { outline: none; box-shadow: var(--g-foco); }

    @media (pointer: fine) {
        .take-photo {
            display: none;
        }
    }
    @media (pointer: coarse) {
        .ei-arraste { display: none; }
    }
</style>
