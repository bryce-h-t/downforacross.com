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
