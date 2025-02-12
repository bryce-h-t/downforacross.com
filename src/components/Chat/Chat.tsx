import React from 'react';
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
import {formatMilliseconds} from '../Toolbar/Clock';
import {ChatProps} from './types';
import './css/index.css';

interface State {
  username: string;
}

export default class Chat extends React.Component<ChatProps, State> {
  public readonly state: State;
  public static displayName = 'Chat';
  public static defaultProps = {
    mobile: false,
    opponentData: undefined,
    header: undefined,
    subheader: undefined,
    hideChatBar: false,
    onUnfocus: () => {},
  };
  static displayName = 'Chat';
  private chatBar: React.RefObject<any>;
  private colorPicker: React.RefObject<any>;

  constructor(props: ChatProps) {
    super(props);
    this.state = {
      username: nameGenerator(),
    };
    this.chatBar = React.createRef();
    this.colorPicker = React.createRef();
  }

  handleSendMessage = (message: string) => {
    const {id} = this.props;
    const {username} = this.state;
    this.props.onChat(username, id, message);
  };

  handleUnfocus = () => {
    if (this.props.onUnfocus) {
      this.props.onUnfocus();
    }
  };

  handleChangeDisplayName = (username: string) => {
    const {id} = this.props;
    this.setState({username});
    this.props.onUpdateDisplayName(id, username);
  };

  handleChangeColor = (color: string) => {
    const {id} = this.props;
    this.props.onUpdateColor(id, color);
  };

  focus() {
    if (this.chatBar.current) {
      this.chatBar.current.focus();
    }
  }

  renderChatHeader() {
    const {header} = this.props;
    if (!header) return null;
    return <div className="chat--header">{header}</div>;
  }

  renderSubheader() {
    const {subheader} = this.props;
    if (!subheader) return null;
    return <div className="chat--subheader">{subheader}</div>;
  }

  renderCloseButton() {
    return (
      <div className="chat--header--button" onClick={this.props.onToggleChat}>
        <MdClose />
      </div>
    );
  }

  renderMessage(message: {senderId: string; text: string; timestamp?: number}, isOpponent = false) {
    const {users = {}, myColor} = this.props;
    const {senderId, text, timestamp} = message;
    const username = users[senderId]?.displayName || (isFromNameGenerator(senderId) ? senderId : 'Anonymous');
    const color = users[senderId]?.color || (isOpponent ? '#000000' : myColor);

    return (
      <div key={timestamp} className="chat--message">
        <span className="chat--message--sender" style={{color}}>
          {username}:
        </span>
        <Linkify>
          <span className="chat--message--text">
            <Emoji>{text}</Emoji>
          </span>
        </Linkify>
        {timestamp && (
          <span className="chat--message--timestamp">{formatMilliseconds(Date.now() - timestamp)}</span>
        )}
      </div>
    );
  }

  renderChatBar() {
    if (this.props.hideChatBar) return null;
    return (
      <ChatBar
        ref={this.chatBar}
        mobile={this.props.mobile}
        onSendMessage={this.handleSendMessage}
        onUnfocus={this.handleUnfocus}
      />
    );
  }

  render() {
    const {data = {messages: []}, opponentData = {messages: []}} = this.props;
    const messages = _.sortBy(
      [
        ...data.messages.map((msg) => ({...msg, opponent: false})),
        ...opponentData.messages.map((msg) => ({...msg, opponent: true})),
      ],
      'timestamp'
    );

    return (
      <Flex column grow={1} className="chat">
        <Flex shrink={0}>
          {this.renderChatHeader()}
          {this.renderSubheader()}
        </Flex>
        <Flex column grow={1} className="chat--messages">
          {messages.map((message) => this.renderMessage(message, message.opponent))}
        </Flex>
        {this.renderChatBar()}
      </Flex>
    );
  }
}
