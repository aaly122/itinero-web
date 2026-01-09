<script setup>
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();


</script>

<template>
    <main class="w-screen h-full gradient-5">
        <div class="flex flex-col justify-center items-center h-full w-full p-5">
            <h1 class="text-4xl font-extrabold text-primary-500">Oops...</h1>
            <p class="text-slate-600 text-center">Looks like there wasn't any open establishments right now. Try adjusting your filters
                or try again in another hour.
            </p>
            <div class="flex gap-2 mt-5">
                <Button label="Back to Create" class="interactive-btn-primary" @click="router.push('/Create')"/>
            </div>

        </div>

    </main>
</template>