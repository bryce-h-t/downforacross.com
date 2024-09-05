/* eslint react/no-string-refs: "warn" */
import './css/editor.css';
import Flex from 'react-flexview';
import React, {Component} from 'react';
import Grid from '../Grid';
import GridControls from './GridControls';
import EditableSpan from '../common/EditableSpan';
import Hints from '../Compose/Hints';

import GridObject from '../../lib/wrappers/GridWrapper';
import * as gameUtils from '../../lib/gameUtils';

interface IdleRequestCallback {
  (deadline: IdleDeadline): void;
}

interface IdleRequestOptions {
  timeout?: number;
}

declare global {
  interface Window {
    requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback: (handle: number) => void;
  }
}

window.requestIdleCallback =
  window.requestIdleCallback ||
  function (cb) {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining() {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };

window.cancelIdleCallback =
  window.cancelIdleCallback ||
  function (id) {
    clearTimeout(id);
  };

/*
 * Summary of Editor component
 *
 * Props: { grid, clues, updateGrid, updateClues }
 *
 * State: { selected, direction }
 *
 * Children: [ GridControls, Grid, EditableClues ]
 * - GridControls.props:
 *   - attributes: { selected, direction, grid, clues }
 *   - callbacks: { setSelected, setDirection }
 * - Grid.props:
 *   - attributes: { grid, selected, direction }
 *   - callbacks: { setSelected, changeDirection }
 * - EditableClues.props:
 *   - attributes: { getClueList(), selected, halfSelected }
 *   - callbacks: { selectClue }
 *
 * Potential parents (so far):
 * - Compose
 * */

interface EditorProps {
  grid: any;
  clues: {
    across: string[];
    down: string[];
  };
  size: number;
  cursors: any;
  myColor: string;
  onUpdateGrid: (r: number, c: number, value: string) => void;
  onUpdateCursor: (selected: {r: number; c: number}) => void;
  onChange: () => void;
  onFlipColor: (r: number, c: number) => void;
  onUpdateClue: (r: number, c: number, direction: string, value: string) => void;
  onAutofill: () => void;
  onPublish: () => void;
  onChangeRows: (value: string) => void;
  onChangeColumns: (value: string) => void;
  onClearPencil: () => void;
  onUnfocus: () => void;
}

interface EditorState {
  selected: {
    r: number;
    c: number;
  };
  direction: 'across' | 'down';
  frozen: boolean;
}

export default class Editor extends Component<EditorProps, EditorState> {
  private prvNum: {[key: string]: number} = {};
  private prvIdleID: {[key: string]: number} = {};
  private clueScroll: number | undefined;

  constructor(props: EditorProps) {
    super(props);
    this.state = {
      selected: {
        r: 0,
        c: 0,
      },
      direction: 'across',
      frozen: false,
    };
  }

  get grid(): GridObject {
    const grid = new GridObject(this.props.grid);
    grid.assignNumbers();
    return grid;
  }

  /* Callback fns, to be passed to child components */

  canSetDirection = (): boolean => true;

  handleSetDirection = (direction: 'across' | 'down'): void => {
    this.setState({
      direction,
    });
  };

  handleSetSelected = (selected: {r: number; c: number}): void => {
    this.setState({
      selected,
    });
    this.props.onUpdateCursor(selected);
  };

  handleChangeDirection = (): void => {
    this.setState((prevState) => ({
      direction: gameUtils.getOppositeDirection(prevState.direction),
    }));
  };

  handleSelectClue = (direction: 'across' | 'down', number: number): void => {
    (this.refs.gridControls as any).selectClue(direction, number);
  };

  handleUpdateGrid = (r: number, c: number, value: string): void => {
    this.props.onUpdateGrid(r, c, value);
    this.props.onChange();
  };

  handlePressPeriod = (): void => {
    const {selected} = this.state;
    this.props.onFlipColor(selected.r, selected.c);
    this.props.onChange();
  };

  handleChangeClue = (value: string): void => {
    const {direction} = this.state;
    const selectedParent = this.selectedParent;
    if (selectedParent) {
      this.props.onUpdateClue(selectedParent.r, selectedParent.c, direction, value);
      this.props.onChange();
    }
  };

  handleAutofill = (): void => {
    this.props.onAutofill();
  };

  handlePublish = (): void => {
    this.props.onPublish();
  };

  handleChangeRows = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.props.onChangeRows(event.target.value);
  };

  handleChangeColumns = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.props.onChangeColumns(event.target.value);
  };

  handleClearPencil = (): void => {
    this.props.onClearPencil();
  };

  handleToggleFreeze = (): void => {
    this.setState((prevState) => ({
      frozen: !prevState.frozen,
    }));
  };

  /* Helper functions used when rendering */

  get selectedIsWhite(): boolean {
    const {selected} = this.state;
    return this.grid.isWhite(selected.r, selected.c);
  }

  get clueBarAbbreviation(): string | undefined {
    const {direction} = this.state;
    if (!this.selectedIsWhite) return undefined;
    if (!this.selectedClueNumber) return undefined;
    return this.selectedClueNumber + direction.substr(0, 1).toUpperCase();
  }

  get selectedClueNumber(): number | undefined {
    const {selected, direction} = this.state;
    if (!this.selectedIsWhite) return undefined;
    return this.grid.getParent(selected.r, selected.c, direction);
  }

  get halfSelectedClueNumber(): number | undefined {
    const {selected, direction} = this.state;
    if (!this.selectedIsWhite) return undefined;
    return this.grid.getParent(selected.r, selected.c, gameUtils.getOppositeDirection(direction));
  }

  get selectedParent(): {r: number; c: number} | undefined {
    if (!this.selectedIsWhite) return undefined;
    const selectedClueNumber = this.selectedClueNumber;
    return selectedClueNumber !== undefined ? this.grid.getCellByNumber(selectedClueNumber) : undefined;
  }

  isClueFilled(direction: 'across' | 'down', number: number): boolean {
    const clueRoot = this.grid.getCellByNumber(number);
    return !this.grid.hasEmptyCells(clueRoot.r, clueRoot.c, direction);
  }

  isClueSelected(direction: 'across' | 'down', number: number): boolean {
    return direction === this.state.direction && number === this.selectedClueNumber;
  }

  isClueHalfSelected(direction: 'across' | 'down', number: number): boolean {
    return direction !== this.state.direction && number === this.halfSelectedClueNumber;
  }

  isHighlighted(r: number, c: number): boolean {
    const {selected, direction} = this.state;
    const selectedParent = this.grid.getParent(selected.r, selected.c, direction);
    return (
      !this.isSelected(r, c) &&
      this.grid.isWhite(r, c) &&
      this.grid.getParent(r, c, direction) === selectedParent
    );
  }

  isSelected(r: number, c: number): boolean {
    const {selected} = this.state;
    return r === selected.r && c === selected.c;
  }

  /* Misc functions */

  // Interacts directly with the DOM
  // Very slow -- use with care
  scrollToClue(dir: 'across' | 'down', num: number, el: HTMLElement): void {
    if (el && this.prvNum[dir] !== num) {
      this.prvNum[dir] = num;
      if (this.prvIdleID[dir]) {
        cancelIdleCallback(this.prvIdleID[dir]);
      }
      this.prvIdleID[dir] = requestIdleCallback(() => {
        if (this.clueScroll === el.offsetTop) return;
        const parent = el.offsetParent as HTMLElement;
        parent.scrollTop = el.offsetTop - parent.offsetHeight * 0.4;
        this.clueScroll = el.offsetTop;
      });
    }
  }

  focusGrid(): void {
    (this.refs.gridControls as any)?.focus();
  }

  focusClue(): void {
    (this.refs.clue as any)?.focus();
  }

  focus(): void {
    this.focusGrid();
  }

  /* Render */

  renderLeft(): JSX.Element {
    const {selected, direction} = this.state;
    return (
      <div className="editor--main--left">
        <div className="editor--main--clue-bar">
          <div className="editor--main--clue-bar--number">{this.clueBarAbbreviation}</div>
          <div className="editor--main--clue-bar--text">
            <EditableSpan
              ref="clue"
              key_={`${direction}${this.selectedClueNumber}`}
              value={this.props.clues[direction][this.selectedClueNumber || 0] || ''}
              onChange={this.handleChangeClue}
              onUnfocus={() => this.focusGrid()}
              hidden={!this.selectedIsWhite || !this.selectedClueNumber}
            />
          </div>
        </div>

        <div className="editor--main--left--grid blurable">
          <Grid
            ref="grid"
            size={this.props.size}
            grid={this.props.grid}
            cursors={this.props.cursors}
            selected={selected}
            direction={direction}
            onSetSelected={this.handleSetSelected}
            onChangeDirection={this.handleChangeDirection}
            myColor={this.props.myColor}
            references={[]}
            editMode={true}
            cellStyle={{}} // TODO: Define proper cellStyle type
          />
        </div>
        <Flex className="editor--button" hAlignContent="center" onClick={this.handleToggleFreeze}>
          {this.state.frozen ? 'Unfreeze Grid' : 'Freeze Grid'}
        </Flex>
        <Flex>
          <Flex className="editor--button" hAlignContent="center" onClick={this.handleAutofill}>
            Autofill Grid
          </Flex>
          <Flex className="editor--button" hAlignContent="center" onClick={this.handleClearPencil}>
            Clear Pencil
          </Flex>
          <Flex className="editor--button" hAlignContent="center" onClick={this.handlePublish}>
            Publish
          </Flex>
        </Flex>
        <Flex>
          <Flex className="editor--grid-size">{'Rows: '}</Flex>
          <Flex className="editor--grid-size">
            <input
              className="editor--input"
              type="number"
              defaultValue={this.grid.size.toString()}
              onChange={this.handleChangeRows}
            />
          </Flex>
          <Flex className="editor--grid-size">{'Columns: '}</Flex>
          <Flex className="editor--grid-size">
            <input
              className="editor--input"
              type="number"
              defaultValue={this.grid.size.toString()}
              onChange={this.handleChangeColumns}
            />
          </Flex>
        </Flex>
      </div>
    );
  }

  renderClueList(dir: 'across' | 'down'): JSX.Element[] {
    return this.props.clues[dir]
      .map((clue, i) =>
        clue !== undefined ? (
          <Flex
            shrink={0}
            key={i}
            className={`${
              this.isClueSelected(dir, i)
                ? 'selected '
                : this.isClueHalfSelected(dir, i)
                ? 'half-selected '
                : ' '
            }editor--main--clues--list--scroll--clue`}
            ref={(el: HTMLDivElement | null) => {
              if (el && (this.isClueSelected(dir, i) || this.isClueHalfSelected(dir, i))) {
                this.scrollToClue(dir, i, el);
              }
            }}
            onClick={() => {
              this.handleSelectClue(dir, i);
            }}
          >
            <Flex className="editor--main--clues--list--scroll--clue--number" shrink={0}>
              {i}
            </Flex>
            <Flex className="editor--main--clues--list--scroll--clue--text" shrink={1}>
              {clue}
            </Flex>
          </Flex>
        ) : null
      )
      .filter((element): element is JSX.Element => element !== null);
  }

  render(): JSX.Element {
    const {selected, direction, frozen} = this.state;
    return (
      <Flex className="editor--main--wrapper">
        <GridControls
          ref="gridControls"
          ignore="input"
          selected={selected}
          editMode
          frozen={frozen}
          direction={direction}
          canSetDirection={this.canSetDirection}
          onSetDirection={this.handleSetDirection}
          onSetSelected={this.handleSetSelected}
          onPressEnter={() => this.setState({}, this.focusClue.bind(this))}
          onPressEscape={() => this.props.onUnfocus()}
          onPressPeriod={this.handlePressPeriod}
          updateGrid={this.handleUpdateGrid}
          grid={this.props.grid}
          clues={this.props.clues}
        >
          <Flex className="editor--main">
            {this.renderLeft()}
            <Flex className="editor--right" column>
              <Flex className="editor--main--clues" grow={1}>
                {
                  // Clues component
                  (['across', 'down'] as const).map((dir, i) => (
                    <Flex key={i} className="editor--main--clues--list">
                      <Flex className="editor--main--clues--list--title">{dir.toUpperCase()}</Flex>
                      <Flex column grow={1}>
                        <Flex
                          column
                          grow={1}
                          basis={1}
                          className={`editor--main--clues--list--scroll ${dir}`}
                          ref={`clues--list--${dir}`}
                        >
                          {this.renderClueList(dir)}
                        </Flex>
                      </Flex>
                    </Flex>
                  ))
                }
              </Flex>
              <Flex className="editor--right--hints">
                <Hints grid={this.props.grid} num={this.selectedClueNumber} direction={direction} />
              </Flex>
            </Flex>
          </Flex>
        </GridControls>
      </Flex>
    );
  }
}
