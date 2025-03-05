import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      fallback: 'index.html', // Enables SPA fallback
    }),
    prerender: {
      entries: [] // Prevent prerendering
    },
    paths: {
      base: ''
    }
  }
};
