/* eslint react/no-unescaped-entities: "warn" */
import * as React from 'react';
type ReactNode = React.ReactNode;
type RefObject<T> = React.RefObject<T>;
type KeyboardEvent = React.KeyboardEvent;
type MouseEvent = React.MouseEvent;
type CSSProperties = React.CSSProperties;
import Flex from 'react-flexview';
import _ from 'lodash';
import Emoji from '../common/Emoji';

interface KbdProps {
  children: ReactNode;
}

interface EmojiPickerProps {
  pattern?: string;
  matches: string[];
  onConfirm: (emoji: string) => void;
  onEscape: () => void;
  onSelectEmoji?: (emoji: string) => void;
  disableKeyListener?: boolean;
}

interface EmojiPickerState {
  selectedEmoji: string | null;
}

interface DOMPosition {
  left: number;
  right: number;
  cx: number;
  cy: number;
}

interface EmojiMatch {
  emoji: string;
  pagey: number;
  dy: number;
  pagex: number;
  dx: number;
}

const Kbd = ({children}: KbdProps): JSX.Element => <kbd>{children}</kbd>;

export default class EmojiPicker extends React.Component<EmojiPickerProps, EmojiPickerState> {
  private emojiRefs: Record<string, RefObject<HTMLSpanElement>> = {};
  private listContainer: RefObject<HTMLDivElement>;

  constructor(props: EmojiPickerProps) {
    super(props);
    this.state = {
      selectedEmoji: null,
    };
    this.listContainer = React.createRef<HTMLDivElement>();
  }

  static getDerivedStateFromProps(
    nextProps: EmojiPickerProps,
    prevState: EmojiPickerState
  ): Partial<EmojiPickerState> {
    let {selectedEmoji} = prevState;
    const {matches} = nextProps;
    if (!selectedEmoji || matches.indexOf(selectedEmoji) === -1) {
      selectedEmoji = matches[0];
    }
    return {
      selectedEmoji,
    };
  }

  componentDidMount() {
    if (this.props.disableKeyListener) return;
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    if (this.props.disableKeyListener) return;
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  getDomPosition(emoji: string): DOMPosition | null {
    const ref = this.emojiRefs[emoji];
    if (!ref || !ref.current) return null;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      cx: rect.x + rect.width / 2,
      cy: rect.y + rect.height / 2,
    };
  }

  scrollEmojiIntoView(emoji: string): void {
    // HACK: hardcoding container's padding here
    const padding = 5;
    const span = this.emojiRefs[emoji]?.current;
    if (!span) return;
    const top = span.offsetTop;
    const bottom = top + span.offsetHeight;
    const container = this.listContainer.current;
    if (!container) return;
    const containerHeight = container.getBoundingClientRect().height - 2 * padding;
    const scrollTop = container.scrollTop;
    const scrollBottom = container.scrollTop + containerHeight;

    if (scrollTop > top) {
      container.scrollTop = top - padding;
    } else if (scrollBottom < bottom) {
      container.scrollTop = bottom - containerHeight + padding;
    }
  }

  selectEmoji(emoji: string): void {
    this.setState({
      selectedEmoji: emoji,
    });
    if (this.props.onSelectEmoji) {
      this.props.onSelectEmoji(emoji);
    }
  }

  handleMouseDown = (e: React.MouseEvent): void => {
    if (this.state.selectedEmoji) {
      this.props.onConfirm(this.state.selectedEmoji);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  handleMouseEnterSpan = (e: MouseEvent<HTMLSpanElement>): void => {
    const emoji = e.currentTarget.getAttribute('data-emoji');
    if (emoji) {
      this.selectEmoji(emoji);
    }
  };

  handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.props.onEscape();
      return;
    }
    const {selectedEmoji} = this.state;
    const {matches} = this.props;
    if (!selectedEmoji || !matches.length) return;
    const key = e.key;
    const shiftKey = e.shiftKey;

    const next = () => {
      const offset = shiftKey ? matches.length - 1 : 1;
      const idx = matches.indexOf(selectedEmoji);
      const nextEmoji = matches[(idx + offset) % matches.length];
      this.selectEmoji(nextEmoji);
      this.scrollEmojiIntoView(nextEmoji);
    };

    // sx, sy should be -1, 0, or 1
    const move = (sx, sy) => () => {
      const {cx, cy} = this.getDomPosition(selectedEmoji);
      // beware, this code is a bit hacky :)
      const bestMatch = _.orderBy(
        matches
          .filter((emoji) => emoji !== selectedEmoji)
          .map((emoji) => {
            const p = this.getDomPosition(emoji);
            let dx = p.cx - cx;
            let dy = p.cy - cy;
            let pagex = 0;
            let pagey = 0;
            if (sx) {
              dy = Math.abs(dy);
              dx *= sx;
              if (dx <= 0) pagex = 1;
            } else if (sy) {
              dy *= sy;
              if (dy <= 0) pagey = 1;
              // check if it's contained within
              if (p.left <= cx && cx <= p.right) {
                dx = 0;
              } else if (dx < 0) {
                // hack: prefer left when moving up/down
                dx = -dx * 0.5;
              }
            }
            return {
              emoji,
              pagey,
              dy,
              pagex,
              dx,
            };
          }),
        ['pagey', 'dy', 'pagex', 'dx']
      )[0];
      this.selectEmoji(bestMatch.emoji);
      this.scrollEmojiIntoView(bestMatch.emoji);
    };

    const confirm = () => {
      this.props.onConfirm(this.state.selectedEmoji);
    };

    const actions = {
      Tab: next,
      ArrowLeft: move(-1, 0),
      ArrowRight: move(1, 0),
      ArrowUp: move(0, -1),
      ArrowDown: move(0, 1),
      Enter: confirm,
    };

    if (actions[key]) {
      actions[key](shiftKey);
      e.preventDefault();
      e.stopPropagation();
    }
  };

  renderHeader() {
    const {pattern} = this.props;

    const headerStyle = {
      justifyContent: 'space-between',
      backgroundColor: 'beige',
      borderBottom: '1px solid #333333',
      padding: 5,
      fontSize: '50%',
    };
    const patternStyle = {fontWeight: 'bold'};
    const hintStyle = {marginLeft: 20};
    return (
      <Flex style={headerStyle}>
        <span>
          <span style={patternStyle}>
            "
            {`:${pattern}`}
            "
          </span>
        </span>
        <span>
          <span style={hintStyle}>
            <Kbd>tab</Kbd>
            {' '}
            or
            <Kbd>↑↓</Kbd>
            {' '}
            to navigate
          </span>
          <span style={hintStyle}>
            <Kbd>↩</Kbd>
            {' '}
            to select
          </span>
          <span style={hintStyle}>
            <Kbd>esc</Kbd>
            {' '}
            to dismiss
          </span>
        </span>
      </Flex>
    );
  }

  renderEmoji(emoji: string): ReactNode {
    const {selectedEmoji} = this.state;
    const isSelected = selectedEmoji === emoji;
    const style: React.CSSProperties = {
      backgroundColor: isSelected ? '#6AA9F4' : 'white',
      color: isSelected ? 'white' : 'inherit',
      cursor: 'pointer',
      padding: 8,
      borderRadius: 13,
      marginRight: 20,
    };

    const textStyle = {
      fontSize: '70%',
      marginLeft: 5,
    };

    if (!this.emojiRefs[emoji]) {
      this.emojiRefs[emoji] = React.createRef();
    }
    return (
      <span
        style={style}
        ref={this.emojiRefs[emoji]}
        key={emoji}
        data-emoji={emoji}
        onMouseMove={this.handleMouseEnterSpan}
      >
        <Emoji emoji={emoji} />
        <span style={textStyle}>{`:${emoji}:`}</span>
      </span>
    );
  }

  renderMatches() {
    const containerStyle = {
      display: 'flex', // we don't use flex-view so that we can access the dom el
      flexWrap: 'wrap',
      padding: 5,
      overflow: 'scroll',
      maxHeight: 200,
      position: 'relative',
    };
    const {matches} = this.props;
    return (
      <div style={containerStyle} ref={this.listContainer}>
        {matches.map((emoji) => this.renderEmoji(emoji))}
      </div>
    );
  }

  render() {
    return (
      <Flex
        style={{backgroundColor: 'white', color: 'var(--main-gray-1)'}}
        column
        onMouseDown={this.handleMouseDown}
      >
        {this.renderHeader()}
        {this.renderMatches()}
      </Flex>
    );
  }
}
