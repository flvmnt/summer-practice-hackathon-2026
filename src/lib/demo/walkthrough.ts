export const WALKTHROUGH_COOKIE = "s2m_walkthrough";
export const WALKTHROUGH_COOKIE_MAX_AGE = 60 * 60; // 1h

export type WalkthroughStep = {
  id: string;
  /**
   * i18n key (under `walkthrough.steps`) used for the step counter tooltip
   * and aria-labels. The component resolves the label via next-intl so the
   * scripted demo nav respects locale.
   */
  labelKey: "today" | "groups" | "group" | "event" | "vote" | "calendar" | "judgeMode";
  /**
   * Static path or a resolver path. Resolver paths point at /demo/step/<id>
   * which redirects to the actual demo entity once seed data is queried.
   */
  href: (locale: "en" | "ro") => string;
};

export const WALKTHROUGH_STEPS: ReadonlyArray<WalkthroughStep> = [
  { id: "today", labelKey: "today", href: (l) => `/${l}/today` },
  { id: "groups", labelKey: "groups", href: (l) => `/${l}/groups` },
  { id: "group", labelKey: "group", href: (l) => `/${l}/demo/step/group` },
  { id: "event", labelKey: "event", href: (l) => `/${l}/demo/step/event` },
  { id: "vote", labelKey: "vote", href: (l) => `/${l}/demo/step/event#vote` },
  { id: "calendar", labelKey: "calendar", href: (l) => `/${l}/calendar` },
  { id: "judge", labelKey: "judgeMode", href: (l) => `/${l}/demo` },
];

/**
 * Match a pathname back to a step index. Used by the client nav to show the
 * counter and pick the previous/next href. Returns -1 if not on a step.
 */
export function resolveStepIndex(pathname: string): number {
  const cleaned = pathname.replace(/\/+$/, "");
  if (/\/today$/.test(cleaned)) return 0;
  if (/\/groups\/?$/.test(cleaned)) return 1;
  if (/\/groups\/[^/]+/.test(cleaned)) return 2;
  if (/\/events\/[^/]+/.test(cleaned)) return 3;
  if (/\/calendar\/?$/.test(cleaned)) return 5;
  if (/\/demo\/?$/.test(cleaned)) return 6;
  return -1;
}
