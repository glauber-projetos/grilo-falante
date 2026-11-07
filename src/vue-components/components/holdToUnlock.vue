<template>
    <button ref="btn" type="button" class="segurar" :class="{segurando: progress > 0}"
            :style="progressStyle"
            :aria-label="ariaLabel" :title="ariaLabel"
            @keydown.enter.space.prevent="onKeyDown" @keyup.enter.space.prevent="onKeyUp" @click.prevent="onClick">
        <i :class="'ti ti-' + icone" aria-hidden="true"></i>
        <span class="segurar-texto"><slot>{{ $t('pranchaResponsavel') }}</slot></span>
        <span v-if="showHint" class="segurar-dica" role="status">{{ duration > 0 ? $t('pranchaSegureParaAbrir') : '' }}</span>
    </button>
</template>

<script>
/**
 * Button that has to be held for some time (Grilo Falante), used as the "Responsável" button of the board:
 * - with duration > 0 (child mode) the adult has to hold it; a bar fills while holding and releasing
 *   before the time is over only shows a short hint;
 * - with duration = 0 (adult mode) a simple tap is enough.
 * Enter / space can also be held (keyboard and switch users).
 *
 * events: unlock (kept for compatibility) and pronto, both when the hold (or the tap) is done
 */
import { holdGesture } from '../../js/input/holdGesture';

export default {
    props: {
        duration: { type: Number, default: 3000 },
        icone: { type: String, default: 'lock' },
        rotulo: { type: String, default: '' }
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
        ariaLabel() {
            let text = this.rotulo || this.$t('pranchaResponsavel');
            return this.duration > 0 ? `${text}, ${this.$t('pranchaSegureParaAbrir')}` : text;
        },
        progressStyle() {
            if (!this.progress) {
                return {};
            }
            let percent = Math.round(this.progress * 100);
            return {
                background: `linear-gradient(to right, var(--g-girassol) ${percent}%, var(--g-superficie) ${percent}%)`
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
            this.done();
        },
        done() {
            this.$emit('unlock');
            this.$emit('pronto');
        },
        onCancel() {
            this.progress = 0;
            this.setHint(true, 2000);
        },
        setHint(show, hideAfterMs) {
            clearTimeout(this.hintTimeout);
            this.showHint = show && this.duration > 0;
            if (show && hideAfterMs) {
                this.hintTimeout = setTimeout(() => {
                    this.showHint = false;
                }, hideAfterMs);
            }
        },
        onKeyDown(event) {
            if (this.duration <= 0) {
                return;
            }
            if (!event.repeat) {
                this.keyDetector.start();
            }
        },
        onKeyUp() {
            if (this.duration <= 0) {
                this.done();
                return;
            }
            this.keyDetector.end();
        },
        onClick() {
            // with holding (child mode) a short tap only shows the hint, see onCancel().
            // Enter / space never get here (keydown is prevented), so screen readers and taps open once.
            if (this.duration <= 0) {
                this.done();
            }
        },
        setup() {
            this.teardown();
            if (this.duration <= 0) {
                return;
            }
            let gestureOptions = {
                duration: this.duration,
                onProgress: this.onProgress,
                onDone: this.onDone,
                onCancel: this.onCancel
            };
            this.detach = holdGesture.attach(this.$refs.btn, gestureOptions);
            this.keyDetector = holdGesture.create(gestureOptions);
        },
        teardown() {
            if (this.detach) {
                this.detach();
                this.detach = null;
            }
            if (this.keyDetector) {
                this.keyDetector.cancel();
                this.keyDetector = null;
            }
            this.progress = 0;
        }
    },
    watch: {
        duration() {
            this.setup();
        }
    },
    mounted() {
        this.setup();
    },
    beforeDestroy() {
        clearTimeout(this.hintTimeout);
        this.teardown();
    }
};
</script>

<style scoped>
.segurar {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--g-e2);
    min-height: var(--g-alvo);
    margin: 0;
    padding: 0 var(--g-e4);
    border-radius: var(--g-raio-pilula);
    border: 2px solid var(--g-borda);
    background: var(--g-superficie);
    color: var(--g-tinta-2);
    font-family: var(--g-fonte);
    font-size: var(--g-t-legenda);
    font-weight: 700;
    letter-spacing: 0;
    text-transform: none;
    line-height: 1;
    height: auto;
    cursor: pointer;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
}
.segurar .ti { font-size: 21.6px; }
.segurar:hover { border-color: var(--g-borda-forte); color: var(--g-tinta); }
.segurar.segurando { border-color: var(--g-folha); color: var(--g-tinta); }
.segurar:focus { outline: none; }
.segurar:focus-visible { box-shadow: var(--g-foco); }

.segurar-dica {
    position: absolute;
    top: 50%;
    right: calc(100% + var(--g-e2));
    transform: translateY(-50%);
    white-space: nowrap;
    background: var(--g-tinta);
    color: #fff;
    border-radius: var(--g-raio-p);
    padding: var(--g-e2) var(--g-e3);
    font-size: var(--g-t-legenda);
    font-weight: 700;
    pointer-events: none;
}

@media (max-width: 420px) {
    .segurar { padding: 0 var(--g-e3); }
}
</style>
