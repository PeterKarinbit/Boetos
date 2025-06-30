const request = require('supertest');
const { getTestDataSource } = require('../testUtils/setupTestDB');
const { getTestUser } = require('../testUtils/testHelpers');
const app = require('../app');

// Mock the logger to prevent console output during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Memory API', () => {
  let authToken;
  let testUser;
  let memoryId;
  let dataSource;

  beforeAll(async () => {
    try {
      // Get test data source
      dataSource = getTestDataSource();
      
      if (!dataSource || !dataSource.isInitialized) {
        throw new Error('Test data source is not initialized');
      }
      
      // Create a test user and get auth token
      testUser = await getTestUser({
        email: 'memory-test@example.com',
        password: 'test123',
        firstName: 'Memory',
        lastName: 'Test',
        isEmailVerified: true
      });
      authToken = testUser.token;
    } catch (error) {
      console.error('❌ Error in beforeAll:', error);
      throw error;
    }
  }, 30000); // Increase timeout for beforeAll

  // Clean up after each test
  afterEach(async () => {
    try {
      if (dataSource && dataSource.isInitialized) {
        // Clean up test data if needed
      }
    } catch (error) {
      console.error('❌ Error in afterEach:', error);
      throw error;
    }
  });

  describe('POST /api/memories', () => {
    it('should create a new memory', async () => {
      const memoryData = {
        title: 'Test Memory',
        content: 'This is a test memory',
        tags: ['test', 'memory'],
        isPublic: false,
        metadata: {
          location: 'Test Location',
          people: ['Person1', 'Person2']
        }
      };
      
      const res = await request(app)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(memoryData);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(memoryData.title);
      expect(res.body.content).toBe(memoryData.content);
      expect(res.body.userId).toBe(testUser.id);
      expect(res.body.tags).toEqual(expect.arrayContaining(memoryData.tags));
        expect(res.body.isPublic).toBe(memoryData.isPublic);
        expect(res.body.metadata).toMatchObject(memoryData.metadata);
        
        // Verify the memory was saved to the database
        const memoryRepo = dataSource.getRepository('Memory');
        const savedMemory = await memoryRepo.findOne({ 
          where: { id: res.body.id } 
        });
        
        expect(savedMemory).toBeDefined();
        expect(savedMemory.userId).toBe(testUser.id);
        
        // Save the ID for later tests
        memoryId = res.body.id;
      });

      it('should return 400 for invalid memory data', async () => {
        const invalidData = {
          // Missing required fields
          content: 'This is missing a title'
        };
        
        const res = await request(app)
          .post('/api/memories')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);
        
        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/memories', () => {
      beforeAll(async () => {
        // Create some test memories
        const memoryRepo = dataSource.getRepository('Memory');
        
        await memoryRepo.save([
          {
            title: 'Public Memory 1',
            content: 'This is a public memory',
            tags: ['public', 'test'],
            isPublic: true,
            userId: testUser.id,
            metadata: {}
          },
          {
            title: 'Private Memory',
            content: 'This is a private memory',
            tags: ['private', 'test'],
            isPublic: false,
            userId: testUser.id,
            metadata: {}
          },
          {
            title: 'Public Memory 2',
            content: 'This is another public memory',
            tags: ['public', 'another'],
            isPublic: true,
            userId: testUser.id,
            metadata: {}
          }
        ]);
      });

      it('should get all memories for the authenticated user', async () => {
        const res = await request(app)
          .get('/api/memories')
          .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        
        // Should return both public and private memories for the authenticated user
        expect(res.body.length).toBeGreaterThanOrEqual(3);
        
        // Check response structure
        const memory = res.body[0];
        expect(memory).toHaveProperty('id');
        expect(memory).toHaveProperty('title');
        expect(memory).toHaveProperty('content');
        expect(memory).toHaveProperty('isPublic');
        expect(memory).toHaveProperty('createdAt');
        expect(Array.isArray(memory.tags)).toBe(true);
      });

      it('should filter memories by tag', async () => {
        const res = await request(app)
          .get('/api/memories?tag=public')
          .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        
        // Check that all returned memories have the 'public' tag
        const allHavePublicTag = res.body.every(memory => 
          memory.tags.includes('public')
        );
        expect(allHavePublicTag).toBe(true);
      });
    });

    describe('GET /api/memories/:id', () => {
      it('should get a specific memory by ID', async () => {
        if (!memoryId) {
          // Create a test memory if one doesn't exist
          const memoryRepo = dataSource.getRepository('Memory');
          const memory = memoryRepo.create({
            title: 'Test Memory for Get',
            content: 'This is a test memory for get operation',
            tags: ['test', 'get'],
            isPublic: true,
            userId: testUser.id,
            metadata: {}
          });
          const savedMemory = await memoryRepo.save(memory);
          memoryId = savedMemory.id;
        }
        
        const res = await request(app)
          .get(`/api/memories/${memoryId}`)
          .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', memoryId);
        expect(res.body).toHaveProperty('title');
        expect(res.body).toHaveProperty('content');
        expect(res.body).toHaveProperty('userId', testUser.id);
      });

      it('should return 404 for non-existent memory', async () => {
        const res = await request(app)
          .get('/api/memories/non-existent-id')
          .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.status).toBe(404);
      });

      it('should return 403 when accessing private memory of another user', async () => {
        // Create another test user
        const anotherUser = await getTestUser({
          email: 'another-user@example.com',
          password: 'test123',
          firstName: 'Another',
          lastName: 'User'
        });
        
        // Create a private memory for the other user
        const memoryRepo = dataSource.getRepository('Memory');
        const privateMemory = memoryRepo.create({
          title: 'Private Memory',
          content: 'This is a private memory',
          tags: ['private'],
          isPublic: false,
          userId: anotherUser.id,
          metadata: {}
        });
        const savedMemory = await memoryRepo.save(privateMemory);
        
        // Try to access it with the original user's token
        const res = await request(app)
          .get(`/api/memories/${savedMemory.id}`)
          .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.status).toBe(403);
      });
    });

    describe('PUT /api/memories/:id', () => {
      it('should update an existing memory', async () => {
        if (!memoryId) {
          // Create a test memory if one doesn't exist
          const memoryRepo = dataSource.getRepository('Memory');
          const memory = memoryRepo.create({
            title: 'Test Memory for Update',
            content: 'This is a test memory for update operation',
            tags: ['test', 'update'],
            isPublic: true,
            userId: testUser.id,
            metadata: {}
          });
          const savedMemory = await memoryRepo.save(memory);
          memoryId = savedMemory.id;
        }
        
        const updateData = {
          title: 'Updated Test Memory',
          content: 'This is an updated test memory',
          tags: ['test', 'updated'],
          isPublic: false,
          metadata: {
            location: 'Updated Location',
            people: ['Person3']
          }
        };
        
        const res = await request(app)
          .put(`/api/memories/${memoryId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', memoryId);
        expect(res.body.title).toBe(updateData.title);
        expect(res.body.content).toBe(updateData.content);
        expect(res.body.tags).toEqual(expect.arrayContaining(updateData.tags));
        expect(res.body.isPublic).toBe(updateData.isPublic);
        expect(res.body.metadata).toMatchObject(updateData.metadata);
        
        // Verify the memory was updated in the database
        const memoryRepo = dataSource.getRepository('Memory');
        const updatedMemory = await memoryRepo.findOne({ 
          where: { id: memoryId } 
        });
        
        expect(updatedMemory.title).toBe(updateData.title);
        expect(updatedMemory.content).toBe(updateData.content);
        expect(updatedMemory.tags).toEqual(expect.arrayContaining(updateData.tags));
        expect(updatedMemory.isPublic).toBe(updateData.isPublic);
        expect(updatedMemory.metadata).toMatchObject(updateData.metadata);
      });
    });

    describe('DELETE /api/memories/:id', () => {
      it('should delete a memory', async () => {
        // Create a memory to delete
        const memoryRepo = dataSource.getRepository('Memory');
        const memory = memoryRepo.create({
          title: 'Memory to Delete',
          content: 'This memory will be deleted',
          tags: ['delete', 'test'],
          isPublic: true,
          userId: testUser.id,
          metadata: {}
        });
        const savedMemory = await memoryRepo.save(memory);
        
        // Delete the memory
        const res = await request(app)
          .delete(`/api/memories/${savedMemory.id}`)
          .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Memory deleted successfully');
        
        // Verify the memory was deleted from the database
        const deletedMemory = await memoryRepo.findOne({ 
          where: { id: savedMemory.id } 
        });
        
        expect(deletedMemory).toBeNull();
      });
    });

    describe('GET /api/memories/search', () => {
      beforeAll(async () => {
        // Create some test memories for searching
        const memoryRepo = dataSource.getRepository('Memory');
        
        await memoryRepo.save([
          {
            title: 'JavaScript Memory',
            content: 'Learning JavaScript is fun and challenging',
            tags: ['programming', 'javascript'],
            isPublic: true,
            userId: testUser.id,
            metadata: {}
          },
          {
            title: 'TypeScript Tips',
            content: 'TypeScript adds static types to JavaScript',
            tags: ['programming', 'typescript'],
            isPublic: true,
            userId: testUser.id,
            metadata: {}
          },
          {
            title: 'Personal Note',
            content: 'This is a private note about TypeScript',
            tags: ['personal', 'typescript'],
            isPublic: false,
            userId: testUser.id,
            metadata: {}
          }
        ]);
      });

      it('should search memories by query string', async () => {
        const res = await request(app)
          .get('/api/memories/search')
          .query({ q: 'JavaScript' })
          .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        
        // Check that all returned memories contain the search term in title or content
        const allMatchSearch = res.body.every(memory => 
          memory.title.includes('JavaScript') || 
          memory.content.includes('JavaScript')
        );
        expect(allMatchSearch).toBe(true);
      });

      it('should filter memories by multiple tags', async () => {
        const res = await request(app)
          .get('/api/memories/search')
          .query({ tags: 'programming,javascript' })
          .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        
        // Check that all returned memories have all the specified tags
        const allHaveTags = res.body.every(memory => 
          ['programming', 'javascript'].every(tag => 
            memory.tags.includes(tag)
          )
        );
        expect(allHaveTags).toBe(true);
      });

      it('should combine search query and tags', async () => {
        const res = await request(app)
          .get('/api/memories/search')
          .query({ 
            q: 'TypeScript',
            tags: 'programming'
          })
          .set('Authorization', `Bearer ${authToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        
        // Should only return the public TypeScript memory with programming tag
        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('TypeScript Tips');
      });

      it('should respect privacy settings', async () => {
        // Search for a term that exists in both public and private memories
        const res = await request(app)
          .get('/api/memories/search')
          .query({ q: 'TypeScript' })
          .set('Authorization', `Bearer ${authToken}`);
        
        // Should only return public memories
        const allPublic = res.body.every(memory => memory.isPublic === true);
        expect(allPublic).toBe(true);
        
        // The private TypeScript note should not be included
        const privateNoteIncluded = res.body.some(memory => 
          memory.title === 'Personal Note'
        );
        expect(privateNoteIncluded).toBe(false);
      });
    });

  // Add more test cases for edge cases and error conditions
  describe('Authentication and Authorization', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .get('/api/memories')
        .expect(401);
      
      expect(res.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 when accessing another user\'s private memory', async () => {
      // Create another user
      const otherUser = await getTestUser({
        email: 'other-user@example.com',
        password: 'test123',
        firstName: 'Other',
        lastName: 'User',
        isEmailVerified: true
      });

      // Create a private memory
      const memoryRepo = dataSource.getRepository('Memory');
      const privateMemory = memoryRepo.create({
        title: 'Private Memory',
        content: 'This is a private memory',
        tags: ['private'],
        isPublic: false,
        userId: otherUser.id,
        metadata: {}
      });
      const savedMemory = await memoryRepo.save(privateMemory);

      // Try to access it with the test user's token
      const res = await request(app)
        .get(`/api/memories/${savedMemory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
      
      expect(res.body).toHaveProperty('message', 'Access denied');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for invalid memory data', async () => {
      const invalidData = {
        // Missing required fields
        content: 'This is missing a title'
      };
      
      const res = await request(app)
        .post('/api/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
      
      expect(res.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent memory', async () => {
      const res = await request(app)
        .get('/api/memories/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      expect(res.body).toHaveProperty('message');
    });
  });
});
