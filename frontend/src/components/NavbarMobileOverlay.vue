<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

const isLoggedIn = false;
</script>

<template>
    <nav id="topNav" class="bg-transparent p-2 z-10 fixed top-0 w-screen">
        <div class="h-3rem w-screen flex justify-between items-center hover:opacity-80 pointer-cursor">
            <router-link to="/" class="h-12 w-12 flex items-center px-4 bg-transparent">
                <img src="@/assets/imgs/Itinero_standalone.svg" alt="Logo" class="w-12 h-12 scale-200"/>
            </router-link>
            <div>
                <Avatar v-if="isLoggedIn" label="K" class="mr-3 shadow-xl" size="large" style="background-color: #9954DD; color: white" shape="circle" severity="secondary" />
                <Button label="Sign In" rounded raised class="mr-4 w-25 pointer-events-auto" @click="router.push('/Registration')"></Button>
            </div>
        </div>
    </nav>
</template>















