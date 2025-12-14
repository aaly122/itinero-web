<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'vue-router';

const router = useRouter();
const userStore = useUserStore();

// --- STATE ---
const displayedText = ref('');
const isSignInMode = ref(true);
let animationTimeout = null;

// --- TYPING ANIMATION ---
const startTypewriter = (text) => {
  // Clear any existing animation
  if (animationTimeout) clearTimeout(animationTimeout);

  displayedText.value = '';
  let i = 0;

  const typeWriter = () => {
    if (i < text.length) {
      displayedText.value += text.charAt(i);
      i++;
      animationTimeout = setTimeout(typeWriter, 150);
    } else {
      animationTimeout = null; // Clear when done
    }
  };
  typeWriter();
};

const toggleAccountMode = () => {
  isSignInMode.value = !isSignInMode.value;
  const text = isSignInMode.value ? "Sign In to Itinero" : "Create an Account";
  startTypewriter(text);
};

const email = ref(null)
const username = ref(null)
const password = ref(null)

const submitHandler = async () => {
    try {
        let result;
        if (!isSignInMode.value) {
            result = await userStore.signUp(email.value, password.value, username.value)
        } else {
            result = await userStore.signIn(email.value, password.value)
        }
    
        if (result && result.success) {
            console.log('Success')
            router.push('/')
        } else {
            console.error('Error:', result?.error)
        }
    
    } catch (error) {
        console.log('Error:', error)
    }

}



onMounted(() => {
  setTimeout(() => startTypewriter("Sign In to Itinero"), 600);
});

onUnmounted(() => {
  if (animationTimeout) clearTimeout(animationTimeout);
});
</script>

<template>

    <section class="h-[100dvh] w-screen flex bg-gradient-to-tr from-purple-300 via-purple-100 to-white overflow-hidden font-['Inter']">
        <div class="w-full lg:w-1/2 flex flex-col justify-center items-start pl-24 lg:pl-40 pr-8 relative">
            <div class="w-full max-w-md flex flex-col gap-8">

                <div class="animate-enter" style="--delay: 0s">
                    <h1 class="min-h-[60px] text-5xl font-extrabold tracking-tight leading-tight pb-2 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
                        {{ displayedText }}<span class="blinking-cursor text-purple-600">|</span>
                    </h1>
                    <p class="text-surface-600 font-medium">Please enter your details to continue.</p>
                </div>

                <!-- Form Fields -->
                <div class="flex flex-col gap-6 animate-enter" style="--delay: 0.1s">
                    <FloatLabel v-if="!isSignInMode">
                        <InputText id="Username" class="field-input w-full !rounded-xl !py-3 !bg-white/60 backdrop-blur-sm !border-surface-300" fluid 
                        v-model="username"/>
                        <label for="Username" class="text-surface-500">Username</label>
                    </FloatLabel>
                    <FloatLabel>
                        <InputText id="Email" type="email" class="field-input w-full !rounded-xl !py-3 !bg-white/60 backdrop-blur-sm !border-surface-300" fluid 
                        v-model="email"/>
                        <label for="Email" class="text-surface-500">Email</label>
                    </FloatLabel>

                    <FloatLabel>
                        <InputText id="Password" type="password" class="field-input w-full !rounded-xl !py-3 !bg-white/60 backdrop-blur-sm !border-surface-300" fluid 
                        v-model="password"/>
                        <label for="Password" class="text-surface-500">Password</label>
                    </FloatLabel>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-col gap-4 animate-enter" style="--delay: 0.2s">
                    <Button :label="isSignInMode ? 'Sign In' : 'Create Account'" class="interactive-btn-primary" fluid @click="submitHandler"/>
                    <Button :label="isSignInMode ? 'Create new account' : 'Sign In to Existing Account'"
                            severity="secondary"
                            class="interactive-btn-secondary !bg-white/80 backdrop-blur-md !text-surface-600 !border-transparent !font-semibold !rounded-xl !py-3.5 hover:!bg-white hover:!text-purple-700 hover:shadow-md"
                            fluid
                            @click="toggleAccountMode" />
                </div>
            </div>
        </div>

        <div class="hidden lg:block h-full w-1/2 p-4 image-hover-trigger">
            <div class="animate-image-enter h-full w-full rounded-[2rem] overflow-hidden shadow-2xl relative">
                <div class="interactive-bg-image h-full w-full bg-[url('@/assets/imgs/DSC_0368.jpg')] bg-cover bg-center">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
            </div>
        </div>

    </section>
</template>

<style>


</style>