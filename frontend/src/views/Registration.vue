<script setup>
import { ref, onMounted } from 'vue';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

// --- TYPING ANIMATION LOGIC ---
const displayedText = ref('');
const fullText = "Sign In";

onMounted(() => {
    setTimeout(() => {
        let i = 0;
        const typeWriter = () => {
            if (i < fullText.length) {
                displayedText.value += fullText.charAt(i);
                i++;
                setTimeout(typeWriter, 150); 
            }
        };
        typeWriter();
    }, 600);
});
</script>

<template>
    <component is="style">
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
    </component>

    <section class="h-[100dvh] w-screen flex bg-gradient-to-tr from-purple-300 via-purple-100 to-white overflow-hidden font-['Inter']">
        
        <div class="w-full lg:w-1/2 flex flex-col justify-center items-start pl-24 lg:pl-40 pr-8 relative">
            
            <div class="w-full max-w-md flex flex-col gap-8">
                
                <div class="animate-enter" style="--delay: 0s">
                    <h1 class="min-h-[60px] text-5xl font-extrabold tracking-tight leading-tight pb-2 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
                        {{ displayedText }}<span class="blinking-cursor text-purple-600">|</span>
                    </h1>
                    <p class="text-surface-600 font-medium">Please enter your details to continue.</p>
                </div>

                <div class="flex flex-col gap-6 animate-enter" style="--delay: 0.1s">
                    <FloatLabel>
                        <InputText id="Username" class="field-input w-full !rounded-xl !py-3 !bg-white/60 backdrop-blur-sm !border-surface-300" fluid />
                        <label for="Username" class="text-surface-500">Username</label>
                    </FloatLabel>
                    
                    <FloatLabel>
                        <InputText id="Password" type="password" class="field-input w-full !rounded-xl !py-3 !bg-white/60 backdrop-blur-sm !border-surface-300" fluid />
                        <label for="Password" class="text-surface-500">Password</label>
                    </FloatLabel>
                </div>

                <div class="flex flex-col gap-4 animate-enter" style="--delay: 0.2s">
                    <Button 
                        label="Sign In" 
                        class="interactive-btn-primary !bg-gradient-to-r !from-purple-700 !to-indigo-600 !border-none !text-white !font-bold !rounded-xl !py-3.5 hover:!brightness-110 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5" 
                        fluid 
                    />
                    <Button 
                        label="Create new account" 
                        severity="secondary" 
                        class="interactive-btn-secondary !bg-white/80 backdrop-blur-md !text-surface-600 !border-transparent !font-semibold !rounded-xl !py-3.5 hover:!bg-white hover:!text-purple-700 hover:shadow-md" 
                        fluid 
                    />
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

<style scoped>

.blinking-cursor {
    display: inline-block;
    margin-left: 2px;
    font-weight: 400;
    animation: blink 1s step-end infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}


.field-input {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    border: 2px solid #e5e7eb;
}

.field-input:focus {
    transform: translateY(-2px);
    outline: none !important;
    box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.25) !important;
    border-color: transparent !important;
    background-image: linear-gradient(white, white), linear-gradient(to right, #9333ea, #4f46e5);
    background-origin: border-box;
    background-clip: padding-box, border-box;
}


.interactive-btn-primary, .interactive-btn-secondary {
    transition: all 0.2s ease-in-out !important;
}
.interactive-btn-primary:active {
    transform: scale(0.98) translateY(1px) !important;
    filter: brightness(0.9);
}
.interactive-btn-secondary:active {
    transform: scale(0.98) translateY(1px) !important;
    background-color: rgba(255,255,255,1) !important;
}


.interactive-bg-image {
    transition: transform 0.5s ease-out, filter 0.5s ease;
    transform: scale(1);
    filter: brightness(1);
}
.image-hover-trigger:hover .interactive-bg-image {
    transform: scale(1.1);
    filter: brightness(1.05);
}


.animate-enter {
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: var(--delay);
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.animate-image-enter {
    opacity: 0;
    transform: translateY(30px); 
    animation: imageWrapperSlide 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: 0.3s; 
}

@keyframes imageWrapperSlide {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>