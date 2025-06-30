const { AppDataSource } = require('../src/data-source');
const User = require('../src/entities/User');
const UserVoiceSettings = require('../src/entities/UserVoiceSettings');

async function createDefaultVoiceSettings() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Data source initialized');
    }

    const userRepo = AppDataSource.getRepository(User);
    const voiceSettingsRepo = AppDataSource.getRepository(UserVoiceSettings);

    const users = await userRepo.find();
    let createdCount = 0;
    for (const user of users) {
      // Check if user already has voice settings
      const existing = await voiceSettingsRepo.findOne({ where: { user_id: user.id } });
      if (!existing) {
        const defaultSettings = voiceSettingsRepo.create({
          user_id: user.id,
          voice_enabled: true,
          voice_id: '21m00Tcm4TlvDq8ikWAM', // Default ElevenLabs voice
          voice_model: 'eleven_monolingual_v1',
          voice_speed: 1.0,
          voice_pitch: 1.0,
          voice_volume: 1.0
        });
        await voiceSettingsRepo.save(defaultSettings);
        createdCount++;
        console.log(`Created default voice settings for user ${user.email} (${user.id})`);
      } else {
        console.log(`User ${user.email} (${user.id}) already has voice settings.`);
      }
    }
    console.log(`Done. Created ${createdCount} new user_voice_settings rows.`);
  } catch (err) {
    console.error('Error creating default voice settings:', err);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

createDefaultVoiceSettings(); 