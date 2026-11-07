<template>
    <div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('offlineImagesTitle') }}</h3>
                <div class="srow break-word">{{ $t('offlineImagesExplanation') }}</div>

                <div class="srow" aria-live="polite">
                    <span v-if="loading" class="fas fa-spin fa-spinner"></span>
                    <template v-else>
                        <div v-if="!supported">
                            <span class="fas fa-exclamation-triangle" aria-hidden="true"></span>
                            {{ $t('offlineImagesNotSupported') }}
                        </div>
                        <div v-else-if="status.total === 0">
                            <span class="fas fa-check-circle" aria-hidden="true"></span>
                            {{ $t('offlineImagesNoWebImages') }}
                        </div>
                        <div v-else-if="status.cached === status.total">
                            <span class="fas fa-check-circle" aria-hidden="true"></span>
                            <strong>{{ $t('offlineImagesAllSaved', { total: status.total }) }}</strong>
                        </div>
                        <div v-else>
                            <span class="fas fa-exclamation-triangle" aria-hidden="true"></span>
                            <strong>{{ $t('offlineImagesSomeSaved', { cached: status.cached, total: status.total }) }}</strong>
                        </div>
                        <div v-if="embeddedCount > 0" class="mt-2">{{ $t('offlineImagesEmbeddedPhotos', { count: embeddedCount }) }}</div>
                    </template>
                </div>

                <div class="srow" v-if="supported && !loading">
                    <button id="downloadOfflineImages" class="six columns" @click="download" :disabled="downloading || !online || status.total === 0">
                        <span class="fas fa-download" aria-hidden="true"></span>
                        {{ $t('offlineImagesDownloadButton') }}
                    </button>
                    <button v-if="downloading" class="three columns" @click="stopRequested = true">{{ $t('offlineImagesStop') }}</button>
                </div>
                <div class="srow" v-if="!online && !downloading">
                    <span class="fas fa-wifi" aria-hidden="true"></span> {{ $t('offlineImagesNoInternetNow') }}
                </div>

                <div class="srow" v-if="progress" aria-live="polite">
                    <progress class="eleven columns" :value="progress.done" :max="progress.total || 1"></progress>
                    <div>{{ $t('offlineImagesProgress', { done: progress.done, total: progress.total }) }}</div>
                </div>
                <div class="srow" v-if="resultMessage" aria-live="polite">
                    <strong class="break-word">{{ resultMessage }}</strong>
                </div>

                <div class="srow" v-if="!loading && supported">
                    <div v-if="!hasServiceWorker" class="mb-2">
                        <span class="fas fa-exclamation-triangle" aria-hidden="true"></span>
                        {{ $t('offlineImagesServiceWorkerMissing') }}
                    </div>
                    <div v-if="storage.persisted" class="mb-2">
                        <span class="fas fa-lock" aria-hidden="true"></span> {{ $t('offlineImagesStoragePersistent') }}
                    </div>
                    <div v-else class="mb-2">
                        <span class="fas fa-info-circle" aria-hidden="true"></span> {{ $t('offlineImagesStorageHint') }}
                    </div>
                    <div v-if="storage.usage !== null">{{ $t('offlineImagesSpaceUsed', { size: formatBytes(storage.usage) }) }}</div>
                    <div class="mt-2">{{ $t('offlineImagesAddNewHint') }}</div>
                </div>

                <div class="srow license break-word">
                    <span class="fas fa-info-circle" aria-hidden="true"></span>
                    {{ $t('offlineImagesLicense') }}
                    <a href="https://arasaac.org/terms-of-use" target="_blank" rel="noopener">arasaac.org/terms-of-use</a>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('offlineVoiceTitle') }}</h3>
                <offline-voice-helper :current-voice-id="userSettingsLocal && userSettingsLocal.voiceConfig ? userSettingsLocal.voiceConfig.preferredVoice : undefined"/>
            </div>
        </div>
    </div>
</template>

<script>
    import { dataService } from '../../../js/service/data/dataService';
    import { offlineService } from '../../../js/service/offlineService';
    import OfflineVoiceHelper from './offlineVoiceHelper.vue';

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
    .srow {
        margin-bottom: 1.5em;
    }
    h3 {
        margin-bottom: 0.5em;
    }
    button .fas, .srow > div > .fas {
        margin-right: 0.25em;
    }
    progress {
        height: 1.5em;
    }
</style>
