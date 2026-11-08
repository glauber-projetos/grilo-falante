/**
 * Grilo Falante: small things every account screen does.
 * - puts the focus on the screen title (ref "titulo"), so screen readers announce the new screen
 * - ir('criar') goes to "#conta/criar"; mensagemDe(e) turns an error into text
 */
import { contaFluxo } from './contaFluxo';
import { contaApi } from './contaApi';
import { mensagemDe } from './contaTextos';

export const contaMixin = {
    props: {
        tela: { type: String, default: '' }
    },
    data() {
        return {
            fluxo: contaFluxo.estado
        };
    },
    methods: {
        ir(tela, options) {
            contaFluxo.ir(tela, options);
        },
        mensagemDe(e) {
            return mensagemDe(e);
        },
        conta() {
            return contaApi.getConta() || {};
        },
        focarTitulo() {
            this.$nextTick(() => {
                let t = this.$refs.titulo;
                if (t && t.focus) {
                    try {
                        t.focus({ preventScroll: true });
                    } catch (e) {
                        t.focus();
                    }
                }
            });
        }
    },
    mounted() {
        this.focarTitulo();
    }
};
