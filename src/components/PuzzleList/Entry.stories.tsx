import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Entry from './Entry';

export default {
  title: 'PuzzleList/Entry',
  component: Entry,
};

const Template = (args) => (
  <BrowserRouter>
    <Entry {...args} />
  </BrowserRouter>
);

export const Default = Template.bind({});
Default.args = {
  info: {
    type: 'puzzle',
  },
  title: 'Sample Puzzle',
  author: 'Devin',
  pid: '12345',
  status: 'started',
  stats: {
    numSolves: 150,
    solves: [],
  },
  fencing: false,
};

export const Solved = Template.bind({});
Solved.args = {
  ...Default.args,
  status: 'solved',
};

export const Unsolved = Template.bind({});
Unsolved.args = {
  ...Default.args,
  status: undefined,
};

export const FencingEnabled = Template.bind({});
FencingEnabled.args = {
  ...Default.args,
  fencing: true,
};

export const HighNumSolves = Template.bind({});
HighNumSolves.args = {
  ...Default.args,
  stats: {
    numSolves: 1000,
    solves: [],
  },
};

export const NoSolves = Template.bind({});
NoSolves.args = {
  ...Default.args,
  stats: {
    numSolves: 0,
    solves: [],
  },
};

export const DifferentType = Template.bind({});
DifferentType.args = {
  ...Default.args,
  info: {
    type: 'challenge',
  },
};

export const CustomTitle = Template.bind({});
CustomTitle.args = {
  ...Default.args,
  title: 'Custom Puzzle Challenge',
};

export const CustomAuthor = Template.bind({});
CustomAuthor.args = {
  ...Default.args,
  author: 'Engineer Devin',
};
