import React from 'react';

declare module 'react-flexview' {
  interface FlexViewProps {
    column?: boolean;
    vAlignContent?: string;
    grow?: number;
    shrink?: number;
    className?: string;
    children?: React.ReactNode;
  }
  const FlexView: React.FC<FlexViewProps>;
  export = FlexView;
}

declare module 'react-linkify' {
  interface LinkifyProps {
    children: React.ReactNode;
  }
  const Linkify: React.FC<LinkifyProps>;
  export = Linkify;
}

declare module 'react-icons/md' {
  export const MdClose: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}
