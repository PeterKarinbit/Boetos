require('dotenv').config();
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { initializeAgentExecutorWithOptions, DynamicTool } = require("langchain/agents");
const { ElevenLabsClient } = require("elevenlabs");
const cron = require("node-cron");
const { AppDataSource } = require('../data-source');
const User = require('../entities/User');
const UserPreferences = require('../entities/UserPreferences');
const CalendarEvent = require('../entities/CalendarEvent');
const MemoryEntry = require('../entities/MemoryEntry');
const Notification = require('../entities/Notification');
const { DynamicStructuredTool } = require("langchain/tools");

// Real DB: Get user profile and preferences
const getUserProfile = async (userId) => {
  const userRepo = AppDataSource.getRepository(User);
  const prefRepo = AppDataSource.getRepository(UserPreferences);
  const user = await userRepo.findOne({ where: { id: userId } });
  const preferences = await prefRepo.findOne({ where: { userId } });
  return { ...user, preferences };
};

// Real DB: Get upcoming events (today)
const getUpcomingEvents = async (userId) => {
  const calendarRepo = AppDataSource.getRepository(CalendarEvent);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const events = await calendarRepo.find({
    where: {
      user_id: userId,
      start_time: { $gte: today, $lt: tomorrow }
    },
    order: { start_time: 'ASC' }
  });
  if (!events.length) return 'No events scheduled for today.';
  return events.map(event =>
    `${event.title} at ${new Date(event.start_time).toLocaleTimeString()}`
  ).join(', ');
};

// Real DB: Get recent memory entries
const getMemoryEntries = async (userId) => {
  const repo = AppDataSource.getRepository(MemoryEntry);
  const entries = await repo.find({
    where: { user_id: userId },
    order: { createdAt: 'DESC' },
    take: 3
  });
  if (!entries.length) return 'No recent memory entries found.';
  return entries.map(e => e.content).join('\n');
};

// Real DB: Create a reminder
const createReminder = async (userId, text, time) => {
  const calendarRepo = AppDataSource.getRepository(CalendarEvent);
  const reminder = calendarRepo.create({
    user_id: userId,
    title: text,
    start_time: new Date(time),
    end_time: new Date(new Date(time).getTime() + 30 * 60000), // 30 min default
    event_type: 'reminder',
    is_boetos_task: true
  });
  await calendarRepo.save(reminder);
  return `Reminder created: ${text} at ${new Date(time).toLocaleString()}`;
};

const elevenLabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

class SidekickService {
  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-2.0-flash",
      temperature: 0.7,
    });
    this.tools = [
      new DynamicStructuredTool({
        name: "getUpcomingEvents",
        description: "Get upcoming calendar events for the user",
        func: getUpcomingEvents,
      }),
      new DynamicStructuredTool({
        name: "getMemoryEntries",
        description: "Get recent memory entries for the user",
        func: getMemoryEntries,
      }),
      new DynamicStructuredTool({
        name: "createReminder",
        description: "Create a reminder for the user",
        func: createReminder,
      }),
    ];
  }

  async handleEvent({ event, userId }) {
    const user = await getUserProfile(userId);
    const agent = await initializeAgentExecutorWithOptions(this.tools, this.llm, {
      agentType: "openai-functions",
      verbose: false,
    });

    let prompt = "";
    if (event === "login") {
      prompt = `The user ${user.name} just logged in. Greet them by name and summarize their day using their calendar and memory entries.`;
    }

    const result = await agent.call({
      input: prompt,
    });

    return result.output;
  }

  async handleOverwhelmed(userId) {
    const user = await getUserProfile(userId);
    const agent = await initializeAgentExecutorWithOptions(this.tools, this.llm, {
      agentType: "openai-functions",
      verbose: false,
    });
    const prompt = `The user ${user.name} is feeling overwhelmed. Check their recent calendar events and memory entries. Ask the user what's going on, and provide 3 actionable, empathetic tips for stress relief and regaining focus. Keep the tone supportive and practical.`;
    const result = await agent.call({
      input: prompt,
    });
    return result.output;
  }
}

module.exports = new SidekickService();