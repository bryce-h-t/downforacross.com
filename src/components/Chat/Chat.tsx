import './css/index.css';
import React, {Component} from 'react';
import _ from 'lodash';
import Flex from 'react-flexview';
import Linkify from 'react-linkify';
import {Link} from 'react-router-dom';
import {MdClose} from 'react-icons/md';
import Emoji from '../common/Emoji';
import * as emojiLib from '../../lib/emoji';
import nameGenerator, {isFromNameGenerator} from '../../lib/nameGenerator';
import ChatBar from './ChatBar';
import EditableSpan from '../common/EditableSpan';
import MobileKeyboard from '../Player/MobileKeyboard';
import ColorPicker from './ColorPicker';
import type {ChatProps, ChatState, ChatMessage, ChatData} from './types';
import {formatMilliseconds} from '../Toolbar/Clock';
import {ChatProps, ChatState, ChatMessage, ChatData} from './types';

const isEmojis = (str: string): boolean => {
  const res = str.match(/[A-Za-z,.0-9!-]/g);
  return !res;
};

export default class Chat extends Component<ChatProps, ChatState> {
  private chatBar: React.RefObject<ChatBar>;
  private usernameInput: React.RefObject<EditableSpan>;

  constructor(props: ChatProps) {
    super(props);
    this.state = {
      username: '',
    };
    this.chatBar = React.createRef();
    this.usernameInput = React.createRef();
  }

  componentDidMount(): void {
    let username = this.props.initialUsername;
    const battleName = localStorage.getItem(`battle_${this.props.bid}`);
    if (battleName && !username) {
      username = battleName;
      this.setState({username: battleName});
    } else {
      this.setState({username});
    }
    this.handleUpdateDisplayName(username || '');
  }

  get usernameKey(): string {
    return `username_${window.location.href}`;
  }

  handleSendMessage = (message: string): void => {
    const {id} = this.props;
    const username = this.props.users[id].displayName;
    this.props.onChat(username, id, message);
    localStorage.setItem(this.usernameKey, username);
  };

  handleUpdateDisplayName = (username: string): void => {
    if (!this.usernameInput?.current?.focused) {
      username = username || nameGenerator();
    }
    const {id} = this.props;
    this.props.onUpdateDisplayName(id, username);
    this.setState({username});
    localStorage.setItem(this.usernameKey, username);
    if (
      localStorage.getItem('username_default') !== localStorage.getItem(this.usernameKey) &&
      !isFromNameGenerator(username)
    ) {
      localStorage.setItem('username_default', username);
    }
  };

  handleUpdateColor = (color: string): void => {
    color = color || this.props.myColor || '';
    const {id} = this.props;
    this.props.onUpdateColor(id, color);
  };

  handleUnfocus = (): void => {
    this.props.onUnfocus?.();
  };

  handleBlur = (): void => {
    let {username} = this.state;
    username = username || nameGenerator();
    this.setState({username});
  };

  handleToggleChat = (): void => {
    this.props.onToggleChat?.();
  };

  get serverUrl(): string {
    return `${window.location.protocol}//${window.location.host}`;
  }

  get url(): string {
    return `${this.serverUrl}/beta${this.props.path}`;
  }

  handleCopyClick = (): void => {
    navigator.clipboard.writeText(this.url);
    let link = document.getElementById('pathText');
    if (link) {
      link.classList.remove('flashBlue');
      void link.offsetWidth;
      link.classList.add('flashBlue');
    }
  };

  handleShareScoreClick = (): void => {
    const text = `${Object.keys(this.props.users).length > 1 ? 'We' : 'I'} solved ${
      this.props.game.info.title
    } in ${formatMilliseconds(this.props.game.clock.totalTime)}!\n\n${this.serverUrl}/beta/play/${
      this.props.game.pid
    }`;
    navigator.clipboard.writeText(text);
    let link = document.getElementById('shareText');
    if (link) {
      link.classList.remove('flashBlue');
      void link.offsetWidth;
      link.classList.add('flashBlue');
    }
  };

  focus = (): void => {
    const chatBar = this.chatBar.current;
    if (chatBar) {
      chatBar.focus();
    }
  };

  mergeMessages(data: ChatData, opponentData?: ChatData): ChatMessage[] {
    if (!opponentData) {
      return data.messages || [];
    }

    const getMessages = (data: ChatData, isOpponent: boolean): ChatMessage[] =>
      _.map(data.messages, (message) => ({...message, isOpponent}));

    const messages = _.concat(getMessages(data, false), getMessages(opponentData, true));

    return _.sortBy(messages, 'timestamp');
  }

  getMessageColor(senderId: string, isOpponent?: boolean): string | undefined {
    const {users, teams} = this.props;
    if (isOpponent === undefined) {
      if (users[senderId]?.teamId && teams) {
        return teams[users[senderId].teamId]?.color;
      }
      return users[senderId]?.color;
    }
    return isOpponent ? 'rgb(220, 107, 103)' : 'rgb(47, 137, 141)';
  }

  renderGameButton(): React.ReactNode {
    return <MdClose onClick={this.handleToggleChat} className="toolbar--game" />;
  }

  renderToolbar(): React.ReactNode {
    if (!this.props.mobile) return null;
    return (
      <Flex className="toolbar--mobile" vAlignContent="center">
        <Link to="/">Down for a Cross</Link> {this.renderGameButton()}
      </Flex>
    );
  }

  renderFencingOptions(): React.ReactNode {
    const fencingUrl = `/fencing/${this.props.gid}`;
    const normalUrl = `/beta/game/${this.props.gid}`;
    const isFencing = this.props.isFencing;
    const fencingPlayers = this.props.game.fencingUsers?.length ?? 0;
    return (
      <div>
        {!isFencing && !!fencingPlayers && <a href={fencingUrl}>Join Fencing ({fencingPlayers} joined)</a>}
        {!isFencing && !fencingPlayers && (
          <a href={fencingUrl} style={{opacity: 0.1, textDecoration: 'none'}}>
            X
          </a>
        )}
        {isFencing && <a href={normalUrl}>Leave Fencing</a>}
      </div>
    );
  }

  renderChatHeader(): React.ReactNode {
    if (this.props.header) return this.props.header;
    const {info = {}, bid} = this.props;
    const {title, description, author, type} = info;
    const desc = description?.startsWith('; ') ? description.substring(2) : description;

    return (
      <div className="chat--header">
        <div className="chat--header--title">{title}</div>
        <div className="chat--header--subtitle">{type && `${type} | By ${author}`}</div>
        {desc && (
          <div className="chat--header--description">
            <strong>Note: </strong>
            <Linkify>{desc}</Linkify>
          </div>
        )}

        {bid && (
          <div className="chat--header--subtitle">
            Battle
            {bid}
          </div>
        )}
        {this.renderFencingOptions()}
      </div>
    );
  }

  renderUsernameInput(): React.ReactNode {
    return this.props.hideChatBar ? null : (
      <div className="chat--username">
        {'You are '}
        <ColorPicker color={this.props.myColor || ''} onUpdateColor={this.handleUpdateColor} />
        <EditableSpan
          ref={this.usernameInput}
          className="chat--username--input"
          mobile={this.props.mobile}
          value={this.state.username}
          onChange={this.handleUpdateDisplayName}
          onBlur={this.handleBlur}
          onUnfocus={this.focus}
          style={{color: this.props.myColor}}
        />
      </div>
    );
  }

  renderUserPresent(id: string, displayName: string, color?: string): React.ReactNode {
    const style = color
      ? {
          color,
        }
      : undefined;
    return (
      <span key={id} style={style}>
        <span className="dot">{'\u25CF'}</span>
        {displayName}{' '}
      </span>
    );
  }

  renderUsersPresent(users: Record<string, {displayName: string; color?: string}>): React.ReactNode {
    return this.props.hideChatBar ? null : (
      <div className="chat--users--present">
        {Object.keys(users).map((id) => this.renderUserPresent(id, users[id].displayName, users[id].color))}
      </div>
    );
  }

  renderChatBar(): React.ReactNode {
    return this.props.hideChatBar ? null : (
      <ChatBar
        ref={this.chatBar}
        mobile={this.props.mobile}
        placeHolder="[Enter] to chat"
        onSendMessage={this.handleSendMessage}
        onUnfocus={this.handleUnfocus}
      />
    );
  }

  renderMessageTimestamp(timestamp: number): React.ReactNode {
    return (
      <span className="chat--message--timestamp">
        {new Date(timestamp).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}
      </span>
    );
  }

  renderMessageSender(name: string, color?: string): React.ReactNode {
    const style = color
      ? {
          color,
        }
      : undefined;
    return (
      <span className="chat--message--sender" style={style}>
        {name}:
      </span>
    );
  }

  renderMessageText(text: string): React.ReactNode {
    const words = text.split(' ');
    const tokens: Array<{type: 'emoji' | 'clueref' | 'text'; data: string | RegExpMatchArray}> = [];
    words.forEach((word) => {
      if (word.length === 0) return;
      if (word.startsWith(':') && word.endsWith(':')) {
        const emoji = word.substring(1, word.length - 1);
        const emojiData = emojiLib.get(emoji);
        if (emojiData) {
          tokens.push({
            type: 'emoji',
            data: emoji,
          });
          return;
        }
      }

      if (word.startsWith('@')) {
        let pattern = word;
        let clueref = pattern.match(/^@(\d+)-?\s?(a(?:cross)?|d(?:own)?)$/i);
        if (clueref) {
          tokens.push({
            type: 'clueref',
            data: clueref,
          });
          return;
        }
      }

      if (tokens.length && tokens[tokens.length - 1].type === 'text') {
        tokens[tokens.length - 1].data += ` ${word}`;
      } else {
        tokens.push({
          type: 'text',
          data: word,
        });
      }
    });

    const bigEmoji = tokens.length <= 3 && _.every(tokens, (token) => token.type === 'emoji');
    return (
      <span className="chat--message--text">
        {tokens.map((token, i) => (
          <React.Fragment key={i}>
            {token.type === 'emoji' ? (
              <Emoji emoji={token.data as string} big={bigEmoji} />
            ) : token.type === 'clueref' ? (
              this.renderClueRef(token.data as RegExpMatchArray)
            ) : (
              token.data
            )}
            {token.type !== 'emoji' && ' '}
          </React.Fragment>
        ))}
      </span>
    );
  }

  renderClueRef(clueref: RegExpMatchArray): React.ReactNode {
    const defaultPattern = clueref[0];

    let clueNumber;
    try {
      clueNumber = parseInt(clueref[1]);
    } catch (e) {
      return defaultPattern;
    }

    const directionFirstChar = clueref[2][0];
    const isAcross = directionFirstChar.toLowerCase() === 'a';
    const clues = isAcross ? this.props.game.clues['across'] : this.props.game.clues['down'];

    if (clueNumber >= 0 && clueNumber < clues.length && clues[clueNumber] !== undefined) {
      const handleClick = () => {
        const directionStr = isAcross ? 'across' : 'down';
        this.props.onSelectClue?.(directionStr, clueNumber);
      };

      return <button onClick={handleClick}> {defaultPattern} </button>;
    } else {
      return defaultPattern;
    }
  }

  renderMessage(message: ChatMessage): React.ReactNode {
    const {text, senderId: id, isOpponent, timestamp} = message;
    const big = text.length <= 10 && isEmojis(text);
    const color = this.getMessageColor(id, isOpponent);
    const users = this.props.users;

    return (
      <div className={`chat--message${big ? ' big' : ''}`}>
        <div className="chat--message--content">
          {this.renderMessageSender(users[id]?.displayName ?? 'Unknown', color)}
          {this.renderMessageText(message.text)}
        </div>
        <div className="chat--message--timestamp">{this.renderMessageTimestamp(timestamp)}</div>
      </div>
    );
  }

  renderMobileKeyboard(): React.ReactNode {
    if (!this.props.mobile) {
      return null;
    }

    return (
      <Flex shrink={0}>
        <MobileKeyboard layout="uppercase" />
      </Flex>
    );
  }

  renderChatSubheader(): React.ReactNode {
    if (this.props.subheader) return this.props.subheader;
    const users = this.props.users;

    return (
      <>
        {this.renderUsernameInput()}
        {this.renderUsersPresent(users)}
      </>
    );
  }

  render(): React.ReactNode {
    const messages = this.mergeMessages(this.props.data, this.props.opponentData);
    return (
      <Flex column grow={1}>
        {this.renderToolbar()}
        <div className="chat">
          {this.renderChatHeader()}
          {this.renderChatSubheader()}
          <div
            ref={(el) => {
              if (el) {
                el.scrollTop = el.scrollHeight;
              }
            }}
            className="chat--messages"
          >
            <div className="chat--message chat--system-message">
              <div>
                <i>
                  Game created! Share the link to play with your friends:
                  <wbr />
                </i>
                <b id="pathText" style={{marginLeft: '5px'}}>
                  {this.url}
                </b>

                <i
                  className="fa fa-clone copyButton"
                  title="Copy to Clipboard"
                  onClick={this.handleCopyClick}
                />
              </div>
            </div>
            {this.props.game.solved && (
              <div className="chat--message chat--system-message">
                <div className="copyText" onClick={this.handleShareScoreClick}>
                  <i id="shareText">
                    Congratulations! You solved the puzzle in{' '}
                    <b>{formatMilliseconds(this.props.game.clock.totalTime)}</b>. Click here to share your
                    score.
                    <wbr />
                  </i>

                  <i className="fa fa-clone copyButton" title="Copy to Clipboard" />
                </div>
              </div>
            )}
            {messages.map((message, i) => (
              <div key={i}>{this.renderMessage(message)}</div>
            ))}
          </div>
          {this.renderChatBar()}
        </div>
      </Flex>
    );
  }
}
