const cron = require('node-cron');
const { AppDataSource } = require('../data-source');
const User = require('../entities/User');
const MentalHealthCheck = require('../entities/MentalHealthCheck');
const burnoutEngine = require('../services/burnoutEngine');

async function getLatestSurveyForDay(userId, date) {
  const repo = AppDataSource.getRepository(MentalHealthCheck);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return await repo.findOne({
    where: {
      user_id: userId,
      created_at: { $gte: start, $lte: end }
    },
    order: { created_at: 'DESC' }
  });
}

async function runDailyBurnoutJob() {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    for (const user of users) {
      try {
        // Fetch latest daily survey for yesterday
        const survey = await getLatestSurveyForDay(user.id, yesterday);
        // Calculate burnout score, passing survey if available
        const scoreData = await burnoutEngine.calculateBurnoutScore(user.id, yesterday, survey);
        await burnoutEngine.saveBurnoutScore(user.id, scoreData);
        console.log(`[CRON] Burnout score updated for user ${user.id} (${user.email})`);
      } catch (err) {
        console.error(`[CRON] Error updating burnout score for user ${user.id}:`, err);
      }
    }
  } catch (err) {
    console.error('[CRON] Error running daily burnout job:', err);
  }
}

// Schedule to run every day at 6am
cron.schedule('0 6 * * *', runDailyBurnoutJob);

// For dev/testing: run immediately if this file is run directly
if (require.main === module) {
  runDailyBurnoutJob();
} 