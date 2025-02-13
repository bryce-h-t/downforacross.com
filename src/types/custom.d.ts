declare module 'react' {
  interface HTMLAttributes<T> {
    vAlignContent?: string;
    grow?: number;
    shrink?: number;
    column?: boolean;
  }
}

declare module 'react' {
  interface HTMLAttributes<T> {
    vAlignContent?: string;
    grow?: number;
    shrink?: number;
    column?: boolean;
  }
}

declare module 'react-flexview' {
  import * as React from 'react';
  const Flex: React.ComponentClass<{
    column?: boolean;
    vAlignContent?: string;
    grow?: number;
    shrink?: number;
    className?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
  }>;
  export default Flex;
}

declare module '../common/EditableSpan' {
  import * as React from 'react';
  const EditableSpan: React.ComponentClass<{
    ref?: React.RefObject<any>;
    className?: string;
    mobile?: boolean;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    onUnfocus?: () => void;
    style?: React.CSSProperties;
  }>;
  export default EditableSpan;
}

declare module './ChatBar' {
  import * as React from 'react';
  const ChatBar: React.ComponentClass<{
    ref?: React.RefObject<any>;
    mobile?: boolean;
    placeHolder?: string;
    onSendMessage: (message: string) => void;
    onUnfocus: () => void;
  }> & {
    focus(): void;
  };
  export default ChatBar;
}

declare module '../Player/MobileKeyboard' {
  import * as React from 'react';
  const MobileKeyboard: React.ComponentClass<{
    layout: string;
  }>;
  export default MobileKeyboard;
}

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
    column?: boolean;
  }

  export class Component<P = {}, S = {}> {
    constructor(props: P);
    props: Readonly<P>;
    state: Readonly<S>;
    setState<K extends keyof S>(
      state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null),
      callback?: () => void
    ): void;
    forceUpdate(callback?: () => void): void;
    render(): ReactNode;
  }

  export type ReactNode = any;
  export type RefObject<T> = { current: T | null };
  export type KeyboardEvent<T = Element> = any;
  export type MouseEvent<T = Element> = any;
  export type ChangeEvent<T = Element> = any;
  export type CSSProperties = any;
  export function createRef<T>(): RefObject<T>;
  export const Fragment: any;
  export const createElement: any;
}

declare global {
  namespace JSX {
    interface Element {}
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}
