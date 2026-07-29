import './config/env';
import { createApp } from './app/createApp';
import { initDatabase } from './bootstrap/initDatabase';

const PORT = process.env.PORT || 3001;
const app = createApp();

async function start(): Promise<void> {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      const env = process.env.APP_ENV || process.env.NODE_ENV || 'development';
      console.log(`Server (${env}) running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

start();
