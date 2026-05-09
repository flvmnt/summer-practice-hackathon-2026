import { describe, expect, it } from "vitest";
import { buildIcsCalendar } from "@/lib/calendar";

describe("calendar export", () => {
  it("builds an event invite with UTC timestamps", () => {
    const ics = buildIcsCalendar(
      {
        id: "event-1",
        title: "Running plan",
        startsAt: new Date("2026-05-10T16:00:00.000Z"),
        durationMin: 90,
        location: "Parcul Rozelor",
        description: "Group link: https://example.test/ro/groups/abc",
        url: "https://example.test/ro/events/event-1",
      },
      new Date("2026-05-09T10:00:00.000Z"),
    );

    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("DTSTAMP:20260509T100000Z");
    expect(ics).toContain("DTSTART:20260510T160000Z");
    expect(ics).toContain("DTEND:20260510T173000Z");
    expect(ics).toContain("SUMMARY:Running plan");
    expect(ics).toContain("LOCATION:Parcul Rozelor");
  });

  it("escapes text fields to avoid malformed calendar content", () => {
    const ics = buildIcsCalendar({
      id: "event-2",
      title: "Tennis, court; bring \\ balls\nInjected:BAD",
      startsAt: new Date("2026-05-10T16:00:00.000Z"),
      durationMin: 60,
      location: "A, B; C",
    });

    expect(ics).toContain("SUMMARY:Tennis\\, court\\; bring \\\\ balls\\nInjected:BAD");
    expect(ics).toContain("LOCATION:A\\, B\\; C");
  });
});
