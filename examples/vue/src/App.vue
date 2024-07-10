<script setup>
import Header from "./components/Header.vue";
</script>

<template>
    <Header />
    <main>
        <RouterView />
    </main>
</template>

<style scoped>
main {
    flex: auto;
    display: flex;
    align-items: center;
    max-width: 1280px;
    margin: 0 auto;
    text-align: center;
}

@media (max-width: 639px) {
    main {
        margin: 2rem;
    }
}
</style>
