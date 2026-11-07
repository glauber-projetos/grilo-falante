<template>
    <div class="tph" aria-hidden="true">
        <span>{{ $t('gestaoEdicaoCopiarOque') }}</span>
        <span>{{ $t('gestaoEdicaoCopiarAgora') }}</span>
    </div>
</template>

<script>
export default {}
</script>

<style scoped>
.tph {
    display: flex; justify-content: space-between; gap: var(--g-e3);
    padding: 0 var(--g-e3) var(--g-e2); color: var(--g-tinta-3); font-size: var(--g-t-legenda); font-weight: 700;
}
@media (max-width: 600px) {
    .tph { display: none; }
}
</style>
