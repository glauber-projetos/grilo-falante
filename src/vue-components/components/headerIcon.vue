<template>
    <!-- full header: the new top bar of the adult screens -->
    <g-topo v-if="fullHeader" marca-completa></g-topo>

    <!-- inside an existing header of an older screen: the Grilo mark and the way back to the adult home -->
    <div v-else class="casca-voltar">
        <a v-if="temUsuario" href="#inicio" class="casca-voltar-btn" :title="$t('cascaVoltarInicio')" :aria-label="$t('cascaVoltarInicio')">
            <img src="app/img/grilo/logo-icone.svg" alt="" class="casca-voltar-marca"/>
            <i class="ti ti-home" aria-hidden="true"></i>
            <span class="casca-voltar-texto">{{ $t('cascaInicio') }}</span>
        </a>
        <img v-else src="app/img/grilo/logo-icone.svg" alt="Grilo Falante" class="casca-voltar-marca"/>
    </div>
</template>

<script>
    /**
     * Grilo Falante: used by the screens of the original app that are not redesigned yet.
     * The sidebar does not exist anymore, so this component now gives the way back to the adult home ("#inicio").
     * New screens use gTopo.vue directly.
     */
    import GTopo from './gTopo.vue';

    export default {
        components: { GTopo },
        props: ['fullHeader'], //if true this component is rendered as full header, otherwise as part of an already existing header
        computed: {
            temUsuario() {
                return !!this.$root.currentUser;
            }
        }
    }
</script>

<style scoped>
    .casca-voltar {
        display: inline-flex;
        align-items: center;
        height: 100%;
        margin-right: 0.5em;
    }

    .casca-voltar-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 44px;
        padding: 0 12px 0 4px;
        border-radius: 999px;
        border: 2px solid var(--g-borda, #e6dcc3);
        background: var(--g-superficie, #fff);
        color: var(--g-folha-escura, #2f6b1f);
        font-family: var(--g-fonte, sans-serif);
        font-weight: 700;
        font-size: 16px;
        line-height: 1;
        text-decoration: none;
        white-space: nowrap;
    }

    .casca-voltar-btn:hover {
        border-color: var(--g-borda-forte, #cdbf9c);
        color: var(--g-folha-escura, #2f6b1f);
    }

    .casca-voltar-btn:focus-visible {
        outline: none;
        box-shadow: var(--g-foco);
    }

    .casca-voltar-btn .ti {
        font-size: 21px;
    }

    .casca-voltar-marca {
        height: 34px;
        width: 34px;
        margin: 0;
        border-radius: 0;
    }

    @media (max-width: 600px) {
        .casca-voltar-texto {
            display: none;
        }
    }
</style>
