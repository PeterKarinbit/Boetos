class BurnoutCalculator {
  calculateBurnoutScore(calendarData) {
    const metrics = {
      meetingDensity: this._analyzeMeetingDensity(calendarData),
      workHours: this._calculateWorkHours(calendarData),
      breakTime: this._analyzeBreaks(calendarData),
      weekendWork: this._checkWeekendActivity(calendarData),
      intensity: this._calculateIntensity(calendarData)
    };

    return this._computeScore(metrics);
  }

  _analyzeMeetingDensity(calendarData) {
    const meetings = calendarData.filter(event => event.type === 'meeting');
    const totalHours = 24; // Assuming we're analyzing a day
    const meetingHours = meetings.reduce((total, meeting) => {
      const duration = (new Date(meeting.end) - new Date(meeting.start)) / (1000 * 60 * 60);
      return total + duration;
    }, 0);

    return (meetingHours / totalHours) * 10; // Score 0-10
  }

  _calculateWorkHours(calendarData) {
    const workEvents = calendarData.filter(event => 
      event.type === 'meeting' || event.type === 'task'
    );

    const totalHours = workEvents.reduce((total, event) => {
      const duration = (new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);
      return total + duration;
    }, 0);

    // Score based on deviation from 8-hour workday
    const deviation = Math.abs(totalHours - 8);
    return Math.max(0, 10 - (deviation * 2)); // Score 0-10
  }

  _analyzeBreaks(calendarData) {
    const events = calendarData.sort((a, b) => new Date(a.start) - new Date(b.start));
    let breakScore = 10;
    let lastEventEnd = null;

    for (const event of events) {
      if (lastEventEnd) {
        const breakDuration = (new Date(event.start) - new Date(lastEventEnd)) / (1000 * 60); // in minutes
        if (breakDuration < 15) {
          breakScore -= 2; // Penalize short breaks
        }
      }
      lastEventEnd = event.end;
    }

    return Math.max(0, breakScore);
  }

  _checkWeekendActivity(calendarData) {
    const weekendEvents = calendarData.filter(event => {
      const date = new Date(event.start);
      return date.getDay() === 0 || date.getDay() === 6;
    });

    return weekendEvents.length > 0 ? 0 : 10; // 0 if weekend work, 10 if no weekend work
  }

  _calculateIntensity(calendarData) {
    const meetings = calendarData.filter(event => event.type === 'meeting');
    let intensityScore = 10;

    // Check for back-to-back meetings
    const sortedMeetings = meetings.sort((a, b) => new Date(a.start) - new Date(b.start));
    for (let i = 1; i < sortedMeetings.length; i++) {
      const gap = (new Date(sortedMeetings[i].start) - new Date(sortedMeetings[i-1].end)) / (1000 * 60);
      if (gap < 15) {
        intensityScore -= 2;
      }
    }

    // Check for long meetings (>1 hour)
    const longMeetings = meetings.filter(meeting => {
      const duration = (new Date(meeting.end) - new Date(meeting.start)) / (1000 * 60);
      return duration > 60;
    });
    intensityScore -= longMeetings.length;

    return Math.max(0, intensityScore);
  }

  _computeScore(metrics) {
    return (
      metrics.meetingDensity * 0.3 +
      metrics.workHours * 0.25 +
      metrics.breakTime * 0.2 +
      metrics.weekendWork * 0.15 +
      metrics.intensity * 0.1
    );
  }
}

module.exports = new BurnoutCalculator(); 