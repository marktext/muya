export {};

declare global {
  interface Window {
    Prism: unknown;
    MUYA_VERSION: string;
  }

  interface HTMLElement {
    __MUYA_BLOCK__: unknown;
  }
}
