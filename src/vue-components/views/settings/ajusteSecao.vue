<template>
    <section :id="id" class="g-cartao aj-secao" :aria-labelledby="id + '-titulo'">
        <div class="aj-secao-topo">
            <span class="aj-secao-icone" :class="'aj-cor-' + (cor || 'folha')" aria-hidden="true"><i :class="'ti ti-' + icone"></i></span>
            <div class="aj-secao-textos">
                <h2 :id="id + '-titulo'" class="aj-secao-titulo">{{ titulo }}</h2>
                <p v-if="resumo" class="g-apoio aj-secao-resumo">{{ resumo }}</p>
            </div>
        </div>
        <div class="aj-secao-corpo">
            <slot></slot>
        </div>
    </section>
</template>

<script>
    export default {
        props: {
            id: { type: String, required: true },
            icone: { type: String, required: true },
            titulo: { type: String, required: true },
            resumo: { type: String, default: '' },
            cor: { type: String, default: 'folha' } // folha, girassol, ceu, lavanda, pessego, coral
        }
    };
</script>

<style scoped>
    .aj-secao {
        scroll-margin-top: 140px;
        padding: var(--g-e5);
    }
    .aj-secao-topo {
        display: flex;
        align-items: flex-start;
        gap: var(--g-e4);
        margin-bottom: var(--g-e4);
    }
    .aj-secao-icone {
        flex: none;
        width: 52px;
        height: 52px;
        border-radius: var(--g-raio);
        display: grid;
        place-items: center;
        font-size: 1.75rem;
    }
    .aj-cor-folha { background: var(--g-folha-clara); color: var(--g-folha-escura); }
    .aj-cor-girassol { background: var(--g-girassol-claro); color: #4a3b00; }
    .aj-cor-ceu { background: var(--g-ceu); color: var(--g-ceu-escuro); }
    .aj-cor-lavanda { background: var(--g-lavanda); color: var(--g-lavanda-escura); }
    .aj-cor-pessego { background: var(--g-pessego); color: var(--g-pessego-escuro); }
    .aj-cor-coral { background: var(--g-pessego); color: var(--g-coral-escuro); }
    .aj-secao-textos { min-width: 0; }
    .aj-secao-titulo {
        font-size: var(--g-t-h2);
        margin: 4px 0 2px !important;
    }
    .aj-secao-resumo { margin: 0; }
    @media (max-width: 480px) {
        .aj-secao { padding: var(--g-e4); border-radius: var(--g-raio); }
        .aj-secao-icone { width: 44px; height: 44px; font-size: 1.5rem; }
        .aj-secao-titulo { font-size: var(--g-t-h3); }
    }
</style>
