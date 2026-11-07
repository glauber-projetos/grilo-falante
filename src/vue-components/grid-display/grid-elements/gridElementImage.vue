<template>
    <div class="img-container" :class="{'img-cover': cover}" v-if="imageData" :style="`order: ${metadata.textConfig.textPosition === TextConfig.TEXT_POS_BELOW ? 0 : 1}`">
        <img ref="imgElement" :src="imageData" draggable="false" :crossorigin="corsActive ? 'anonymous' : null" @error="handleImageError" alt=""/>
    </div>
</template>

<script>
import GridElementTextContainer from './gridElementTextContainer.vue';
import { TextConfig } from '../../../js/model/TextConfig';
import { GridImage } from '../../../js/model/GridImage';

export default {
    components: { GridElementTextContainer },
    props: ["gridImage", "metadata"],
    data() {
        return {
            TextConfig: TextConfig,
            corsActive: true
        }
    },
    computed: {
        imageData() {
            return this.gridImage ? this.gridImage.data || this.gridImage.url : null;
        },
        cover() {
            return GridImage.shouldCover(this.gridImage, this.metadata);
        }
    },
    methods: {
        handleImageError() {
            // If the image fails to load and we were trying CORS,
            // it's likely a CORS mismatch. Try again without it.
            if (this.corsActive) {
                this.corsActive = false;
            }
        }
    },
    mounted() {
    },
    beforeDestroy() {
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

/* photo fills the whole image area, cut evenly at the edges (centered) */
.img-container.img-cover {
    position: relative;
}
.img-container.img-cover img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    padding: 0;
    object-fit: cover;
    object-position: center 30%; /* faces are usually in the upper part of a photo */
}
</style>