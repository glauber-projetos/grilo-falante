<template>
    <div class="ml-sel">
        <div class="ml-sel-cabeca">
            <h4 class="ml-sel-titulo">{{ $t('gestaoAcaoRadiosEscolhidas') }}</h4>
            <button type="button" class="g-btn" :disabled="gridData.webRadios.length === 0" @click="addAllRadioElements">
                <i class="ti ti-layout-grid-add" aria-hidden="true"></i><span>{{ $t('gestaoAcaoCriarBotaoCadaRadio') }}</span>
            </button>
        </div>
        <media-list v-model="gridData.webRadios"
                    img-prop="faviconUrl" id-prop="radioId" :label-fn="radio => radio.radioName"
                    :action-config-prop="{canSelect: false, canMoveUp: true, canRemove: true}"
                    :playingMedia="playingRadio"
                    @togglePlay="togglePlay">

        </media-list>
        <p class="g-dica" v-if="gridData.webRadios.length === 0">{{ $t('gestaoAcaoRadiosNenhuma') }}</p>

        <div class="ml-sel-cabeca ml-sel-busca">
            <h4 class="ml-sel-titulo">{{ $t('gestaoAcaoProcurarRadio') }}</h4>
            <span class="g-dica">
                <i18n path="radioSearchPoweredBy" tag="span">
                    <template v-slot:radioLink>
                        <a href="https://www.radio-browser.info/gui/#!/" target="_blank" rel="noopener">radio-browser.info</a>
                    </template>
                </i18n>
            </span>
        </div>
        <div class="ml-sel-barra">
            <search-bar v-model="webradioSearch" @input="searchRadios" :debounce-time="500"></search-bar>
        </div>
        <media-list :media-elems="webradioSearchResults"
                    v-model="gridData.webRadios"
                    img-prop="faviconUrl" id-prop="radioId" :label-fn="radio => radio.radioName"
                    @togglePlay="togglePlay"
                    :playingMedia="playingRadio"
                    :enableNext="hasMoreWebradios"
                    :enablePrev="webradioStartIndex !== 0"
                    @paginateNext="nextSearchResults()"
                    @paginatePrev="prevSearchResults()">
        </media-list>
        <div role="status" aria-live="polite">
            <p class="g-dica" v-show="webradioSearchResults.length === 0 && webradioSearch && !webradioSearching && !webradioSearchError">{{ $t('noRadioStationsFoundTryAnOtherSearchTerm') }}</p>
            <p class="g-aviso" v-show="webradioSearchError">
                <i class="ti ti-wifi-off" aria-hidden="true"></i>
                <span>{{ $t('searchingFailedNoConnectionToInternet') }}</span>
                <button type="button" class="g-btn g-btn-leve" @click="searchRadios"><i class="ti ti-refresh" aria-hidden="true"></i><span>{{ $t('retry') }}</span></button>
            </p>
            <p class="g-dica" v-show="webradioSearching"><i class="ti ti-loader-2 ml-girar" aria-hidden="true"></i> {{ $t('searching') }}</p>
        </div>
    </div>
</template>

<script>
    import {webradioService} from "../../js/service/webradioService";
    import {i18nService} from "../../js/service/i18nService";
    import {GridData} from "../../js/model/GridData";
    import {GridActionWebradio} from "../../js/model/GridActionWebradio";
    import {GridImage} from "../../js/model/GridImage";
    import {imageUtil} from "../../js/util/imageUtil";
    import MediaList from './media-list.vue';
    import SearchBar from './searchBar.vue';

    let WEBRADIO_LIMIT = 10;

    export default {
        components: { SearchBar, MediaList },
        props: {
            gridData: Object
        },
        data() {
            return {
                webradioSearchResults: [],
                webradioSearch: null,
                webradioStartIndex: 0,
                webradioSearching: false,
                webradioSearchError: false,
                hasMoreWebradios: false,
                playingRadio: null
            }
        },
        methods: {
            togglePlay(data) {
                this.playingRadio = webradioService.toggle(data);
            },
            addAllRadioElements() {
                if (!confirm(i18nService.t('thisActionAddsXNewElements', this.gridData.webRadios.length))) {
                    return;
                }
                let thiz = this;
                let promises = [];
                let promiseChain = Promise.resolve();
                thiz.gridData.webRadios.forEach((radio, index) => {
                    const makeNextPromise = (currentRadio) => () => {
                        let promise = imageUtil.urlToBase64(currentRadio.faviconUrl).then(base64 => {
                            let image = base64 ? new GridImage({data: base64}) : undefined;
                            let newElement = new GridData(thiz.gridData).getNewGridElement({
                                label: i18nService.getTranslationObject(currentRadio.radioName),
                                actions: [new GridActionWebradio({
                                    radioId: currentRadio.radioId,
                                    action: GridActionWebradio.WEBRADIO_ACTION_START
                                })],
                                image: image
                            });
                            thiz.gridData.gridElements.push(newElement);
                            return Promise.resolve();
                        });
                        return promise;
                    }
                    promiseChain = promiseChain.then(makeNextPromise(radio));
                });
            },
            searchRadios() {
                this.webradioStartIndex = 0;
                this.searchWebradiosInternal();
            },
            nextSearchResults() {
                let thiz = this;
                thiz.webradioStartIndex += WEBRADIO_LIMIT;
                thiz.searchWebradiosInternal();
            },
            prevSearchResults() {
                let thiz = this;
                thiz.webradioStartIndex -= WEBRADIO_LIMIT;
                thiz.searchWebradiosInternal();
            },
            searchWebradiosInternal() {
                let thiz = this;
                thiz.webradioSearching = true;
                thiz.webradioSearchError = false;
                webradioService.search(thiz.webradioSearch, WEBRADIO_LIMIT, thiz.webradioStartIndex).then(result => {
                    thiz.hasMoreWebradios = webradioService.hasMoreSearchResults();
                    thiz.webradioSearchResults = result;
                    thiz.webradioSearching = false;
                }).catch(error => {
                    thiz.webradioSearchError = true;
                    thiz.webradioSearching = false;
                });
            }
        },
        mounted() {
        }
    }
</script>

<style scoped>
    .ml-sel-cabeca {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--g-e2) var(--g-e3);
        margin: var(--g-e3) 0 var(--g-e2);
    }
    .ml-sel-busca {
        margin-top: var(--g-e5);
    }
    .ml-sel-titulo {
        font-family: var(--g-fonte-titulo);
        font-size: var(--g-t-grande);
        font-weight: 700;
        margin: 0;
        color: var(--g-tinta);
        text-transform: none;
        letter-spacing: 0;
    }
    .ml-sel-barra {
        margin-bottom: var(--g-e3);
    }
    .ml-sel p {
        margin: var(--g-e2) 0 0;
    }
    .ml-sel .g-aviso {
        flex-wrap: wrap;
        align-items: center;
    }
    .ml-girar {
        display: inline-block;
        animation: ml-girar 1s linear infinite;
    }
    @keyframes ml-girar {
        to { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
        .ml-girar { animation: none; }
    }
</style>
