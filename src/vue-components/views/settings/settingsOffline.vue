<template>
    <div class="aj-offline">
        <h3 class="aj-sub">{{ $t('offlineImagesTitle') }}</h3>
        <p class="g-apoio">{{ $t('offlineImagesExplanation') }}</p>

        <div class="aj-estado" :class="'aj-estado-' + estado" aria-live="polite">
            <img :src="'app/img/grilo/mascote/grilo-' + mascoteEstado + '.webp'" alt="" aria-hidden="true" class="aj-estado-grilo"/>
            <div class="aj-estado-textos">
                <strong class="aj-estado-titulo">{{ tituloEstado }}</strong>
                <span v-if="textoEstado" class="aj-estado-texto">{{ textoEstado }}</span>
                <span v-if="!loading && embeddedCount > 0" class="aj-estado-texto">{{ $t('offlineImagesEmbeddedPhotos', { count: embeddedCount }) }}</span>
            </div>
        </div>

        <div v-if="supported && !loading && (faltam > 0 || downloading)" class="aj-offline-acoes">
            <button id="downloadOfflineImages" class="g-btn g-btn-principal g-btn-grande" @click="download"
                    :disabled="downloading || !online || status.total === 0 || faltam === 0">
                <i :class="downloading ? 'ti ti-loader-2' : 'ti ti-cloud-download'" aria-hidden="true"></i>
                {{ faltam > 0 ? $t('ajustesOfflineGuardar', { count: faltam }) : $t('ajustesOfflineGuardarTudo') }}
            </button>
            <button v-if="downloading" class="g-btn g-btn-grande" @click="stopRequested = true">
                <i class="ti ti-player-stop" aria-hidden="true"></i>{{ $t('offlineImagesStop') }}
            </button>
        </div>
        <p v-if="!online && !downloading" class="g-aviso aj-offline-aviso">
            <i class="ti ti-wifi-off" aria-hidden="true"></i><span>{{ $t('offlineImagesNoInternetNow') }}</span>
        </p>

        <div v-if="progress" class="aj-progresso" aria-live="polite">
            <progress :value="progress.done" :max="progress.total || 1"></progress>
            <span class="g-dica">{{ $t('offlineImagesProgress', { done: progress.done, total: progress.total }) }}</span>
        </div>
        <p v-if="resultMessage" class="aj-resultado" aria-live="polite"><strong>{{ resultMessage }}</strong></p>

        <ul v-if="!loading && supported" class="aj-detalhes">
            <li v-if="!hasServiceWorker"><i class="ti ti-alert-triangle" aria-hidden="true"></i><span>{{ $t('offlineImagesServiceWorkerMissing') }}</span></li>
            <li v-if="storage.persisted"><i class="ti ti-lock" aria-hidden="true"></i><span>{{ $t('offlineImagesStoragePersistent') }}</span></li>
            <li v-else><i class="ti ti-info-circle" aria-hidden="true"></i><span>{{ $t('offlineImagesStorageHint') }}</span></li>
            <li v-if="storage.usage !== null"><i class="ti ti-database" aria-hidden="true"></i><span>{{ $t('offlineImagesSpaceUsed', { size: formatBytes(storage.usage) }) }}</span></li>
            <li><i class="ti ti-photo" aria-hidden="true"></i><span>{{ $t('offlineImagesAddNewHint') }}</span></li>
        </ul>

        <p class="g-dica aj-licenca">
            {{ $t('offlineImagesLicense') }}
            <a href="https://arasaac.org/terms-of-use" target="_blank" rel="noopener">arasaac.org/terms-of-use</a>
        </p>

        <h3 class="aj-sub" id="ajustes-voz-sem-internet">{{ $t('offlineVoiceTitle') }}</h3>
        <offline-voice-helper :can-select="true" :current-voice-id="userSettingsLocal && userSettingsLocal.voiceConfig ? userSettingsLocal.voiceConfig.preferredVoice : undefined"
                              @use-voice="id => $emit('use-voice', id)"/>
    </div>
</template>

<script>
    import { dataService } from '../../../js/service/data/dataService';
    import { offlineService } from '../../../js/service/offlineService';
    import OfflineVoiceHelper from './offlineVoiceHelper.vue';

    /**
     * Ajustes > Sem internet: save the pictures of the boards on the device (offlineService) and check the voice.
     * Emits "use-voice" when the adult picks the voice found by the voice check.
     */
    export default {
        components: { OfflineVoiceHelper },
        props: ['userSettingsLocal', 'metadata'],
        data() {
            return {
                loading: true,
                supported: offlineService.isSupported(),
                urls: [],
                embeddedCount: 0,
                status: { total: 0, cached: 0, missing: [] },
                storage: { persisted: false, usage: null, quota: null },
                downloading: false,
                stopRequested: false,
                progress: null,
                resultMessage: '',
                online: navigator.onLine,
                hasServiceWorker: !!(navigator.serviceWorker && navigator.serviceWorker.controller)
            };
        },
        computed: {
            faltam() {
                return Math.max(0, (this.status.total || 0) - (this.status.cached || 0));
            },
            estado() {
                if (this.loading) {
                    return 'carregando';
                }
                if (!this.supported) {
                    return 'aviso';
                }
                return this.faltam === 0 ? 'pronto' : 'falta';
            },
            mascoteEstado() {
                // new mascot (DESIGN.md): festa when all is ready, surpreso when something is missing, pensando while checking
                return { carregando: 'pensando', aviso: 'surpreso', pronto: 'festa', falta: 'surpreso' }[this.estado];
            },
            tituloEstado() {
                switch (this.estado) {
                    case 'carregando': return this.$t('ajustesOfflineConferindo');
                    case 'aviso': return this.$t('offlineImagesNotSupported');
                    case 'pronto': return this.$t('ajustesOfflineTudoPronto');
                    default: return this.$t('ajustesOfflineFaltam', { count: this.faltam });
                }
            },
            textoEstado() {
                if (this.estado === 'pronto') {
                    return this.status.total === 0 ? this.$t('offlineImagesNoWebImages') : this.$t('offlineImagesAllSaved', { total: this.status.total });
                }
                if (this.estado === 'falta') {
                    return this.$t('offlineImagesSomeSaved', { cached: this.status.cached, total: this.status.total });
                }
                return '';
            }
        },
        methods: {
            formatBytes: offlineService.formatBytes,
            async refresh() {
                this.status = await offlineService.getStatus(this.urls);
                this.storage = await offlineService.getStorageInfo();
            },
            async download() {
                this.downloading = true;
                this.stopRequested = false;
                this.resultMessage = '';
                await offlineService.requestPersistentStorage();
                let missing = (await offlineService.getStatus(this.urls)).missing;
                this.progress = { done: 0, total: missing.length };
                let result = await offlineService.downloadImages(missing, {
                    onProgress: (p) => {
                        this.progress = { done: p.done, total: p.total };
                    },
                    shouldStop: () => this.stopRequested || !navigator.onLine
                });
                await this.refresh();
                if (this.status.cached === this.status.total) {
                    this.resultMessage = this.$t('offlineImagesDone');
                } else if (result.stopped) {
                    this.resultMessage = this.$t('offlineImagesStopped', { count: this.status.total - this.status.cached });
                } else {
                    this.resultMessage = this.$t('offlineImagesSomeFailed', { count: this.status.total - this.status.cached });
                }
                this.progress = null;
                this.downloading = false;
            },
            onOnlineChange() {
                this.online = navigator.onLine;
            }
        },
        async mounted() {
            window.addEventListener('online', this.onOnlineChange);
            window.addEventListener('offline', this.onOnlineChange);
            let grids = await dataService.getGrids(true);
            this.urls = offlineService.collectImageUrls(grids);
            this.embeddedCount = (grids || []).reduce((sum, grid) => sum + (grid.gridElements || []).filter(e => e.image && e.image.data).length, 0);
            if (this.supported) {
                await this.refresh();
            }
            this.loading = false;
        },
        beforeDestroy() {
            this.stopRequested = true;
            window.removeEventListener('online', this.onOnlineChange);
            window.removeEventListener('offline', this.onOnlineChange);
        }
    };
</script>

<style scoped>
    .aj-estado {
        display: flex;
        align-items: center;
        gap: var(--g-e4);
        padding: var(--g-e4) var(--g-e5);
        border-radius: var(--g-raio);
        margin: var(--g-e3) 0 var(--g-e4);
        background: var(--g-superficie-2);
    }
    .aj-estado-grilo { width: 72px; height: 84px; object-fit: contain; flex: none; }
    @media (max-width: 420px) {
        .aj-estado { gap: var(--g-e3); padding: var(--g-e3) var(--g-e4); align-items: flex-start; }
        .aj-estado-grilo { width: 52px; height: 64px; }
    }
    .aj-estado-pronto { background: var(--g-folha-clara); color: var(--g-folha-escura); }
    .aj-estado-falta { background: var(--g-girassol-claro); color: #4a3b00; }
    .aj-estado-aviso { background: var(--g-perigo-claro); color: var(--g-perigo); }
    .aj-estado-textos { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .aj-estado-titulo { font-family: var(--g-fonte-titulo); font-size: var(--g-t-h3); line-height: 1.2; }
    .aj-offline-acoes .ti-loader-2 { animation: aj-girar 1s linear infinite; }
    @keyframes aj-girar { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
        .aj-offline-acoes .ti-loader-2 { animation: none; }
    }
    .aj-offline-acoes {
        display: flex;
        gap: var(--g-e3);
        flex-wrap: wrap;
        margin-bottom: var(--g-e4);
    }
    .aj-offline-acoes .g-btn-principal { flex: 1 1 280px; }
    .aj-offline-aviso { margin: 0 0 var(--g-e4); }
    .aj-progresso { display: flex; flex-direction: column; gap: var(--g-e1); margin-bottom: var(--g-e3); }
    .aj-progresso progress { width: 100%; height: 16px; accent-color: var(--g-folha); }
    .aj-resultado { margin: 0 0 var(--g-e3); }
    .aj-detalhes {
        list-style: none;
        margin: 0 0 var(--g-e3);
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--g-e2);
        color: var(--g-tinta-2);
    }
    .aj-detalhes li { display: flex; gap: var(--g-e2); align-items: flex-start; margin: 0; }
    .aj-detalhes .ti { font-size: 20px; flex: none; margin-top: 1px; }
    .aj-licenca { margin-bottom: var(--g-e5); }
</style>
