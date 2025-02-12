declare module 'react-flexview' {
  import * as React from 'react';
  interface FlexViewProps extends React.HTMLAttributes<HTMLDivElement> {
    column?: boolean;
    vAlignContent?: string;
    grow?: number;
    shrink?: number;
    className?: string;
    children?: React.ReactNode;
  }
  const FlexView: React.FC<FlexViewProps>;
  export default FlexView;
}

declare module '../common/Emoji' {
  import * as React from 'react';
  interface EmojiProps {
    emoji: string;
    big?: boolean;
  }
  const Emoji: React.FC<EmojiProps>;
  export default Emoji;
}

declare module 'react-linkify' {
  import * as React from 'react';
  interface LinkifyProps {
    children: React.ReactNode;
  }
  const Linkify: React.FC<LinkifyProps>;
  export default Linkify;
}

declare module 'react-icons/md/index' {
  import * as React from 'react';
  export interface IconBaseProps extends React.SVGAttributes<SVGElement> {
    children?: React.ReactNode;
    size?: string | number;
    color?: string;
    title?: string;
  }
  export type IconType = React.ComponentType<IconBaseProps>;
  export const MdClose: IconType;
}

declare module 'react-router-dom' {
  import * as React from 'react';
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string;
    replace?: boolean;
    innerRef?: React.Ref<HTMLAnchorElement>;
  }
  export const Link: React.FC<LinkProps>;
  export const BrowserRouter: React.FC<{children?: React.ReactNode}>;
  export const Route: React.FC<{
    path?: string;
    exact?: boolean;
    component?: React.ComponentType<any>;
    render?: (props: any) => React.ReactNode;
  }>;
}
