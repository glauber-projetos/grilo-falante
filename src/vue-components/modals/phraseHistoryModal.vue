<template>
    <div class="frases-raiz">
        <div class="g-veu" @click="$emit('close')"></div>
        <div class="frases-janela" @keydown.esc.stop="$emit('close')" role="dialog" aria-modal="true" aria-labelledby="phraseModalTitle">
            <div class="frases-topo">
                <button type="button" class="g-btn g-btn-icone frases-voltar" @click="$emit('close')" :aria-label="$t('close')" :title="$t('close')">
                    <i class="ti ti-arrow-left" aria-hidden="true"></i>
                </button>
                <h2 id="phraseModalTitle" class="frases-titulo">{{ $t('phrasesTitle') }}</h2>
                <div class="frases-abas" role="tablist">
                    <button type="button" role="tab" id="phraseTabFavorites" :aria-selected="String(tab === TAB_FAVORITES)" :class="{ ativa: tab === TAB_FAVORITES }" @click="tab = TAB_FAVORITES">
                        <i class="ti ti-star" aria-hidden="true"></i>{{ $t('phrasesFavorites') }} <span class="frases-conta">{{ favorites.length }}</span>
                    </button>
                    <button type="button" role="tab" id="phraseTabRecent" :aria-selected="String(tab === TAB_RECENT)" :class="{ ativa: tab === TAB_RECENT }" @click="tab = TAB_RECENT">
                        <i class="ti ti-history" aria-hidden="true"></i>{{ $t('phrasesRecentShort') }} <span class="frases-conta">{{ recent.length }}</span>
                    </button>
                </div>
            </div>

            <div class="frases-corpo">
                <div class="frases-lista-area" role="tabpanel" :aria-labelledby="tab === TAB_FAVORITES ? 'phraseTabFavorites' : 'phraseTabRecent'">
                    <div v-if="loading" class="frases-vazio" role="status"><i class="ti ti-loader-2 frases-girar" aria-hidden="true"></i></div>
                    <div v-if="!loading && shownEntries.length === 0" class="frases-vazio">
                        <img v-if="!locked" src="app/img/grilo/mascote/grilo-duvida.webp" alt="" aria-hidden="true" class="frases-vazio-grilo"/>
                        <i v-else class="ti ti-message-circle frases-vazio-icone" aria-hidden="true"></i>
                        <p>{{ tab === TAB_FAVORITES && recent.length > 0 ? $t('phrasesFavoritesEmpty') : $t('phrasesEmpty') }}</p>
                    </div>
                    <ul class="frases-lista" v-if="!loading">
                        <li v-for="(entry, index) in shownEntries" :key="tab + entry.text" class="frases-linha" :class="{ favorita: entry.favorite }">
                            <button type="button" class="frases-principal" @click="usePhrase(entry, shownElements[index])" :aria-label="entry.text">
                                <span class="frases-figuras" v-if="hasImages(shownElements[index])">
                                    <span v-for="(element, i) in imagesOf(shownElements[index])" :key="i" class="frases-figura">
                                        <img :src="element.image.data || element.image.url" alt="" draggable="false"/>
                                    </span>
                                </span>
                                <span class="frases-texto">{{ entry.text }}</span>
                                <span class="frases-falar" aria-hidden="true"><i class="ti ti-volume"></i></span>
                            </button>
                            <button v-if="!locked" type="button" class="frases-icone frases-estrela" :class="{ ativa: entry.favorite }" @click="toggleFavorite(entry)"
                                    :title="entry.favorite ? $t('phrasesRemoveFavorite') : $t('phrasesAddFavorite')"
                                    :aria-label="entry.favorite ? $t('phrasesRemoveFavorite') : $t('phrasesAddFavorite')"
                                    :aria-pressed="String(!!entry.favorite)">
                                <i class="ti ti-star" aria-hidden="true"></i>
                            </button>
                            <button v-if="!locked && tab === TAB_RECENT" type="button" class="frases-icone frases-tirar" @click="remove(entry)" :title="$t('phrasesRemove')" :aria-label="$t('phrasesRemove')">
                                <i class="ti ti-trash" aria-hidden="true"></i>
                            </button>
                        </li>
                    </ul>
                </div>
                <aside v-if="!locked" class="g-cartao frases-dica" aria-hidden="true">
                    <img src="app/img/grilo/mascote/grilo-apontando.webp" alt="" class="frases-dica-grilo"/>
                    <p class="frases-dica-principal">{{ $t('phrasesHintPlay') }}</p>
                    <p class="g-dica">{{ $t('phrasesHintStar') }}</p>
                </aside>
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
.frases-raiz { position: relative; z-index: 9999; }
.frases-raiz .g-veu { z-index: 9998; }
.frases-janela {
    position: fixed;
    z-index: 9999;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(1180px, 96vw);
    height: 92vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--g-fundo);
    border-radius: var(--g-raio-g);
    box-shadow: var(--g-sombra-alta);
    font-family: var(--g-fonte);
    color: var(--g-tinta);
    animation: g-aparecer var(--g-medio) var(--g-curva);
}

/* topo: voltar, título e abas grandes */
.frases-topo {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--g-e3) var(--g-e4);
    padding: var(--g-e3) var(--g-e4);
    background: var(--g-superficie);
    border-bottom: 2px solid var(--g-borda);
}
.frases-voltar { width: var(--g-alvo-g); min-width: var(--g-alvo-g); min-height: var(--g-alvo-g); font-size: 19.2px; }
.frases-titulo { margin: 0; flex: 1 1 auto; font-family: var(--g-fonte-titulo); font-size: var(--g-t-h2); font-weight: 700; color: var(--g-tinta); }
.frases-abas { display: flex; gap: var(--g-e2); }
.frases-abas button {
    display: inline-flex;
    align-items: center;
    gap: var(--g-e2);
    min-height: var(--g-alvo-g);
    height: auto;
    margin: 0;
    padding: 0 var(--g-e4);
    border-radius: var(--g-raio-pilula);
    border: 2px solid var(--g-borda);
    background: var(--g-superficie);
    color: var(--g-tinta);
    font-family: var(--g-fonte);
    font-size: var(--g-t-corpo);
    font-weight: 700;
    line-height: 1;
    text-transform: none;
    letter-spacing: 0;
    cursor: pointer;
}
.frases-abas button .ti { font-size: 20.8px; }
.frases-abas button.ativa { background: var(--g-folha); border-color: var(--g-folha); color: #fff; }
.frases-conta {
    display: inline-block;
    min-width: 1.6em;
    padding: 2px 6px;
    border-radius: var(--g-raio-pilula);
    background: var(--g-superficie-2);
    color: var(--g-tinta-2);
    font-size: var(--g-t-legenda);
    text-align: center;
}
.frases-abas button.ativa .frases-conta { background: rgba(255, 255, 255, 0.25); color: #fff; }

/* corpo: lista e dica do Grilo */
.frases-corpo { flex: 1 1 auto; min-height: 0; display: flex; gap: var(--g-e4); padding: var(--g-e4); }
.frases-lista-area { flex: 1 1 auto; min-width: 0; overflow-y: auto; padding: 4px; }
.frases-lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--g-e3); }
.frases-linha { display: flex; align-items: stretch; gap: var(--g-e2); margin: 0; }
.frases-principal {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--g-e4);
    min-height: 104px;
    height: auto;
    margin: 0;
    padding: var(--g-e3) var(--g-e3) var(--g-e3) var(--g-e4);
    text-align: left;
    text-transform: none;
    letter-spacing: 0;
    line-height: 1.3;
    white-space: normal;
    border-radius: var(--g-raio-g);
    border: 2px solid var(--g-borda);
    background: var(--g-superficie);
    color: var(--g-tinta);
    font-family: var(--g-fonte);
    cursor: pointer;
    transition: transform var(--g-rapido) var(--g-curva);
}
.frases-linha.favorita .frases-principal { border-color: #e0b100; }
.frases-principal:active { transform: scale(0.98); }
.frases-figuras { display: flex; gap: var(--g-e2); flex-shrink: 0; }
.frases-figura {
    width: 68px;
    height: 76px;
    border-radius: var(--g-raio-p);
    overflow: hidden;
    background: var(--g-superficie-2);
    display: flex;
    align-items: center;
    justify-content: center;
}
.frases-figura img { max-width: 88%; max-height: 88%; object-fit: contain; }
.frases-texto { flex: 1 1 auto; min-width: 0; font-size: 21.6px; font-weight: 700; overflow-wrap: anywhere; }
.frases-falar {
    flex: none;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--g-coral);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
}
.frases-icone {
    flex: none;
    width: 72px;
    height: auto;
    margin: 0;
    padding: 0;
    border-radius: var(--g-raio-g);
    border: 2px solid var(--g-borda);
    background: var(--g-superficie);
    color: var(--g-tinta-2);
    font-size: 25.6px;
    cursor: pointer;
}
.frases-estrela { background: var(--g-girassol-claro); border-color: #e0b100; color: #7a5c00; }
.frases-estrela.ativa { background: var(--g-girassol); color: #4a3b00; }
.frases-estrela:not(.ativa) { background: var(--g-superficie); color: var(--g-tinta-3); border-color: var(--g-borda); }
.frases-tirar { color: var(--g-perigo); }
.frases-principal:focus, .frases-icone:focus, .frases-abas button:focus { outline: none; }
.frases-principal:focus-visible, .frases-icone:focus-visible, .frases-abas button:focus-visible { box-shadow: var(--g-foco); }

.frases-vazio { text-align: center; color: var(--g-tinta-2); padding: var(--g-e6) var(--g-e4); font-size: var(--g-t-grande); }
.frases-vazio p { max-width: 32em; margin: var(--g-e2) auto 0; }
.frases-vazio-grilo { width: 120px; height: 120px; object-fit: contain; }
.frases-vazio-icone, .frases-girar { font-size: 48px; color: var(--g-folha); }
.frases-girar { display: inline-block; animation: frases-girar 1s linear infinite; }
@keyframes frases-girar { to { transform: rotate(360deg); } }

.frases-dica { flex: 0 0 280px; align-self: flex-start; text-align: center; }
.frases-dica-grilo { width: 140px; height: 140px; object-fit: contain; }
.frases-dica-principal { font-family: var(--g-fonte-titulo); font-weight: 700; font-size: var(--g-t-h3); margin: var(--g-e2) 0; line-height: 1.2; }
.frases-dica .g-dica { margin: 0; }

@media (max-width: 900px) {
    .frases-dica { display: none; }
}
@media (max-width: 600px) {
    .frases-janela { width: 100vw; height: 100vh; border-radius: 0; }
    .frases-titulo { font-size: var(--g-t-h3); }
    .frases-abas { width: 100%; }
    .frases-abas button { flex: 1; justify-content: center; padding: 0 var(--g-e2); }
    .frases-corpo { padding: var(--g-e3); }
    .frases-principal { min-height: 84px; flex-wrap: wrap; gap: var(--g-e2); padding: var(--g-e2) var(--g-e3); }
    .frases-figura { width: 48px; height: 54px; }
    .frases-texto { font-size: 17.6px; }
    .frases-falar { width: 56px; height: 56px; font-size: 24px; }
    .frases-icone { width: 56px; }
}
@media (prefers-reduced-motion: reduce) {
    .frases-principal { transition: none; }
    .frases-principal:active { transform: none; }
    .frases-girar { animation: none; }
}
</style>
