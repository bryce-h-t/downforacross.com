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

// Add missing React types
declare module 'react' {
  export interface Component<P = {}, S = {}> extends React.Component<P, S> {}
  export type ReactNode = React.ReactNode;
  export type RefObject<T> = React.RefObject<T>;
  export type KeyboardEvent<T = Element> = React.KeyboardEvent<T>;
  export type MouseEvent<T = Element> = React.MouseEvent<T>;
  export type ChangeEvent<T = Element> = React.ChangeEvent<T>;
  export type CSSProperties = React.CSSProperties;
  export const createRef: typeof React.createRef;
}
