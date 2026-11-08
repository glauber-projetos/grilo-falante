<template>
    <div class="ct-dividida-form">
        <div class="ct-form ct-form-largo">
            <div class="ct-topo-form">
                <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar ao Início" @click="inicio()">
                    <i class="ti ti-arrow-left" aria-hidden="true"></i>
                </button>
                <h1 ref="titulo" tabindex="-1">Preparar o tablet de {{ nome }}</h1>
            </div>
            <p class="g-apoio">Só na primeira vez. Isto fica guardado neste tablet.</p>

            <ul class="ct-linhas">
                <li v-if="offlineSuportado" class="ct-linha">
                    <i class="ti ti-wifi-off" aria-hidden="true"></i>
                    <div class="ct-txt">
                        <b>Usar sem internet</b>
                        <span v-if="offline === null">Conferindo as imagens…</span>
                        <span v-else-if="guardando" aria-live="polite">Guardando {{ guardando.done }} de {{ guardando.total }} imagens…</span>
                        <span v-else-if="!offline.missing.length">As imagens já estão guardadas neste tablet.</span>
                        <span v-else>Guarda {{ offline.missing.length === 1 ? 'a imagem' : 'as ' + offline.missing.length + ' imagens' }} das pranchas neste tablet.</span>
                    </div>
                    <span v-if="offline && (!offline.missing.length || guardado)" class="g-pilula g-pilula-ok ct-feito">
                        <i class="ti ti-circle-check" aria-hidden="true"></i> Guardado
                    </span>
                    <button v-else type="button" class="g-btn" :disabled="!offline || !!guardando" @click="guardarImagens()">
                        <i v-if="guardando" class="ti ti-loader-2 ct-girando" aria-hidden="true"></i> Guardar agora
                    </button>
                </li>
                <li class="ct-linha">
                    <i class="ti ti-lock" aria-hidden="true"></i>
                    <div class="ct-txt">
                        <b>Modo Criança</b>
                        <span>{{ nome }} não sai da prancha. Para sair, segure Responsável por 3 segundos.</span>
                    </div>
                    <span v-if="travado" class="g-pilula g-pilula-ok ct-feito" role="status">
                        <i class="ti ti-circle-check" aria-hidden="true"></i> Ligado
                    </span>
                    <button v-else type="button" class="g-btn" :disabled="ligando" @click="ligarModoCrianca()">Ligar</button>
                </li>
            </ul>
            <p v-if="avisoImagens" class="g-apoio" role="status">{{ avisoImagens }}</p>

            <button type="button" class="g-btn g-btn-principal g-btn-grande ct-btn-cheio" @click="abrir()">
                <i class="ti ti-message-circle-2" aria-hidden="true"></i> Abrir a prancha de {{ nome }}
            </button>
        </div>
    </div>
</template>

<script>
    /**
     * Grilo Falante: first time on the child's tablet: keep the images for use without internet and turn on
     * "Modo Criança". Both only change this device.
     */
    import { contaMixin } from './contaMixin';
    import { contaApi } from './contaApi';
    import { contaFluxo } from './contaFluxo';
    import { Router } from '../../../js/router';
    import { MainVue } from '../../../js/vue/mainVue';
    import { databaseService } from '../../../js/service/data/databaseService';
    import { dataService } from '../../../js/service/data/dataService';
    import { offlineService } from '../../../js/service/offlineService';

    export default {
        mixins: [contaMixin],
        data() {
            return {
                offlineSuportado: offlineService.isSupported(),
                offline: null,
                guardando: null,
                guardado: false,
                avisoImagens: '',
                travado: false,
                ligando: false
            };
        },
        computed: {
            nome() {
                return (MainVue.getPerfil() || {}).nome || this.fluxo.ultimaCrianca || 'a criança';
            }
        },
        methods: {
            inicio() {
                Router.toInicio();
            },
            async conferirImagens() {
                try {
                    let grids = await dataService.getGrids(false, true);
                    let urls = offlineService.collectImageUrls(grids);
                    this.offline = await offlineService.getStatus(urls);
                } catch (e) {
                    log.warn('conta: could not check offline images', e);
                    this.offline = { total: 0, cached: 0, missing: [] };
                }
            },
            async guardarImagens() {
                if (!this.offline || this.guardando) {
                    return;
                }
                this.avisoImagens = '';
                this.guardando = { done: 0, total: this.offline.missing.length };
                offlineService.requestPersistentStorage().catch(() => {});
                let r = await offlineService.downloadImages(this.offline.missing, {
                    onProgress: (p) => (this.guardando = { done: p.done, total: p.total })
                });
                this.guardando = null;
                if (r.failed.length) {
                    this.avisoImagens = r.failed.length === 1 ? 'Faltou 1 imagem. Tente de novo com internet.' : 'Faltaram ' + r.failed.length + ' imagens. Tente de novo com internet.';
                    await this.conferirImagens();
                } else {
                    this.guardado = true;
                }
            },
            async ligarModoCrianca() {
                this.ligando = true;
                try {
                    let metadata = await dataService.getMetadata();
                    metadata.locked = true;
                    await dataService.saveMetadata(metadata);
                    this.travado = true;
                } catch (e) {
                    log.warn('conta: could not turn on child mode', e);
                }
                this.ligando = false;
            },
            abrir() {
                contaFluxo.abrirPrancha();
            },
            nomearAparelho() {
                let conta = this.conta();
                if (conta && contaApi.temConta() && contaApi.nomeDeAparelhoGenerico(conta.aparelhoNome) && this.nome) {
                    contaApi.nomearAparelho('Tablet de ' + this.nome).catch(() => {});
                }
            }
        },
        async mounted() {
            if (!databaseService.getCurrentUsedDatabase()) {
                return Router.toAbertura();
            }
            this.nomearAparelho();
            let metadata = await dataService.getMetadata();
            this.travado = !!(metadata && metadata.locked);
            if (this.offlineSuportado) {
                this.conferirImagens();
            }
        }
    };
</script>

<style scoped>
    .ct-form-largo {
        max-width: 680px;
    }
    .ct-feito {
        min-height: var(--g-alvo);
        padding: 0 var(--g-e4);
        font-size: var(--g-t-corpo);
    }
    .ct-feito .ti {
        font-size: 20px;
    }
</style>
