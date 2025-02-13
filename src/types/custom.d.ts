declare module 'react-flexview';
declare module 'react-linkify';
declare module '*.css';
declare module 'lodash';
declare module 'react-icons/md';
declare module 'react-router-dom';

declare module 'react' {
  interface HTMLAttributes<T> {
    vAlignContent?: string;
    grow?: number;
    shrink?: number;
  }
}

declare global {
  namespace JSX {
    interface Element {}
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}

declare module 'react' {
  export class Component<P = {}, S = {}> {
    constructor(props: P);
    props: Readonly<P>;
    state: Readonly<S>;
    setState<K extends keyof S>(
      state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null),
      callback?: () => void
    ): void;
    forceUpdate(callback?: () => void): void;
    render(): React.ReactNode;
  }

  export type ReactNode = any;
  export type RefObject<T> = { current: T | null };
  export type KeyboardEvent<T = Element> = any;
  export type MouseEvent<T = Element> = any;
  export type ChangeEvent<T = Element> = any;
  export type CSSProperties = any;
  export function createRef<T>(): RefObject<T>;
  export const createElement: any;
  export const Fragment: any;
}
