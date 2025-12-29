<script setup>
    import Navbar from '@/components/Navbar.vue';
    import Sidebar from '@/components/Sidebar.vue';
    import NavbarMobile from '@/components/NavbarMobile.vue';
    import NavbarMobileOverlay from '@/components/NavbarMobileOverlay.vue';
    import SidebarMobile from '@/components/SidebarMobile.vue';
</script>



<template>
  <div class="relative h-full w-screen flex flex-col overflow-hidden">
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

    <!-- Desktop Overlays -->
    <div class="hidden md:block min-w-18 h-full flex-shrink-0 fixed z-10 left-0">
      <Navbar />
    </div>

    <div class="hidden md:block fixed right-0 h-full w-[30%] z-10">
      <Sidebar />
    </div>

    <!-- Mobile Sidebar Overlay -->
    <div class="absolute md:hidden left-0 h-[calc(100%-4rem)] w-full z-5 pointer-events-none">
      <SidebarMobile />
    </div>


  </div>
</template>


