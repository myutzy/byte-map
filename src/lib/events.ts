export interface Event {
  name: string;
  properties?: Record<string, any>;
}

export function trackEvent(event: Event) {
  // TODO: Implement event tracking
}
