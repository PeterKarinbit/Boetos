import 'dotenv/config';
import app from './app';
import { initializeDataSource } from './data-source';

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // Initialize the database connection
    await initializeDataSource();

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 