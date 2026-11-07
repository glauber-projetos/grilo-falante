<template>
    <div class="overflow-content g-tela wz-page">
        <div class="wz-wrap">
            <header class="wz-header">
                <img src="app/img/grilo/grilo-acenando.svg" alt="" aria-hidden="true" class="wz-grilo"/>
                <div class="wz-header-text">
                    <span class="wz-step-label">{{ $t('wizardStepOf', {step: step, total: TOTAL}) }}</span>
                    <div class="wz-dots" aria-hidden="true">
                        <i v-for="n in TOTAL" :key="n" :class="{on: n <= step}"></i>
                    </div>
                </div>
                <button v-if="novaCrianca" type="button" class="g-btn g-btn-leve" @click="cancel()" :disabled="saving">
                    <i class="ti ti-x" aria-hidden="true"></i> {{ $t('entradaCancelar') }}
                </button>
                <button v-else type="button" class="g-btn g-btn-leve" @click="doLater()">{{ $t('wizardDoLater') }}</button>
            </header>

            <!-- 1: nome e foto -->
            <section v-if="step === 1" class="wz-step" aria-labelledby="wzTitle1">
                <h1 id="wzTitle1" class="wz-question">{{ $t('wizardNameQuestion') }}</h1>
                <div class="g-campo wz-campo">
                    <label for="wzName">{{ $t('wizardNameLabel') }}</label>
                    <input id="wzName" ref="nameInput" type="text" class="wz-input" v-model.trim="childName" maxlength="40"
                           :placeholder="$t('wizardNamePlaceholder')" autocomplete="off" @keydown.enter.prevent="next()"/>
                </div>
                <h2 class="wz-sub">{{ $t('wizardPhotoTitle') }}</h2>
                <p class="wz-hint">{{ $t('wizardPhotoHint') }}</p>
                <div class="wz-photo-row">
                    <div class="wz-photo" :class="{empty: !childPhoto}">
                        <img v-if="childPhoto" :src="childPhoto" :alt="$t('wizardPhotoAlt', {name: displayName})"/>
                        <i v-else class="ti ti-mood-kid" aria-hidden="true"></i>
                    </div>
                    <div class="wz-photo-actions">
                        <photo-picker facing="user" :cell-aspect="1" :output-width="400" @photo="childPhoto = $event"/>
                        <button v-if="childPhoto" type="button" class="g-btn g-btn-leve wz-link" @click="childPhoto = null">
                            <i class="ti ti-trash" aria-hidden="true"></i> {{ $t('wizardRemovePhoto') }}
                        </button>
                    </div>
                </div>
                <p class="wz-privacy"><i class="ti ti-lock" aria-hidden="true"></i> {{ $t('wizardPhotoPrivacy') }}</p>
            </section>

            <!-- 2: idade -->
            <section v-if="step === 2" class="wz-step" aria-labelledby="wzTitle2">
                <h1 id="wzTitle2" class="wz-question">{{ $t('wizardAgeQuestion', {name: displayName}) }}</h1>
                <div class="wz-options" role="radiogroup" aria-labelledby="wzTitle2">
                    <button v-for="age in AGES" :key="age.value" type="button" role="radio" class="wz-option"
                            :aria-checked="String(ageGroup === age.value)" :class="{selected: ageGroup === age.value}" @click="setAge(age.value)">
                        <span>{{ $t(age.label) }}</span>
                        <i :class="ageGroup === age.value ? 'ti ti-circle-check-filled' : 'ti ti-circle'" aria-hidden="true"></i>
                    </button>
                </div>
                <p class="wz-hint">{{ $t('wizardAgeHint') }}</p>
            </section>

            <!-- 3: voz -->
            <section v-if="step === 3" class="wz-step" aria-labelledby="wzTitle3">
                <h1 id="wzTitle3" class="wz-question">{{ childName ? $t('wizardVoiceQuestion', {name: childName}) : $t('wizardVoiceQuestionNoName') }}</h1>
                <p v-if="voicesLoading" class="wz-loading"><i class="ti ti-loader-2 wz-spin" aria-hidden="true"></i></p>
                <div v-if="!voicesLoading && voices.length" class="wz-options" role="radiogroup" aria-labelledby="wzTitle3">
                    <div v-for="(voice, index) in voices" :key="voice.id" class="wz-option wz-voice" :class="{selected: voiceId === voice.id}">
                        <button type="button" role="radio" class="wz-voice-select" :aria-checked="String(voiceId === voice.id)" @click="voiceId = voice.id">
                            <i :class="voiceId === voice.id ? 'ti ti-circle-check-filled' : 'ti ti-circle'" aria-hidden="true"></i>
                            <span class="wz-voice-text">
                                <span>{{ $t('wizardVoiceN', {n: index + 1}) }}</span>
                                <small>{{ voice.name }}<template v-if="voice.type !== VOICE_TYPE_NATIVE"> · {{ $t('wizardNeedsInternet') }}</template></small>
                            </span>
                        </button>
                        <button type="button" class="g-btn wz-listen" @click="listen(voice.id)" :aria-label="$t('listen') + ': ' + $t('wizardVoiceN', {n: index + 1})">
                            <i class="ti ti-player-play" aria-hidden="true"></i> {{ $t('listen') }}
                        </button>
                    </div>
                </div>
                <div v-if="!voicesLoading && voices.length">
                    <h2 class="wz-sub">{{ $t('wizardSpeed') }}</h2>
                    <div class="wz-segmented" role="radiogroup" :aria-label="$t('wizardSpeed')">
                        <button v-for="speed in SPEEDS" :key="speed.value" type="button" role="radio" :aria-checked="String(voiceRate === speed.value)"
                                :class="{selected: voiceRate === speed.value}" @click="voiceRate = speed.value; listen(voiceId)">{{ $t(speed.label) }}</button>
                    </div>
                </div>
                <div v-if="!voicesLoading && !voices.length" class="wz-novoice">
                    <p><strong>{{ $t('wizardNoVoice') }}</strong></p>
                    <offline-voice-helper :can-select="true" :current-voice-id="voiceId" @use-voice="useOfflineVoice"/>
                </div>
            </section>

            <!-- 4: tamanho -->
            <section v-if="step === 4" class="wz-step" aria-labelledby="wzTitle4">
                <h1 id="wzTitle4" class="wz-question">{{ $t('wizardSizeQuestion') }}</h1>
                <div class="wz-sizes" role="radiogroup" aria-labelledby="wzTitle4">
                    <button v-for="s in SIZES" :key="s.value" type="button" role="radio" class="wz-size"
                            :aria-checked="String(size === s.value)" :class="{selected: size === s.value}" @click="size = s.value">
                        <span class="wz-mini" :style="{'grid-template-columns': `repeat(${s.cols}, 1fr)`}" aria-hidden="true">
                            <i v-for="n in s.cols * s.rows" :key="n"></i>
                        </span>
                        <strong>{{ $t(s.label) }}</strong>
                        <span>{{ $t('wizardButtonsPerScreen', {n: s.cols * s.rows}) }}</span>
                        <small v-if="s.value === suggestedSize" class="g-pilula g-pilula-ok">{{ $t('wizardSuggestedForAge') }}</small>
                    </button>
                </div>
                <p class="wz-hint">{{ $t('wizardSizeHint') }}</p>
            </section>

            <!-- 5: prancha pronta -->
            <section v-if="step === 5" class="wz-step" aria-labelledby="wzTitle5">
                <h1 id="wzTitle5" class="wz-question">{{ childName ? $t('wizardBoardReady', {name: childName}) : $t('wizardBoardReadyNoName') }}</h1>
                <p class="wz-hint">{{ $t('wizardBoardHint') }}</p>
                <div class="wz-board" :style="{'grid-template-columns': `repeat(${previewColumns}, minmax(0, 1fr))`}" aria-hidden="true">
                    <div v-for="cell in previewCells" :key="cell.key" class="wz-cell" :class="{hidden: cell.hidden, folder: cell.folder}">
                        <img v-if="cell.img" :src="cell.img" alt=""/>
                        <span>{{ cell.label }}</span>
                    </div>
                </div>
                <p v-if="hiddenCount" class="wz-note">{{ $t('wizardHiddenWords', {n: hiddenCount}) }}</p>
                <ul class="wz-tips">
                    <li><i class="ti ti-hand-finger" aria-hidden="true"></i> {{ $t('wizardTipHold') }}</li>
                    <li><i class="ti ti-lock" aria-hidden="true"></i> {{ $t('wizardTipLock') }}</li>
                    <li v-if="novaCrianca"><i class="ti ti-device-tablet" aria-hidden="true"></i> {{ $t('entradaSemSenha') }}</li>
                </ul>
                <p class="wz-credit">{{ ARASAAC_CREDIT }}</p>
                <p v-if="error" class="g-erro" role="alert">{{ $t('wizardSaveError') }}</p>
            </section>

            <footer class="wz-footer">
                <button v-if="step > 1" type="button" class="g-btn g-btn-grande" @click="back()" :disabled="saving"><i class="ti ti-arrow-left" aria-hidden="true"></i> {{ $t('back') }}</button>
                <button v-if="step === 1" type="button" class="g-btn g-btn-grande" @click="next()">{{ $t('wizardSkip') }}</button>
                <button v-if="step < TOTAL" type="button" class="g-btn g-btn-principal g-btn-grande" @click="next()">{{ $t('wizardNext') }} <i class="ti ti-arrow-right" aria-hidden="true"></i></button>
                <button v-if="step === TOTAL" type="button" class="g-btn g-btn-principal g-btn-grande" @click="finish()" :disabled="saving">
                    <i :class="saving ? 'ti ti-loader-2 wz-spin' : 'ti ti-player-play'" aria-hidden="true"></i> {{ $t('wizardStart') }}
                </button>
            </footer>
        </div>
    </div>
</template>

<script>
/**
 * Setup wizard on first use (Grilo Falante): name and photo, age, voice, button size and a
 * ready starter board in Brazilian Portuguese. Every step can be skipped and changed later.
 * With novaCrianca (opened from the Entrada) the offline profile is created, without password, on finish.
 */
import PhotoPicker from '../components/photoPicker.vue';
import OfflineVoiceHelper from '../views/settings/offlineVoiceHelper.vue';
import { setupWizard } from '../../js/wizard/setupWizard';
import { starterBoard } from '../../js/wizard/starterBoard';
import {
    WORDS, TOPICS, ARASAAC_CREDIT, SIZE_LARGE, SIZE_MEDIUM, SIZE_SMALL, AGE_2_3, AGE_4_6, AGE_7_10, AGE_11
} from '../../js/wizard/starterBoardData';
import { speechService } from '../../js/service/speechService';
import { localStorageService } from '../../js/service/data/localStorageService';
import { Router } from '../../js/router';
import { pickWizardVoices } from '../../js/wizard/wizardVoices';
import { perfilArquivoService } from '../../js/service/perfilArquivoService';

const TOTAL = 5;

export default {
    components: { PhotoPicker, OfflineVoiceHelper },
    props: {
        // aberto pela Entrada ("Nova criança"): cria o perfil offline, sem senha, ao terminar
        novaCrianca: { type: Boolean, default: false }
    },
    data() {
        return {
            TOTAL,
            ARASAAC_CREDIT,
            VOICE_TYPE_NATIVE: 'VOICE_TYPE_NATIVE',
            AGES: [
                { value: AGE_2_3, label: 'wizardAge23' },
                { value: AGE_4_6, label: 'wizardAge46' },
                { value: AGE_7_10, label: 'wizardAge710' },
                { value: AGE_11, label: 'wizardAge11' }
            ],
            SIZES: [
                { value: SIZE_LARGE, label: 'wizardSizeLarge', cols: 4, rows: 3 },
                { value: SIZE_MEDIUM, label: 'wizardSizeMedium', cols: 5, rows: 4 },
                { value: SIZE_SMALL, label: 'wizardSizeSmall', cols: 6, rows: 5 }
            ],
            SPEEDS: [
                { value: 0.8, label: 'wizardSlower' },
                { value: 1, label: 'wizardNormal' },
                { value: 1.2, label: 'wizardFaster' }
            ],
            step: 1,
            childName: '',
            childPhoto: null,
            ageGroup: AGE_4_6,
            size: SIZE_MEDIUM,
            sizeChosen: false,
            voices: [],
            voicesLoading: true,
            voiceId: null,
            voiceRate: 1,
            images: null,
            saving: false,
            error: false,
            createdUser: null
        };
    },
    computed: {
        displayName() {
            return this.childName || this.$t('wizardTheChild');
        },
        suggestedSize() {
            return starterBoard.getAgeSuggestion(this.ageGroup).size;
        },
        previewColumns() {
            return Math.max(...starterBoard.getLayout(this.size).map((row) => row.length));
        },
        hiddenKeys() {
            return starterBoard.getHiddenKeys(this.size, this.ageGroup);
        },
        hiddenCount() {
            return this.hiddenKeys.length;
        },
        previewCells() {
            let cells = [];
            for (let key of starterBoard.getLayout(this.size).flat()) {
                let topic = TOPICS[key];
                let imageKey = topic ? topic.image : key;
                let img = this.images && this.images[imageKey] ? this.images[imageKey].data : null;
                if (key === 'eu' && this.childPhoto) {
                    img = this.childPhoto;
                }
                cells.push({
                    key: key,
                    label: topic ? topic.label : WORDS[key].label,
                    img: img,
                    folder: !!topic,
                    hidden: this.hiddenKeys.includes(key)
                });
            }
            return cells;
        }
    },
    methods: {
        setAge(value) {
            this.ageGroup = value;
            if (!this.sizeChosen) {
                this.size = starterBoard.getAgeSuggestion(value).size;
            }
        },
        next() {
            if (this.step === 4) {
                this.sizeChosen = true;
            }
            speechService.stopSpeaking();
            this.step = Math.min(TOTAL, this.step + 1);
            this.focusTitle();
        },
        back() {
            speechService.stopSpeaking();
            this.step = Math.max(1, this.step - 1);
            this.focusTitle();
        },
        focusTitle() {
            this.$nextTick(() => {
                let title = this.$el.querySelector('.wz-question');
                if (title) {
                    title.setAttribute('tabindex', '-1');
                    title.focus();
                }
            });
        },
        listen(voiceId) {
            if (!voiceId) {
                return;
            }
            let text = this.childName ? this.$t('wizardVoiceSampleName', {name: this.childName}) : this.$t('wizardVoiceSample');
            speechService.stopSpeaking();
            speechService.speak(text, { preferredVoice: voiceId, rate: this.voiceRate, useStandardRatePitch: false });
        },
        useOfflineVoice(voiceId) {
            this.voiceId = voiceId;
            this.loadVoices();
        },
        async loadVoices() {
            this.voicesLoading = true;
            let all = await speechService.getVoicesInitialized();
            this.voices = pickWizardVoices(all);
            let current = (localStorageService.getUserSettings().voiceConfig || {}).preferredVoice;
            if (!this.voiceId || !this.voices.some((v) => v.id === this.voiceId)) {
                this.voiceId = this.voices.some((v) => v.id === current) ? current : (this.voices[0] ? this.voices[0].id : null);
            }
            this.voicesLoading = false;
        },
        async finish() {
            this.saving = true;
            this.error = false;
            try {
                if (this.novaCrianca && !this.createdUser) {
                    this.createdUser = await perfilArquivoService.criarPerfil(this.childName, { foto: this.childPhoto });
                }
                await setupWizard.saveVoice(this.voiceId, this.voiceRate);
                let mainGrid = await setupWizard.createStarterBoard({
                    childName: this.childName,
                    childPhoto: this.childPhoto,
                    ageGroup: this.ageGroup,
                    size: this.size,
                    boardName: this.childName ? this.$t('wizardBoardName', {name: this.childName}) : this.$t('wizardBoardNameDefault')
                });
                Router.toGrid(mainGrid.id);
            } catch (e) {
                log.warn('setup wizard: could not save', e);
                this.error = true;
            }
            this.saving = false;
        },
        doLater() {
            speechService.stopSpeaking();
            Router.toManageGrids();
        },
        cancel() {
            speechService.stopSpeaking();
            this.$emit('fechar');
        }
    },
    async mounted() {
        this.$nextTick(() => {
            if (this.$refs.nameInput) {
                this.$refs.nameInput.focus();
            }
        });
        this.loadVoices();
        try {
            this.images = await setupWizard.loadImages();
        } catch (e) {
            log.warn('setup wizard: could not load pictograms', e);
        }
    },
    beforeDestroy() {
        speechService.stopSpeaking();
    }
};
</script>

<style scoped>
.wz-page {
    min-height: 100%;
}

.wz-wrap {
    max-width: 52em;
    margin: 0 auto;
    padding: var(--g-e4) max(var(--g-e4), env(safe-area-inset-left, 0px)) var(--g-e6);
    display: flex;
    flex-direction: column;
    gap: var(--g-e5);
}

.wz-page *, .wz-page *::before, .wz-page *::after {
    box-sizing: border-box;
}

.wz-header {
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    gap: var(--g-e3);
}

.wz-grilo {
    width: 64px;
    height: auto;
    flex: none;
}

.wz-header-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--g-e2);
    min-width: 0;
}

.wz-step-label {
    font-weight: 700;
    white-space: nowrap;
    color: var(--g-tinta-2);
}

.wz-dots {
    display: flex;
    gap: var(--g-e1);
}

.wz-dots i {
    display: block;
    flex: 0 1 40px;
    height: 8px;
    border-radius: var(--g-raio-pilula);
    background: var(--g-borda);
}

.wz-dots i.on {
    background: var(--g-folha);
}

.wz-step {
    display: flex;
    flex-direction: column;
    gap: var(--g-e3);
}

.g-tela .wz-question {
    font-size: clamp(26px, 4vw, 36px);
    margin: 0;
    outline: none;
}

.g-tela .wz-sub {
    font-size: var(--g-t-h3);
    margin: var(--g-e2) 0 0;
}

.wz-hint,
.wz-privacy,
.wz-note,
.wz-credit {
    margin: 0;
    color: var(--g-tinta-2);
    max-width: 60ch;
}

.wz-privacy {
    display: flex;
    gap: var(--g-e2);
    align-items: center;
}

.wz-note {
    background: var(--g-girassol-claro);
    color: #4a3b00;
    border-radius: var(--g-raio);
    padding: var(--g-e3) var(--g-e4);
}

.wz-credit {
    font-size: var(--g-t-legenda);
    color: var(--g-tinta-3);
}

.wz-campo {
    max-width: 26em;
    margin-bottom: 0;
}

.g-campo input.wz-input {
    font-size: 22px;
    min-height: var(--g-alvo-g);
}

.wz-photo-row {
    display: flex;
    gap: var(--g-e4);
    align-items: center;
    flex-wrap: wrap;
}

.wz-photo {
    width: 112px;
    height: 112px;
    border-radius: 50%;
    overflow: hidden;
    flex: none;
    background: var(--g-folha-clara);
    display: grid;
    place-items: center;
    border: 3px solid var(--g-folha);
}

.wz-photo.empty {
    border-style: dashed;
    border-color: var(--g-borda-forte);
    background: var(--g-superficie-2);
}

.wz-photo .ti {
    font-size: 56px;
    color: var(--g-folha-escura);
}

.wz-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.wz-photo-actions {
    flex: 1 1 18em;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--g-e2);
}

.wz-link {
    align-self: flex-start;
}

.wz-options {
    display: grid;
    gap: var(--g-e2);
    max-width: 34em;
}

.wz-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--g-e3);
    margin: 0;
    min-height: var(--g-alvo-g);
    padding: var(--g-e2) var(--g-e4);
    text-align: left;
    text-transform: none;
    letter-spacing: 0;
    font-family: var(--g-fonte);
    font-size: var(--g-t-grande);
    font-weight: 700;
    line-height: 1.25;
    white-space: normal;
    height: auto;
    color: var(--g-tinta);
    background: var(--g-superficie);
    border: 2px solid var(--g-borda);
    border-radius: var(--g-raio);
    cursor: pointer;
}

.wz-option:hover {
    border-color: var(--g-borda-forte);
    color: var(--g-tinta);
}

.wz-option.selected {
    border-color: var(--g-folha);
    background: var(--g-folha-clara);
}

.wz-option .ti {
    font-size: 26px;
    color: var(--g-folha);
    flex: none;
}

.wz-voice {
    padding: var(--g-e1) var(--g-e2) var(--g-e1) var(--g-e1);
    cursor: default;
}

.wz-voice-select {
    flex: 1;
    min-width: 0;
    margin: 0;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    gap: var(--g-e3);
    text-align: left;
    text-transform: none;
    letter-spacing: 0;
    font-family: var(--g-fonte);
    font-size: 1em;
    font-weight: 700;
    color: var(--g-tinta);
    height: auto;
    min-height: var(--g-alvo);
    padding: var(--g-e2) var(--g-e3);
    border-radius: var(--g-raio-p);
    white-space: normal;
    cursor: pointer;
}

.wz-voice-select:hover,
.wz-voice-select:focus {
    background: transparent;
    border: none;
    color: var(--g-tinta);
}

.wz-voice-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.wz-voice-select small {
    font-weight: 400;
    color: var(--g-tinta-2);
    font-size: var(--g-t-legenda);
    overflow-wrap: anywhere;
}

.wz-listen {
    flex: none;
    padding: 0 var(--g-e4);
}

.wz-segmented {
    display: flex;
    flex-wrap: wrap;
    gap: var(--g-e2);
    margin-top: var(--g-e2);
}

.wz-segmented button {
    margin: 0;
    flex: 1 1 8em;
    min-height: var(--g-alvo);
    text-transform: none;
    letter-spacing: 0;
    font-family: var(--g-fonte);
    font-size: var(--g-t-corpo);
    font-weight: 700;
    height: auto;
    color: var(--g-tinta);
    background: var(--g-superficie);
    border: 2px solid var(--g-borda);
    border-radius: var(--g-raio-pilula);
    cursor: pointer;
}

.wz-segmented button.selected {
    border-color: var(--g-folha);
    background: var(--g-folha-clara);
}

.wz-sizes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--g-e3);
}

@media (max-width: 560px) {
    .wz-sizes {
        grid-template-columns: minmax(0, 1fr);
    }
}

.wz-size {
    margin: 0;
    height: auto;
    padding: var(--g-e4);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--g-e2);
    text-transform: none;
    letter-spacing: 0;
    font-family: var(--g-fonte);
    font-size: var(--g-t-corpo);
    font-weight: 400;
    line-height: 1.25;
    white-space: normal;
    color: var(--g-tinta);
    background: var(--g-superficie);
    border: 2px solid var(--g-borda);
    border-radius: var(--g-raio-g);
    cursor: pointer;
}

.wz-size:hover {
    color: var(--g-tinta);
}

.wz-size.selected {
    border-color: var(--g-folha);
    background: var(--g-folha-clara);
}

.wz-size strong {
    font-size: var(--g-t-grande);
}

.wz-mini {
    display: grid;
    gap: 3px;
    width: 100%;
    max-width: 9em;
    margin-bottom: var(--g-e1);
}

.wz-mini i {
    display: block;
    aspect-ratio: 1.2;
    border: 1.5px solid var(--g-borda-forte);
    border-radius: 4px;
    background: var(--g-superficie);
}

.wz-size.selected .wz-mini i {
    border-color: var(--g-folha);
}

.wz-board {
    display: grid;
    gap: var(--g-e2);
    background: var(--g-superficie-2);
    border-radius: var(--g-raio);
    padding: var(--g-e2);
}

.wz-cell {
    background: var(--g-superficie);
    border: 2px solid var(--g-borda);
    border-radius: var(--g-raio-p);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--g-e1);
    min-width: 0;
    aspect-ratio: 1.15;
    font-weight: 700;
    font-size: 0.9em;
    text-align: center;
    line-height: 1.1;
    overflow: hidden;
}

.wz-cell img {
    flex: 1;
    min-height: 0;
    max-width: 100%;
    object-fit: contain;
}

.wz-cell span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.wz-cell.folder {
    border-color: var(--g-folha);
    border-top-width: 6px;
}

.wz-cell.hidden {
    border-style: dashed;
    opacity: 0.4;
    filter: grayscale(1);
}

.wz-tips {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--g-e2);
}

.wz-tips li {
    display: flex;
    gap: var(--g-e2);
    align-items: center;
    margin: 0;
}

.wz-tips .ti {
    color: var(--g-folha);
    font-size: 22px;
    flex: none;
}

.wz-novoice {
    display: flex;
    flex-direction: column;
    gap: var(--g-e2);
}

.wz-loading .ti {
    font-size: 32px;
    color: var(--g-folha);
}

.wz-spin {
    display: inline-block;
    animation: wz-girar 0.9s linear infinite;
}

@keyframes wz-girar {
    to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
    .wz-spin { animation: none; }
}

.wz-footer {
    display: flex;
    gap: var(--g-e3);
    justify-content: flex-end;
    flex-wrap: wrap;
    padding-top: var(--g-e4);
    border-top: 2px solid var(--g-borda);
}

.wz-footer .g-btn {
    min-width: 9em;
}

@media (max-width: 480px) {
    .wz-grilo { width: 48px; }
    .wz-footer .g-btn { flex: 1 1 40%; min-width: 0; }
}
</style>
