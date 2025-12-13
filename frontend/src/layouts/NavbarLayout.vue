<script setup>
  import Navbar from '@/components/Navbar.vue';
  import NavbarMobile from '@/components/NavbarMobile.vue';
  import NavbarMobileOverlay from '@/components/NavbarMobileOverlay.vue';
</script>



<template>
  <div class="relative h-screen w-screen flex flex-col">

    <!-- Mobile Top Overlay (fixed positioning) -->
    <div class="md:hidden">
      <NavbarMobileOverlay />
    </div>

    <!-- Main Content (full width on desktop) -->
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>

    <!-- Mobile Bottom Navbar (part of content flow) -->
    <div class="md:hidden flex-shrink-0">
      <NavbarMobile />
    </div>

    <!-- Desktop Navbar Overlay -->
    <div class="hidden md:block w-18 h-full flex-shrink-0 fixed z-10 left-0">
      <Navbar />
    </div>

  </div>
</template>

<!-- 
    <main class="absolute inset-0 z-0">
      <router-view />
    </main>

    <div class="md:fixed md:top-0 hidden md:block left-0 right-0 z-10">
      <Navbar />
    </div> -->
