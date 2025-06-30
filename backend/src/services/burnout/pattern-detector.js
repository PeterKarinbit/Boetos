class PatternDetector {
  detectPatterns(historicalData) {
    const patterns = {
      meetingClusters: this._detectMeetingClusters(historicalData),
      workHourPatterns: this._detectWorkHourPatterns(historicalData),
      breakPatterns: this._detectBreakPatterns(historicalData),
      weekendPatterns: this._detectWeekendPatterns(historicalData)
    };

    return this._analyzePatterns(patterns);
  }

  _detectMeetingClusters(historicalData) {
    const clusters = [];
    const meetingsByDay = this._groupByDay(historicalData);

    for (const [day, events] of Object.entries(meetingsByDay)) {
      const meetings = events.filter(e => e.type === 'meeting');
      if (meetings.length >= 4) {
        clusters.push({
          day,
          count: meetings.length,
          type: 'high-meeting-day'
        });
      }

      // Check for back-to-back meetings
      const backToBack = this._findBackToBackMeetings(meetings);
      if (backToBack.length > 0) {
        clusters.push({
          day,
          pattern: backToBack,
          type: 'back-to-back-meetings'
        });
      }
    }

    return clusters;
  }

  _detectWorkHourPatterns(historicalData) {
    const patterns = [];
    const workHoursByDay = this._groupByDay(historicalData);

    for (const [day, events] of Object.entries(workHoursByDay)) {
      const workEvents = events.filter(e => e.type === 'meeting' || e.type === 'task');
      const totalHours = workEvents.reduce((total, event) => {
        const duration = (new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);
        return total + duration;
      }, 0);

      if (totalHours > 10) {
        patterns.push({
          day,
          hours: totalHours,
          type: 'long-work-day'
        });
      }
    }

    return patterns;
  }

  _detectBreakPatterns(historicalData) {
    const patterns = [];
    const eventsByDay = this._groupByDay(historicalData);

    for (const [day, events] of Object.entries(eventsByDay)) {
      const sortedEvents = events.sort((a, b) => new Date(a.start) - new Date(b.start));
      const shortBreaks = this._findShortBreaks(sortedEvents);

      if (shortBreaks.length > 0) {
        patterns.push({
          day,
          breaks: shortBreaks,
          type: 'insufficient-breaks'
        });
      }
    }

    return patterns;
  }

  _detectWeekendPatterns(historicalData) {
    const weekendEvents = historicalData.filter(event => {
      const date = new Date(event.start);
      return date.getDay() === 0 || date.getDay() === 6;
    });

    if (weekendEvents.length > 0) {
      return [{
        type: 'weekend-work',
        events: weekendEvents
      }];
    }

    return [];
  }

  _groupByDay(events) {
    return events.reduce((acc, event) => {
      const date = new Date(event.start).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {});
  }

  _findBackToBackMeetings(meetings) {
    const backToBack = [];
    const sortedMeetings = meetings.sort((a, b) => new Date(a.start) - new Date(b.start));

    for (let i = 1; i < sortedMeetings.length; i++) {
      const gap = (new Date(sortedMeetings[i].start) - new Date(sortedMeetings[i-1].end)) / (1000 * 60);
      if (gap < 15) {
        backToBack.push({
          first: sortedMeetings[i-1],
          second: sortedMeetings[i],
          gap
        });
      }
    }

    return backToBack;
  }

  _findShortBreaks(events) {
    const shortBreaks = [];
    for (let i = 1; i < events.length; i++) {
      const gap = (new Date(events[i].start) - new Date(events[i-1].end)) / (1000 * 60);
      if (gap < 15) {
        shortBreaks.push({
          between: [events[i-1], events[i]],
          duration: gap
        });
      }
    }
    return shortBreaks;
  }

  _analyzePatterns(patterns) {
    const analysis = {
      highRiskDays: [],
      recommendations: [],
      trends: []
    };

    // Analyze meeting clusters
    const highMeetingDays = patterns.meetingClusters.filter(p => p.type === 'high-meeting-day');
    if (highMeetingDays.length > 0) {
      analysis.highRiskDays.push(...highMeetingDays);
      analysis.recommendations.push('Consider redistributing meetings across the week');
    }

    // Analyze work hour patterns
    const longWorkDays = patterns.workHourPatterns.filter(p => p.type === 'long-work-day');
    if (longWorkDays.length > 0) {
      analysis.highRiskDays.push(...longWorkDays);
      analysis.recommendations.push('Schedule more breaks during long work days');
    }

    // Analyze break patterns
    if (patterns.breakPatterns.length > 0) {
      analysis.recommendations.push('Add buffer time between meetings');
    }

    // Analyze weekend patterns
    if (patterns.weekendPatterns.length > 0) {
      analysis.recommendations.push('Consider moving weekend work to weekdays');
    }

    return analysis;
  }
}

module.exports = new PatternDetector(); 