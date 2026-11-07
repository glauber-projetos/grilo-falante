<template>
    <div class="overflow-content g-tela ajuda-tela">
        <g-topo :titulo="$t('ajudaTitulo')"></g-topo>
        <main class="g-conteudo ajuda-conteudo">
            <div class="ajuda-intro">
                <img src="app/img/grilo/mascote/grilo-explicando.webp" alt="" aria-hidden="true" class="ajuda-grilo"/>
                <p class="g-apoio">{{ $t('ajudaIntro') }}</p>
            </div>

            <nav :aria-label="$t('ajudaGuias')">
                <ul class="ajuda-indice">
                    <li v-for="(guia, i) in guias" :key="guia.id">
                        <a :href="'#help'" class="ajuda-indice-item" :class="'ajuda-cor-' + (i % cores.length)" @click.prevent="irPara(guia.id)">
                            <i :class="'ti ti-' + guia.icone" aria-hidden="true"></i>
                            <span>{{ $t(guia.prefixo + 'Titulo') }}</span>
                        </a>
                    </li>
                </ul>
            </nav>

            <article v-for="(guia, i) in guias" :key="guia.id" :id="'ajuda-' + guia.id" class="g-cartao ajuda-guia" :aria-labelledby="'ajuda-' + guia.id + '-titulo'">
                <div class="ajuda-guia-topo">
                    <img :src="'app/img/grilo/mascote/grilo-' + guia.mascote + '.webp'" alt="" aria-hidden="true" class="ajuda-guia-grilo"/>
                    <div>
                        <h2 :id="'ajuda-' + guia.id + '-titulo'">{{ $t(guia.prefixo + 'Titulo') }}</h2>
                        <p class="g-apoio">{{ $t(guia.prefixo + 'Resumo') }}</p>
                    </div>
                </div>
                <ol class="ajuda-passos">
                    <li v-for="n in guia.passos" :key="n">{{ $t(guia.prefixo + 'Passo' + n) }}</li>
                </ol>
                <p class="g-aviso ajuda-dica"><i class="ti ti-bulb" aria-hidden="true"></i><span>{{ $t(guia.prefixo + 'Dica') }}</span></p>
            </article>

            <p class="g-dica ajuda-manual">
                <a href="https://www.asterics.eu/manuals/asterics-grid/" target="_blank" rel="noopener">{{ $t('ajudaManualTecnico') }}</a>
            </p>
        </main>
    </div>
</template>

<script>
    import GTopo from '../components/gTopo.vue';

    /**
     * Grilo Falante: own help in Portuguese, short guides with 3-5 steps each (texts: i18n keys "ajuda…").
     * Each guide has the element id "ajuda-<id>".
     */
    const GUIAS = [
        { id: 'primeiros-passos', icone: 'rocket', prefixo: 'ajudaPrimeirosPassos', passos: 4, mascote: 'orientando' },
        { id: 'montar-frase', icone: 'message-circle', prefixo: 'ajudaMontarFrase', passos: 5, mascote: 'apontando' },
        { id: 'botao-foto-voz', icone: 'camera', prefixo: 'ajudaBotaoFoto', passos: 5, mascote: 'ideia' },
        { id: 'sem-internet', icone: 'wifi-off', prefixo: 'ajudaSemInternet', passos: 5, mascote: 'festa' },
        { id: 'modo-crianca', icone: 'lock', prefixo: 'ajudaModoCrianca', passos: 5, mascote: 'confiante' },
        { id: 'arquivo-copia', icone: 'file-import', prefixo: 'ajudaArquivoCopia', passos: 4, mascote: 'aprovando' },
        { id: 'instalar', icone: 'device-mobile', prefixo: 'ajudaInstalar', passos: 4, mascote: 'feliz' }
    ];

    export default {
        components: { GTopo },
        data() {
            return {
                guias: GUIAS,
                cores: [0, 1, 2, 3, 4]
            };
        },
        methods: {
            irPara(id) {
                let el = document.getElementById('ajuda-' + id);
                if (el) {
                    let reduzir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    el.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' });
                    el.setAttribute('tabindex', '-1');
                    el.focus({ preventScroll: true });
                }
            }
        }
    }
</script>

<style scoped>
    .ajuda-conteudo {
        max-width: 960px;
        display: flex;
        flex-direction: column;
        gap: var(--g-e4);
    }
    .ajuda-intro { display: flex; align-items: center; gap: var(--g-e4); }
    .ajuda-intro p { margin: 0; font-size: var(--g-t-grande); }
    .ajuda-grilo { width: 112px; height: 104px; object-fit: contain; flex: none; }
    .ajuda-indice {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--g-e3);
    }
    .ajuda-indice li { margin: 0; }
    .ajuda-indice-item {
        display: flex;
        align-items: center;
        gap: var(--g-e3);
        box-sizing: border-box;
        min-height: 64px;
        height: 100%;
        padding: var(--g-e3) var(--g-e4);
        border-radius: var(--g-raio);
        font-weight: 700;
        text-decoration: none;
        line-height: 1.25;
    }
    .ajuda-indice-item:focus-visible { outline: none; box-shadow: var(--g-foco); }
    .ajuda-indice-item .ti { font-size: 28px; flex: none; }
    .ajuda-cor-0 { background: var(--g-folha-clara); color: var(--g-folha-escura); }
    .ajuda-cor-1 { background: var(--g-girassol-claro); color: #4a3b00; }
    .ajuda-cor-2 { background: var(--g-ceu); color: var(--g-ceu-escuro); }
    .ajuda-cor-3 { background: var(--g-lavanda); color: var(--g-lavanda-escura); }
    .ajuda-cor-4 { background: var(--g-pessego); color: var(--g-pessego-escuro); }
    a.ajuda-indice-item:hover { filter: brightness(0.97); }
    .ajuda-guia { scroll-margin-top: 80px; padding: var(--g-e5); }
    .ajuda-guia:focus { outline: none; }
    .ajuda-guia-topo { display: flex; gap: var(--g-e4); align-items: flex-start; margin-bottom: var(--g-e3); }
    .ajuda-guia-topo h2 { font-size: var(--g-t-h2); margin: 4px 0 2px !important; }
    .ajuda-guia-topo p { margin: 0; }
    .ajuda-guia-grilo { width: 72px; height: 80px; object-fit: contain; flex: none; }
    .ajuda-passos {
        counter-reset: passo;
        list-style: none;
        margin: 0 0 var(--g-e4);
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--g-e3);
    }
    .ajuda-passos li {
        counter-increment: passo;
        display: flex;
        gap: var(--g-e3);
        align-items: flex-start;
        margin: 0;
        font-size: var(--g-t-grande);
        line-height: 1.45;
    }
    .ajuda-passos li::before {
        content: counter(passo);
        flex: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--g-folha);
        color: #fff;
        font-family: var(--g-fonte-titulo);
        font-weight: 700;
        display: grid;
        place-items: center;
        line-height: 1;
        margin-top: 1px;
    }
    .ajuda-dica { margin: 0; }
    .ajuda-manual { text-align: center; margin: var(--g-e3) 0 0; }
    .ajuda-manual a { color: var(--g-tinta-2); }
    @media (max-width: 480px) {
        .ajuda-guia { padding: var(--g-e4); border-radius: var(--g-raio); }
        .ajuda-guia-grilo { width: 56px; height: 64px; }
        .ajuda-grilo { width: 88px; height: 84px; }
        .ajuda-guia-topo h2 { font-size: var(--g-t-h3); }
        .ajuda-passos li { font-size: var(--g-t-corpo); }
        .ajuda-indice { grid-template-columns: 1fr 1fr; }
        .ajuda-indice-item { padding: var(--g-e2) var(--g-e3); gap: var(--g-e2); font-size: var(--g-t-legenda); }
        .ajuda-indice-item .ti { font-size: 22px; }
    }
</style>
