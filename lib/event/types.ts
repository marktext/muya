export type Listener = (...args: any[]) => void;

export interface Event {
  eventId: string;
  target: HTMLElement;
  event: string;
  listener: EventListenerOrEventListenerObject;
  capture?: boolean | AddEventListenerOptions;
}

export interface Listeners {
  [key: string]: Array<{
    listener: Listener;
    once: boolean;
  }>;
}