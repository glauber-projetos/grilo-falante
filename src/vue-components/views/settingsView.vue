<template>
    <div class="overflow-content g-tela aj-tela" ref="rolagem">
        <g-topo :titulo="$t('ajustesTitulo')">
            <span class="g-pilula aj-salvo" :class="{ 'g-pilula-ok': saveState === SAVE_STATES.STATE_SAVED }" role="status" aria-live="polite">
                <template v-if="saveState === SAVE_STATES.STATE_SAVING"><i class="ti ti-loader-2 aj-gira" aria-hidden="true"></i>{{ $t('ajustesSalvando') }}</template>
                <template v-else-if="saveState === SAVE_STATES.STATE_SAVED"><i class="ti ti-check" aria-hidden="true"></i>{{ $t('ajustesSalvo') }}</template>
            </span>
        </g-topo>

        <nav class="aj-atalhos" :aria-label="$t('ajustesAtalhos')">
            <a v-for="secao in SECOES" :key="secao.id" :href="'#settings/' + secao.id" class="aj-atalho"
               :class="{ 'aj-atalho-on': secaoAtual === secao.id }" @click.prevent="irPara(secao.id)">
                <i :class="'ti ti-' + secao.icone" aria-hidden="true"></i>{{ $t(secao.titulo) }}
            </a>
        </nav>

        <main class="g-conteudo aj-conteudo" v-if="metadata">
            <ajuste-secao :id="idDe('voz')" icone="volume" cor="coral" :titulo="$t('ajustesVozTitulo')" :resumo="$t('ajustesVozResumo')">
                <settings-voz ref="voz" :metadata="metadata" :user-settings-local="userSettingsLocal" @changing="onChanging" @changed="onChanged" @ir-para="irPara"/>
            </ajuste-secao>

            <ajuste-secao :id="idDe('aparencia')" icone="palette" cor="girassol" :titulo="$t('ajustesAparenciaTitulo')" :resumo="$t('ajustesAparenciaResumo')">
                <settings-appearance :metadata="metadata" :user-settings-local="userSettingsLocal" @changing="onChanging" @changed="onChanged"/>
            </ajuste-secao>

            <ajuste-secao :id="idDe('modo-crianca')" icone="shield-lock" cor="lavanda" :titulo="$t('ajustesModoTitulo')" :resumo="$t('ajustesModoResumo')">
                <settings-modo-crianca :metadata="metadata" :app-settings="appSettings" :user-settings-local="userSettingsLocal" @changing="onChanging" @changed="onChanged"/>
            </ajuste-secao>

            <ajuste-secao :id="idDe('sem-internet')" icone="wifi-off" cor="ceu" :titulo="$t('ajustesOfflineTitulo')" :resumo="$t('ajustesOfflineResumo')">
                <settings-offline :metadata="metadata" :user-settings-local="userSettingsLocal" @use-voice="usarVoz"/>
            </ajuste-secao>

            <ajuste-secao :id="idDe('formas-de-tocar')" icone="hand-finger" cor="pessego" :titulo="$t('ajustesFormasTitulo')" :resumo="$t('ajustesFormasResumo')">
                <settings-formas-de-tocar :metadata="metadata" :user-settings-local="userSettingsLocal" @changing="onChanging" @changed="onChanged"/>
            </ajuste-secao>

            <ajuste-secao :id="idDe('idioma')" icone="language" cor="folha" :titulo="$t('ajustesIdiomaTitulo')" :resumo="$t('ajustesIdiomaResumo')">
                <settings-language :metadata="metadata" :user-settings-local="userSettingsLocal" :app-settings="appSettings"
                                   @changing="onChanging" @changed="onChanged" @idioma-pranchas="idiomaPranchasMudou"/>
            </ajuste-secao>

            <section :id="idDe('avancado')" class="g-cartao aj-avancado-cartao" :aria-label="$t('ajustesAvancadoTitulo')">
                <details ref="avancado" class="aj-avancado-details" :open="avancadoAberto" @toggle="avancadoAberto = $event.target.open">
                    <summary>
                        <span class="aj-avancado-icone" aria-hidden="true"><i class="ti ti-tool"></i></span>
                        <span class="aj-avancado-textos">
                            <span class="aj-avancado-titulo">{{ $t('ajustesAvancadoTitulo') }}</span>
                            <span class="g-apoio">{{ $t('ajustesAvancadoResumo') }}</span>
                        </span>
                        <i class="ti ti-chevron-down aj-avancado-seta" aria-hidden="true"></i>
                    </summary>
                    <div class="aj-avancado-corpo" v-if="avancadoAberto">
                        <settings-avancado :metadata="metadata" :user-settings-local="userSettingsLocal" :app-settings="appSettings" @changing="onChanging" @changed="onChanged"/>
                    </div>
                </details>
            </section>
        </main>
        <div v-else class="g-conteudo aj-carregando" role="status">
            <i class="ti ti-loader-2 aj-gira" aria-hidden="true"></i>{{ $t('ajustesCarregando') }}
        </div>
    </div>
</template>

<script>
    import { dataService } from "../../js/service/data/dataService";
    import { localStorageService } from "../../js/service/data/localStorageService";
    import GTopo from '../components/gTopo.vue';
    import AjusteSecao from './settings/ajusteSecao.vue';
    import SettingsVoz from './settings/settingsVoz.vue';
    import SettingsAppearance from './settings/settingsAppearance.vue';
    import SettingsModoCrianca from './settings/settingsModoCrianca.vue';
    import SettingsOffline from './settings/settingsOffline.vue';
    import SettingsFormasDeTocar from './settings/settingsFormasDeTocar.vue';
    import SettingsLanguage from './settings/settingsLanguage.vue';
    import SettingsAvancado from './settings/settingsAvancado.vue';

    /**
     * Grilo Falante: Ajustes, one page with a card per thing the family wants to do.
     * Stable links to a card: "#settings/<id>" with id = voz, aparencia, modo-crianca, sem-internet,
     * formas-de-tocar, idioma, avancado (the card's element id is "ajustes-<id>").
     */
    const SECOES = [
        { id: 'voz', icone: 'volume', titulo: 'ajustesVozTitulo' },
        { id: 'aparencia', icone: 'palette', titulo: 'ajustesAparenciaTitulo' },
        { id: 'modo-crianca', icone: 'shield-lock', titulo: 'ajustesModoCurto' },
        { id: 'sem-internet', icone: 'wifi-off', titulo: 'ajustesOfflineTitulo' },
        { id: 'formas-de-tocar', icone: 'hand-finger', titulo: 'ajustesFormasTitulo' },
        { id: 'idioma', icone: 'language', titulo: 'ajustesIdiomaTitulo' },
        { id: 'avancado', icone: 'tool', titulo: 'ajustesAvancadoTitulo' }
    ];

    // other names that may come in the link (old tab names, English)
    const APELIDOS = {
        offline: 'sem-internet', voice: 'voz', appearance: 'aparencia', 'modo': 'modo-crianca', crianca: 'modo-crianca', seguranca: 'modo-crianca',
        lock: 'modo-crianca', input: 'formas-de-tocar', inputmethods: 'formas-de-tocar', language: 'idioma',
        advanced: 'avancado', integrations: 'avancado', integracoes: 'avancado', general: 'modo-crianca'
    };

    const SAVE_STATES = {
        STATE_INITIAL: 'STATE_INITIAL',
        STATE_SAVING: 'STATE_SAVING',
        STATE_SAVED: 'STATE_SAVED'
    };

    export default {
        components: { GTopo, AjusteSecao, SettingsVoz, SettingsAppearance, SettingsModoCrianca, SettingsOffline, SettingsFormasDeTocar, SettingsLanguage, SettingsAvancado },
        props: {
            abaInicial: { type: String, default: '' } // from the route "#settings/:aba"
        },
        data() {
            return {
                metadata: null,
                appSettings: localStorageService.getAppSettings(),
                userSettingsLocal: localStorageService.getUserSettings(),
                SECOES: SECOES,
                SAVE_STATES: SAVE_STATES,
                saveState: SAVE_STATES.STATE_INITIAL,
                secaoAtual: null,
                avancadoAberto: false
            }
        },
        methods: {
            idDe(secao) {
                return 'ajustes-' + secao;
            },
            normalizar(nome) {
                nome = (nome || '').toLowerCase().replace(/^ajustes-/, '');
                if (SECOES.some(s => s.id === nome)) {
                    return nome;
                }
                return APELIDOS[nome] || null;
            },
            irPara(alvo, instantaneo) {
                let elementId = alvo.startsWith('ajustes-') ? alvo : null;
                let secao = this.normalizar(alvo);
                if (secao === 'avancado') {
                    this.avancadoAberto = true;
                }
                if (secao) {
                    this.secaoAtual = secao;
                    elementId = elementId && document.getElementById(elementId) ? elementId : this.idDe(secao);
                    if (history && history.replaceState) {
                        history.replaceState(null, null, location.origin + location.pathname + location.search + '#settings/' + secao);
                    }
                }
                this.$nextTick(() => {
                    let el = elementId ? document.getElementById(elementId) : null;
                    if (el) {
                        let reduzir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                        el.scrollIntoView({ behavior: reduzir || instantaneo ? 'auto' : 'smooth', block: 'start' });
                        if (instantaneo) {
                            // the cards above still load content (voices, preview) and push this one down: align again
                            setTimeout(() => el.scrollIntoView({ block: 'start' }), 600);
                            setTimeout(() => el.scrollIntoView({ block: 'start' }), 1500);
                        }
                        // highlight the card for a moment, so the adult sees where they arrived
                        let cartao = el.closest('.g-cartao') || el;
                        cartao.classList.remove('aj-destaque');
                        void cartao.offsetWidth;
                        cartao.classList.add('aj-destaque');
                        clearTimeout(this.destaqueTimer);
                        this.destaqueTimer = setTimeout(() => cartao.classList.remove('aj-destaque'), 2500);
                    }
                });
            },
            onChanging() {
                this.saveState = SAVE_STATES.STATE_SAVING;
            },
            onChanged() {
                this.saveState = SAVE_STATES.STATE_SAVED;
            },
            usarVoz(voiceId) {
                if (this.$refs.voz) {
                    this.$refs.voz.useVoice(voiceId);
                }
            },
            idiomaPranchasMudou() {
                if (this.$refs.voz) {
                    this.$refs.voz.atualizarVozes();
                }
            },
            secaoDoLink() {
                if (this.abaInicial) {
                    return this.abaInicial;
                }
                let match = location.hash.match(/[?&]secao=([^&]+)/);
                return match ? decodeURIComponent(match[1]) : null;
            }
        },
        async mounted() {
            let metadata = await dataService.getMetadata();
            this.metadata = JSON.parse(JSON.stringify(metadata));
            let alvo = this.secaoDoLink();
            if (alvo && this.normalizar(alvo)) {
                // wait a moment, the cards above get their content (voices, pictures) right after mounting
                this.$nextTick(() => setTimeout(() => this.irPara(alvo, true), 150));
            }
        }
    }
</script>

<style scoped>
    .aj-salvo:empty { display: none; }
    .aj-gira { animation: aj-girar 1s linear infinite; }
    @keyframes aj-girar { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .aj-gira { animation: none; } }

    .aj-atalhos {
        position: sticky;
        top: 64px;
        z-index: 15;
        display: flex;
        gap: var(--g-e2);
        overflow-x: auto;
        padding: var(--g-e2) var(--g-e4);
        background: var(--g-fundo);
        border-bottom: 1px solid var(--g-borda);
        scrollbar-width: thin;
    }
    .aj-atalho {
        flex: none;
        display: inline-flex;
        align-items: center;
        gap: var(--g-e2);
        min-height: var(--g-alvo);
        padding: 0 var(--g-e4);
        border-radius: var(--g-raio-pilula);
        border: 2px solid var(--g-borda);
        background: var(--g-superficie);
        color: var(--g-tinta);
        font-weight: 700;
        text-decoration: none;
        white-space: nowrap;
    }
    .aj-atalho:hover { border-color: var(--g-borda-forte); color: var(--g-tinta); }
    .aj-atalho:focus-visible { outline: none; box-shadow: var(--g-foco); }
    .aj-atalho .ti { font-size: 1.25rem; color: var(--g-folha-escura); }
    .aj-atalho-on { background: var(--g-folha-clara); border-color: var(--g-folha); color: var(--g-folha-escura); }
    @media (min-width: 1100px) {
        .aj-atalhos { justify-content: center; flex-wrap: wrap; }
    }

    .aj-conteudo {
        display: flex;
        flex-direction: column;
        gap: var(--g-e5);
        width: 100%;
    }
    .aj-carregando { display: flex; align-items: center; gap: var(--g-e2); }

    .aj-avancado-cartao { padding: 0; scroll-margin-top: 140px; }
    .aj-avancado-details > summary {
        display: flex;
        align-items: center;
        gap: var(--g-e4);
        padding: var(--g-e4) var(--g-e5);
        min-height: 80px;
        cursor: pointer;
        list-style: none;
        border-radius: var(--g-raio-g);
    }
    .aj-avancado-details > summary::-webkit-details-marker { display: none; }
    .aj-avancado-details > summary:focus-visible { outline: none; box-shadow: var(--g-foco); }
    .aj-avancado-icone {
        flex: none;
        width: 52px;
        height: 52px;
        border-radius: var(--g-raio);
        display: grid;
        place-items: center;
        font-size: 1.75rem;
        background: var(--g-superficie-2);
        color: var(--g-tinta-2);
    }
    .aj-avancado-textos { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .aj-avancado-titulo { font-family: var(--g-fonte-titulo); font-weight: 700; font-size: var(--g-t-h2); line-height: 1.15; }
    .aj-avancado-seta { font-size: 1.5rem; transition: transform var(--g-medio) var(--g-curva); }
    .aj-avancado-details[open] .aj-avancado-seta { transform: rotate(180deg); }
    .aj-avancado-corpo { padding: 0 var(--g-e5) var(--g-e5); }
    @media (max-width: 480px) {
        .aj-avancado-details > summary { padding: var(--g-e4); }
        .aj-avancado-corpo { padding: 0 var(--g-e4) var(--g-e4); }
        .aj-avancado-icone { width: 44px; height: 44px; font-size: 1.5rem; }
        .aj-avancado-titulo { font-size: var(--g-t-h3); }
    }
</style>

<style>
    /* Grilo Falante: small pieces shared by the Ajustes cards (only inside .aj-tela) */
    .aj-tela .aj-sub {
        font-family: var(--g-fonte-titulo);
        font-size: var(--g-t-h3);
        margin: var(--g-e5) 0 var(--g-e3);
    }
    .aj-tela .aj-secao-corpo > div > .aj-sub:first-child,
    .aj-tela .aj-aparencia-campos > .aj-sub:first-child,
    .aj-tela .aj-avancado > .aj-sub:first-child { margin-top: 0; }
    .aj-tela .aj-escolha {
        display: flex;
        flex-wrap: wrap;
        gap: var(--g-e2);
        margin-bottom: var(--g-e2);
    }
    .aj-tela .aj-escolha .g-btn { padding: 0 var(--g-e4); }
    .aj-tela .aj-escolha .g-btn[aria-pressed="true"] {
        background: var(--g-folha-clara);
        border-color: var(--g-folha);
        color: var(--g-folha-escura);
    }
    .aj-tela .aj-duas {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        column-gap: var(--g-e5);
    }
    .aj-tela .g-marcar { margin-bottom: var(--g-e2); align-items: center; }
    .aj-tela .g-marcar input { margin-top: 0; }
    .aj-tela .g-marcar span { font-weight: 400; }
    .aj-tela .g-campo select, .aj-tela .g-campo input[type="text"], .aj-tela .g-campo input[type="password"], .aj-tela .g-campo input[type="number"] {
        max-width: 100%;
    }
    .aj-tela .aj-mais {
        border: 2px solid var(--g-borda);
        border-radius: var(--g-raio);
        background: var(--g-superficie);
        margin-top: var(--g-e4);
    }
    .aj-tela .aj-mais > summary {
        display: flex;
        align-items: center;
        gap: var(--g-e2);
        min-height: var(--g-alvo);
        padding: 0 var(--g-e4);
        font-weight: 700;
        cursor: pointer;
        list-style: none;
        border-radius: var(--g-raio);
    }
    .aj-tela .aj-mais > summary::-webkit-details-marker { display: none; }
    .aj-tela .aj-mais > summary:focus-visible { outline: none; box-shadow: var(--g-foco); }
    .aj-tela .aj-mais > summary .ti { font-size: 1.3rem; color: var(--g-folha-escura); }
    .aj-tela .aj-mais-corpo { padding: var(--g-e2) var(--g-e4) var(--g-e4); }
    .aj-tela .g-cartao { transition: border-color var(--g-medio), box-shadow var(--g-medio); }
    .aj-tela .g-cartao.aj-destaque { border-color: var(--g-girassol); box-shadow: 0 0 0 4px var(--g-girassol-claro); }
    .aj-tela p { margin-top: 0; }
    .aj-tela p.g-dica { margin-bottom: var(--g-e3); }
    .aj-tela .g-campo p.g-dica { margin-bottom: 0; }
    .aj-tela a { color: var(--g-folha-escura); }
</style>
