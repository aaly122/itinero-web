<script setup>
    import Avatar from 'primevue/avatar';
    import { useUserStore } from '@/store/userStore';
    import { useRouter } from 'vue-router';
    import AccountsTabs from '@/components/AccountsTabs.vue';

    const router = useRouter();
    const userStore = useUserStore();

    const username = userStore.profile.user_name;
    const usernameProfileLetter = username[0];

    const signOutFunction = () => {
        userStore.signOut()
        router.push('/')
    }

</script>
<template>
    <section class="h-full w-full gradient-5 md:pl-25 p-4 flex gap-4 flex-col animate-enter" style="--delay:0s">
        <div class="md:h-[40%] flex md:flex-row flex-col items-center gap-4 animate-enter" style="--delay:0.1s">
            <div class="h-full flex flex-col items-center gap-2">
                <Avatar :label="usernameProfileLetter" class="bg-primary-500 text-white w-40 h-40 rounded-xl" size="xlarge" />
            </div>
            <div class="h-full flex flex-col md:justify-between sm:items-center ">
                <h1 class="text-4xl font-bold text-slate-800 pb-4 ">{{username}}</h1>
                <p class="text-slate-600 md:w-[60%] w-full p-4">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates tempora cupiditate quae illum magni natus. Voluptatum eaque nemo, doloribus harum quae voluptatibus vel eius atque ipsum, culpa amet placeat iste.</p>
                <div class="flex justify-end gap-2 animate-enter" style="--delay:0.3s">
                    <Button label="Edit Profile" class="interactive-btn-secondary !text-black text-sm min-w-40"></Button>
                    <Button label="Sign Out" icon="pi pi-sign-out" @click="signOutFunction" class="interactive-btn-danger min-w-40"></Button>
                </div>


            </div>
        </div>
        <div class="card bg-white md:h[60%] h-120 animate-enter" style="--delay:0.2s">
            <AccountsTabs />
        </div>
    </section>
</template>