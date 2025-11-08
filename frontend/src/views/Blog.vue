<script setup></script>

<template>
        <div class="h-[100dvh] w-screen flex flex-col md:flex-row justify-center items-center md:p-20 bg-slate-50">
      <div class="flex flex-col md:flex-row justify-center gap-2 p-2">

        <div class="h-full flex flex-col p-4 rounded-xl bg-white transition-all ease-in-out duration-250 hover:scale-101 cursor-pointer w-100 drop-shadow-2xl">
          <p class="font-extrabold text-slate-700 text-2xl mb-4">Popular Trips</p>
          <div class="bg-slate-200 md:h-50 h-25 rounded-xl" ></div>
          <p class="text-slate-500">Come check out the most popular trips</p>
          <Button label="View more" rounded class="md:w-45 bg-slate-500"></Button>          
        </div>

        <div class="flex md:min-w-[1/3] flex-col p-4 rounded-xl bg-white transition-all ease-in-out duration-250 hover:scale-101 cursor-pointer min-w-100 drop-shadow-2xl">
          <p class="font-extrabold text-slate-700 text-2xl mb-4">Reccomended</p>
          <div class="bg-slate-200 md:h-50 h-25 rounded-xl" ></div>
          <p class="text-slate-500">Places that the dev team recommend</p>
          <Button label="View more" rounded class="md:w-45 bg-slate-500"></Button>          
        </div>

        <div class="flex md:w-50 flex-col p-4 rounded-xl bg-white transition-all ease-in-out duration-250 hover:scale-101 cursor-pointer min-w-100 drop-shadow-2xl">
          <p class="font-extrabold text-slate-700 text-2xl mb-4">Travel Guides</p>
          <div class="bg-slate-200 md:h-50 h-25 rounded-xl" ></div>
          <p class="text-slate-500">Check out travel guides from esteemed bloggers</p>
          <Button label="View more" rounded class="md:w-45 bg-slate-500"></Button>          
        </div>
      </div>

    </div>
</template>