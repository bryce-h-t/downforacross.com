import React, {Component, RefObject, KeyboardEvent, MouseEvent} from 'react';
import './css/gridControls.css';
import GridObject from '../../lib/wrappers/GridWrapper';

interface GridControlsProps {
  grid: any[][];
  selected: {r: number; c: number};
  direction: 'across' | 'down';
  editMode: boolean;
  frozen: boolean;
  onSetDirection: (direction: 'across' | 'down') => void;
  canSetDirection: (direction: 'across' | 'down') => boolean;
  onSetSelected: (selected: {r: number; c: number}) => void;
  updateGrid: (r: number, c: number, value: string) => void;
  onCheck?: (type: string) => void;
  onReveal?: (type: string) => void;
  onPressEnter?: () => void;
  onPressPeriod?: () => void;
  onPressEscape?: () => void;
  clues: any;
  beta?: boolean;
  vimMode?: boolean;
  onVimNormal?: () => void;
  onVimInsert?: () => void;
  vimInsert?: boolean;
}

interface GridControlsState {}

function safe_while(condition: () => boolean, step: () => void, cap = 500): void {
  while (condition() && cap >= 0) {
    step();
    cap -= 1;
  }
}

export default class GridControls extends Component<GridControlsProps, GridControlsState> {
  private inputRef: RefObject<HTMLInputElement>;
  private nextTime: number | null = null;

  constructor(props: GridControlsProps) {
    super(props);
    this.inputRef = React.createRef();
  }

  actions: Record<string, () => void> = {
    left: (): void => this.setDirectionWithCallback('across', () => this.moveSelectedBy(0, -1))(),
    up: (): void => this.setDirectionWithCallback('down', () => this.moveSelectedBy(-1, 0))(),
    down: (): void => this.setDirectionWithCallback('down', () => this.moveSelectedBy(1, 0))(),
    right: (): void => this.setDirectionWithCallback('across', () => this.moveSelectedBy(0, 1))(),
    forward: (): void => this.moveSelectedUsingDirection(1),
    backward: (): void => this.moveSelectedUsingDirection(-1),
    home: (): void => this.moveToEdge(true),
    end: (): void => this.moveToEdge(false),
    backspace: (): void => this.backspace(),
    delete: (): void => {
      this.delete();
    },
    tab: (): void => this.selectNextClue(),
    space: (): void => this.flipDirection(),
  };

  get grid(): GridObject {
    return new GridObject(this.props.grid);
  }

  getSelectedClueNumber(): number {
    return this.grid.getParent(this.props.selected.r, this.props.selected.c, this.props.direction);
  }

  componentDidMount(): void {
    this.focus();
  }

  setDirectionWithCallback(direction: 'across' | 'down', callback: () => void): () => void {
    return () => {
      if (this.props.direction !== direction) {
        if (this.canSetDirection(direction)) {
          this.setDirection(direction);
        } else {
          callback();
        }
      } else {
        callback();
      }
    };
  }

  moveSelectedBy(dr: number, dc: number): void {
    const {selected} = this.props;
    let {r, c} = selected;
    const step = () => {
      r += dr;
      c += dc;
    };
    step();
    safe_while(() => this.grid.isInBounds(r, c) && !this.isSelectable(r, c), step);
    if (this.grid.isInBounds(r, c)) {
      this.setSelected({r, c});
    }
  }

  moveSelectedUsingDirection(d: number): void {
    const [dr, dc] = this.props.direction === 'down' ? [d, 0] : [0, d];
    this.moveSelectedBy(dr, dc);
  }

  moveToEdge(start: boolean): void {
    const {selected, direction} = this.props;
    let {r, c} = selected;
    ({r, c} = this.grid.getEdge(r, c, direction, start));
    if (this.grid.isInBounds(r, c)) {
      this.setSelected({r, c});
    }
  }

  flipDirection(): void {
    if (this.props.direction === 'across') {
      if (this.canSetDirection('down')) {
        this.setDirection('down');
      }
    } else if (this.canSetDirection('across')) {
      this.setDirection('across');
    }
  }

  backspace(shouldStay: boolean = false): void {
    if (!this.delete() && !shouldStay) {
      const cell = this.goToPreviousCell();
      if (cell) {
        this.props.updateGrid(cell.r, cell.c, '');
      }
    }
  }

  delete(): boolean {
    const {r, c} = this.props.selected;
    if (this.props.grid[r][c].value !== '' && !this.props.grid[r][c].good) {
      this.props.updateGrid(r, c, '');
      return true;
    }
    return false;
  }

  selectNextClue(backwards: boolean = false, parallel: boolean = false): void {
    const {direction, clueNumber} = this.grid.getNextClue(
      this.getSelectedClueNumber(),
      this.props.direction,
      this.props.clues,
      backwards,
      parallel
    );

    this.selectClue(direction, clueNumber);
  }

  selectClue(direction: 'across' | 'down', number: number): void {
    this.setDirection(direction);
    const clueRoot = this.grid.getCellByNumber(number);
    const firstEmptyCell = this.grid.getNextEmptyCell(clueRoot.r, clueRoot.c, direction);
    this.setSelected(firstEmptyCell || clueRoot);
  }

  focus(): void {
    this.inputRef.current?.focus({preventScroll: true});
  }

  canSetDirection(direction: 'across' | 'down'): boolean {
    return this.props.canSetDirection(direction);
  }

  setDirection(direction: 'across' | 'down'): void {
    this.props.onSetDirection(direction);
  }

  setSelected(selected: {r: number; c: number}): void {
    this.props.onSetSelected(selected);
  }

  isSelectable(r: number, c: number): boolean {
    return this.props.editMode || this.grid.isWhite(r, c);
  }

  handleClick(ev: React.MouseEvent<HTMLDivElement>): void {
    ev.preventDefault();
    this.focus();
  }

  handleKeyDown(ev: React.KeyboardEvent<HTMLDivElement>): void {
    const {vimMode} = this.props;
    const _handleKeyDown = vimMode ? this._handleKeyDownVim : this._handleKeyDown;

    if (
      ev.target !== this.inputRef.current &&
      (ev.target instanceof HTMLInputElement || ev.metaKey || ev.ctrlKey)
    ) {
      return;
    }
    if (_handleKeyDown(ev.key, ev.shiftKey, ev.altKey)) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  goToPreviousCell(): {r: number; c: number} | null {
    let {r, c} = this.props.selected;
    const grid = this.props.grid;
    const step = () => {
      if (this.props.direction === 'across') {
        if (c > 0) {
          c--;
        } else {
          c = grid[0].length - 1;
          r--;
        }
      } else {
        if (r > 0) {
          r--;
        } else {
          r = grid.length - 1;
          c--;
        }
      }
    };
    const ok = () => this.grid.isInBounds(r, c) && this.grid.isWhite(r, c);
    step();
    safe_while(() => this.grid.isInBounds(r, c) && !ok(), step);
    if (ok()) {
      return {r, c};
    }
    return null;
  }

  _handleKeyDownVim = (key: string, shiftKey: boolean, altKey: boolean): boolean => {
    type ActionKey = keyof typeof this.actions;
    const normalModeActionKeys: Record<string, ActionKey> = {
      h: 'left',
      j: 'down',
      k: 'up',
      l: 'right',
      x: 'delete',
      '^': 'home',
      $: 'end',
    };

    const {onVimNormal, onVimInsert, vimInsert} = this.props;
    if (!vimInsert) {
      if (key in normalModeActionKeys) {
        const action = normalModeActionKeys[key];
        if (action in this.actions) {
          this.actions[action]();
          return true;
        }
      } else if (key === 'w') {
        this.selectNextClue(false);
        return true;
      } else if (key === 'b') {
        this.selectNextClue(true);
        return true;
      } else if (key === 'i') {
        onVimInsert?.();
        return true;
      } else if (key === 's') {
        this.delete();
        onVimInsert?.();
        return true;
      }
    } else {
      return this._handleKeyDown(key, shiftKey, altKey);
    }
    return false;
  };

  _handleKeyDown = (key: string, shiftKey: boolean, altKey: boolean): boolean => {
    const actionKeys: Record<string, keyof typeof this.actions> = {
      ArrowLeft: 'left',
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowRight: 'right',
      Backspace: 'backspace',
      Delete: 'delete',
      Tab: 'tab',
      ' ': 'space',
      '[': 'backward',
      ']': 'forward',
      Home: 'home',
      End: 'end',
    };

    const {onPressEnter, onPressPeriod, onPressEscape} = this.props;

    if (key in actionKeys) {
      const action = actionKeys[key];
      if (action in this.actions) {
        this.actions[action]();
        return true;
      }
    }
    if (key === '.') {
      onPressPeriod?.();
      return true;
    }
    if (key === 'Enter') {
      onPressEnter?.();
      return true;
    }
    if (altKey) {
      this.handleAltKey(key, shiftKey);
      return true;
    }
    if (key === 'Escape') {
      onPressEscape?.();
      return true;
    }
    if (!this.props.frozen) {
      const letter = key.toUpperCase();
      if (this.validLetter(letter)) {
        this.typeLetter(letter, shiftKey);
        return true;
      }
    }
    return false;
  };

  handleAltKey(key: string, shiftKey: boolean): void {
    key = key.toLowerCase();
    const altAction = shiftKey ? this.props.onReveal : this.props.onCheck;
    if (key === 's') {
      altAction && altAction('square');
    }
    if (key === 'w') {
      altAction && altAction('word');
    }
    if (key === 'p') {
      altAction && altAction('puzzle');
    }
  }

  validLetter(letter: string): boolean {
    const VALID_SYMBOLS = '!@#$%^&*()-+=`~/?\\';
    if (VALID_SYMBOLS.indexOf(letter) !== -1) return true;
    return /^[A-Z0-9]$/.test(letter);
  }

  typeLetter(letter: string, isRebus: boolean): void {
    const {r, c} = this.props.selected;
    const value = this.props.grid[r][c].value;
    if (!isRebus) {
      this.goToNextEmptyCell();
    }
    this.props.updateGrid(r, c, isRebus ? (value || '').substr(0, 10) + letter : letter);
  }

  goToNextEmptyCell(): void {
    const {r, c} = this.props.selected;
    const nextEmptyCell = this.grid.getNextEmptyCell(r, c, this.props.direction, {
      skipFirst: true,
    });
    if (nextEmptyCell) {
      this.setSelected(nextEmptyCell);
    } else {
      const nextCell = this.grid.getNextCell(r, c, this.props.direction);
      if (nextCell) {
        this.setSelected(nextCell);
      }
    }
  }

  render(): React.ReactNode {
    const gridProps = {
      style: {
        touchAction: 'manipulation' as const,
      },
    };
    const inputProps = {
      style: {
        opacity: 0,
        width: 0,
        height: 0,
      },
      autoComplete: 'off' as const,
      autoCapitalize: 'none' as const,
    };
    return (
      <div
        className="grid-controls"
        tabIndex={1}
        onClick={this.handleClick.bind(this)}
        onKeyDown={this.handleKeyDown.bind(this)}
        {...gridProps}
      >
        <div className="grid--content">{this.props.children}</div>
        <input tabIndex={-1} name="grid" ref={this.inputRef} {...inputProps} />
      </div>
    );
  }
}
