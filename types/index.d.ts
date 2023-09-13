export {};

declare global {
  interface Window {
    MUYA_VERSION: string;
    Prism: unknown;
  }

  interface HTMLElement {
    __MUYA_BLOCK__: unknown;
  }
}
