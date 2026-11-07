<template>
    <button ref="btn" type="button" class="hold-to-unlock" :class="{holding: progress > 0}"
            :style="progressStyle"
            :aria-label="$t('holdToUnlock')" :title="$t('holdToUnlock')"
            @keydown.enter.space.prevent="onKeyDown" @keyup.enter.space.prevent="onKeyUp" @click.prevent="onClick">
        <i class="fas fa-unlock"></i>
        <span v-if="showHint" class="hold-hint" role="status">{{ $t('holdToUnlockShort') }}</span>
    </button>
</template>

<script>
/**
 * Lock button of the child mode: the adult has to hold it for 3 seconds to leave the child mode.
 * A green bar fills while holding. Releasing before the time is over does nothing.
 *
 * events: unlock
 */
import { holdGesture } from '../../js/input/holdGesture';

export default {
    props: {
        duration: { type: Number, default: 3000 }
    },
    data() {
        return {
            progress: 0,
            showHint: false,
            hintTimeout: null,
            detach: null,
            keyDetector: null
        };
    },
    computed: {
        progressStyle() {
            if (!this.progress) {
                return {};
            }
            let percent = Math.round(this.progress * 100);
            return {
                background: `linear-gradient(to right, var(--gf-sol, #FFC83D) ${percent}%, #FFFFFF ${percent}%)`
            };
        }
    },
    methods: {
        onProgress(value) {
            this.progress = value;
            if (value > 0) {
                this.setHint(true);
            }
        },
        onDone() {
            this.progress = 0;
            this.setHint(false);
            this.$emit('unlock');
        },
        onCancel() {
            this.progress = 0;
            this.setHint(true, 2000);
        },
        setHint(show, hideAfterMs) {
            clearTimeout(this.hintTimeout);
            this.showHint = show;
            if (show && hideAfterMs) {
                this.hintTimeout = setTimeout(() => {
                    this.showHint = false;
                }, hideAfterMs);
            }
        },
        onKeyDown(event) {
            if (!event.repeat) {
                this.keyDetector.start();
            }
        },
        onKeyUp() {
            this.keyDetector.end();
        },
        onClick() {
            // a short click/tap only shows the hint, see onCancel()
        }
    },
    mounted() {
        let gestureOptions = {
            duration: this.duration,
            onProgress: this.onProgress,
            onDone: this.onDone,
            onCancel: this.onCancel
        };
        this.detach = holdGesture.attach(this.$refs.btn, gestureOptions);
        this.keyDetector = holdGesture.create(gestureOptions);
    },
    beforeDestroy() {
        clearTimeout(this.hintTimeout);
        if (this.detach) {
            this.detach();
        }
        if (this.keyDetector) {
            this.keyDetector.cancel();
        }
    }
};
</script>

<style scoped>
.hold-to-unlock {
    position: relative;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
}

.hold-to-unlock.holding {
    border-color: var(--gf-mata, #1D6B35);
}

.hold-hint {
    position: absolute;
    top: calc(100% + 0.4em);
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    background: var(--gf-tinta, #14261A);
    color: #FFFFFF;
    border-radius: 8px;
    padding: 0.3em 0.7em;
    font-size: 0.8em;
    font-weight: 700;
    pointer-events: none;
}
</style>
