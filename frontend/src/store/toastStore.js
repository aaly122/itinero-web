import { defineStore } from 'pinia';

export const useToastStore = defineStore('toast', {
  state: () => ({
    message: null, 
  }),
  actions: {

    trigger(payload) {
      this.message = payload;
    },

    consume() {
      const msg = this.message;
      this.message = null; 
      return msg;
    }
  }
});