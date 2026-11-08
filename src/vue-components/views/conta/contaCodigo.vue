<template>
    <conta-dividida :mascote="arte.mascote" :titulo="arte.titulo" :texto="arte.texto">
        <div class="ct-form">
            <div class="ct-topo-form">
                <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar" @click="trocarEmail()">
                    <i class="ti ti-arrow-left" aria-hidden="true"></i>
                </button>
                <h1 ref="titulo" tabindex="-1">Confira seu e-mail</h1>
            </div>
            <p class="g-apoio">Mandamos um código de 6 números para <b class="ct-email">{{ email }}</b>. Ele vale por 15 minutos.</p>

            <codigo-seis ref="codigo" :erro="!!erro" :desligado="conferindo" @completo="conferir"/>
            <p v-if="conferindo" class="g-apoio" role="status"><i class="ti ti-loader-2 ct-girando" aria-hidden="true"></i> Conferindo…</p>
            <p v-if="erro" class="ct-msg-erro" role="alert"><i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ erro }}</p>

            <p class="g-dica">Não chegou? Olhe no spam ou no lixo eletrônico.</p>
            <div class="ct-linha-acoes">
                <button v-if="podeReenviar" type="button" class="g-btn" :disabled="espera > 0 || reenviando" @click="reenviar()">
                    <i class="ti ti-mail-forward" aria-hidden="true"></i>
                    <span v-if="espera > 0">Mandar de novo em {{ textoEspera }}</span>
                    <span v-else-if="reenviando">Mandando…</span>
                    <span v-else>Mandar de novo</span>
                </button>
                <button type="button" class="ct-link" @click="trocarEmail()">Trocar o e-mail</button>
            </div>
        </div>
    </conta-dividida>
</template>

<script>
    /**
     * Grilo Falante: the 6-number code from the e-mail. Three uses:
     * - "codigo": confirm the e-mail of a new account
     * - "esqueci-codigo": forgot the password
     * - "email-codigo": confirm the new e-mail of the account
     */
    import ContaDividida from '../../components/conta/contaDividida.vue';
    import CodigoSeis from '../../components/conta/codigoSeis.vue';
    import { contaMixin } from './contaMixin';
    import { contaApi } from './contaApi';
    import { contaFluxo } from './contaFluxo';

    const ESPERA_INICIAL = 60; // the server sends at most one code per minute

    export default {
        mixins: [contaMixin],
        components: { ContaDividida, CodigoSeis },
        data() {
            return {
                erro: '',
                conferindo: false,
                reenviando: false,
                espera: ESPERA_INICIAL
            };
        },
        computed: {
            email() {
                if (this.tela === 'email-codigo') {
                    return this.fluxo.emailNovo;
                }
                if (this.tela === 'codigo') {
                    return this.conta().email || this.fluxo.email;
                }
                return this.fluxo.email;
            },
            arte() {
                if (this.tela === 'esqueci-codigo') {
                    return { mascote: 'pensando', titulo: 'Quase lá', texto: 'Depois do código você cria a senha nova. As pranchas continuam todas lá.' };
                }
                if (this.tela === 'email-codigo') {
                    return { mascote: 'explicando', titulo: 'Falta pouco', texto: 'O código mostra que o e-mail novo é seu. Depois, você entra com ele.' };
                }
                return { mascote: 'explicando', titulo: 'Falta pouco', texto: 'O código prova que o e-mail é seu. Assim dá para recuperar a senha se você esquecer.' };
            },
            podeReenviar() {
                // changing the e-mail needs the password again: "Trocar o e-mail" starts it over
                return this.tela !== 'email-codigo';
            },
            textoEspera() {
                let m = Math.floor(this.espera / 60);
                let s = this.espera % 60;
                return m + ':' + (s < 10 ? '0' : '') + s;
            }
        },
        methods: {
            contar(segundos) {
                clearInterval(this._relogio);
                this.espera = segundos;
                this._relogio = setInterval(() => {
                    this.espera = Math.max(0, this.espera - 1);
                    if (!this.espera) {
                        clearInterval(this._relogio);
                    }
                }, 1000);
            },
            trocarEmail() {
                if (this.tela === 'esqueci-codigo') {
                    return this.ir('esqueci');
                }
                if (this.tela === 'email-codigo') {
                    return this.ir('trocar-email');
                }
                // a new account whose e-mail was typed wrong: change it (the code then goes to the new one)
                contaFluxo.set({ trocaNoCadastro: true });
                this.ir('trocar-email');
            },
            async reenviar() {
                if (this.espera > 0 || this.reenviando) {
                    return;
                }
                this.reenviando = true;
                this.erro = '';
                try {
                    let r = this.tela === 'esqueci-codigo' ? await contaApi.esqueciSenha(this.email) : await contaApi.reenviarCodigo();
                    this.$emit('aviso', 'Enviamos um código novo para o seu e-mail. Veja também a caixa de spam.');
                    this.contar((r && r.esperarSegundos) || ESPERA_INICIAL);
                    this.$refs.codigo.limpar();
                } catch (e) {
                    this.erro = this.mensagemDe(e);
                    if (e.esperarSegundos) {
                        this.contar(e.esperarSegundos);
                    }
                }
                this.reenviando = false;
            },
            async conferir(codigo) {
                if (this.conferindo) {
                    return;
                }
                this.erro = '';
                this.conferindo = true;
                try {
                    if (this.tela === 'codigo') {
                        await contaApi.confirmarEmail(codigo);
                        return contaFluxo.seguirDepoisDeConfirmar();
                    }
                    if (this.tela === 'esqueci-codigo') {
                        let r = await contaApi.verificarCodigoSenha(this.email, codigo);
                        contaFluxo.estado.chaveSenha = r && r.chave;
                        return this.ir('nova-senha', { noHistory: true });
                    }
                    await contaApi.confirmarTrocaEmail(codigo);
                    if (this.fluxo.trocaNoCadastro) {
                        contaFluxo.set({ trocaNoCadastro: false, emailNovo: '', email: this.email });
                        return contaFluxo.seguirDepoisDeConfirmar();
                    }
                    contaFluxo.set({ aviso: 'E-mail trocado. Agora você entra com ' + this.email + '.', emailNovo: '' });
                    this.ir('familia', { noHistory: true });
                } catch (e) {
                    this.conferindo = false;
                    this.erro = this.mensagemDe(e);
                    if (e.erro === 'codigo_vencido') {
                        this.espera = 0;
                        clearInterval(this._relogio);
                    }
                    if (e.esperarSegundos) {
                        this.contar(e.esperarSegundos);
                    }
                    this.$refs.codigo.limpar();
                }
            }
        },
        mounted() {
            if (!this.email) {
                return this.ir(this.tela === 'esqueci-codigo' ? 'esqueci' : this.tela === 'email-codigo' ? 'familia' : 'criar', { noHistory: true });
            }
            if (this.tela === 'codigo' && !contaApi.temConta()) {
                return this.ir('criar', { noHistory: true });
            }
            this.contar(ESPERA_INICIAL);
        },
        beforeDestroy() {
            clearInterval(this._relogio);
        }
    };
</script>
