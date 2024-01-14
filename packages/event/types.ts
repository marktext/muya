// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Listener = (...args: any[]) => void;

export interface Event {
  eventId: string;
  target: HTMLElement | Document;
  event: string;
  listener: EventListenerOrEventListenerObject;
  capture?: boolean | AddEventListenerOptions;
}

export interface Listeners {
  [key: string]: {
    listener: Listener;
    once: boolean;
  }[];
}