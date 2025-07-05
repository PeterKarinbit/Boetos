// This file provides a CommonJS wrapper around the TypeScript data source
const { dataSource } = require('./data-source-new');

// Export the initializeDataSource function for backward compatibility
module.exports = {
  initializeDataSource: async () => {
    try {
      const ds = await dataSource;
      if (!ds.isInitialized) {
        await ds.initialize();
      }
      return ds;
    } catch (error) {
      console.error('Error initializing data source:', error);
      throw error;
    }
  },
  dataSource // Export the data source promise directly if needed
};
