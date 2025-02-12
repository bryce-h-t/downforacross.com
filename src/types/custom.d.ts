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
  export type ReactNode = React.ReactNode;
  export type RefObject<T> = React.RefObject<T>;
  export type KeyboardEvent = React.KeyboardEvent;
  export type MouseEvent = React.MouseEvent;
  export type ChangeEvent = React.ChangeEvent;
  export type Component = React.Component;
  export type CSSProperties = React.CSSProperties;
}
