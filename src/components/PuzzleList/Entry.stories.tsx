import React from 'react';
import {StoryFn as Story, Meta} from '@storybook/react';
import Entry, {EntryProps} from './Entry';

export default {
  title: 'PuzzleList/Entry',
  component: Entry,
} as Meta;

const Template: Story<EntryProps> = (args) => <Entry {...args} />;

export const Default = Template.bind({});
Default.args = {
  info: {
    type: 'Daily Puzzle',
  },
  title: 'Sample Puzzle',
  author: 'Devin',
  pid: 'puzzle-id',
  status: 'started',
  stats: {
    numSolves: 5,
    solves: [],
  },
  fencing: false,
};

export const Solved = Template.bind({});
Solved.args = {
  ...Default.args,
  status: 'solved',
};

export const Fencing = Template.bind({});
Fencing.args = {
  ...Default.args,
  fencing: true,
};

export const NoSolves = Template.bind({});
NoSolves.args = {
  ...Default.args,
  stats: {
    numSolves: 0,
    solves: [],
  },
};

export const WithSolves = Template.bind({});
WithSolves.args = {
  ...Default.args,
  stats: {
    numSolves: 10,
    solves: new Array(10).fill({}),
  },
};

export const MiniPuzzle = Template.bind({});
MiniPuzzle.args = {
  ...Default.args,
  info: {
    type: 'Mini Puzzle',
  },
};

export const StandardPuzzle = Template.bind({});
StandardPuzzle.args = {
  ...Default.args,
  info: {
    type: 'Standard Puzzle',
  },
};

export const UndefinedStatus = Template.bind({});
UndefinedStatus.args = {
  ...Default.args,
  status: undefined,
};

export const LargeNumberOfSolves = Template.bind({});
LargeNumberOfSolves.args = {
  ...Default.args,
  stats: {
    numSolves: 100,
    solves: new Array(100).fill({}),
  },
};

export const CustomDisplayName = Template.bind({});
CustomDisplayName.args = {
  ...Default.args,
  author: 'Custom Author',
  info: {
    type: 'Custom Puzzle Type',
  },
};

export const LongTitle = Template.bind({});
LongTitle.args = {
  ...Default.args,
  title:
    'This is a very long puzzle title that should be truncated with ellipsis when displayed in the Entry component',
};

export const NoAuthor = Template.bind({});
NoAuthor.args = {
  ...Default.args,
  author: '',
};

export const NoTitle = Template.bind({});
NoTitle.args = {
  ...Default.args,
  title: '',
};
