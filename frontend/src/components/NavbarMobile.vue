<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

const createAndRefresh = () => {
    router.push('/Create');
    setTimeout(() => {
        window.location.reload();
    }, 50);
};

const isLoggedIn = false;
</script>

<template>
    <nav class="h-2rem w-screen z-10">
        <div class="flex justify-around p-2 gap-3 bg-white shadow-2xl">
            <Button class="w-15 h-15 bg-white border-0" severity="secondary" icon="pi pi-plus" @click="createAndRefresh" />
            <Button class="w-15 h-15 bg-white border-0" severity="secondary" icon="pi pi-compass" @click="router.push('/Explore')"/>
            <Button class="w-15 h-15 bg-white border-0" severity="secondary" icon="pi pi-book" @click="router.push('/Blog')"/>
            <Button class="w-15 h-15 bg-white border-0" severity="secondary" icon="pi pi-user" />
        </div>
    </nav>
</template>

