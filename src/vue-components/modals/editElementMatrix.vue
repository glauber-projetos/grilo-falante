<template>
    <div class="emx" v-if="gridElement">
        <p class="g-apoio emx-intro"><i class="ti ti-messages" aria-hidden="true"></i>{{ $t('gestaoBotaoConversaIntro') }}</p>
        <label class="g-marcar">
            <input id="autoSpeak" type="checkbox" v-model="gridElement.autoSpeak"/>
            <span>{{ $t('gestaoBotaoConversaFalar') }}</span>
        </label>
    </div>
</template>

<script>
    import './../../css/modal.css';

    export default {
        props: ['gridElement'],
        data: function () {
            return {
            }
        },
        methods: {
        },
        mounted() {
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
.ec-intro, .eyt-intro, .emx-intro { display: flex; align-items: flex-start; gap: var(--g-e2); margin: 0 0 var(--g-e4); }
.eyt-intro .ti, .emx-intro .ti { font-size: 1.4em; color: var(--g-folha-escura); flex: none; }
.eyt-sub { display: block; font-weight: 400; }
</style>
