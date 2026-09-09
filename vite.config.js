import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Solo-frontend: sin backend ni proxy en este MVP.
export default defineConfig({
  plugins: [react()],
});
