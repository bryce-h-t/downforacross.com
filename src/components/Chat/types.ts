import {UserJson, CellCoords} from '../../shared/types';

export interface ChatMessage {
  text: string;
  senderId: string;
  sender: string;
  timestamp: number;
  isOpponent?: boolean;
}

export interface ChatData {
  messages: ChatMessage[];
}

export interface ChatProps {
  id: string;
  bid?: string;
  path?: string;
  gid?: string;
  game: {
    info: {
      title: string;
      type?: string;
      author?: string;
      description?: string;
    };
    clues: {
      across: string[];
      down: string[];
    };
    solved?: boolean;
    clock: {
      totalTime: number;
    };
    fencingUsers?: string[];
  };
  users: Record<string, {
    displayName: string;
    color?: string;
    teamId?: number;
  }>;
  teams?: Record<number, {
    color: string;
  }>;
  data: ChatData;
  opponentData?: ChatData;
  initialUsername?: string;
  myColor?: string;
  mobile?: boolean;
  isFencing?: boolean;
  header?: React.ReactNode;
  subheader?: React.ReactNode;
  hideChatBar?: boolean;
  onChat: (username: string, id: string, message: string) => void;
  onUpdateDisplayName: (id: string, displayName: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUnfocus?: () => void;
  onToggleChat?: () => void;
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
