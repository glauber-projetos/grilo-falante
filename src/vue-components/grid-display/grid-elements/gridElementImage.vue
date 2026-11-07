<template>
    <div ref="container" class="img-container" :class="{'img-cover': modo === 'cover', 'img-inteira': modo === 'inteira'}" v-if="imageData" :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 0 : 1}`">
        <!-- whole photo on top of a blurred copy of itself, so the button stays filled without cutting faces -->
        <img v-if="modo === 'inteira'" class="img-fundo" :src="imageData" draggable="false" alt="" aria-hidden="true"/>
        <img ref="imgElement" class="img-principal" :src="imageData" draggable="false" :crossorigin="corsActive ? 'anonymous' : null" @error="handleImageError" @load="medir" alt=""
             :style="modo === 'inteira' && zoom > 1 ? `transform: scale(${zoom})` : null"/>
    </div>
</template>

<script>
import GridElementTextContainer from './gridElementTextContainer.vue';
import { TextConfig } from '../../../js/model/TextConfig';
import { GridImage } from '../../../js/model/GridImage';
import { fotoEncaixe } from '../../../js/util/fotoEncaixe';

export default {
    components: { GridElementTextContainer },
    props: ["gridImage", "metadata"],
    data() {
        return {
            TextConfig: TextConfig,
            corsActive: true,
            autoFit: fotoEncaixe.PREENCHER, // result of measuring photo and cell in automatic mode
            zoom: 1, // extra zoom on the whole photo, see fotoEncaixe.ampliacao
            observer: null
        }
    },
    computed: {
        imageData() {
            return this.gridImage ? this.gridImage.data || this.gridImage.url : null;
        },
        cover() {
            return GridImage.shouldCover(this.gridImage, this.metadata);
        },
        automatico() {
            return this.cover && (!this.gridImage.fit || this.gridImage.fit === GridImage.FIT_AUTO);
        },
        /**
         * 'cover': photo fills the area and is cut at the edges
         * 'inteira': whole photo, the rest filled with a blurred copy (automatic mode, very different shapes)
         * 'simbolo': whole image, no fill (symbols, or "show whole image" chosen)
         */
        modo() {
            if (!this.cover) {
                return 'simbolo';
            }
            if (!this.automatico) {
                return 'cover';
            }
            return this.autoFit === fotoEncaixe.INTEIRA ? 'inteira' : 'cover';
        }
    },
    methods: {
        handleImageError() {
            // If the image fails to load and we were trying CORS,
            // it's likely a CORS mismatch. Try again without it.
            if (this.corsActive) {
                this.corsActive = false;
            }
        },
        medir() {
            let img = this.$refs.imgElement;
            let box = this.$refs.container;
            if (!this.automatico || !img || !box) {
                return;
            }
            this.autoFit = fotoEncaixe.escolher(img.naturalWidth, img.naturalHeight, box.clientWidth, box.clientHeight);
            this.zoom = fotoEncaixe.ampliacao(img.naturalWidth, img.naturalHeight, box.clientWidth, box.clientHeight);
        }
    },
    mounted() {
        if (window.ResizeObserver && this.$refs.container) {
            this.observer = new ResizeObserver(() => this.medir());
            this.observer.observe(this.$refs.container);
        }
    },
    beforeDestroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.$refs.imgElement) {
            // Flush the URL to release the network stream and VRAM texture
            this.$refs.imgElement.src = '';
        }
    }
}
</script>

<style scoped>
.img-container img {
    box-sizing: border-box;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    padding: 2%;
}

/* photo fills the whole image area, cut evenly at the edges */
.img-container.img-cover,
.img-container.img-inteira {
    position: relative;
    overflow: hidden;
}
.img-container.img-cover img,
.img-container.img-inteira img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    padding: 0;
}
.img-container.img-cover img {
    object-fit: cover;
    object-position: center 30%; /* faces are usually in the upper part of a photo */
}

/* whole photo, centered, over a soft blurred copy that fills the sides */
.img-container.img-inteira .img-principal {
    object-fit: contain;
    transform-origin: center 35%; /* when enlarged, cut more of the neck than of the head */
}
.img-container.img-inteira .img-fundo {
    object-fit: cover;
    filter: blur(10px) saturate(1.1);
    transform: scale(1.2);
    opacity: 0.85;
}
</style>
