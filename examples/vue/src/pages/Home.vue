
<script setup>
import { ref } from "vue";

const count = ref(0);
</script>

<template>
    <div class="home">
        <div>
            <a href="https://vitejs.dev" target="_blank">
                <img src="/vite.svg" class="logo" alt="Vite logo" />
            </a>
            <a href="https://vuejs.org/" target="_blank">
                <img src="../assets/vue.svg" class="logo vue" alt="Vue logo" />
            </a>
        </div>
        <h1>Vite + Vue</h1>

        <div>
            <button type="button" @click="count++">count is {{ count }}</button>
            <p>
                Edit
                <code>src/App.vue</code> to test HMR
            </p>
        </div>

        <p>Click on the Vite and Vue logos to learn more</p>
    </div>
</template>

<style scoped>
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}
.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
}
</style>

