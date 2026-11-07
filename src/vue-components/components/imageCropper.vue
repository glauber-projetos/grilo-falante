<template>
    <div class="image-cropper">
        <p class="cropper-hint"><i class="fas fa-hand-pointer"></i> {{ $t('cropImageHint') }}</p>
        <div class="cropper-aspects" v-if="cellAspect && Math.abs(cellAspect - 1) > 0.05">
            <button :class="{'button-primary': !square}" @click="setSquare(false)">{{ $t('cropAspectCell') }}</button>
            <button :class="{'button-primary': square}" @click="setSquare(true)">{{ $t('cropAspectSquare') }}</button>
        </div>
        <div class="cropper-frame" ref="frame" :style="{'aspect-ratio': String(aspect), width: `min(100%, ${Math.round(55 * aspect)}vh)`}"
             @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp"
             @pointercancel="onPointerUp" @pointerleave="onPointerUp" @wheel.prevent="onWheel">
            <img ref="img" :src="src" crossorigin="anonymous" draggable="false" alt="" @load="onImageLoad" :style="imgStyle"/>
            <div class="cropper-guides"></div>
        </div>
        <div class="cropper-zoom">
            <i class="fas fa-search-minus"></i>
            <input type="range" min="1" max="4" step="0.01" v-model.number="zoom" @input="clamp()" :aria-label="$t('cropZoom')"/>
            <i class="fas fa-search-plus"></i>
        </div>
        <div class="cropper-actions">
            <button @click="$emit('cancel')"><i class="fas fa-times"></i> {{ $t('cropCancel') }}</button>
            <button @click="reset()"><i class="fas fa-undo"></i> {{ $t('cropReset') }}</button>
            <button class="button-primary" @click="apply()" :disabled="!loaded"><i class="fas fa-check"></i> {{ $t('cropApply') }}</button>
        </div>
    </div>
</template>

<script>
/**
 * Lets the user position (drag) and zoom (slider, pinch, wheel) a photo inside a frame with the
 * format of the grid cell, and emits the framed result as JPEG base64.
 *
 * props:
 * - src: image data URL or URL
 * - cellAspect: width / height of the image area of the cell
 * - outputWidth: width in px of the resulting image
 *
 * events: apply(base64), cancel, error
 */
export default {
    props: {
        src: String,
        cellAspect: {type: Number, default: 1},
        outputWidth: {type: Number, default: 400}
    },
    data() {
        return {
            loaded: false,
            natW: 0,
            natH: 0,
            frameW: 0,
            frameH: 0,
            zoom: 1,
            offX: 0, // offset of the image center from the frame center, in frame px
            offY: 0,
            square: false,
            pointers: {},
            pinchStartDist: null,
            pinchStartZoom: 1
        };
    },
    computed: {
        aspect() {
            return this.square ? 1 : (this.cellAspect || 1);
        },
        baseScale() {
            if (!this.natW || !this.frameW) {
                return 1;
            }
            // "cover" scale: the image always covers the whole frame
            return Math.max(this.frameW / this.natW, this.frameH / this.natH);
        },
        scale() {
            return this.baseScale * this.zoom;
        },
        imgStyle() {
            let w = this.natW * this.scale;
            let h = this.natH * this.scale;
            return {
                width: w + 'px',
                height: h + 'px',
                left: (this.frameW / 2 + this.offX - w / 2) + 'px',
                top: (this.frameH / 2 + this.offY - h / 2) + 'px'
            };
        }
    },
    methods: {
        onImageLoad() {
            let img = this.$refs.img;
            this.natW = img.naturalWidth;
            this.natH = img.naturalHeight;
            this.measure();
            this.reset();
            this.loaded = true;
        },
        measure() {
            let rect = this.$refs.frame.getBoundingClientRect();
            this.frameW = rect.width;
            this.frameH = rect.height;
        },
        reset() {
            this.zoom = 1;
            this.offX = 0;
            // photos of people: faces are usually in the upper part, start slightly above center
            let h = this.natH * this.baseScale;
            this.offY = (h - this.frameH) * 0.2;
            this.clamp();
        },
        setSquare(value) {
            this.square = value;
            this.$nextTick(() => {
                this.measure();
                this.clamp();
            });
        },
        clamp() {
            let maxX = Math.max(0, (this.natW * this.scale - this.frameW) / 2);
            let maxY = Math.max(0, (this.natH * this.scale - this.frameH) / 2);
            this.offX = Math.min(maxX, Math.max(-maxX, this.offX));
            this.offY = Math.min(maxY, Math.max(-maxY, this.offY));
        },
        onPointerDown(event) {
            event.preventDefault();
            try {
                // keep receiving moves even if the finger leaves the frame
                this.$refs.frame.setPointerCapture(event.pointerId);
            } catch (e) {
                // not supported / pointer not active: dragging still works inside the frame
            }
            this.$set(this.pointers, event.pointerId, {x: event.clientX, y: event.clientY});
            let ids = Object.keys(this.pointers);
            if (ids.length === 2) {
                this.pinchStartDist = this.pointerDist();
                this.pinchStartZoom = this.zoom;
            }
        },
        onPointerMove(event) {
            let last = this.pointers[event.pointerId];
            if (!last) {
                return;
            }
            event.preventDefault();
            let ids = Object.keys(this.pointers);
            if (ids.length === 1) {
                this.offX += event.clientX - last.x;
                this.offY += event.clientY - last.y;
            }
            this.pointers[event.pointerId] = {x: event.clientX, y: event.clientY};
            if (ids.length === 2 && this.pinchStartDist) {
                this.zoom = Math.min(4, Math.max(1, this.pinchStartZoom * this.pointerDist() / this.pinchStartDist));
            }
            this.clamp();
        },
        onPointerUp(event) {
            this.$delete(this.pointers, event.pointerId);
            if (Object.keys(this.pointers).length < 2) {
                this.pinchStartDist = null;
            }
        },
        pointerDist() {
            let p = Object.values(this.pointers);
            return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1;
        },
        onWheel(event) {
            this.zoom = Math.min(4, Math.max(1, this.zoom * (event.deltaY < 0 ? 1.08 : 1 / 1.08)));
            this.clamp();
        },
        apply() {
            let outW = Math.round(this.outputWidth);
            let outH = Math.round(outW / this.aspect);
            let k = outW / this.frameW;
            let canvas = document.createElement('canvas');
            canvas.width = outW;
            canvas.height = outH;
            let ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, outW, outH);
            ctx.imageSmoothingQuality = 'high';
            let w = this.natW * this.scale;
            let h = this.natH * this.scale;
            let left = this.frameW / 2 + this.offX - w / 2;
            let top = this.frameH / 2 + this.offY - h / 2;
            ctx.drawImage(this.$refs.img, left * k, top * k, w * k, h * k);
            try {
                this.$emit('apply', canvas.toDataURL('image/jpeg', 0.9));
            } catch (e) {
                // image from another website without CORS permission -> canvas is "tainted"
                log.warn('could not crop image', e);
                this.$emit('error', e);
            }
        },
        onResize() {
            if (this.loaded) {
                this.measure();
                this.clamp();
            }
        }
    },
    mounted() {
        window.addEventListener('resize', this.onResize);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    }
};
</script>

<style scoped>
.image-cropper {
    max-width: 420px;
}
.cropper-hint {
    margin-bottom: 0.5em;
}
.cropper-aspects button {
    margin-right: 0.5em;
    margin-bottom: 0.5em;
}
.cropper-frame {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 12px;
    background: #222;
    cursor: grab;
    touch-action: none;
    user-select: none;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}
.cropper-frame:active {
    cursor: grabbing;
}
.cropper-frame img {
    position: absolute;
    max-width: none;
    max-height: none;
    pointer-events: none;
}
.cropper-guides {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
        linear-gradient(to right, transparent calc(33.33% - 0.5px), rgba(255,255,255,0.5) calc(33.33% - 0.5px), rgba(255,255,255,0.5) calc(33.33% + 0.5px), transparent calc(33.33% + 0.5px), transparent calc(66.66% - 0.5px), rgba(255,255,255,0.5) calc(66.66% - 0.5px), rgba(255,255,255,0.5) calc(66.66% + 0.5px), transparent calc(66.66% + 0.5px)),
        linear-gradient(to bottom, transparent calc(33.33% - 0.5px), rgba(255,255,255,0.5) calc(33.33% - 0.5px), rgba(255,255,255,0.5) calc(33.33% + 0.5px), transparent calc(33.33% + 0.5px), transparent calc(66.66% - 0.5px), rgba(255,255,255,0.5) calc(66.66% - 0.5px), rgba(255,255,255,0.5) calc(66.66% + 0.5px), transparent calc(66.66% + 0.5px));
}
.cropper-zoom {
    display: flex;
    align-items: center;
    gap: 0.75em;
    margin: 0.75em 0;
}
.cropper-zoom input {
    flex: 1;
    margin: 0;
}
.cropper-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
}
.cropper-actions button {
    margin: 0;
}
</style>
