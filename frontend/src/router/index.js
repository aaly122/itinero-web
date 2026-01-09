// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import { useUserStore } from '@/store/userStore';

//layouts
import NavbarLayout from '@/layouts/NavbarLayout.vue'
import SidebarLayout from '@/layouts/SidebarLayout.vue'


//views
import Home from '@/views/Home.vue'
import Dashboard from '@/views/Dashboard.vue'
import Create from '@/views/Create.vue'
import LoadingScreen from '@/views/LoadingScreen.vue'
import Explore from '@/views/Explore.vue'
import Registration from '@/views/Registration.vue'
import Blog from '@/views/Blog.vue'
import ItineraryEdit from '@/views/ItineraryEdit.vue'
import Account from '@/views/Account.vue'
import UpdatePassword from '@/views/UpdatePassword.vue';
import NoOpenHours from '@/views/NoOpenHours.vue';

const routes = [
    {
        path: '/',
        component: NavbarLayout,
        children: [
            {path: '', name: 'Home', component: Home},
            {path: '/Create', name: 'Create', component: Create},
            {path: '/Loading', name: 'Loading', component: LoadingScreen},
            {path: '/Explore', name: 'Explore', component: Explore},
            {path: '/Blog', name: 'Blog', component: Blog},
            {path: '/Registration', name: 'Registration', component: Registration},
            {path: '/Edit', name: 'Edit', component: ItineraryEdit},
            {path: '/Account', name: 'Account', component: Account, meta: { requiresProfile: true }},
            {path: '/UpdatePassword', name: 'UpdatePassword', component: UpdatePassword},
            {path: '/oops', name: 'Oops', component: NoOpenHours}

            
        ]
    },
    {
        path: '/Dashboard',
        component: SidebarLayout,
        children: [
            {path: '', name: 'Dashboard', component: Dashboard}
        ]
    }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from) => {
    const userStore = useUserStore();

    if (to.matched.some(record => record.meta.requiresProfile)) {
        if (!userStore.hasProfile) {
            console.warn("No profile found! Redirecting...");
            return { name: 'Home' }; // Redirect to home
        }
    }
});


export let routerInstance = router
export default router