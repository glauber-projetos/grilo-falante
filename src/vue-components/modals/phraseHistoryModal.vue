<template>
    <div class="modal">
        <div class="modal-mask" style="z-index: 9999">
            <div class="modal-wrapper">
                <div class="modal-container phrase-modal" @keydown.esc="$emit('close')">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')" :aria-label="$t('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1><i class="fas fa-comment-dots"></i> {{ $t('phrasesTitle') }}</h1>
                    </div>
                    <div class="modal-body">
                        <div v-if="loading" class="phrase-empty"><i class="fas fa-spinner fa-spin"></i></div>
                        <div v-if="!loading && favorites.length === 0 && recent.length === 0" class="phrase-empty">
                            <i class="far fa-comment fa-3x"></i>
                            <p>{{ $t('phrasesEmpty') }}</p>
                        </div>

                        <h2 v-if="favorites.length > 0" class="phrase-section"><i class="fas fa-star"></i> {{ $t('phrasesFavorites') }}</h2>
                        <ul class="phrase-list">
                            <li v-for="(entry, index) in favorites" :key="'f' + entry.text" class="phrase-row favorite">
                                <button class="phrase-main" @click="usePhrase(entry, favoriteElements[index])" :aria-label="entry.text">
                                    <span class="phrase-images" v-if="hasImages(favoriteElements[index])">
                                        <span v-for="(element, i) in favoriteElements[index]" class="phrase-img-wrapper" v-if="element && element.image && (element.image.data || element.image.url)">
                                            <img :src="element.image.data || element.image.url" alt="" draggable="false"/>
                                        </span>
                                    </span>
                                    <span class="phrase-text">{{ entry.text }}</span>
                                </button>
                                <button v-if="!locked" class="phrase-icon-btn active" @click="toggleFavorite(entry)" :title="$t('phrasesRemoveFavorite')" :aria-label="$t('phrasesRemoveFavorite')"><i class="fas fa-star"></i></button>
                            </li>
                        </ul>

                        <h2 v-if="recent.length > 0" class="phrase-section"><i class="fas fa-history"></i> {{ $t('phrasesRecent') }}</h2>
                        <ul class="phrase-list">
                            <li v-for="(entry, index) in recent" :key="'r' + entry.text" class="phrase-row">
                                <button class="phrase-main" @click="usePhrase(entry, recentElements[index])" :aria-label="entry.text">
                                    <span class="phrase-images" v-if="hasImages(recentElements[index])">
                                        <span v-for="(element, i) in recentElements[index]" class="phrase-img-wrapper" v-if="element && element.image && (element.image.data || element.image.url)">
                                            <img :src="element.image.data || element.image.url" alt="" draggable="false"/>
                                        </span>
                                    </span>
                                    <span class="phrase-text">{{ entry.text }}</span>
                                </button>
                                <button v-if="!locked" class="phrase-icon-btn" @click="toggleFavorite(entry)" :title="$t('phrasesAddFavorite')" :aria-label="$t('phrasesAddFavorite')"><i class="far fa-star"></i></button>
                                <button v-if="!locked" class="phrase-icon-btn" @click="remove(entry)" :title="$t('phrasesRemove')" :aria-label="$t('phrasesRemove')"><i class="fas fa-trash-alt"></i></button>
                            </li>
                        </ul>
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
 * When the app is locked (child mode), sentences can only be used, not changed or removed.
 */
import './../../css/modal.css';
import { phraseHistoryService } from '../../js/service/phraseHistoryService';
import { collectElementService } from '../../js/service/collectElementService';
import { util } from '../../js/util/util';

export default {
    data() {
        return {
            loading: true,
            favorites: [],
            recent: [],
            favoriteElements: [],
            recentElements: [],
            locked: util.isUILocked()
        };
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
        hasImages(elements) {
            return (elements || []).some(e => e && e.image && (e.image.data || e.image.url));
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
    mounted() {
        this.reload();
    }
};
</script>

<style scoped>
.phrase-modal {
    max-width: 900px;
}
.phrase-empty {
    text-align: center;
    color: #666;
    padding: 2em 1em;
}
.phrase-section {
    font-size: 1.3em;
    margin: 1.2em 0 0.5em 0;
}
.phrase-section .fa-star {
    color: #f5b301;
}
.phrase-list {
    list-style: none;
    margin: 0;
    padding: 0;
}
.phrase-row {
    display: flex;
    align-items: stretch;
    gap: 0.5em;
    margin-bottom: 0.6em;
}
.phrase-main {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 1em;
    min-height: 72px;
    height: auto;
    margin: 0;
    padding: 0.5em 1em;
    text-align: left;
    text-transform: none;
    letter-spacing: normal;
    line-height: 1.3;
    white-space: normal;
    border-radius: 14px;
    border: 2px solid #d6dde5;
    background: #fff;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.phrase-row.favorite .phrase-main {
    border-color: #f5cf5b;
    background: #fffbea;
}
.phrase-main:active {
    transform: scale(0.98);
    box-shadow: inset 0 0 0 3px rgba(0, 0, 0, 0.08);
}
.phrase-images {
    display: flex;
    gap: 0.3em;
    flex-shrink: 0;
}
.phrase-img-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 10px;
    overflow: hidden;
    background: #f3f5f7;
    display: flex;
    align-items: center;
    justify-content: center;
}
.phrase-img-wrapper img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}
.phrase-text {
    font-size: 1.4em;
    font-weight: bold;
    color: #222;
}
.phrase-icon-btn {
    width: 56px;
    height: auto;
    margin: 0;
    padding: 0;
    border-radius: 14px;
    font-size: 1.3em;
    color: #888;
}
.phrase-icon-btn.active {
    color: #f5b301;
}
@media (max-width: 600px) {
    .phrase-img-wrapper {
        width: 40px;
        height: 40px;
    }
    .phrase-text {
        font-size: 1.15em;
    }
}
</style>
