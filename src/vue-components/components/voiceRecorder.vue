<template>
    <div class="voice-recorder">
        <p v-if="state === 'idle'" class="vr-hint">{{ $t('recordVoiceHint') }}</p>
        <div class="vr-buttons">
            <button v-if="state !== 'recording'" type="button" class="vr-btn vr-record" @click="start()">
                <i class="fas fa-microphone" aria-hidden="true"></i>
                <span>{{ recording ? $t('recordAgain') : $t('startRecording') }}</span>
            </button>
            <button v-if="state === 'recording'" type="button" class="vr-btn vr-stop" @click="stop()">
                <i class="fas fa-stop" aria-hidden="true"></i>
                <span>{{ $t('stopRecording') }} ({{ secondsLeft }})</span>
            </button>
            <button v-if="recording && state !== 'recording'" type="button" class="vr-btn" @click="play()">
                <i class="fas fa-play" aria-hidden="true"></i> <span>{{ $t('listen') }}</span>
            </button>
        </div>
        <div v-if="state === 'recording'" class="vr-level" aria-hidden="true">
            <span :style="{width: Math.round(elapsedMs / maxMs * 100) + '%'}"></span>
        </div>
        <p v-if="error" class="vr-error" role="alert">{{ $t('microphoneNotAllowed') }}</p>
    </div>
</template>

<script>
/**
 * Records the voice of a family member for a button (max. 10 seconds), using audioUtil.
 *
 * props:
 * - recording: current recording {base64, mimeType, durationMs} or null
 * - maxMs: max. recording time
 *
 * events: recorded({base64, mimeType, durationMs})
 */
import { audioUtil } from '../../js/util/audioUtil';

export default {
    props: {
        recording: { type: Object, default: null },
        maxMs: { type: Number, default: 10000 }
    },
    data() {
        return {
            state: 'idle', // idle | recording | done
            elapsedMs: 0,
            intervalHandler: null,
            error: false
        };
    },
    computed: {
        secondsLeft() {
            return Math.max(0, Math.ceil((this.maxMs - this.elapsedMs) / 1000));
        }
    },
    methods: {
        async start() {
            this.error = false;
            audioUtil.stopAudio();
            try {
                await audioUtil.record((data) => {
                    this.state = 'done';
                    this.$emit('recorded', {
                        base64: data.base64,
                        mimeType: data.mimeType,
                        durationMs: this.elapsedMs
                    });
                });
            } catch (e) {
                this.error = true;
                this.state = 'idle';
                return;
            }
            if (!audioUtil.isRecording()) {
                this.error = true;
                return;
            }
            this.state = 'recording';
            this.elapsedMs = 0;
            clearInterval(this.intervalHandler);
            this.intervalHandler = setInterval(() => {
                this.elapsedMs += 100;
                if (this.elapsedMs >= this.maxMs) {
                    this.stop();
                }
            }, 100);
        },
        stop() {
            clearInterval(this.intervalHandler);
            if (audioUtil.isRecording()) {
                audioUtil.stopRecording();
            }
        },
        play() {
            if (this.recording && this.recording.base64) {
                audioUtil.stopAudio();
                audioUtil.playAudio(this.recording.base64);
            }
        }
    },
    beforeDestroy() {
        clearInterval(this.intervalHandler);
        if (audioUtil.isRecording()) {
            audioUtil.stopRecording();
        }
    }
};
</script>

<style scoped>
.vr-hint {
    margin: 0 0 0.6em;
}

.vr-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6em;
}

.vr-btn {
    flex: 1 1 10em;
    min-height: 3em;
    margin: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    text-transform: none;
    font-size: 1.05em;
    letter-spacing: 0;
}

.vr-record {
    background-color: var(--gf-mata, #1D6B35);
    border-color: var(--gf-mata, #1D6B35);
    color: #FFFFFF;
}

.vr-record:hover,
.vr-record:focus {
    background-color: var(--gf-mata-escuro, #175A2C);
    color: #FFFFFF;
}

.vr-stop {
    border-color: var(--gf-coral, #B8391F);
    color: var(--gf-coral, #B8391F);
}

.vr-level {
    margin-top: 0.6em;
    height: 0.5em;
    border-radius: 0.25em;
    background: var(--gf-linha, #D3E0D0);
    overflow: hidden;
}

.vr-level span {
    display: block;
    height: 100%;
    background: var(--gf-coral, #B8391F);
    transition: width 0.1s linear;
}

.vr-error {
    margin: 0.6em 0 0;
    color: var(--gf-coral, #B8391F);
    font-weight: 700;
}
</style>
