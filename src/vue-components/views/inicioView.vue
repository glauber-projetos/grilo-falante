<template>
    <div class="g-tela overflow-content inicio">
        <g-topo marca-completa :mostrar-inicio="false"></g-topo>

        <div class="g-conteudo inicio-conteudo">
            <section class="inicio-boas" aria-labelledby="inicioOi">
                <span class="g-avatar inicio-avatar" :style="{background: perfil.foto ? 'var(--g-superficie-2)' : perfil.cor}" aria-hidden="true">
                    <img v-if="perfil.foto" :src="perfil.foto" alt=""/>
                    <span v-else-if="perfil.inicial">{{ perfil.inicial }}</span>
                    <i v-else class="ti ti-mood-kid"></i>
                </span>
                <div class="inicio-oi">
                    <h1 id="inicioOi">{{ perfil.nome ? $t('inicioOi', {nome: perfil.nome}) : $t('inicioOiSemNome') }}</h1>
                    <p class="g-apoio">{{ $t('inicioPergunta') }}</p>
                </div>
                <img class="inicio-mascote" src="app/img/grilo/mascote/grilo-feliz.webp" alt=""/>
            </section>

            <nav :aria-label="$t('cascaInicio')">
                <div class="inicio-grade">
                    <a href="#main" class="g-ladrilho g-ladrilho-folha inicio-falar" @click.prevent="falar">
                        <i class="ti ti-message-circle-2" aria-hidden="true"></i>
                        <span>{{ $t('inicioFalar') }}<small>{{ perfil.nome ? $t('inicioFalarDica', {nome: perfil.nome}) : $t('inicioFalarDicaSemNome') }}</small></span>
                    </a>
                    <button type="button" class="g-ladrilho g-ladrilho-girassol" @click="abrirFrases">
                        <i class="ti ti-star" aria-hidden="true"></i>
                        <span>{{ $t('inicioFrases') }}<small>{{ textoFrases }}</small></span>
                    </button>
                    <a href="#grids" class="g-ladrilho g-ladrilho-pessego">
                        <i class="ti ti-layout-grid" aria-hidden="true"></i>
                        <span>{{ $t('inicioPranchas') }}<small>{{ textoPranchas }}</small></span>
                    </a>
                    <a href="#settings" class="g-ladrilho g-ladrilho-lavanda">
                        <i class="ti ti-adjustments" aria-hidden="true"></i>
                        <span>{{ $t('inicioAjustes') }}<small>{{ $t('inicioAjustesDica') }}</small></span>
                    </a>
                    <a href="#settings?secao=offline" class="g-ladrilho g-ladrilho-ceu inicio-offline-ladrilho">
                        <span class="inicio-ladrilho-alto">
                            <i class="ti ti-wifi-off" aria-hidden="true"></i>
                            <img v-if="offline" class="inicio-offline-grilo" alt=""
                                 :src="offline.missing === 0 ? 'app/img/grilo/mascote/grilo-festa.webp' : 'app/img/grilo/mascote/grilo-surpreso.webp'"/>
                        </span>
                        <span>{{ $t('inicioSemInternet') }}
                            <small class="inicio-offline" :class="{'inicio-offline-ok': offline && offline.missing === 0}">
                                <i v-if="offline && offline.missing === 0" class="ti ti-circle-check" aria-hidden="true"></i>{{ textoOffline }}
                            </small>
                        </span>
                    </a>
                </div>

                <h2 class="g-oculto-leitor">{{ $t('inicioMais') }}</h2>
                <div class="inicio-mais">
                    <a href="#dictionaries" class="inicio-mais-item">
                        <i class="ti ti-abc" aria-hidden="true"></i>
                        <span>{{ $t('inicioPalavras') }}<small>{{ $t('inicioPalavrasDica') }}</small></span>
                    </a>
                    <a href="#help" class="inicio-mais-item">
                        <i class="ti ti-help-circle" aria-hidden="true"></i>
                        <span>{{ $t('inicioAjuda') }}<small>{{ $t('inicioAjudaDica') }}</small></span>
                    </a>
                    <a href="#about" class="inicio-mais-item">
                        <i class="ti ti-info-circle" aria-hidden="true"></i>
                        <span>{{ $t('inicioSobre') }}<small>{{ $t('inicioSobreDica') }}</small></span>
                    </a>
                    <a href="#welcome" class="inicio-mais-item">
                        <i class="ti ti-users" aria-hidden="true"></i>
                        <span>{{ $t('inicioTrocar') }}<small>{{ $t('inicioTrocarDica') }}</small></span>
                    </a>
                </div>
            </nav>
        </div>
    </div>
</template>

<script>
    /**
     * Grilo Falante: adult home ("#inicio"). Big tiles, everything in sight, no hidden menu.
     */
    import GTopo from '../components/gTopo.vue';
    import {Router} from '../../js/router';
    import {MainVue} from '../../js/vue/mainVue';
    import {dataService} from '../../js/service/data/dataService';
    import {offlineService} from '../../js/service/offlineService';

    export default {
        components: { GTopo },
        data() {
            return {
                favoritas: null,
                pranchas: null,
                offline: null, // {total, cached, missing (number)}
                offlineSuportado: offlineService.isSupported()
            }
        },
        computed: {
            perfil() {
                return this.$root.perfil || {};
            },
            textoFrases() {
                if (this.favoritas === null || this.favoritas === 0) {
                    return this.$t('inicioFrasesNenhuma');
                }
                return this.favoritas === 1 ? this.$t('inicioFrasesUma') : this.$t('inicioFrasesN', {n: this.favoritas});
            },
            textoPranchas() {
                if (this.pranchas === null) {
                    return this.$t('inicioPranchasDica');
                }
                if (this.pranchas === 0) {
                    return this.$t('inicioPranchasNenhuma');
                }
                return this.pranchas === 1 ? this.$t('inicioPranchasUma') : this.$t('inicioPranchasN', {n: this.pranchas});
            },
            textoOffline() {
                if (!this.offlineSuportado) {
                    return this.$t('inicioSemInternetDica');
                }
                if (!this.offline) {
                    return this.$t('inicioSemInternetConferindo');
                }
                if (this.offline.missing === 0) {
                    return this.$t('inicioSemInternetPronto');
                }
                return this.offline.missing === 1 ? this.$t('inicioSemInternetFaltaUma') : this.$t('inicioSemInternetFaltam', {n: this.offline.missing});
            }
        },
        methods: {
            falar() {
                Router.toMain();
            },
            abrirFrases() {
                MainVue.showPhraseHistoryModal();
            },
            async carregar() {
                let metadata = await dataService.getMetadata();
                if (this._isDestroyed) {
                    return;
                }
                this.favoritas = ((metadata && metadata.phraseHistory) || []).filter(e => e && e.favorite).length;
                // all grids, also the global bar, like the "Sem internet" settings count the images
                let grids = await dataService.getGrids(true);
                if (this._isDestroyed) {
                    return;
                }
                this.pranchas = grids.filter(g => !metadata || g.id !== metadata.globalGridId).length;
                if (this.offlineSuportado) {
                    try {
                        let urls = offlineService.collectImageUrls(grids);
                        let status = await offlineService.getStatus(urls);
                        if (!this._isDestroyed) {
                            this.offline = { total: status.total, cached: status.cached, missing: status.missing.length };
                        }
                    } catch (e) {
                        log.warn('inicio: could not check offline images', e);
                        this.offlineSuportado = false;
                    }
                }
            }
        },
        mounted() {
            this.carregar();
        }
    }
</script>

<style scoped>
    .inicio {
        display: flex;
        flex-direction: column;
    }

    .inicio-conteudo {
        width: 100%;
        box-sizing: border-box;
        padding-top: var(--g-e5);
    }

    /* ---------- boas-vindas ---------- */
    .inicio-boas {
        display: flex;
        align-items: center;
        gap: var(--g-e4);
        margin-bottom: var(--g-e5);
    }

    .inicio-avatar {
        width: 72px;
        height: 72px;
        font-size: 35px;
    }

    .inicio-avatar .ti {
        font-size: 38px;
    }

    .inicio-oi {
        flex: 1;
        min-width: 0;
    }

    .inicio-oi h1 {
        font-size: clamp(28px, 19px + 2vw, 40px);
        margin: 0;
        overflow-wrap: anywhere;
    }

    .inicio-oi p {
        margin: 2px 0 0;
        font-size: var(--g-t-grande);
    }

    .inicio-mascote {
        height: 128px;
        width: 128px;
        object-fit: contain;
        flex: none;
        margin: -16px 0 -16px;
    }

    .inicio-ladrilho-alto {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--g-e2);
    }

    .inicio-offline-grilo {
        width: 84px;
        height: 84px;
        object-fit: contain;
        margin: -12px -8px -16px 0;
    }

    /* ---------- ladrilhos principais ---------- */
    .inicio-grade {
        display: grid;
        grid-template-columns: 1.35fr 1fr 1fr;
        grid-template-rows: repeat(2, minmax(160px, auto));
        gap: var(--g-e4);
    }

    .inicio-grade .g-ladrilho {
        min-height: 160px;
        padding: var(--g-e5);
        font-size: var(--g-t-h2);
        font-family: var(--g-fonte-titulo);
    }

    .inicio-grade .g-ladrilho small {
        font-family: var(--g-fonte);
        font-size: var(--g-t-corpo);
        margin-top: 4px;
    }

    .inicio-grade .g-ladrilho .ti {
        font-size: 40px;
    }

    .inicio-falar {
        grid-row: span 2;
    }

    .inicio-grade .inicio-falar {
        font-size: 36px;
        justify-content: space-between;
    }

    .inicio-grade .inicio-falar .ti {
        font-size: 72px;
    }

    .inicio-grade .inicio-falar small {
        font-size: var(--g-t-grande);
    }

    .g-ladrilho:hover {
        filter: brightness(0.97);
    }

    .inicio-offline {
        display: flex !important;
        align-items: center;
        gap: 4px;
    }

    .inicio-grade .inicio-offline .ti {
        font-size: 18px;
    }

    .inicio-offline-ok {
        font-weight: 700 !important;
    }

    /* ---------- mais opções ---------- */
    .inicio-mais {
        margin-top: var(--g-e4);
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--g-e3);
    }

    .inicio-mais-item {
        display: flex;
        align-items: center;
        gap: var(--g-e3);
        min-height: 72px;
        padding: var(--g-e3) var(--g-e4);
        background: var(--g-superficie);
        border: 2px solid var(--g-borda);
        border-radius: var(--g-raio);
        color: var(--g-tinta);
        font-weight: 700;
        font-size: var(--g-t-grande);
        line-height: 1.2;
        text-decoration: none;
        transition: transform var(--g-rapido) var(--g-curva);
    }

    .inicio-mais-item:hover {
        border-color: var(--g-borda-forte);
        color: var(--g-tinta);
    }

    .inicio-mais-item:active {
        transform: scale(0.97);
    }

    .inicio-mais-item .ti {
        font-size: 30px;
        color: var(--g-folha-escura);
        flex: none;
    }

    .inicio-mais-item small {
        display: block;
        font-weight: 400;
        font-size: var(--g-t-legenda);
        color: var(--g-tinta-2);
        margin-top: 2px;
    }

    .inicio-mais-item:focus-visible {
        outline: none;
        box-shadow: var(--g-foco);
    }

    /* ---------- tablet em pé e telas médias ---------- */
    @media (max-width: 900px) {
        .inicio-mais {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    /* ---------- celular ---------- */
    @media (max-width: 640px) {
        .inicio-conteudo {
            padding: var(--g-e4) var(--g-e3) var(--g-e6);
        }

        .inicio-boas {
            gap: var(--g-e3);
            margin-bottom: var(--g-e4);
        }

        .inicio-avatar {
            width: 56px;
            height: 56px;
            font-size: 27px;
        }

        .inicio-oi p {
            font-size: var(--g-t-corpo);
        }

        .inicio-mascote {
            height: 84px;
            width: 84px;
            margin: -8px 0;
        }

        .inicio-offline-grilo {
            width: 60px;
            height: 60px;
            margin: -8px -6px -10px 0;
        }

        .inicio-grade {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: none;
            gap: var(--g-e3);
        }

        .inicio-falar {
            grid-row: auto;
            grid-column: 1 / -1;
        }

        .inicio-grade .g-ladrilho {
            min-height: 132px;
            padding: var(--g-e4);
            font-size: var(--g-t-grande);
        }

        .inicio-grade .g-ladrilho small {
            font-size: var(--g-t-legenda);
        }

        .inicio-grade .g-ladrilho .ti {
            font-size: 34px;
        }

        .inicio-grade .inicio-falar {
            min-height: 140px;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            gap: var(--g-e4);
            font-size: 30px;
        }

        .inicio-grade .inicio-falar .ti {
            font-size: 56px;
        }

        .inicio-grade .inicio-falar small {
            font-size: var(--g-t-corpo);
        }

        .inicio-mais-item {
            min-height: 64px;
            padding: var(--g-e3);
            gap: var(--g-e2);
            font-size: var(--g-t-corpo);
        }

        .inicio-mais-item .ti {
            font-size: 26px;
        }
    }

    @media (max-width: 340px) {
        .inicio-mascote {
            display: none;
        }
    }
</style>
