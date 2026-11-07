<template>
    <div class="ml">
        <ul class="ml-lista" v-if="paginatedElems.length">
            <li v-for="(mediaElem, index) in paginatedElems" :title="titleProp ? mediaElem[titleProp] : ''">
                <img :src="mediaElem[imgProp]" :key="mediaElem[imgProp]" alt=""/>
                <span class="ml-nome">{{ labelFn ? labelFn(mediaElem) : '' }}</span>
                <span class="ml-botoes">
                    <button v-if="actionConfig.canMoveUp" type="button" class="g-btn g-btn-leve g-btn-icone"
                            @click="elemUp(mediaElem)"
                            :disabled="isFirstElem(mediaElem)"
                            :aria-label="$t('gestaoAcaoSubirX', [labelFn ? labelFn(mediaElem) : ''])" :title="$t('gestaoAcaoSubir')">
                        <i class="ti ti-arrow-up" aria-hidden="true"></i>
                    </button>
                    <button v-if="actionConfig.canPlay" type="button" class="g-btn g-btn-leve g-btn-icone"
                            @click="emitTogglePlay(mediaElem)"
                            :aria-pressed="elemsEqual(playingMedia, mediaElem).toString()"
                            :aria-label="$t(elemsEqual(playingMedia, mediaElem) ? 'gestaoAcaoPararX' : 'gestaoAcaoOuvirX', [labelFn ? labelFn(mediaElem) : ''])"
                            :title="$t(elemsEqual(playingMedia, mediaElem) ? 'gestaoAcaoAudioParar' : 'gestaoAcaoAudioOuvir')">
                        <i :class="elemsEqual(playingMedia, mediaElem) ? 'ti ti-player-stop' : 'ti ti-player-play'" aria-hidden="true"></i>
                    </button>
                    <button v-if="actionConfig.canRemove" type="button" class="g-btn g-btn-leve g-btn-icone ml-tirar"
                            @click="remove(mediaElem)"
                            :aria-label="$t('gestaoAcaoTirarX', [labelFn ? labelFn(mediaElem) : ''])" :title="$t('gestaoAcaoTirar')">
                        <i class="ti ti-trash" aria-hidden="true"></i>
                    </button>
                    <button v-if="actionConfig.canSelect" type="button" class="g-btn g-btn-leve g-btn-icone"
                            @click="addMediaElem(mediaElem)"
                            :disabled="value && Array.isArray(value) ? !!value.find(elem => elemsEqual(elem, mediaElem)) : false"
                            :aria-label="$t('gestaoAcaoEscolherX', [labelFn ? labelFn(mediaElem) : ''])" :title="$t('gestaoAcaoEscolher')">
                        <i class="ti ti-plus" aria-hidden="true"></i>
                    </button>
                </span>
            </li>
        </ul>
        <div class="ml-paginas" v-if="!disableNext || !disablePrev">
            <button type="button" class="g-btn" @click="prev" :disabled="disablePrev"><i class="ti ti-arrow-left" aria-hidden="true"></i><span>{{ $t('gestaoAcaoPaginaAnterior') }}</span></button>
            <button type="button" class="g-btn" @click="next" :disabled="disableNext"><span>{{ $t('gestaoAcaoPaginaSeguinte') }}</span><i class="ti ti-arrow-right" aria-hidden="true"></i></button>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            gridData: Object,
            mediaElems: Array, // search result list
            actionConfigProp: Object,
            imgProp: String,
            titleProp: String,
            labelFn: Function,
            idProp: {
                type: String,
                default: "id"
            },
            value: Array, // selected list or editable list
            playingMedia: Object,
            enableNext: Boolean,
            enablePrev: Boolean,
            internalPagination: Boolean,
            itemsPerPage: {
                type: Number,
                default: 10
            }
        },
        data() {
            return {
                paginationPage: 1
            }
        },
        computed: {
            actionConfig() {
                return Object.assign({
                    canSelect: true,
                    canPlay: true,
                    canMoveUp: false,
                    canRemove: false
                }, this.actionConfigProp || {});
            },
            listElems() {
                return this.mediaElems || this.value || [];
            },
            paginatedElems() {
                let elems = this.listElems;
                if (!this.internalPagination) {
                    return elems;
                } else {
                    const start = (this.paginationPage - 1) * this.itemsPerPage;
                    const end = start + this.itemsPerPage;
                    return elems.slice(start, end);
                }
            },
            disableNext() {
                if (this.listElems.length === 0) {
                    return true;
                }
                if (this.internalPagination) {
                    let lastElem = this.listElems[this.listElems.length - 1];
                    return this.paginatedElems.includes(lastElem);
                } else {
                    return !this.enableNext;
                }
            },
            disablePrev() {
                if (this.listElems.length === 0) {
                    return true;
                }
                if (this.internalPagination) {
                    return this.paginationPage === 1;
                } else {
                    return !this.enablePrev;
                }
            }
        },
        methods: {
            isFirstElem(elem) {
                let first = this.listElems[0] || {};
                return this.elemsEqual(elem, first);
            },
            elemsEqual(elem1, elem2) {
                if (!elem1 || !elem2) {
                    return false;
                }
                return this.idProp ? elem1[this.idProp] === elem2[this.idProp] : elem1 === elem2;
            },
            emitTogglePlay(mediaElem) {
                this.$emit('togglePlay', mediaElem);
            },
            prev() {
                if (this.internalPagination) {
                    this.paginationPage = this.disablePrev ? this.paginationPage : this.paginationPage - 1;
                } else {
                    this.$emit('paginatePrev');
                }
            },
            next() {
                if (this.internalPagination) {
                    this.paginationPage = this.disableNext ? this.paginationPage : this.paginationPage + 1;
                } else {
                    this.$emit('paginateNext');
                }
            },
            emitChange(newValue) {
                this.$emit("input", newValue);
                this.$emit("change", newValue);
            },
            addMediaElem(mediaElem) {
                this.value = this.value || [];
                this.value.push(mediaElem);
                this.emitChange(this.value);
            },
            elemUp(mediaElem) {
                if (!this.value) {
                    return;
                }
                let index = this.value.indexOf(mediaElem);
                if (index > 0) {
                    this.value.splice(index - 1, 0, this.value.splice(index, 1)[0]);
                    this.emitChange(this.value);
                }
            },
            remove(mediaElem) {
                if (!this.value) {
                    return;
                }
                let newElems = this.value.filter(elem => !this.elemsEqual(elem, mediaElem));
                this.emitChange(newElems);
            }
        },
        mounted() {
        }
    }
</script>

<style scoped>
    .ml-lista {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--g-e1);
    }
    .ml-lista li {
        display: flex;
        align-items: center;
        gap: var(--g-e3);
        margin: 0;
        padding: var(--g-e1) var(--g-e1) var(--g-e1) var(--g-e3);
        background: var(--g-superficie);
        border: 2px solid var(--g-borda);
        border-radius: var(--g-raio);
    }
    .ml-lista li:hover {
        border-color: var(--g-borda-forte);
    }
    .ml-lista img {
        flex: none;
        width: 36px;
        height: 36px;
        object-fit: contain;
        border-radius: var(--g-raio-p);
        background: var(--g-superficie-2);
    }
    .ml-nome {
        flex: 1;
        min-width: 0;
        overflow-wrap: anywhere;
        font-weight: 700;
    }
    .ml-botoes {
        display: flex;
        flex: none;
        gap: 2px;
    }
    .ml-tirar {
        color: var(--g-perigo);
    }
    .ml-tirar:hover {
        background: var(--g-perigo-claro);
    }
    .ml-paginas {
        display: flex;
        gap: var(--g-e2);
        margin-top: var(--g-e3);
    }
    .ml-paginas .g-btn {
        flex: 1;
        padding: 0 var(--g-e3);
    }
</style>
