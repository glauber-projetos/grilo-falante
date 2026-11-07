<template>
    <div class="modal">
        <div class="modal-mask" style="z-index: 9999">
            <div class="modal-wrapper">
                <div class="modal-container phrase-modal" @keydown.esc="$emit('close')" role="dialog" aria-modal="true" aria-labelledby="phraseModalTitle">
                    <div class="phrase-top">
                        <button class="phrase-back" @click="$emit('close')" :aria-label="$t('close')" :title="$t('close')"><i class="fas fa-arrow-left"></i></button>
                        <h1 id="phraseModalTitle" class="phrase-title">{{ $t('phrasesTitle') }}</h1>
                        <div class="phrase-tabs" role="tablist">
                            <button role="tab" id="phraseTabFavorites" :aria-selected="String(tab === TAB_FAVORITES)" :class="{ selected: tab === TAB_FAVORITES }" @click="tab = TAB_FAVORITES">
                                <i class="fas fa-star"></i> {{ $t('phrasesFavorites') }} <span class="phrase-count">{{ favorites.length }}</span>
                            </button>
                            <button role="tab" id="phraseTabRecent" :aria-selected="String(tab === TAB_RECENT)" :class="{ selected: tab === TAB_RECENT }" @click="tab = TAB_RECENT">
                                <i class="fas fa-history"></i> {{ $t('phrasesRecentShort') }} <span class="phrase-count">{{ recent.length }}</span>
                            </button>
                        </div>
                    </div>

                    <div class="phrase-body" :class="{ 'with-hint': !locked }">
                        <div class="phrase-list-area" role="tabpanel" :aria-labelledby="tab === TAB_FAVORITES ? 'phraseTabFavorites' : 'phraseTabRecent'">
                            <div v-if="loading" class="phrase-empty"><i class="fas fa-spinner fa-spin fa-2x"></i></div>
                            <div v-if="!loading && shownEntries.length === 0" class="phrase-empty">
                                <img v-if="!locked" src="app/img/grilo/grilo-pensando.svg" alt="" aria-hidden="true" class="phrase-empty-grilo"/>
                                <i v-else class="far fa-comment fa-3x"></i>
                                <p>{{ tab === TAB_FAVORITES && recent.length > 0 ? $t('phrasesFavoritesEmpty') : $t('phrasesEmpty') }}</p>
                            </div>
                            <ul class="phrase-list" v-if="!loading">
                                <li v-for="(entry, index) in shownEntries" :key="tab + entry.text" class="phrase-row" :class="{ favorite: entry.favorite }">
                                    <button class="phrase-main" @click="usePhrase(entry, shownElements[index])" :aria-label="entry.text">
                                        <span class="phrase-images" v-if="hasImages(shownElements[index])">
                                            <span v-for="(element, i) in imagesOf(shownElements[index])" :key="i" class="phrase-img-wrapper">
                                                <img :src="element.image.data || element.image.url" alt="" draggable="false"/>
                                            </span>
                                        </span>
                                        <span class="phrase-text">{{ entry.text }}</span>
                                        <span class="phrase-play" aria-hidden="true"><i class="fas fa-play"></i></span>
                                    </button>
                                    <button v-if="!locked" class="phrase-icon-btn phrase-star" :class="{ active: entry.favorite }" @click="toggleFavorite(entry)"
                                            :title="entry.favorite ? $t('phrasesRemoveFavorite') : $t('phrasesAddFavorite')"
                                            :aria-label="entry.favorite ? $t('phrasesRemoveFavorite') : $t('phrasesAddFavorite')"
                                            :aria-pressed="String(!!entry.favorite)">
                                        <i :class="entry.favorite ? 'fas fa-star' : 'far fa-star'"></i>
                                    </button>
                                    <button v-if="!locked && tab === TAB_RECENT" class="phrase-icon-btn phrase-remove" @click="remove(entry)" :title="$t('phrasesRemove')" :aria-label="$t('phrasesRemove')">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <aside v-if="!locked" class="phrase-hint" aria-hidden="true">
                            <img src="app/img/grilo/grilo-apontando.svg" alt="" class="phrase-hint-grilo"/>
                            <p class="phrase-hint-main">{{ $t('phrasesHintPlay') }}</p>
                            <p class="phrase-hint-sub">{{ $t('phrasesHintStar') }}</p>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * Shows the favorite and recently spoken sentences of the current user (child).
 * Touching a sentence puts it into the sentence bar and speaks it.
 * When the app is locked (child mode), sentences can only be used, not changed or removed,
 * and the Grilo hint is hidden to avoid distraction.
 */
import './../../css/modal.css';
import { phraseHistoryService } from '../../js/service/phraseHistoryService';
import { collectElementService } from '../../js/service/collectElementService';
import { util } from '../../js/util/util';

const TAB_FAVORITES = 'TAB_FAVORITES';
const TAB_RECENT = 'TAB_RECENT';

export default {
    data() {
        return {
            loading: true,
            favorites: [],
            recent: [],
            favoriteElements: [],
            recentElements: [],
            locked: util.isUILocked(),
            tab: TAB_FAVORITES,
            TAB_FAVORITES: TAB_FAVORITES,
            TAB_RECENT: TAB_RECENT
        };
    },
    computed: {
        shownEntries() {
            return this.tab === TAB_FAVORITES ? this.favorites : this.recent;
        },
        shownElements() {
            return this.tab === TAB_FAVORITES ? this.favoriteElements : this.recentElements;
        }
    },
    methods: {
        async reload() {
            let phrases = await phraseHistoryService.getPhrases();
            this.favoriteElements = await phraseHistoryService.resolveElements(phrases.favorites);
            this.recentElements = await phraseHistoryService.resolveElements(phrases.recent);
            this.favorites = phrases.favorites;
            this.recent = phrases.recent;
            this.loading = false;
        },
        imagesOf(elements) {
            return (elements || []).filter(e => e && e.image && (e.image.data || e.image.url));
        },
        hasImages(elements) {
            return this.imagesOf(elements).length > 0;
        },
        async usePhrase(entry, elements) {
            this.$emit('close');
            await collectElementService.restorePhrase(entry, elements, true);
        },
        async toggleFavorite(entry) {
            await phraseHistoryService.setFavorite(entry.text, !entry.favorite);
            await this.reload();
        },
        async remove(entry) {
            await phraseHistoryService.removePhrase(entry.text);
            await this.reload();
        }
    },
    async mounted() {
        await this.reload();
        if (this.favorites.length === 0 && this.recent.length > 0) {
            this.tab = TAB_RECENT;
        }
    }
};
</script>

<style scoped>
.phrase-modal {
    width: 96vw;
    max-width: 1180px;
    height: 92vh;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
    background: var(--gf-fundo, #F3F8F0);
}

/* cabeçalho: voltar, título e abas grandes */
.phrase-top {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6em 1em;
    padding: 0.7em 1em;
    background: #FFFFFF;
    border-bottom: 2px solid var(--gf-linha, #D3E0D0);
}
.phrase-back {
    width: 64px;
    height: 64px;
    margin: 0;
    padding: 0;
    border-radius: 50%;
    font-size: 1.3em;
    line-height: 1;
    flex: none;
}
.phrase-title {
    margin: 0;
    font-size: 1.6em;
    flex: 1 1 auto;
}
.phrase-tabs {
    display: flex;
    gap: 0.5em;
}
.phrase-tabs button {
    height: 64px;
    margin: 0;
    padding: 0 1.2em;
    border-radius: 32px;
    font-size: 1em;
    line-height: 1;
    text-transform: none;
    letter-spacing: normal;
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
}
.phrase-tabs button.selected,
.phrase-tabs button.selected:hover,
.phrase-tabs button.selected:focus {
    background: var(--gf-mata, #1D6B35);
    border-color: var(--gf-mata, #1D6B35);
    color: #FFFFFF;
}
.phrase-tabs .fa-star {
    color: var(--gf-sol, #FFC83D);
}
.phrase-count {
    display: inline-block;
    min-width: 1.6em;
    padding: 0.15em 0.4em;
    border-radius: 1em;
    background: rgba(20, 38, 26, 0.1);
    font-size: 0.85em;
    text-align: center;
}
.phrase-tabs button.selected .phrase-count {
    background: rgba(255, 255, 255, 0.22);
}

/* corpo: lista + dica do Grilo */
.phrase-body {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    gap: 1em;
    padding: 1em;
}
.phrase-list-area {
    flex: 1 1 auto;
    min-width: 0;
    overflow-y: auto;
    padding: 2px;
}
.phrase-list {
    list-style: none;
    margin: 0;
    padding: 0;
}
.phrase-row {
    display: flex;
    align-items: stretch;
    gap: 0.6em;
    margin-bottom: 0.8em;
}
.phrase-main {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 1em;
    min-height: 112px;
    height: auto;
    margin: 0;
    padding: 0.6em 0.8em 0.6em 1em;
    text-align: left;
    text-transform: none;
    letter-spacing: normal;
    line-height: 1.3;
    white-space: normal;
    border-radius: 22px;
    border: 2px solid var(--gf-linha, #D3E0D0);
    background: #FFFFFF;
    transition: transform 0.09s ease-out;
}
.phrase-row.favorite .phrase-main {
    border-color: #A87700;
}
.phrase-main:active {
    transform: scale(0.98);
}
.phrase-images {
    display: flex;
    gap: 0.4em;
    flex-shrink: 0;
}
.phrase-img-wrapper {
    width: 72px;
    height: 80px;
    border-radius: 12px;
    overflow: hidden;
    background: var(--gf-fundo, #F3F8F0);
    display: flex;
    align-items: center;
    justify-content: center;
}
.phrase-img-wrapper img {
    max-width: 88%;
    max-height: 88%;
    object-fit: contain;
}
.phrase-text {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 1.4em;
    font-weight: bold;
    color: var(--gf-tinta, #14261A);
    overflow-wrap: anywhere;
}
.phrase-play {
    flex: none;
    width: 92px;
    height: 92px;
    border-radius: 50%;
    background: var(--gf-mata, #1D6B35);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6em;
}
.phrase-play i {
    margin-left: 0.15em;
}
.phrase-icon-btn {
    flex: none;
    width: 76px;
    height: auto;
    margin: 0;
    padding: 0;
    border-radius: 22px;
    font-size: 1.5em;
    color: var(--gf-cinza, #4A5C4F);
}
.phrase-star {
    background: #FFF6D6;
    border-color: #A87700;
}
.phrase-star.active {
    color: #A87700;
}
.phrase-star .fa-star {
    color: #A87700;
}
.phrase-remove {
    color: var(--gf-coral, #B8391F);
}
.phrase-empty {
    text-align: center;
    color: var(--gf-cinza, #4A5C4F);
    padding: 2em 1em;
    font-size: 1.1em;
}
.phrase-empty p {
    max-width: 32em;
    margin: 0.5em auto 0 auto;
}
.phrase-empty-grilo {
    width: 7em;
    height: 7em;
}

.phrase-hint {
    flex: 0 0 280px;
    align-self: flex-start;
    background: #FFFFFF;
    border: 2px solid var(--gf-linha, #D3E0D0);
    border-radius: 26px;
    padding: 1em;
    text-align: center;
}
.phrase-hint-grilo {
    width: 190px;
    height: 190px;
}
.phrase-hint-main {
    font-family: var(--gf-titulo, inherit);
    font-weight: 800;
    font-size: 1.2em;
    margin: 0.3em 0;
    line-height: 1.2;
}
.phrase-hint-sub {
    font-size: 0.9em;
    color: var(--gf-cinza, #4A5C4F);
    margin: 0;
}

@media (max-width: 900px) {
    .phrase-hint {
        display: none;
    }
}
@media (max-width: 600px) {
    .phrase-modal {
        width: 100vw;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
    }
    .phrase-title {
        font-size: 1.3em;
    }
    .phrase-tabs {
        width: 100%;
    }
    .phrase-tabs button {
        flex: 1;
        justify-content: center;
        padding: 0 0.6em;
    }
    .phrase-main {
        min-height: 88px;
        flex-wrap: wrap;
    }
    .phrase-img-wrapper {
        width: 48px;
        height: 54px;
    }
    .phrase-text {
        font-size: 1.15em;
    }
    .phrase-play {
        width: 64px;
        height: 64px;
        font-size: 1.2em;
    }
    .phrase-icon-btn {
        width: 60px;
    }
}
@media (prefers-reduced-motion: reduce) {
    .phrase-main {
        transition: none;
    }
    .phrase-main:active {
        transform: none;
    }
}
</style>
