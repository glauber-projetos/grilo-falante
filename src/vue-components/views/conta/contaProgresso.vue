<template>
    <main class="ct-centro">
        <template v-if="!erro">
            <span class="ct-icone-grande" :class="{'ct-ceu': baixando}">
                <i :class="['ti', baixando ? 'ti-cloud-download' : 'ti-cloud-upload']" aria-hidden="true"></i>
            </span>
            <h1 ref="titulo" tabindex="-1">{{ titulo }}</h1>
            <div class="ct-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="porcento"
                 :aria-valuetext="contagem || (porcento + '%')" :aria-label="titulo">
                <span :style="{width: porcento + '%'}"></span>
            </div>
            <p class="g-apoio" aria-live="polite">{{ contagem || etapa }}</p>
            <p class="g-dica">{{ baixando ? 'Depois desta primeira vez, o tablet funciona sem internet.' : 'Pode deixar o app aberto. Se a internet cair, ele continua de onde parou.' }}</p>
        </template>

        <template v-else>
            <img class="ct-grilo-p" src="app/img/grilo/mascote/grilo-triste.webp" alt=""/>
            <h1 ref="titulo" tabindex="-1">{{ baixando ? 'Não deu para trazer as pranchas' : 'Não deu para terminar de guardar' }}</h1>
            <p class="g-apoio" role="alert">{{ erro }}</p>
            <p v-if="!baixando && jaNoAparelho" class="g-apoio">As pranchas de {{ nome }} já estão neste tablet. Dá para tentar guardar na conta depois.</p>
            <div class="ct-pilha">
                <button type="button" class="g-btn g-btn-principal g-btn-grande" @click="tentarDeNovo()">
                    <i class="ti ti-refresh" aria-hidden="true"></i> Tentar de novo
                </button>
                <button type="button" class="g-btn g-btn-leve" @click="agoraNao()">Agora não</button>
            </div>
        </template>
    </main>
</template>

<script>
    /**
     * Grilo Falante: progress while a child goes to the account ("enviando": from a .grd file or a profile
     * already on this tablet) or comes from the account to a new tablet ("baixando").
     * The job comes from contaFluxo.estado.trabalho.
     */
    import { contaMixin } from './contaMixin';
    import { contaApi } from './contaApi';
    import { contaFluxo } from './contaFluxo';
    import { juntarNomes } from './contaTextos';
    import { Router } from '../../../js/router';
    import { perfilArquivoService } from '../../../js/service/perfilArquivoService';

    export default {
        mixins: [contaMixin],
        data() {
            return {
                trabalho: contaFluxo.estado.trabalho,
                porcento: 0,
                contagem: '',
                etapa: 'Preparando…',
                erro: '',
                jaNoAparelho: false
            };
        },
        computed: {
            baixando() {
                return this.tela === 'baixando';
            },
            nome() {
                let t = this.trabalho || {};
                if (t.criancas) {
                    return juntarNomes(t.criancas.map((k) => k.nome));
                }
                return t.nome || 'a criança';
            },
            titulo() {
                return this.baixando ? 'Trazendo as pranchas de ' + this.nome : 'Levando as pranchas de ' + this.nome + ' para a conta';
            }
        },
        methods: {
            mostrar(feito, total, unidade, de, ate) {
                if (!total) {
                    return;
                }
                feito = Math.min(feito, total);
                this.porcento = Math.round(de + ((ate - de) * feito) / total);
                // the service counts documents when it gives no unit: then only the percentage means something
                this.contagem = unidade ? feito + ' de ' + total + ' ' + unidade : this.porcento + '%';
            },
            async enviar() {
                let t = this.trabalho;
                if (t.tipo === 'arquivo' && !t.usuario) {
                    this.etapa = 'Abrindo o arquivo neste tablet…';
                    t.usuario = await perfilArquivoService.criarPerfilDoArquivo(t.preparado, t.nome, (p) => {
                        this.porcento = Math.max(this.porcento, Math.round(p * 0.3));
                    });
                    t.preparado = null;
                }
                this.jaNoAparelho = true;
                let base = t.tipo === 'arquivo' ? 30 : 0;
                this.porcento = Math.max(this.porcento, base);
                this.contagem = '';
                this.etapa = 'Guardando na conta…';
                await contaApi.levarParaConta(t.usuario, t.nome, (p) => {
                    this.mostrar(p.enviados, p.total, p.unidade, base, 100);
                });
                this.porcento = 100;
                contaFluxo.estado.trabalho = null;
                contaFluxo.set({ ultimaCrianca: t.nome, pendente: null });
                this.ir('pronto', { noHistory: true });
            },
            async baixar() {
                let t = this.trabalho;
                let lista = t.criancas.filter((k) => !k.pronta);
                let total = t.criancas.length;
                for (let k of lista) {
                    let antes = t.criancas.indexOf(k);
                    await contaApi.baixarCrianca(k.banco, (p) => {
                        let de = (100 * antes) / total;
                        this.mostrar(p.recebidos, p.total, p.unidade, de, de + 100 / total);
                    });
                    k.pronta = true;
                }
                this.porcento = 100;
                contaFluxo.estado.trabalho = null;
                if (t.totalNaConta === 1 && t.criancas.length === 1 && !contaFluxo.perfisSoNoAparelho().length) {
                    await contaApi.abrirCrianca(t.criancas[0].banco);
                    contaFluxo.set({ ultimaCrianca: t.criancas[0].nome });
                    return this.ir('preparar', { noHistory: true });
                }
                Router.to('#welcome', { noHistory: true });
            },
            async comecar() {
                this.erro = '';
                try {
                    if (this.baixando) {
                        await this.baixar();
                    } else {
                        await this.enviar();
                    }
                } catch (e) {
                    log.warn('conta: progress failed', e);
                    this.erro = e && e.erro ? this.mensagemDe(e) : 'Algo deu errado. Confira a internet e tente de novo.';
                    this.focarTitulo();
                }
            },
            tentarDeNovo() {
                this.porcento = 0;
                this.contagem = '';
                this.comecar();
                this.focarTitulo();
            },
            agoraNao() {
                contaFluxo.estado.trabalho = null;
                Router.toAbertura();
            }
        },
        mounted() {
            if (!this.trabalho || (this.baixando ? this.trabalho.tipo !== 'baixar' : this.trabalho.tipo === 'baixar')) {
                // nothing to do (e.g. the page was reloaded): back to the right place
                return Router.toAbertura();
            }
            this.comecar();
        }
    };
</script>
