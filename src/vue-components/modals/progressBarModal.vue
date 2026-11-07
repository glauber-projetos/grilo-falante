<template>
    <div class="pb-veu" @dragenter.prevent @dragover.prevent @drop.prevent>
        <div class="pb-janela g-tela" role="dialog" aria-modal="true" aria-labelledby="pbTitulo" aria-describedby="pbTexto" @keyup.27="close()">
            <img class="pb-mascote" src="app/img/grilo/mascote/grilo-pensando.webp" alt="" width="112" height="112"/>
            <h2 id="pbTitulo" class="pb-titulo">{{options.header}}</h2>
            <p id="pbTexto" class="pb-texto">{{options.text}}...</p>

            <div class="pb-trilho" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(progressPercentage)" :aria-labelledby="'pbTitulo'">
                <div class="pb-barra" :style="{width: progressPercentage + '%'}"></div>
            </div>
            <div class="pb-numero" aria-hidden="true">{{Math.round(progressPercentage)}}%</div>
            <p class="g-dica pb-dica">{{ $t('gestaoArquivoProgressoDica') }}</p>

            <div v-if="options.closable" class="pb-botoes">
                <button type="button" class="g-btn" @click="close()" :title="$t('keyboardEsc')">
                    <i class="ti ti-x" aria-hidden="true"></i><span>{{ $t('gestaoCancelar') }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";

    let defaultOptions = {
        header: '',
        closable: false,
        cancelFn: null,
        text: ''
    }

    export default {
        props: [],
        data: function () {
            return {
                progressPercentage: 0,
                options: JSON.parse(JSON.stringify(defaultOptions))
            }
        },
        methods: {
            setProgress(percentage, options) {
                this.progressPercentage = Math.min(percentage, 100);
                Object.keys(this.options).forEach(key => {
                    if (options && options[key] !== undefined) {
                        this.options[key] = options[key];
                    }
                });

                return new Promise((resolve) => {
                    this.$nextTick(() => {
                        if (Math.abs(this.progressPercentage - 100) < 0.001) {
                            setTimeout(() => {
                                this.options = JSON.parse(JSON.stringify(defaultOptions));
                                this.$emit('close');
                                resolve();
                            }, 200);
                        } else {
                            resolve();
                        }
                    });
                });
            },
            close() {
                if (this.options.closable) {
                    this.$emit('close');
                    if (this.options.cancelFn) {
                        this.options.cancelFn();
                    }
                    this.options = JSON.parse(JSON.stringify(defaultOptions));
                }
            }
        },
        mounted() {
        }
    }
</script>

<style scoped>
    /* Grilo Falante: barra de progresso (importar, guardar cópia, imprimir). Fica acima dos modais de gestão (9998). */
    .pb-veu {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(20, 32, 15, 0.45);
        display: flex; align-items: center; justify-content: center;
        padding: var(--g-e4);
        animation: g-aparecer var(--g-medio) var(--g-curva);
    }
    .pb-janela.g-tela {
        min-height: 0;
        width: 100%;
        max-width: 520px;
        display: flex; flex-direction: column; align-items: center;
        padding: var(--g-e6) var(--g-e5) var(--g-e5);
        background: var(--g-superficie);
        border-radius: var(--g-raio-g);
        box-shadow: var(--g-sombra);
        text-align: center;
    }
    .pb-mascote { width: 112px; height: 112px; object-fit: contain; margin-bottom: var(--g-e2); animation: pb-balanco 1.6s ease-in-out infinite; }
    @keyframes pb-balanco { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
    @media (prefers-reduced-motion: reduce) { .pb-mascote { animation: none; } }
    .pb-janela .pb-titulo { font-size: var(--g-t-h3); margin: 0 0 var(--g-e1); overflow-wrap: anywhere; }
    .pb-texto { margin: 0 0 var(--g-e4); color: var(--g-tinta-2); font-size: var(--g-t-grande); overflow-wrap: anywhere; }
    .pb-trilho {
        width: 100%; height: 20px; border-radius: var(--g-raio-pilula);
        background: var(--g-superficie-2); border: 2px solid var(--g-borda); overflow: hidden;
    }
    .pb-barra {
        height: 100%; border-radius: var(--g-raio-pilula); background: var(--g-folha);
        transition: width var(--g-medio) var(--g-curva);
    }
    .pb-numero { margin-top: var(--g-e2); font-family: var(--g-fonte-titulo); font-weight: 700; font-size: var(--g-t-h3); color: var(--g-folha-escura); }
    .pb-dica { margin: var(--g-e2) 0 0; }
    .pb-botoes { display: flex; justify-content: center; width: 100%; margin-top: var(--g-e4); }
    .pb-botoes .g-btn { min-width: 160px; }
    .pb-janela :focus-visible { outline: none; box-shadow: var(--g-foco); }
</style>
