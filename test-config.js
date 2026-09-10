import { resolveConfig } from 'vite';
resolveConfig({ mode: 'production', command: 'build' }, 'build').then(conf => console.log(conf.base));
