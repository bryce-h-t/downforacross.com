import type {ReactNode} from 'react';
import type {RefObject} from 'react';
import type {GameJson, UserJson} from '../../shared/types';

export interface ChatMessage {
  text: string;
  senderId: string;
  timestamp: number | undefined;
}

export interface ChatState {
  messages: ChatMessage[];
}

export interface ChatProps {
  id: string;
  path: string;
  game: GameJson;
  users: Record<string, UserJson>;
  data: ChatState;
  opponentData?: ChatState;
  myColor: string;
  mobile?: boolean;
  header?: ReactNode;
  subheader?: ReactNode;
  hideChatBar?: boolean;
  onChat: (username: string, id: string, message: string) => void;
  onUpdateDisplayName: (id: string, name: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUnfocus?: () => void;
  onToggleChat: () => void;
}

export interface ChatBarProps {
  mobile?: boolean;
  onSendMessage: (message: string) => void;
  onUnfocus: () => void;
  ref?: RefObject<any>;
}

export interface ChatBarState {
  message: string;
  escapedEmoji: string | null;
  enters: number;
}

export interface EmojiPickerProps {
  pattern: string;
  matches: string[];
  onConfirm: (emoji: string) => void;
  onEscape: () => void;
  onSelectEmoji?: (emoji: string) => void;
  disableKeyListener?: boolean;
  ref?: RefObject<any>;
}

export interface EmojiPickerState {
  selectedEmoji: string | null;
}

export interface DOMPosition {
  left: number;
  right: number;
  cx: number;
  cy: number;
}

export interface EmojiMatch {
  emoji: string;
  pagey: number;
  dy: number;
  pagex: number;
  dx: number;
}
