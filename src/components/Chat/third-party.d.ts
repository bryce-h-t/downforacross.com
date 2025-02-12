declare module 'react-flexview' {
  import * as React from 'react';
  interface FlexViewProps {
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
  export interface LinkProps {
    to: string;
    children?: React.ReactNode;
    className?: string;
  }
  export const Link: React.FC<LinkProps>;
}
