const { AppDataSource } = require('./data-source');
const User = require('./entities/User');
const Notification = require('./entities/Notification');
const MemoryEntry = require('./entities/MemoryEntry');
const CalendarEvent = require('./entities/CalendarEvent');

async function createTestNotifications() {
  try {
    // Initialize data source
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Data source initialized');
    }

    const userRepo = AppDataSource.getRepository(User);
    const notificationRepo = AppDataSource.getRepository(Notification);
    const memoryRepo = AppDataSource.getRepository(MemoryEntry);
    const calendarRepo = AppDataSource.getRepository(CalendarEvent);

    // Get the first user (or create one if none exists)
    let user = await userRepo.findOne({ where: {} });
    
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`👤 Using user: ${user.name} (${user.email})`);

    // Clear existing test notifications
    await notificationRepo.delete({ user_id: user.id });
    console.log('🧹 Cleared existing notifications');

    // Create sample memory entries for testing
    const testMemories = [
      {
        content: "Remember to review the quarterly budget report by Friday",
        type: "reminder",
        nudgePreference: "daily",
        isArchived: false,
        isDone: false,
        user_id: user.id
      },
      {
        content: "Call mom this weekend to check in",
        type: "reminder", 
        nudgePreference: "before_sleep",
        isArchived: false,
        isDone: false,
        user_id: user.id
      },
      {
        content: "Schedule dentist appointment for next month",
        type: "reminder",
        nudgePreference: "daily",
        isArchived: false,
        isDone: false,
        user_id: user.id
      }
    ];

    for (const memory of testMemories) {
      const memoryEntry = memoryRepo.create({
        ...memory,
        createdAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000) // Random time in last 48 hours
      });
      await memoryRepo.save(memoryEntry);
    }
    console.log('💭 Created test memory entries');

    // Create sample Boetos tasks
    const testTasks = [
      {
        title: "Complete project proposal",
        description: "Finish the Q4 project proposal document",
        start_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        end_time: new Date(Date.now() + 4 * 60 * 60 * 1000),   // 4 hours from now
        event_type: "focus",
        is_boetos_task: true,
        boetos_task_state: "active",
        reminder_time: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        user_id: user.id
      },
      {
        title: "Team standup meeting",
        description: "Daily team synchronization",
        start_time: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        end_time: new Date(Date.now() + 60 * 60 * 1000),   // 1 hour from now
        event_type: "meeting",
        is_boetos_task: true,
        boetos_task_state: "active",
        reminder_time: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        user_id: user.id
      }
    ];

    for (const task of testTasks) {
      const calendarEvent = calendarRepo.create(task);
      await calendarRepo.save(calendarEvent);
    }
    console.log('📅 Created test Boetos tasks');

    // Create sample notifications
    const testNotifications = [
      {
        title: "Memory Assistant Reminder",
        message: "💭 \"Remember to review the quarterly budget report by Friday\"\n\nThis was saved 12 hours ago. Would you like to review it?",
        type: "memory-reminder",
        data: {
          memoryId: "test-memory-1",
          content: "Remember to review the quarterly budget report by Friday",
          hoursSinceCreation: 12,
          originalType: "reminder"
        },
        read: false,
        user_id: user.id
      },
      {
        title: "Your Daily Motivation",
        message: "The harder you work for something, the greater you'll feel when you achieve it.\n\n📅 Today's Schedule:\n• 2 meetings\n• 3 focus blocks\n• 1 Boetos tasks\n\n🧠 Wellness:\n• Burnout risk: 45%\n• 15 memories saved\n\n🔥 3-day wellness streak!",
        type: "daily-motivation",
        data: {
          burnoutRisk: 45,
          streak: 3,
          eventsToday: 6,
          meetings: 2,
          focusBlocks: 3,
          boetosTasks: 1,
          memoryCount: 15,
          quote: "The harder you work for something, the greater you'll feel when you achieve it."
        },
        read: false,
        user_id: user.id
      },
      {
        title: "Boetos Task Reminder",
        message: "⏰ Time to focus on: \"Complete project proposal\"\n\nDuration: 120 minutes",
        type: "boetos-reminder",
        data: {
          taskId: "test-task-1",
          taskTitle: "Complete project proposal",
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 4 * 60 * 60 * 1000)
        },
        read: false,
        user_id: user.id
      },
      {
        title: "Burnout Alert",
        message: "⚠️ Your burnout risk has increased to 65%. Consider taking a short break or scheduling some downtime.",
        type: "burnout-alert",
        data: {
          burnoutRisk: 65,
          previousRisk: 45,
          recommendations: ["Take a 5-minute break", "Practice deep breathing", "Schedule downtime"]
        },
        read: false,
        user_id: user.id
      },
      {
        title: "Meeting Reminder",
        message: "📅 Team standup meeting starts in 15 minutes",
        type: "meeting-reminder",
        data: {
          meetingId: "test-meeting-1",
          meetingTitle: "Team standup meeting",
          startTime: new Date(Date.now() + 15 * 60 * 1000),
          duration: 30
        },
        read: false,
        user_id: user.id
      }
    ];

    for (const notification of testNotifications) {
      const notif = notificationRepo.create({
        ...notification,
        created_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random time in last 24 hours
      });
      await notificationRepo.save(notif);
    }
    console.log('🔔 Created test notifications');

    // Update user preferences for notifications
    await userRepo.update(user.id, {
      preferences: {
        ...user.preferences,
        pushNotificationsEnabled: true,
        notificationTimes: ['08:00', '12:00', '18:00']
      }
    });
    console.log('⚙️ Updated user notification preferences');

    console.log('\n🎉 Test data created successfully!');
    console.log(`📊 Created ${testNotifications.length} notifications`);
    console.log(`💭 Created ${testMemories.length} memory entries`);
    console.log(`📅 Created ${testTasks.length} Boetos tasks`);
    console.log('\n🚀 You can now test the notification system in the frontend!');

  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the test
createTestNotifications(); 