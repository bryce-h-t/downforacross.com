import {ReactNode} from 'react';

export interface ChatProps {
  id: string;
  initialUsername?: string;
  bid?: string;
  path: string;
  isFencing?: boolean;
  users: Record<string, {
    displayName: string;
    color?: string;
    teamId?: number;
  }>;
  game: {
    info: {
      title: string;
      description?: string;
      author?: string;
      type?: string;
    };
    pid?: string;
    gid?: string;
    clock: {
      totalTime: number;
    };
    solved?: boolean;
    clues: {
      across: string[];
      down: string[];
    };
    isFencing?: boolean;
    fencingUsers?: any[];
  };
  data: {
    messages?: Array<{
      text: string;
      senderId: string;
      timestamp: number;
    }>;
  };
  opponentData?: {
    messages?: Array<{
      text: string;
      senderId: string;
      timestamp: number;
      isOpponent: boolean;
    }>;
  };
  myColor: string;
  mobile?: boolean;
  header?: ReactNode;
  subheader?: ReactNode;
  hideChatBar?: boolean;
  onChat: (username: string, id: string, message: string) => void;
  onUpdateDisplayName: (id: string, displayName: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUnfocus?: () => void;
  onToggleChat: () => void;
  onSelectClue?: (direction: 'across' | 'down', number: number) => void;
}

export interface ChatState {
  username: string;
}

export interface ChatBarProps {
  mobile?: boolean;
  placeHolder?: string;
  onSendMessage: (message: string) => void;
  onUnfocus: () => void;
}

export interface ChatBarState {
  message: string;
  escapedEmoji: string | null;
  enters: number;
}

export interface EmojiPickerProps {
  pattern?: string;
  matches: string[];
  onConfirm: (emoji: string) => void;
  onEscape: () => void;
  onSelectEmoji?: (emoji: string) => void;
  disableKeyListener?: boolean;
}

export interface EmojiPickerState {
  selectedEmoji: string | null;
}
