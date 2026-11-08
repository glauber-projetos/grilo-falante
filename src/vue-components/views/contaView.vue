<template>
    <div class="g-tela overflow-content ct-tela">
        <component v-if="tela && componente" :is="componente" :key="tela" :tela="tela" @aviso="avisar"></component>
        <div v-if="aviso" class="ct-toast" role="status" aria-live="polite">{{ aviso }}</div>
    </div>
</template>

<script>
    /**
     * Grilo Falante: the family account screens ("#conta" and "#conta/<tela>").
     * Spec: docs/grilo-design/prototipo-contas/prototipo-contas.html (journeys of phase 1).
     */
    import ContaCriar from './conta/contaCriar.vue';
    import ContaEntrar from './conta/contaEntrar.vue';
    import ContaCodigo from './conta/contaCodigo.vue';
    import ContaSenha from './conta/contaSenha.vue';
    import ContaCrianca from './conta/contaCrianca.vue';
    import ContaProgresso from './conta/contaProgresso.vue';
    import ContaPreparar from './conta/contaPreparar.vue';
    import ContaFamilia from './conta/contaFamilia.vue';
    import ContaAvisos from './conta/contaAvisos.vue';
    import { contaFluxo } from './conta/contaFluxo';
    import { Router } from '../../js/router';

    const TELAS = {
        criar: ContaCriar,
        entrar: ContaEntrar,
        codigo: ContaCodigo,
        'esqueci-codigo': ContaCodigo,
        'email-codigo': ContaCodigo,
        esqueci: ContaSenha,
        'nova-senha': ContaSenha,
        'trocar-senha': ContaSenha,
        crianca: ContaCrianca,
        'nova-crianca': ContaCrianca,
        arquivo: ContaCrianca,
        enviando: ContaProgresso,
        baixando: ContaProgresso,
        preparar: ContaPreparar,
        familia: ContaFamilia,
        'trocar-email': ContaFamilia,
        apagar: ContaFamilia,
        dados: ContaAvisos,
        pronto: ContaAvisos,
        'senha-ok': ContaAvisos,
        apagada: ContaAvisos,
        'sem-conta': ContaAvisos,
        guardar: ContaAvisos,
        'sem-internet': ContaAvisos
    };

    export default {
        props: {
            tela: { type: String, default: 'familia' }
        },
        data() {
            return { aviso: '' };
        },
        computed: {
            componente() {
                return TELAS[this.tela] || null;
            }
        },
        methods: {
            avisar(texto) {
                clearTimeout(this._tempoAviso);
                this.aviso = texto;
                this._tempoAviso = setTimeout(() => (this.aviso = ''), 4000);
            }
        },
        mounted() {
            if (!this.componente) {
                return Router.to('#welcome', { noHistory: true });
            }
            if (contaFluxo.estado.aviso) {
                this.avisar(contaFluxo.estado.aviso);
                contaFluxo.set({ aviso: '' });
            }
        },
        beforeDestroy() {
            clearTimeout(this._tempoAviso);
        }
    };
</script>

<style>
    /* shared by all account screens (ct- = conta) */
    .ct-tela {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
    }
    .ct-tela *, .ct-tela *::before, .ct-tela *::after {
        box-sizing: border-box;
    }
    .ct-tela p {
        margin: 0;
    }
    .ct-tela h1, .ct-tela h2 {
        margin: 0;
    }
    .ct-tela h1:focus, .ct-tela h2:focus {
        outline: none;
    }
    .ct-tela .ct-titulo-grande {
        font-size: clamp(26px, 4.5vw, 36px);
    }

    /* centered message screens */
    .ct-centro {
        flex: 1;
        width: 100%;
        max-width: 640px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: var(--g-e4);
        padding: var(--g-e6) var(--g-e5);
    }
    .ct-centro-alto {
        justify-content: flex-start;
    }
    .ct-grilo {
        width: 140px;
        height: auto;
    }
    .ct-grilo-p {
        width: 112px;
        height: auto;
    }
    .ct-pilha {
        display: flex;
        flex-direction: column;
        gap: var(--g-e3);
        width: 100%;
        max-width: 380px;
    }
    .ct-icone-grande {
        width: 104px;
        height: 104px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--g-folha-clara);
        color: var(--g-folha-escura);
        font-size: 56px;
        flex: none;
    }
    .ct-icone-grande.ct-perigo {
        background: var(--g-perigo-claro);
        color: var(--g-perigo);
    }
    .ct-icone-grande.ct-ceu {
        background: var(--g-ceu);
        color: var(--g-ceu-escuro);
    }

    /* mascot + form */
    .ct-dividida {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr;
        min-height: 100%;
    }
    .ct-arte {
        display: none;
    }
    @media (min-width: 720px) {
        .ct-dividida {
            grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
        }
        .ct-arte {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: var(--g-e3);
            text-align: center;
            padding: var(--g-e6);
            background: var(--g-folha-clara);
        }
    }
    .ct-arte-grilo {
        width: 180px;
        max-width: 80%;
        height: auto;
    }
    .ct-arte-titulo {
        font-family: var(--g-fonte-titulo);
        font-weight: 700;
        font-size: var(--g-t-h2);
        line-height: 1.2;
        color: var(--g-folha-escura);
    }
    .ct-arte-texto {
        color: var(--g-tinta-2);
        max-width: 30ch;
        font-size: var(--g-t-grande);
    }
    .ct-dividida-form {
        display: flex;
        min-width: 0;
    }
    .ct-tela > .ct-dividida-form, .ct-tela > div > .ct-dividida-form {
        flex: 1;
    }
    .ct-form {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--g-e4);
        width: 100%;
        max-width: 520px;
        margin: 0 auto;
        padding: var(--g-e5) var(--g-e5) var(--g-e6);
    }
    .ct-form-alto {
        justify-content: flex-start;
    }
    .ct-form .g-campo {
        margin-bottom: 0;
    }
    .ct-topo-form {
        display: flex;
        align-items: center;
        gap: var(--g-e2);
        margin-left: calc(-1 * var(--g-e2));
    }
    .ct-topo-form h1, .ct-topo-form h2 {
        font-size: var(--g-t-h2);
        flex: 1;
        min-width: 0;
    }
    .ct-tela .ct-btn-cheio {
        width: 100%;
    }

    /* fields */
    .ct-campo label {
        font-size: var(--g-t-grande);
    }
    .ct-dica {
        margin: 0;
    }
    .ct-msg-erro {
        color: var(--g-perigo);
        font-size: var(--g-t-corpo);
        font-weight: 700;
        display: flex;
        gap: var(--g-e2);
        align-items: flex-start;
        margin: 2px 0 0;
    }
    .ct-msg-erro .ti {
        font-size: 20px;
        margin-top: 1px;
        flex: none;
    }
    .ct-senha {
        position: relative;
    }
    .ct-tela .ct-senha input {
        padding-right: 56px;
    }
    .ct-tela .ct-olho {
        position: absolute;
        right: 2px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--g-tinta-2);
    }
    .ct-tela .ct-olho:active {
        transform: translateY(-50%) scale(0.95);
    }
    .ct-medidor {
        display: flex;
        gap: var(--g-e1);
        margin-top: var(--g-e1);
    }
    .ct-medidor i {
        flex: 1;
        height: 6px;
        border-radius: 3px;
        background: var(--g-borda);
    }
    .ct-medidor[data-n="1"] i:nth-child(-n+1) { background: var(--g-coral); }
    .ct-medidor[data-n="2"] i:nth-child(-n+2) { background: var(--g-girassol); }
    .ct-medidor[data-n="3"] i:nth-child(-n+3) { background: var(--g-folha); }
    .ct-marcar {
        padding: var(--g-e2) 0;
        font-size: var(--g-t-corpo);
        line-height: 1.4;
    }
    .ct-marcar.ct-erro span {
        color: var(--g-perigo);
    }
    .ct-marcar .g-dica {
        display: block;
        margin-top: 2px;
    }

    /* error box with actions */
    .ct-aviso-erro {
        background: var(--g-perigo-claro);
        color: var(--g-perigo);
        border-radius: var(--g-raio);
        padding: var(--g-e3) var(--g-e4);
        font-weight: 700;
        display: flex;
        flex-direction: column;
        gap: var(--g-e1);
        text-align: left;
    }
    .ct-aviso-erro > span {
        display: flex;
        gap: var(--g-e2);
        align-items: flex-start;
    }
    .ct-aviso-erro .ti {
        font-size: 20px;
        flex: none;
        margin-top: 1px;
    }
    .ct-aviso-erro .ct-acoes {
        display: flex;
        flex-wrap: wrap;
        gap: 0 var(--g-e3);
    }
    .ct-aviso-erro .ct-link {
        color: var(--g-perigo);
    }
    .ct-aviso-erro .ct-normal {
        font-weight: 400;
    }

    /* text-like button */
    .ct-link {
        margin: 0;
        padding: 0 var(--g-e1);
        min-height: var(--g-alvo);
        background: transparent;
        border: none;
        color: var(--g-folha-escura);
        font-family: var(--g-fonte);
        font-size: var(--g-t-corpo);
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 3px;
        text-transform: none;
        letter-spacing: 0;
        height: auto;
        line-height: 1.3;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--g-e1);
    }
    .ct-link:hover {
        color: var(--g-tinta);
        background: transparent;
    }
    .ct-link:focus-visible {
        outline: none;
        box-shadow: var(--g-foco);
        border-radius: var(--g-raio-p);
    }
    .ct-link-inicio {
        align-self: flex-start;
    }
    .ct-linha-acoes {
        display: flex;
        flex-wrap: wrap;
        gap: var(--g-e2) var(--g-e4);
        align-items: center;
    }

    /* code boxes */
    .ct-codigo {
        display: flex;
        gap: var(--g-e2);
        flex-wrap: nowrap;
    }
    .ct-tela .ct-codigo input {
        width: 52px;
        min-width: 0;
        flex: 0 1 52px;
        height: 64px;
        text-align: center;
        font-family: var(--g-fonte-titulo);
        font-size: 30px;
        font-weight: 700;
        border: 2px solid var(--g-borda-forte);
        border-radius: var(--g-raio);
        background: var(--g-superficie);
        color: var(--g-tinta);
        padding: 0;
        margin: 0;
        box-shadow: none;
    }
    .ct-tela .ct-codigo input:focus {
        border-color: var(--g-folha);
    }
    .ct-codigo.erro input {
        border-color: var(--g-perigo);
    }
    .ct-codigo-meio {
        width: var(--g-e2);
        flex: none;
    }

    /* cards to choose how to start */
    .ct-cartoes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: var(--g-e3);
        width: 100%;
        max-width: 760px;
    }
    .ct-cartao {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--g-e2);
        padding: var(--g-e5);
        margin: 0;
        height: auto;
        text-align: left;
        cursor: pointer;
        border: 2px solid var(--g-borda);
        border-radius: var(--g-raio-g);
        background: var(--g-superficie);
        color: var(--g-tinta);
        font-family: var(--g-fonte);
        font-size: var(--g-t-corpo);
        text-transform: none;
        letter-spacing: 0;
        line-height: 1.35;
        white-space: normal;
        transition: transform var(--g-rapido) var(--g-curva), border-color var(--g-rapido);
    }
    .ct-cartao:hover {
        border-color: var(--g-folha);
        background: var(--g-superficie);
        color: var(--g-tinta);
    }
    .ct-cartao:active {
        transform: scale(0.98);
    }
    .ct-cartao:focus-visible {
        outline: none;
        box-shadow: var(--g-foco);
    }
    .ct-cartao[disabled] {
        opacity: 0.6;
        cursor: default;
    }
    .ct-circ {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--g-folha-clara);
        color: var(--g-folha-escura);
        font-size: 30px;
        flex: none;
    }
    .ct-cartao b {
        font-family: var(--g-fonte-titulo);
        font-size: var(--g-t-h3);
        line-height: 1.2;
    }
    .ct-cartao > span:not(.ct-circ):not(.g-avatar) {
        color: var(--g-tinta-2);
        font-weight: 400;
    }

    /* boxes */
    .ct-caixa {
        width: 100%;
        border: 2px solid var(--g-borda);
        border-radius: var(--g-raio-g);
        background: var(--g-superficie);
        padding: var(--g-e4) var(--g-e5);
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: var(--g-e2);
    }
    .ct-caixa.ct-caixa-aviso {
        background: var(--g-girassol-claro);
        border-color: #f0d77a;
        color: #4a3b00;
    }
    .ct-caixa ol, .ct-caixa ul {
        margin: 0;
        padding-left: 24px;
    }
    .ct-caixa li {
        margin: 2px 0;
    }
    .ct-caixa-titulo {
        display: flex;
        gap: var(--g-e2);
        align-items: center;
        font-weight: 700;
    }
    .ct-caixa-titulo .ti {
        font-size: 22px;
    }

    /* progress */
    .ct-barra {
        width: 100%;
        max-width: 440px;
        height: 18px;
        border-radius: var(--g-raio-pilula);
        background: var(--g-superficie-2);
        border: 1px solid var(--g-borda);
        overflow: hidden;
    }
    .ct-barra > span {
        display: block;
        height: 100%;
        width: 0;
        border-radius: var(--g-raio-pilula);
        background: var(--g-folha);
        transition: width var(--g-medio) linear;
    }

    /* "Conta da família" lists */
    .ct-lista {
        width: 100%;
        max-width: 760px;
        margin: 0 auto;
        padding: var(--g-e4) var(--g-e4) var(--g-e6);
        display: flex;
        flex-direction: column;
        gap: var(--g-e5);
    }
    .ct-secao h2 {
        font-family: var(--g-fonte);
        font-size: var(--g-t-legenda);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--g-tinta-2);
        margin: 0 0 var(--g-e2) var(--g-e1);
    }
    .ct-linhas {
        border: 2px solid var(--g-borda);
        border-radius: var(--g-raio-g);
        background: var(--g-superficie);
        overflow: hidden;
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .ct-linha {
        display: flex;
        align-items: center;
        gap: var(--g-e3);
        padding: var(--g-e3) var(--g-e4);
        min-height: 68px;
        flex-wrap: wrap;
        margin: 0;
    }
    .ct-linha + .ct-linha {
        border-top: 1px solid var(--g-borda);
    }
    .ct-linha > .ti {
        font-size: 28px;
        color: var(--g-folha-escura);
        flex: none;
    }
    .ct-linha .ct-txt {
        flex: 1;
        min-width: 160px;
        display: flex;
        flex-direction: column;
        text-align: left;
    }
    .ct-linha .ct-txt b {
        font-weight: 700;
        overflow-wrap: anywhere;
    }
    .ct-linha .ct-txt span {
        color: var(--g-tinta-2);
        font-size: var(--g-t-legenda);
    }
    .ct-linha .g-avatar {
        width: 44px;
        height: 44px;
        font-size: 22px;
    }
    .ct-linha-alerta {
        background: var(--g-girassol-claro);
    }
    .ct-linha-alerta > .ti {
        color: var(--g-pessego-escuro);
    }

    /* account chip in the top bar */
    .ct-chip-conta {
        display: inline-flex;
        align-items: center;
        gap: var(--g-e2);
        min-height: var(--g-alvo);
        max-width: 280px;
        padding: 0 var(--g-e4);
        border-radius: var(--g-raio-pilula);
        border: 2px solid var(--g-borda);
        background: var(--g-superficie);
        color: var(--g-tinta);
        font-family: var(--g-fonte);
        font-size: var(--g-t-legenda);
        font-weight: 700;
        text-decoration: none;
    }
    .ct-chip-conta:hover {
        border-color: var(--g-folha);
        color: var(--g-tinta);
    }
    .ct-chip-conta span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .ct-chip-conta .ti {
        font-size: 20px;
        flex: none;
    }

    /* short message at the bottom */
    .ct-toast {
        position: fixed;
        left: 50%;
        bottom: var(--g-e5);
        transform: translateX(-50%);
        z-index: 950;
        max-width: calc(100% - 32px);
        width: max-content;
        padding: var(--g-e3) var(--g-e5);
        border-radius: var(--g-raio);
        background: var(--g-tinta);
        color: #fff;
        font-weight: 700;
        box-shadow: var(--g-sombra);
        text-align: center;
    }

    .ct-girando {
        display: inline-block;
        animation: ct-girar 0.9s linear infinite;
    }
    @keyframes ct-girar {
        to { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
        .ct-girando { animation: none; }
        .ct-barra > span { transition: none; }
    }

    @media (max-width: 480px) {
        .ct-form { padding: var(--g-e4) var(--g-e4) var(--g-e5); }
        .ct-centro { padding: var(--g-e5) var(--g-e4); }
        .ct-tela .ct-codigo input { height: 56px; font-size: 26px; }
        .ct-cartoes { grid-template-columns: 1fr; }
    }
</style>
