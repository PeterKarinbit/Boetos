const cron = require('node-cron');
const { AppDataSource } = require('../data-source');
const { Between, LessThan } = require('typeorm');
const User = require('../entities/User');
const MemoryEntry = require('../entities/MemoryEntry');
const CalendarEvent = require('../entities/CalendarEvent');
const Notification = require('../entities/Notification');
const { sendPushNotification } = require('../services/onesignalService');
const burnoutEngine = require('../services/burnoutEngine');
const { MentalHealthService } = require('../services/mentalHealthService');

// Example motivational quotes
const motivationalQuotes = [
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Stay positive, work hard, make it happen.",
  "Don't watch the clock; do what it does. Keep going.",
  "Success is not for the lazy.",
  "Push yourself, because no one else is going to do it for you.",
  "Your limitation—it's only your imagination.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it."
];

function getRandomQuote() {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}

function getCurrentTimeHHMM(date = new Date()) {
  return date.toTimeString().slice(0, 5); // 'HH:MM'
}

// Memory reminder logic
async function processMemoryReminders(user, now) {
  const memoryRepo = AppDataSource.getRepository(MemoryEntry);
  const notificationRepo = AppDataSource.getRepository(Notification);
  
  // Get memory entries that need reminders
  const memoryEntries = await memoryRepo.find({
    where: {
      user_id: user.id,
      isArchived: false,
      isDone: false,
      type: 'reminder',
      createdAt: LessThan(new Date(now.getTime() - 24 * 60 * 60 * 1000)) // Older than 24 hours
    },
    order: { createdAt: 'ASC' },
    take: 3 // Limit to 3 reminders per run
  });

  for (const memory of memoryEntries) {
    // Check if it's time to remind based on nudgePreference
    let shouldRemind = false;
    const hoursSinceCreation = (now.getTime() - memory.createdAt.getTime()) / (1000 * 60 * 60);
    
    switch (memory.nudgePreference) {
      case 'daily':
        shouldRemind = hoursSinceCreation >= 24;
        break;
      case 'before_sleep':
        const hour = now.getHours();
        shouldRemind = hour >= 21 || hour <= 6; // Between 9 PM and 6 AM
        break;
      case 'never':
        shouldRemind = false;
        break;
    }

    if (shouldRemind) {
      // Create notification
      const notification = notificationRepo.create({
        user_id: user.id,
        title: 'Memory Assistant Reminder',
        message: `💭 "${memory.content.substring(0, 100)}${memory.content.length > 100 ? '...' : ''}"\n\nThis was saved ${Math.floor(hoursSinceCreation)} hours ago. Would you like to review it?`,
        type: 'memory-reminder',
        data: {
          memoryId: memory.id,
          content: memory.content,
          hoursSinceCreation: Math.floor(hoursSinceCreation),
          originalType: memory.type
        },
        read: false
      });

      await notificationRepo.save(notification);

      // Send push notification if user has push notifications enabled
      if (user.preferences?.pushNotificationsEnabled) {
        try {
          await sendPushNotification({
            contents: `💭 Memory reminder: "${memory.content.substring(0, 50)}..."`,
            headings: 'Memory Assistant Reminder',
            include_player_ids: [user.onesignalPlayerId], // You'll need to store this
            data: { 
              type: 'memory-reminder',
              memoryId: memory.id,
              notificationId: notification.id
            }
          });
        } catch (error) {
          console.error(`[MEMORY] Failed to send push notification for user ${user.id}:`, error);
        }
      }

      console.log(`[MEMORY] Sent reminder for memory ${memory.id} to user ${user.id}`);
    }
  }
}

// Enhanced daily motivation with real data
async function sendDailyMotivation(user, now) {
  const calendarRepo = AppDataSource.getRepository(CalendarEvent);
  const notificationRepo = AppDataSource.getRepository(Notification);
  const mentalHealthService = new MentalHealthService();

  try {
    // Gather real data
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const eventsToday = await calendarRepo.find({
      where: {
        user_id: user.id,
        start_time: Between(startOfDay, endOfDay)
      }
    });

    const meetings = eventsToday.filter(e => e.event_type === 'meeting').length;
    const focusBlocks = eventsToday.filter(e => e.event_type === 'focus').length;
    const boetosTasks = eventsToday.filter(e => e.is_boetos_task).length;

    // Get real burnout metrics
    let burnoutRisk = 35; // Default fallback
    try {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const burnoutScores = await burnoutEngine.getBurnoutScores(user.id, yesterday, yesterday);
      if (burnoutScores.length > 0) {
        burnoutRisk = Math.round(burnoutScores[0].score);
      }
    } catch (error) {
      console.error(`[MOTIVATION] Error fetching burnout score for user ${user.id}:`, error);
    }

    // Get real check-in streak
    let streak = 0;
    try {
      streak = await mentalHealthService.getCheckInStreak(user.id);
    } catch (error) {
      console.error(`[MOTIVATION] Error fetching streak for user ${user.id}:`, error);
    }

    // Get memory count
    const memoryRepo = AppDataSource.getRepository(MemoryEntry);
    const memoryCount = await memoryRepo.count({
      where: { user_id: user.id, isArchived: false }
    });

    const quote = getRandomQuote();
    
    // Compose personalized message
    let message = `${quote}\n\n📅 Today's Schedule:\n• ${meetings} meetings\n• ${focusBlocks} focus blocks\n• ${boetosTasks} Boetos tasks\n\n🧠 Wellness:\n• Burnout risk: ${burnoutRisk}%\n• ${memoryCount} memories saved`;
    
    if (streak > 1) {
      message += `\n🔥 ${streak}-day wellness streak!`;
    } else if (streak === 1) {
      message += `\n🔥 1-day streak! Keep it going!`;
    } else {
      message += `\n💪 Ready to start your wellness journey?`;
    }

    // Create notification
    const notification = notificationRepo.create({
      user_id: user.id,
      title: 'Your Daily Motivation',
      message: message,
      type: 'daily-motivation',
      data: {
        burnoutRisk,
        streak,
        eventsToday: eventsToday.length,
        meetings,
        focusBlocks,
        boetosTasks,
        memoryCount,
        quote: quote
      },
      read: false
    });

    await notificationRepo.save(notification);

    // Send push notification
    if (user.preferences?.pushNotificationsEnabled) {
      try {
        await sendPushNotification({
          contents: message,
          headings: 'Your Daily Motivation',
          include_player_ids: [user.onesignalPlayerId],
          data: { 
            type: 'daily-motivation',
            notificationId: notification.id
          }
        });
      } catch (error) {
        console.error(`[MOTIVATION] Failed to send push notification for user ${user.id}:`, error);
      }
    }

    console.log(`[MOTIVATION] Sent daily motivation to user ${user.id} (burnout: ${burnoutRisk}%, streak: ${streak})`);
  } catch (error) {
    console.error(`[MOTIVATION] Error sending daily motivation to user ${user.id}:`, error);
  }
}

async function runNudgeScheduler() {
  try {
    // Ensure data source is initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('[NUDGE] Data source initialized');
    }

    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find();
    const now = new Date();
    const nowHHMM = getCurrentTimeHHMM(now);

    console.log(`[NUDGE] Processing ${users.length} users at ${nowHHMM}`);

    for (const user of users) {
      try {
        // Process memory reminders
        await processMemoryReminders(user, now);

        // Send daily motivation at scheduled times
        const preferences = user.preferences || {};
        const notificationTimes = preferences.notificationTimes || ['08:00', '12:00', '18:00'];
        
        if (notificationTimes.includes(nowHHMM)) {
          await sendDailyMotivation(user, now);
        }

        // Process Boetos task reminders
        const calendarRepo = AppDataSource.getRepository(CalendarEvent);
        const tenMinsFromNow = new Date(now.getTime() + 10 * 60 * 1000);
        const boetosTasks = await calendarRepo.find({
          where: {
            user_id: user.id,
            is_boetos_task: true,
            reminder_time: Between(now, tenMinsFromNow),
            boetos_task_state: 'active',
          },
        });

        for (const task of boetosTasks) {
          const notificationRepo = AppDataSource.getRepository(Notification);
          const notification = notificationRepo.create({
            user_id: user.id,
            title: 'Boetos Task Reminder',
            message: `⏰ Time to focus on: "${task.title}"\n\nDuration: ${Math.floor((new Date(task.end_time).getTime() - new Date(task.start_time).getTime()) / 60000)} minutes`,
            type: 'boetos-reminder',
            data: {
              taskId: task.id,
              taskTitle: task.title,
              startTime: task.start_time,
              endTime: task.end_time
            },
            read: false
          });

          await notificationRepo.save(notification);

          // Send push notification
          if (user.preferences?.pushNotificationsEnabled) {
            try {
              await sendPushNotification({
                contents: `⏰ Time to focus on: "${task.title}"`,
                headings: 'Boetos Task Reminder',
                include_player_ids: [user.onesignalPlayerId],
                data: { 
                  type: 'boetos-reminder',
                  taskId: task.id,
                  notificationId: notification.id
                }
              });
            } catch (error) {
              console.error(`[BOETOS] Failed to send push notification for user ${user.id}:`, error);
            }
          }

          console.log(`[BOETOS] Sent reminder for task '${task.title}' to user ${user.id}`);
        }

      } catch (err) {
        console.error(`[NUDGE] Error processing user ${user.id}:`, err);
      }
    }
  } catch (err) {
    console.error('[NUDGE] Error running nudge scheduler:', err);
  }
}

// Schedule to run every 5 minutes (reduced frequency for better performance)
cron.schedule('*/5 * * * *', runNudgeScheduler);

// For dev/testing: run immediately if this file is run directly
if (require.main === module) {
  (async () => {
    try {
      await runNudgeScheduler();
      console.log('[NUDGE] Scheduler completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('[NUDGE] Scheduler failed:', error);
      process.exit(1);
    }
  })();
} 