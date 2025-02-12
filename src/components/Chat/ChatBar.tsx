import React from 'react';
import EmojiPicker from './EmojiPicker';
import * as emojiLib from '../../lib/emoji';
import {ChatBarProps, ChatBarState} from './types';

const MAX_EMOJIS = 150;

export default class ChatBar extends React.Component<ChatBarProps, ChatBarState> {
  private input: React.RefObject<HTMLInputElement | null>;
  private emojiPicker: React.RefObject<EmojiPicker | null>;

  constructor(props: ChatBarProps) {
    super(props);
    this.state = {
      message: '',
      escapedEmoji: null,
      enters: 0,
    };
    this.input = React.createRef<HTMLInputElement>();
    this.emojiPicker = React.createRef<EmojiPicker>();
  }

  handlePressEnter = (): void => {
    const {message} = this.state;
    if (message.length > 0) {
      this.props.onSendMessage(message);
      this.setState((prevState) => ({message: '', enters: prevState.enters + 1}));
    } else {
      this.props.onUnfocus();
    }
  };

  handleKeyDown = (ev: React.KeyboardEvent): void => {
    if (this.emojiPicker.current) {
      this.emojiPicker.current.handleKeyDown((ev as unknown) as KeyboardEvent);
      return;
    }

    if (ev.key === 'Enter') {
      ev.stopPropagation();
      ev.preventDefault();
      this.handlePressEnter();
    } else if (ev.key === 'Escape') {
      this.props.onUnfocus();
    }
  };

  handleChangeMobile = (message: string): void => {
    this.setState({message});
  };

  handleChange = (ev: React.ChangeEvent<HTMLInputElement>): void => {
    const message = ev.target.value;
    this.setState({message});
  };

  handleConfirmEmoji = (emoji: string): void => {
    const words = this.state.message.split(' ');
    const newMessage = [...words.slice(0, words.length - 1), `:${emoji}:`, ''].join(' ');
    this.setState({
      message: newMessage,
    });
  };

  handleEscapeEmoji = (): void => {
    this.setState({
      escapedEmoji: this.emojiPattern,
    });
    setTimeout(() => {
      this.setState({
        escapedEmoji: null,
      });
    }, 5000);
  };

  focus(): void {
    const input = this.input.current;
    if (input) {
      input.focus();
    }
  }

  get emojiPattern(): string | undefined {
    const words = this.state.message.split(' ');
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith(':')) {
      const pattern = lastWord.substring(1).toLowerCase();
      if (pattern.match(/^[a-zA-Z_-]*$/)) {
        if (pattern !== this.state.escapedEmoji) {
          return pattern;
        }
      }
    }
    return undefined;
  }

  renderEmojiPicker(): React.ReactNode {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          left: 0,
          right: 0,
          top: 'auto',
        }}
      >
        <EmojiPicker
          disableKeyListener
          ref={this.emojiPicker}
          pattern={this.emojiPattern}
          matches={emojiLib.findMatches(this.emojiPattern).slice(0, MAX_EMOJIS)}
          onConfirm={this.handleConfirmEmoji}
          onEscape={this.handleEscapeEmoji}
        />
      </div>
    );
  }

  renderInput(): React.ReactNode {
    return (
      <input
        ref={this.input}
        className={this.props.mobile ? 'chat--bar--input--mobile' : 'chat--bar--input'}
        placeholder="[Enter] to chat"
        value={this.state.message}
        onChange={this.handleChange}
        onKeyDown={this.handleKeyDown}
      />
    );
  }

  render(): React.ReactNode {
    return (
      <div className="chat--bar">
        {this.emojiPattern && this.renderEmojiPicker()}
        {this.renderInput()}
      </div>
    );
  }
}
