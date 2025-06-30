const { AppDataSource } = require('./data-source');
const User = require('./entities/User');
const Notification = require('./entities/Notification');

async function testNotificationSystem() {
  try {
    // Initialize data source
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Data source initialized');
    }

    const userRepo = AppDataSource.getRepository(User);
    const notificationRepo = AppDataSource.getRepository(Notification);

    // Get the first user
    let user = await userRepo.findOne({ where: {} });
    
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`👤 Using user: ${user.name} (${user.email})`);

    // Create a test notification
    const testNotification = notificationRepo.create({
      title: "Test Notification",
      message: "This is a test notification to verify the system is working! 🎉",
      type: "test",
      data: {
        testId: "test-123",
        timestamp: new Date().toISOString()
      },
      read: false,
      user_id: user.id
    });

    await notificationRepo.save(testNotification);
    console.log('✅ Test notification created successfully');

    // Fetch notifications
    const notifications = await notificationRepo.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' }
    });

    console.log(`📊 Found ${notifications.length} notifications for user`);
    
    // Get unread count
    const unreadCount = await notificationRepo.count({
      where: { 
        user_id: user.id,
        read: false
      }
    });

    console.log(`🔔 Unread notifications: ${unreadCount}`);

    // Test API endpoints
    console.log('\n🧪 Testing API endpoints...');
    
    // Test GET /notifications
    const response = await fetch('http://localhost:4001/api/notifications', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ GET /notifications endpoint working');
      console.log(`📊 Retrieved ${data.notifications?.length || 0} notifications`);
    } else {
      console.log('❌ GET /notifications endpoint failed');
    }

    console.log('\n🎉 Notification system test completed!');
    console.log('🚀 The enhanced notification system is ready to use!');

  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the test
testNotificationSystem(); 