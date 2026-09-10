import { defineConfig } from 'vite';
const conf = defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  return { base: process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : (isDev ? '/' : './') };
});
console.log(typeof conf === 'function' ? conf({ mode: 'production', command: 'build' }) : conf);
