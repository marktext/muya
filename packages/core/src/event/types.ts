export type Listener = (...args: any[]) => void;

export interface IEvent {
    eventId: string;
    target: HTMLElement | Document;
    event: string;
    listener: EventListenerOrEventListenerObject;
    capture?: boolean | AddEventListenerOptions;
}

export interface IListeners {
    [key: string]: {
        listener: Listener;
        once: boolean;
    }[];
}
