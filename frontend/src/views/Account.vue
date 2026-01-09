<script setup>
    import { ref, computed } from 'vue'; // Added computed
    import Avatar from 'primevue/avatar';
    import InputText from 'primevue/inputtext';
    import Textarea from 'primevue/textarea';
    import Button from 'primevue/button'; // Ensure Button is imported
    import { useUserStore } from '@/store/userStore';
    import { useRouter } from 'vue-router';
    import AccountsTabs from '@/components/AccountsTabs.vue';

    
    import ConfirmDialog from 'primevue/confirmdialog';
    import { useConfirm } from "primevue/useconfirm";
    const confirm = useConfirm();

    import { useToastStore } from '@/store/toastStore';
    const toastStore = useToastStore();

    const router = useRouter();
    const userStore = useUserStore();
    

 

    // Use computed for username to ensure reactivity if store updates
    const username = computed(() => userStore.profile?.user_name || 'User');
    const usernameProfileLetter = computed(() => username.value ? username.value[0].toUpperCase() : 'U');

    const signOutFunction = () => {
        confirm.require({
            message: 'Are you sure you want to sign out?',
            header: 'Sign Out',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sign out',
            rejectLabel: 'Cancel',
            acceptClass: 'p-button-danger',
            rejectClass: 'p-button-secondary',
        accept: () => {
            toastStore.trigger({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Signed-out Successfully!',
                        life: 3000
                    });
            userStore.signOut()
            router.push('/')
        },
        reject: () => {
        
        }
    });


    }

    const isEditing = ref(false);
    const editedUsername = ref('');
    const editedDescription = ref('');
    const errorMessage = ref(''); // To show save errors

    const isUsernameValid = computed(() => {
        return editedUsername.value.trim().length >= 3 && editedUsername.value.trim().length <= 25;
    });

    const isDescriptionValid = computed(() => {
        const len = editedDescription.value.length;
        if (len === 0) return true; // Allow empty bio
        return len >= 3 && len <= 150;
    });

    const isFormValid = computed(() => isUsernameValid.value && isDescriptionValid.value);
    // ------------------------

    const startEditing = () => {
        editedUsername.value = userStore.profile.user_name || '';
        editedDescription.value = userStore.profile.bio || '';
        isEditing.value = true;
        errorMessage.value = '';
    };

    const cancelEditing = () => {
        isEditing.value = false;
        errorMessage.value = '';
    };

    const saveChanges = async () => {
        if (!isFormValid.value) return; // Prevent saving if invalid

        const { success, error } = await userStore.updateProfile({
            user_name: editedUsername.value,
            bio: editedDescription.value
        });

        if (!success) {
            console.error('Error saving profile changes:', error);
            errorMessage.value = "Failed to save changes. Please try again.";
            return;
        }
        
        // Reload profile to ensure UI updates
        if (userStore.user?.id) {
            await userStore.loadProfile(userStore.user.id);
        }
        isEditing.value = false;
    };
</script>

<template>
    <section class="min-h-full md:h-full w-full gradient-5 md:pl-25 p-4 flex gap-4 flex-col animate-enter" style="--delay:0s">
        <div class="md:h-[40%] flex md:flex-row flex-col items-center gap-4 animate-enter" style="--delay:0.1s">

            <ConfirmDialog></ConfirmDialog>
            
            <div class="h-full flex flex-col items-center gap-2">
                <Avatar :label="usernameProfileLetter" class="bg-primary-500 text-white w-40 h-40 rounded-xl !text-5xl" size="xlarge" />
            </div>

            <div class="h-full flex flex-col md:justify-between sm:items-center w-full md:w-auto">
                
                <template v-if="!isEditing">
                    <div class="flex flex-col gap-2 mb-4 p-4 text-center md:text-left">
                        <h1 class="text-4xl font-bold text-slate-800 pb-2">{{ username }}</h1>
                        <p class="text-slate-600 md:w-[60%] w-full">{{ userStore.profile?.bio || 'No description available.' }}</p>
                    </div>
                </template>

                <template v-else>
                    <div class="flex flex-col gap-4 mb-4 w-full md:min-w-[400px]">
                        
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-semibold text-slate-500 uppercase">Username</label>
                            <InputText 
                                v-model="editedUsername" 
                                class="font-bold text-slate-800 field-input !py-3" 
                                :class="{'p-invalid': !isUsernameValid}"
                                placeholder="Username (3-25 chars)"
                            />
                            <div class="flex justify-between text-xs">
                                <span :class="isUsernameValid ? 'text-slate-400' : 'text-red-500'">
                                    {{ editedUsername.length }} / 25
                                </span>
                                <span v-if="!isUsernameValid" class="text-red-500">Must be 3-25 characters</span>
                            </div>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-semibold text-slate-500 uppercase">Bio</label>
                            <Textarea 
                                v-model="editedDescription" 
                                autoResize 
                                rows="3" 
                                class="text-slate-600 field-input !p-3" 
                                :class="{'p-invalid': !isDescriptionValid}"
                                placeholder="Tell us about yourself..."
                            />
                            <div class="flex justify-between text-xs">
                                <span :class="isDescriptionValid ? 'text-slate-400' : 'text-red-500'">
                                    {{ editedDescription.length }} / 150
                                </span>
                                <span v-if="!isDescriptionValid" class="text-red-500">Max 150 characters</span>
                            </div>
                        </div>

                        <div v-if="errorMessage" class="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">
                            {{ errorMessage }}
                        </div>
                    </div>
                </template>

                <div class="flex flex-wrap justify-center md:justify-end gap-2 animate-enter" style="--delay:0.3s">
                    <template v-if="!isEditing">
                        <Button label="Edit Profile" @click="startEditing" class="interactive-btn-secondary !text-black text-sm min-w-40" />
                        <Button label="Sign Out" icon="pi pi-sign-out" @click="signOutFunction" class="interactive-btn-danger min-w-40 text-sm" />
                    </template>
                    
                    <template v-else>
                        <Button label="Cancel" @click="cancelEditing" class="interactive-btn-secondary min-w-32 text-sm" />
                        <Button 
                            label="Save Changes" 
                            @click="saveChanges" 
                            :disabled="!isFormValid"
                            class="interactive-btn-primary !text-white text-sm min-w-32"
                            :class="{'opacity-50 cursor-not-allowed': !isFormValid}" 
                        />
                    </template>
                </div>

            </div>
        </div>

        <div class="card bg-white md:h-[60%] h-120 animate-enter rounded-2xl shadow-sm border border-slate-100 overflow-hidden" style="--delay:0.2s">
            <AccountsTabs />
        </div>
    </section>
</template>