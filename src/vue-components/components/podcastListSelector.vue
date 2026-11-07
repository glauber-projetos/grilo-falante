<template>
    <div class="ml-sel">
        <div class="ml-sel-cabeca">
            <h4 class="ml-sel-titulo">{{ $t('gestaoAcaoPodcastsEscolhidos') }}</h4>
            <button type="button" class="g-btn" :disabled="selectedPodcasts.length === 0" @click="addAllPodcastElements">
                <i class="ti ti-layout-grid-add" aria-hidden="true"></i><span>{{ $t('gestaoAcaoCriarBotaoCadaPodcast') }}</span>
            </button>
        </div>
        <media-list v-model="selectedPodcasts"
                    @input="$emit('input', selectedPodcasts)"
                    img-prop="image" id-prop="guid" title-prop="description"
                    :label-fn="podcast => `${podcast.title} (${podcast.author})`"
                    :action-config-prop="{canSelect: false, canMoveUp: true, canRemove: true}"
                    :playingMedia="playingPodcast"
                    @togglePlay="togglePlay"
                    :internal-pagination="true" :items-per-page="15">
        </media-list>
        <p class="g-dica" v-if="selectedPodcasts.length === 0">{{ $t('gestaoAcaoPodcastsNenhum') }}</p>

        <div class="ml-sel-cabeca ml-sel-busca">
            <h4 class="ml-sel-titulo">{{ $t('gestaoAcaoProcurarPodcast') }}</h4>
            <span class="g-dica">
                <i18n path="searchPoweredBy" tag="span">
                    <template v-slot:opensymbolsLink>
                        <a href="https://podcastindex.org/" target="_blank" rel="noopener">podcastindex.org</a>
                    </template>
                </i18n>
            </span>
        </div>
        <div class="ml-sel-barra">
            <search-bar v-model="searchTerm" @input="searchPodcasts" :debounce-time="500"></search-bar>
        </div>
        <media-list :media-elems="searchResults"
                    v-model="selectedPodcasts"
                    @input="$emit('input', selectedPodcasts)"
                    img-prop="image" id-prop="guid" title-prop="description"
                    :label-fn="podcast => `${podcast.title} (${podcast.author})`"
                    @togglePlay="togglePlay"
                    :playingMedia="playingPodcast"
                    :internal-pagination="true">
        </media-list>
        <div role="status" aria-live="polite">
            <p class="g-dica" v-show="searchResults.length === 0 && searchTerm && !isSearching && !searchError">{{ $t('noPodcastsFoundTryAnOtherSearchTerm') }}</p>
            <p class="g-aviso" v-show="searchError">
                <i class="ti ti-wifi-off" aria-hidden="true"></i>
                <span>{{ $t('searchingFailedNoConnectionToInternet') }}</span>
                <button type="button" class="g-btn g-btn-leve" @click="searchPodcasts"><i class="ti ti-refresh" aria-hidden="true"></i><span>{{ $t('retry') }}</span></button>
            </p>
            <p class="g-dica" v-show="isSearching"><i class="ti ti-loader-2 ml-girar" aria-hidden="true"></i> {{ $t('searching') }}</p>
        </div>
    </div>
</template>

<script>
    import MediaList from './media-list.vue';
    import SearchBar from './searchBar.vue';
    import { podcastService } from '../../js/service/podcastService';
    import { PodcastInfo } from '../../js/model/PodcastInfo';
    import { i18nService } from '../../js/service/i18nService';
    import { GridImage } from '../../js/model/GridImage';
    import { GridData } from '../../js/model/GridData';
    import { GridActionPodcast } from '../../js/model/GridActionPodcast';

    export default {
        components: { SearchBar, MediaList },
        props: {
            value: Array,
            gridData: Object
        },
        data() {
            return {
                PAGINATION_LIMIT: 10,
                selectedPodcasts: this.value,
                searchResults: [],
                searchTerm: null,
                isSearching: false,
                searchError: false,
                playingPodcast: null
            }
        },
        methods: {
            async togglePlay(podcastInfo) {
                let playingPodcastGuid = await podcastService.toggle(podcastInfo.guid);
                this.playingPodcast = new PodcastInfo({ guid: playingPodcastGuid });
            },
            searchPodcasts() {
                this.isSearching = true;
                this.searchError = false;
                podcastService.search(this.searchTerm).then(result => {
                    this.searchResults = result;
                    this.isSearching = false;
                }).catch(() => {
                    this.searchError = true;
                    this.isSearching = false;
                });
            },
            addAllPodcastElements() {
                if (!confirm(i18nService.t('thisActionAddsXNewElements', this.selectedPodcasts.length))) {
                    return;
                }
                for (let podcast of this.selectedPodcasts) {
                    let image = new GridImage({
                        url: podcast.image,
                        author: podcast.author,
                        authorURL: podcast.link
                    });
                    let newElement = new GridData(this.gridData).getNewGridElement({
                        label: i18nService.getTranslationObject(podcast.title),
                        actions: [new GridActionPodcast({
                            podcastGuid: podcast.guid,
                            action: GridActionPodcast.actions.TOGGLE
                        })],
                        image: image
                    });
                    this.gridData.gridElements.push(JSON.parse(JSON.stringify(newElement)));
                }
            },
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
