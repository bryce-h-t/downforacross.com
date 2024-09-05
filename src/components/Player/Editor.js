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

// Polyfill for requestIdleCallback
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

// Polyfill for cancelIdleCallback
window.cancelIdleCallback =
  window.cancelIdleCallback ||
  function (id) {
    clearTimeout(id);
  };

/**
 * Editor component for a crossword puzzle editor.
 *
 * This component manages the editing interface for crossword puzzles,
 * including the grid, clues, and various editing controls.
 *
 * Props:
 * @param {Object} grid - The current state of the crossword grid
 * @param {Object} clues - The current clues for the crossword
 * @param {Function} updateGrid - Callback to update the grid
 * @param {Function} updateClues - Callback to update the clues
 * @param {Function} onUpdateCursor - Callback when the cursor position is updated
 * @param {Function} onFlipColor - Callback to flip the color of a cell
 * @param {Function} onUpdateClue - Callback to update a specific clue
 * @param {Function} onChange - Callback when any change is made
 * @param {Function} onAutofill - Callback to trigger autofill
 * @param {Function} onPublish - Callback to publish the crossword
 * @param {Function} onChangeRows - Callback to change the number of rows
 * @param {Function} onChangeColumns - Callback to change the number of columns
 * @param {Function} onClearPencil - Callback to clear pencil marks
 * @param {Function} onUnfocus - Callback when the editor should lose focus
 * @param {string} myColor - Color associated with the current user
 *
 * State:
 * @property {Object} selected - Currently selected cell {r, c}
 * @property {string} direction - Current direction ('across' or 'down')
 * @property {boolean} frozen - Whether the grid is frozen (locked) or not
 *
 * Children: GridControls, Grid, EditableClues
 */
export default class Editor extends Component {
  /**
   * Initialize the Editor component.
   * Sets up initial state and instance variables.
   */
  constructor() {
    super();
    this.state = {
      selected: {
        r: 0,
        c: 0,
      },
      direction: 'across',
      frozen: false,
    };
    this.prvNum = {}; // Stores previous clue numbers for scrolling
    this.prvIdleID = {}; // Stores previous idle callback IDs
  }

  /**
   * Getter for the grid object.
   * Creates a new GridObject instance from the current grid prop and assigns numbers to cells.
   * @returns {GridObject} The current grid with assigned numbers
   */
  get grid() {
    const grid = new GridObject(this.props.grid);
    grid.assignNumbers();
    return grid;
  }

  /* Callback functions to be passed to child components */

  /**
   * Determines if the direction can be set.
   * @returns {boolean} Always returns true in this implementation.
   */
  canSetDirection = () => true;

  /**
   * Updates the direction state of the editor.
   * @param {string} direction - The new direction ('across' or 'down').
   */
  handleSetDirection = (direction) => {
    this.setState({direction});
  };

  /**
   * Updates the selected cell state and notifies parent of cursor update.
   * @param {Object} selected - The newly selected cell coordinates { r, c }.
   */
  handleSetSelected = (selected) => {
    this.setState({selected});
    this.props.onUpdateCursor(selected);
  };

  /**
   * Toggles the direction between 'across' and 'down'.
   */
  handleChangeDirection = () => {
    this.setState((prevState) => ({
      direction: gameUtils.getOppositeDirection(prevState.direction),
    }));
  };

  /**
   * Selects a clue in the grid controls.
   * @param {string} direction - The direction of the clue ('across' or 'down').
   * @param {number} number - The clue number.
   */
  handleSelectClue = (direction, number) => {
    this.refs.gridControls.selectClue(direction, number);
  };

  /**
   * Updates a cell in the grid and triggers onChange event.
   * @param {number} r - The row index of the cell.
   * @param {number} c - The column index of the cell.
   * @param {string} value - The new value for the cell.
   */
  handleUpdateGrid = (r, c, value) => {
    this.props.onUpdateGrid(r, c, value);
    this.props.onChange();
  };

  /**
   * Handles the period key press to flip the color of the selected cell.
   */
  handlePressPeriod = () => {
    const {selected} = this.state;
    this.props.onFlipColor(selected.r, selected.c);
    this.props.onChange();
  };

  /**
   * Updates the clue for the currently selected direction and cell.
   * @param {string} value - The new clue text.
   */
  handleChangeClue = (value) => {
    const {direction} = this.state;
    this.props.onUpdateClue(this.selectedParent.r, this.selectedParent.c, direction, value);
    this.props.onChange();
  };

  /**
   * Triggers the autofill action for the grid.
   */
  handleAutofill = () => {
    this.props.onAutofill();
  };

  /**
   * Triggers the publish action for the puzzle.
   */
  handlePublish = () => {
    this.props.onPublish();
  };

  /**
   * Handles the change in the number of rows in the grid.
   * @param {Event} event - The input change event.
   */
  handleChangeRows = (event) => {
    this.props.onChangeRows(event.target.value);
  };

  /**
   * Handles the change in the number of columns in the grid.
   * @param {Event} event - The input change event.
   */
  handleChangeColumns = (event) => {
    this.props.onChangeColumns(event.target.value);
  };

  /**
   * Handles clearing all pencil marks from the grid.
   */
  handleClearPencil = () => {
    this.props.onClearPencil();
  };

  /**
   * Toggles the frozen state of the grid.
   * When frozen, the grid cannot be edited.
   */
  handleToggleFreeze = () => {
    this.setState((prevState) => ({
      frozen: !prevState.frozen,
    }));
  };

  /* Helper functions used when rendering */

  /**
   * Checks if the currently selected cell is white (not a black square).
   * @returns {boolean} True if the selected cell is white, false otherwise.
   */
  get selectedIsWhite() {
    const {selected} = this.state;
    return this.grid.isWhite(selected.r, selected.c);
  }

  /**
   * Generates the clue bar abbreviation (e.g., "1A" for 1-Across).
   * @returns {string|undefined} The clue abbreviation or undefined if not applicable.
   */
  get clueBarAbbreviation() {
    const {direction} = this.state;
    if (!this.selectedIsWhite) return undefined;
    if (!this.selectedClueNumber) return undefined;
    return this.selectedClueNumber + direction.substr(0, 1).toUpperCase();
  }

  /**
   * Gets the clue number for the currently selected cell and direction.
   * @returns {number|undefined} The clue number or undefined if not applicable.
   */
  get selectedClueNumber() {
    const {selected, direction} = this.state;
    if (!this.selectedIsWhite) return undefined;
    return this.grid.getParent(selected.r, selected.c, direction);
  }

  /**
   * Gets the clue number for the currently selected cell in the opposite direction.
   * @returns {number|undefined} The clue number or undefined if not applicable.
   */
  get halfSelectedClueNumber() {
    const {selected, direction} = this.state;
    if (!this.selectedIsWhite) return undefined;
    return this.grid.getParent(selected.r, selected.c, gameUtils.getOppositeDirection(direction));
  }

  /**
   * Gets the parent cell (first cell of the current clue) for the selected clue.
   * @returns {Object|undefined} The parent cell object or undefined if not applicable.
   */
  get selectedParent() {
    if (!this.selectedIsWhite) return undefined;
    return this.grid.getCellByNumber(this.selectedClueNumber);
  }

  /**
   * Checks if a clue is completely filled.
   * @param {string} direction - The direction of the clue ('across' or 'down').
   * @param {number} number - The clue number.
   * @returns {boolean} True if the clue is filled, false otherwise.
   */
  isClueFilled(direction, number) {
    const clueRoot = this.grid.getCellByNumber(number);
    return !this.grid.hasEmptyCells(clueRoot.r, clueRoot.c, direction);
  }

  /**
   * Checks if a clue is currently selected.
   * @param {string} direction - The direction of the clue ('across' or 'down').
   * @param {number} number - The clue number.
   * @returns {boolean} True if the clue is selected, false otherwise.
   */
  isClueSelected(direction, number) {
    return direction === this.state.direction && number === this.selectedClueNumber;
  }

  /**
   * Checks if a clue is half-selected (selected in the opposite direction).
   * @param {string} direction - The direction of the clue ('across' or 'down').
   * @param {number} number - The clue number.
   * @returns {boolean} True if the clue is half-selected, false otherwise.
   */
  isClueHalfSelected(direction, number) {
    return direction !== this.state.direction && number === this.halfSelectedClueNumber;
  }

  /**
   * Checks if a cell should be highlighted (part of the current clue but not selected).
   * @param {number} r - The row of the cell.
   * @param {number} c - The column of the cell.
   * @returns {boolean} True if the cell should be highlighted, false otherwise.
   */
  isHighlighted(r, c) {
    const {selected, direction} = this.state;
    const selectedParent = this.grid.getParent(selected.r, selected.c, direction);
    return (
      !this.isSelected(r, c) &&
      this.grid.isWhite(r, c) &&
      this.grid.getParent(r, c, direction) === selectedParent
    );
  }

  /**
   * Checks if a cell is currently selected.
   * @param {number} r - The row of the cell.
   * @param {number} c - The column of the cell.
   * @returns {boolean} True if the cell is selected, false otherwise.
   */
  isSelected(r, c) {
    const {selected} = this.state;
    return r === selected.r && c === selected.c;
  }

  /* Misc functions */

  /**
   * Scrolls to the specified clue in the clue list.
   * Interacts directly with the DOM and is very slow -- use with care.
   * @param {string} dir - The direction of the clue ('across' or 'down').
   * @param {number} num - The clue number.
   * @param {HTMLElement} el - The DOM element of the clue.
   */
  scrollToClue(dir, num, el) {
    if (el && this.prvNum[dir] !== num) {
      this.prvNum[dir] = num;
      if (this.prvIdleID[dir]) {
        cancelIdleCallback(this.prvIdleID[dir]);
      }
      this.prvIdleID[dir] = requestIdleCallback(() => {
        if (this.clueScroll === el.offsetTop) return;
        const parent = el.offsetParent;
        parent.scrollTop = el.offsetTop - parent.offsetHeight * 0.4;
        this.clueScroll = el.offsetTop;
      });
    }
  }

  /**
   * Focuses the grid controls.
   */
  focusGrid() {
    this.refs.gridControls && this.refs.gridControls.focus();
  }

  /**
   * Focuses the clue input.
   */
  focusClue() {
    this.refs.clue && this.refs.clue.focus();
  }

  /**
   * Focuses the editor, which by default focuses the grid.
   */
  focus() {
    this.focusGrid();
  }

  /* Render */

  /**
   * Renders the left side of the editor, including the clue bar, grid, and control buttons.
   * @returns {JSX.Element} The rendered left side of the editor.
   */
  renderLeft() {
    const {selected, direction} = this.state;
    return (
      <div className="editor--main--left">
        <div className="editor--main--clue-bar">
          <div className="editor--main--clue-bar--number">{this.clueBarAbbreviation}</div>
          <div className="editor--main--clue-bar--text">
            <EditableSpan
              ref="clue"
              key_={`${direction}${this.selectedClueNumber}`}
              value={this.props.clues[direction][this.selectedClueNumber] || ''}
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
            editMode
            cellStyle={{}}
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
              defaultValue={this.grid.size}
              onChange={this.handleChangeRows}
            />
          </Flex>
          <Flex className="editor--grid-size">{'Columns: '}</Flex>
          <Flex className="editor--grid-size">
            <input
              className="editor--input"
              type="number"
              defaultValue={this.grid.size}
              onChange={this.handleChangeColumns}
            />
          </Flex>
        </Flex>
      </div>
    );
  }

  /**
   * Renders the clue list for a given direction.
   * @param {string} dir - The direction of the clues ('across' or 'down').
   * @returns {JSX.Element[]} An array of rendered clue elements.
   */
  renderClueList(dir) {
    return this.props.clues[dir].map(
      (clue, i) =>
        clue !== undefined && (
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
            ref={
              this.isClueSelected(dir, i) || this.isClueHalfSelected(dir, i)
                ? this.scrollToClue.bind(this, dir, i)
                : null
            }
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
        )
    );
  }

  /**
   * Renders the entire Editor component.
   * @returns {JSX.Element} The rendered Editor component.
   */
  render() {
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
                  ['across', 'down'].map((dir, i) => (
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
