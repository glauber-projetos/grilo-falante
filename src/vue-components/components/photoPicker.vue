<template>
    <div class="photo-picker">
        <div v-if="!pickedSrc" class="photo-picker-buttons">
            <label :for="cameraId" class="button photo-btn photo-btn-main" role="button" tabindex="0" @keydown.enter.space.prevent="openInput(cameraId)">
                <i class="ti ti-camera" aria-hidden="true"></i> <span>{{ $t('takePhotoNow') }}</span>
            </label>
            <input type="file" :id="cameraId" class="photo-input" accept="image/*" :capture="facing" @change="onFile($event.target)"/>
            <label v-if="withGallery" :for="galleryId" class="button photo-btn" role="button" tabindex="0" @keydown.enter.space.prevent="openInput(galleryId)">
                <i class="ti ti-photo" aria-hidden="true"></i> <span>{{ $t('chooseFromGallery') }}</span>
            </label>
            <input v-if="withGallery" type="file" :id="galleryId" class="photo-input" accept="image/*" @change="onFile($event.target)"/>
        </div>
        <div v-if="loading" class="photo-picker-loading"><i class="ti ti-loader-2 pp-gira" aria-hidden="true"></i> {{ $t('loadingPhoto') }}</div>
        <p v-if="error" class="photo-picker-error" role="alert">{{ $t('photoCouldNotBeLoaded') }}</p>
        <image-cropper v-if="pickedSrc" :src="pickedSrc" :cell-aspect="cellAspect" :output-width="outputWidth"
                       @apply="onApply" @cancel="reset()" @error="onError"/>
    </div>
</template>

<script>
/**
 * "Take a photo now": opens the camera directly (on Android with <input capture>), with the
 * gallery as second option. After choosing, the photo is framed with the existing imageCropper.
 * Devices without camera access simply show the file chooser.
 *
 * props:
 * - facing: 'environment' (back camera, objects and places) or 'user' (front camera, selfie)
 * - cellAspect: width / height of the image area of the cell
 * - outputWidth: width of the resulting image in px
 * - withGallery: also show "choose from gallery"
 *
 * events: photo(base64 JPEG data URL), cancel
 */
import ImageCropper from './imageCropper.vue';
import { imageUtil } from '../../js/util/imageUtil';
import { constants } from '../../js/util/constants';

let idCounter = 0;

export default {
    components: { ImageCropper },
    props: {
        facing: { type: String, default: 'environment' },
        cellAspect: { type: Number, default: 1 },
        outputWidth: { type: Number, default: 400 },
        withGallery: { type: Boolean, default: true }
    },
    data() {
        idCounter++;
        return {
            cameraId: 'photoPickerCamera' + idCounter,
            galleryId: 'photoPickerGallery' + idCounter,
            pickedSrc: null,
            loading: false,
            error: false
        };
    },
    methods: {
        openInput(id) {
            let input = document.getElementById(id);
            if (input) {
                input.click();
            }
        },
        async onFile(input) {
            this.error = false;
            if (!input.files || !input.files[0]) {
                return;
            }
            this.loading = true;
            try {
                this.pickedSrc = await imageUtil.getBase64FromInput(input);
            } catch (e) {
                this.error = true;
            }
            this.loading = false;
            input.value = '';
            if (!this.pickedSrc) {
                this.error = true;
            }
        },
        async onApply(base64) {
            let result = base64;
            if (result && result.length / 1024 > constants.MAX_BASE64_IMAGE_SIZE_KB) {
                try {
                    let compressed = await imageUtil.compressToSize(result, this.outputWidth, constants.MAX_BASE64_IMAGE_SIZE_KB);
                    if (compressed && compressed.length < result.length) {
                        result = compressed;
                    }
                } catch (e) {
                    log.warn('could not compress photo', e);
                }
            }
            this.pickedSrc = null;
            this.$emit('photo', result);
        },
        onError() {
            this.pickedSrc = null;
            this.error = true;
        },
        reset() {
            this.pickedSrc = null;
            this.error = false;
            this.$emit('cancel');
        }
    }
};
</script>

<style scoped>
.pp-gira { display: inline-block; animation: pp-girar 1s linear infinite; }
@keyframes pp-girar { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .pp-gira { animation: none; } }
.photo-picker-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6em;
}

.photo-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    flex: 1 1 12em;
    min-height: 3em;
    margin: 0;
    cursor: pointer;
    text-transform: none;
    font-size: 1.05em;
    letter-spacing: 0;
}

.photo-btn-main {
    background-color: var(--gf-mata, #1D6B35);
    border-color: var(--gf-mata, #1D6B35);
    color: #FFFFFF;
}

.photo-btn-main:hover,
.photo-btn-main:focus {
    background-color: var(--gf-mata-escuro, #175A2C);
    color: #FFFFFF;
}

.photo-input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
}

.photo-picker-loading,
.photo-picker-error {
    margin: 0.6em 0 0;
}

.photo-picker-error {
    color: var(--gf-coral, #B8391F);
    font-weight: 700;
}
</style>
