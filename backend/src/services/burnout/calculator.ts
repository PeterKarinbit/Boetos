class BurnoutCalculator {
  calculateBurnoutScore(calendarData: any[]): number {
    const metrics = {
      meetingDensity: this._analyzeMeetingDensity(calendarData),
      workHours: this._calculateWorkHours(calendarData),
      breakTime: this._analyzeBreaks(calendarData),
      weekendWork: this._checkWeekendActivity(calendarData),
      intensity: this._calculateIntensity(calendarData)
    };
    return this._computeScore(metrics);
  }

  _analyzeMeetingDensity(calendarData: any[]): number {
    const meetings = calendarData.filter((event: any) => event.type === 'meeting');
    const totalHours = 24;
    const meetingHours = meetings.reduce((total: number, meeting: any) => {
      const duration = (new Date(meeting.end).getTime() - new Date(meeting.start).getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);
    return (meetingHours / totalHours) * 10;
  }

  _calculateWorkHours(calendarData: any[]): number {
    const workEvents = calendarData.filter((event: any) => event.type === 'meeting' || event.type === 'task');
    const totalHours = workEvents.reduce((total: number, event: any) => {
      const duration = (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);
    const deviation = Math.abs(totalHours - 8);
    return Math.max(0, 10 - (deviation * 2));
  }

  _analyzeBreaks(calendarData: any[]): number {
    const events = calendarData.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
    let breakScore = 10;
    let lastEventEnd: string | null = null;
    for (const event of events) {
      if (lastEventEnd) {
        const breakDuration = (new Date(event.start).getTime() - new Date(lastEventEnd).getTime()) / (1000 * 60);
        if (breakDuration < 15) {
          breakScore -= 2;
        }
      }
      lastEventEnd = event.end;
    }
    return Math.max(0, breakScore);
  }

  _checkWeekendActivity(calendarData: any[]): number {
    const weekendEvents = calendarData.filter((event: any) => {
      const date = new Date(event.start);
      return date.getDay() === 0 || date.getDay() === 6;
    });
    return weekendEvents.length > 0 ? 0 : 10;
  }

  _calculateIntensity(calendarData: any[]): number {
    const meetings = calendarData.filter((event: any) => event.type === 'meeting');
    let intensityScore = 10;
    const sortedMeetings = meetings.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
    for (let i = 1; i < sortedMeetings.length; i++) {
      const gap = (new Date(sortedMeetings[i].start).getTime() - new Date(sortedMeetings[i-1].end).getTime()) / (1000 * 60);
      if (gap < 15) {
        intensityScore -= 2;
      }
    }
    const longMeetings = meetings.filter((meeting: any) => {
      const duration = (new Date(meeting.end).getTime() - new Date(meeting.start).getTime()) / (1000 * 60);
      return duration > 60;
    });
    intensityScore -= longMeetings.length;
    return Math.max(0, intensityScore);
  }

  _computeScore(metrics: any): number {
    return (
      metrics.meetingDensity * 0.3 +
      metrics.workHours * 0.25 +
      metrics.breakTime * 0.2 +
      metrics.weekendWork * 0.15 +
      metrics.intensity * 0.1
    );
  }
}

export default new BurnoutCalculator(); 