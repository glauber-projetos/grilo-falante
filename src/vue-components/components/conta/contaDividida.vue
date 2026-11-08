<template>
    <div class="ct-dividida">
        <aside class="ct-arte" aria-hidden="true">
            <img class="ct-arte-grilo" :src="'app/img/grilo/mascote/grilo-' + mascote + '.webp'" alt=""/>
            <p class="ct-arte-titulo">{{ titulo }}</p>
            <p class="ct-arte-texto">{{ texto }}</p>
        </aside>
        <div class="ct-dividida-form">
            <slot></slot>
        </div>
    </div>
</template>

<script>
    /**
     * Grilo Falante: account screens with the mascot on the side (tablet lying down) and the form.
     * In narrow screens the side with the mascot is hidden; the form says everything.
     */
    export default {
        props: {
            mascote: { type: String, default: 'feliz' },
            titulo: { type: String, default: '' },
            texto: { type: String, default: '' }
        }
    };
</script>
