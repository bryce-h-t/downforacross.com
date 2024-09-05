/* eslint react/no-string-refs: "warn", no-plusplus: "off" */
import './css/gridControls.css';

import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';

import GridObject from '../../lib/wrappers/GridWrapper';

function safe_while(condition, step, cap = 500) {
  while (condition() && cap >= 0) {
    step();
    cap -= 1;
  }
}

export default function GridControls(props) {
  const inputRef = useRef(null);
  const nextTime = useRef(null);

  const grid = new GridObject(props.grid);

  const getSelectedClueNumber = () => {
    return grid.getParent(props.selected.r, props.selected.c, props.direction);
  };

  useEffect(() => {
    focus();
  }, []);

  const selectNextClue = useCallback(
    (backwards, parallel = false) => {
      const {direction, clueNumber} = grid.getNextClue(
        getSelectedClueNumber(),
        props.direction,
        props.clues,
        backwards,
        parallel
      );

      selectClue(direction, clueNumber);
    },
    [props.direction, props.clues, props.selected]
  );

  const selectClue = useCallback((direction, number) => {
    setDirection(direction);
    const clueRoot = grid.getCellByNumber(number);
    const firstEmptyCell = grid.getNextEmptyCell(clueRoot.r, clueRoot.c, direction);
    setSelected(firstEmptyCell || clueRoot);
  }, []);

  const isSelectable = useCallback(
    (r, c) => {
      return props.editMode || grid.isWhite(r, c);
    },
    [props.editMode]
  );

  const flipDirection = useCallback(() => {
    if (props.direction === 'across') {
      if (canSetDirection('down')) {
        setDirection('down');
      }
    } else if (canSetDirection('across')) {
      setDirection('across');
    }
  }, [props.direction, canSetDirection, setDirection]);

  const moveSelectedBy = useCallback(
    (dr, dc) => {
      return () => {
        const {selected} = props;
        let {r, c} = selected;
        const step = () => {
          r += dr;
          c += dc;
        };
        step();
        safe_while(() => grid.isInBounds(r, c) && !isSelectable(r, c), step);
        if (grid.isInBounds(r, c)) {
          setSelected({r, c});
        }
      };
    },
    [props.selected, isSelectable, setSelected]
  );

  const moveSelectedUsingDirection = useCallback(
    (d) => {
      return () => {
        const [dr, dc] = props.direction === 'down' ? [0, d] : [d, 0];
        return moveSelectedBy(dr, dc)();
      };
    },
    [props.direction, moveSelectedBy]
  );

  const moveToEdge = useCallback(
    (start) => {
      return () => {
        const {selected, direction} = props;
        let {r, c} = selected;
        ({r, c} = grid.getEdge(r, c, direction, start));
        if (grid.isInBounds(r, c)) {
          setSelected({r, c});
        }
      };
    },
    [props, setSelected]
  );

  const actions = useMemo(
    () => ({
      left: setDirectionWithCallback('across', moveSelectedBy(0, -1)),
      up: setDirectionWithCallback('down', moveSelectedBy(-1, 0)),
      down: setDirectionWithCallback('down', moveSelectedBy(1, 0)),
      right: setDirectionWithCallback('across', moveSelectedBy(0, 1)),
      forward: moveSelectedUsingDirection(1),
      backward: moveSelectedUsingDirection(-1),
      home: moveToEdge(true),
      end: moveToEdge(false),
      backspace: backspace,
      delete: deleteCell,
      tab: selectNextClue,
      space: flipDirection,
    }),
    [
      setDirectionWithCallback,
      moveSelectedBy,
      moveSelectedUsingDirection,
      moveToEdge,
      backspace,
      deleteCell,
      selectNextClue,
      flipDirection,
    ]
  );

  const setDirectionWithCallback = useCallback(
    (direction, cbk) => {
      return () => {
        if (props.direction !== direction) {
          if (canSetDirection(direction)) {
            setDirection(direction);
          } else {
            cbk();
          }
        } else {
          cbk();
        }
      };
    },
    [props.direction, canSetDirection, setDirection]
  );

  // factored out handleAction for mobileGridControls
  const handleAction = useCallback(
    (action, shiftKey) => {
      if (!(action in actions)) {
        console.error('illegal action', action);
        return; // weird!
      }
      actions[action](shiftKey);
    },
    [actions]
  );

  const handleAltKey = useCallback(
    (key, shiftKey) => {
      key = key.toLowerCase();
      const altAction = shiftKey ? props.onReveal : props.onCheck;
      if (key === 's') {
        altAction('square');
      }
      if (key === 'w') {
        altAction('word');
      }
      if (key === 'p') {
        altAction('puzzle');
      }
    },
    [props.onReveal, props.onCheck]
  );

  const validLetter = useCallback((letter) => {
    const VALID_SYMBOLS = '!@#$%^&*()-+=`~/?\\'; // special theme puzzles have these sometimes;
    if (VALID_SYMBOLS.indexOf(letter) !== -1) return true;
    return letter.match(/^[A-Z0-9]$/);
  }, []);

  // takes in key, a string
  const _handleKeyDown = useCallback(
    (key, shiftKey, altKey) => {
      const actionKeys = {
        ArrowLeft: 'left',
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowRight: 'right',
        Backspace: 'backspace',
        '{del}': 'backspace',
        Delete: 'delete',
        Tab: 'tab',
        ' ': 'space',
        '[': 'backward',
        ']': 'forward',
        Home: 'home',
        End: 'end',
      };

      if (shiftKey) {
        const isAcross = props.direction === 'across';
        actionKeys[isAcross ? 'ArrowUp' : 'ArrowLeft'] = 'backward';
        actionKeys[isAcross ? 'ArrowDown' : 'ArrowRight'] = 'forward';
      }

      const {onPressEnter, onPressPeriod, onPressEscape} = props;
      if (key in actionKeys) {
        handleAction(actionKeys[key], shiftKey);
        return true;
      }
      if (key === '.') {
        onPressPeriod && onPressPeriod();
        return true;
      }
      if (key === 'Enter') {
        onPressEnter && onPressEnter();
        return true;
      }
      if (altKey) {
        handleAltKey(key, shiftKey);
        return true;
      }
      if (key === 'Escape') {
        onPressEscape && onPressEscape();
      } else if (!props.frozen) {
        const letter = key.toUpperCase();
        if (validLetter(letter)) {
          typeLetter(letter, shiftKey);
          return true;
        }
      }
    },
    [props, handleAction, handleAltKey, validLetter, typeLetter]
  );

  const _handleKeyDownVim = useCallback(
    (key, shiftKey, altKey) => {
      const actionKeys = {
        ArrowLeft: 'left',
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowRight: 'right',
        Backspace: 'backspace',
        '{del}': 'backspace',
        Delete: 'delete',
        Tab: 'tab',
        ' ': 'space',
        '[': 'backward',
        ']': 'forward',
        Home: 'home',
        End: 'end',
      };

      const normalModeActionKeys = {
        h: 'left',
        j: 'down',
        k: 'up',
        l: 'right',
        x: 'delete',
        '^': 'home',
        $: 'end',
      };

      const {onVimNormal, onVimInsert, vimInsert, onPressEnter, onPressPeriod} = props;
      if (key in actionKeys) {
        handleAction(actionKeys[key], shiftKey);
        return true;
      }
      if (altKey) {
        handleAltKey(key, shiftKey);
        return true;
      }
      if (!vimInsert) {
        if (key in normalModeActionKeys) {
          handleAction(normalModeActionKeys[key], shiftKey);
        } else if (key === 'w') {
          selectNextClue(false);
        } else if (key === 'b') {
          selectNextClue(true);
        } else if (key === 'i') {
          onVimInsert && onVimInsert();
        } else if (key === 's') {
          deleteCell();
          onVimInsert && onVimInsert();
        }
      } else if (key === '.') {
        onPressPeriod && onPressPeriod();
        return true;
      } else if (key === 'Enter') {
        onPressEnter && onPressEnter();
        return true;
      } else if (key === 'Escape') {
        onVimNormal && onVimNormal();
      } else if (vimInsert && !props.frozen) {
        const letter = key.toUpperCase();
        if (validLetter(letter)) {
          typeLetter(letter, shiftKey);
          return true;
        }
      }
    },
    [props, handleAction, handleAltKey, selectNextClue, deleteCell, validLetter, typeLetter]
  );

  const handleClick = useCallback(
    (ev) => {
      ev.preventDefault();
      focus();
    },
    [focus]
  );

  // takes in a Keyboard Event
  const handleKeyDown = useCallback(
    (ev) => {
      const {vimMode} = props;
      const handleKeyDownFunc = vimMode ? _handleKeyDownVim : _handleKeyDown;

      if (ev.target !== inputRef.current && (ev.tagName === 'INPUT' || ev.metaKey || ev.ctrlKey)) {
        return;
      }
      if (handleKeyDownFunc(ev.key, ev.shiftKey, ev.altKey)) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    },
    [props.vimMode, _handleKeyDownVim, _handleKeyDown]
  );

  const goToNextEmptyCell = useCallback(
    ({nextClueIfFilled = false} = {}) => {
      const {r, c} = props.selected;
      const nextEmptyCell = grid.getNextEmptyCell(r, c, props.direction, {
        skipFirst: true,
      });
      if (nextEmptyCell) {
        setSelected(nextEmptyCell);
        return nextEmptyCell;
      }
      const nextCell = grid.getNextCell(r, c, props.direction);
      if (nextCell) {
        setSelected(nextCell);
        return nextCell;
      }
      if (nextClueIfFilled) {
        selectNextClue();
      }
    },
    [props.selected, props.direction, grid, setSelected, selectNextClue]
  );

  const goToPreviousCell = useCallback(() => {
    let {r, c} = props.selected;
    const grid = props.grid;
    const step = () => {
      if (props.direction === 'across') {
        if (c > 0) {
          c--;
        } else {
          c = grid[0].length - 1;
          r--;
        }
      } else if (r > 0) {
        r--;
      } else {
        r = grid.length - 1;
        c--;
      }
    };
    const ok = () => grid.isInBounds(r, c) && grid.isWhite(r, c);
    step();
    safe_while(() => grid.isInBounds(r, c) && !ok(), step);
    if (ok()) {
      setSelected({r, c});
      return {r, c};
    }
  }, [props.selected, props.direction, props.grid, setSelected]);

  const typeLetter = useCallback(
    (letter, isRebus, {nextClueIfFilled} = {}) => {
      if (props.beta) {
        return typeLetterSync(letter, isRebus, {nextClueIfFilled});
      }
      if (!nextTime.current) nextTime.current = Date.now();
      setTimeout(() => {
        if (letter === '/') isRebus = true;
        const {r, c} = props.selected;
        const value = props.grid[r][c].value;
        if (!isRebus) {
          goToNextEmptyCell({nextClueIfFilled});
        }
        props.updateGrid(r, c, isRebus ? (value || '').substr(0, 10) + letter : letter);
      }, Math.max(0, nextTime.current - Date.now()));
      nextTime.current = Math.max(nextTime.current, Date.now()) + 30;
    },
    [props.beta, props.selected, props.grid, props.updateGrid, typeLetterSync, goToNextEmptyCell]
  );

  const typeLetterSync = useCallback(
    (letter, isRebus, {nextClueIfFilled} = {}) => {
      if (letter === '/') isRebus = true;
      const {r, c} = props.selected;
      const value = props.grid[r][c].value;
      if (!isRebus) {
        goToNextEmptyCell({nextClueIfFilled});
      }
      props.updateGrid(r, c, isRebus ? (value || '').substr(0, 10) + letter : letter);
    },
    [props.selected, props.grid, props.updateGrid, goToNextEmptyCell]
  );

  // Returns true if the letter was successfully deleted
  const deleteCell = useCallback(() => {
    const {r, c} = props.selected;
    if (props.grid[r][c].value !== '' && !props.grid[r][c].good) {
      props.updateGrid(r, c, '');
      return true;
    }
    return false;
  }, [props.selected, props.grid, props.updateGrid]);

  const backspace = useCallback(
    (shouldStay) => {
      if (!deleteCell() && !shouldStay) {
        const cell = goToPreviousCell();
        if (cell) {
          props.updateGrid(cell.r, cell.c, '');
        }
      }
    },
    [deleteCell, goToPreviousCell, props.updateGrid]
  );

  const isGridFilled = useCallback(() => {
    return grid.isGridFilled();
  }, [grid]);

  const setDirection = useCallback(
    (direction) => {
      props.onSetDirection(direction);
    },
    [props.onSetDirection]
  );

  const canSetDirection = useCallback(
    (direction) => {
      return props.canSetDirection(direction);
    },
    [props.canSetDirection]
  );

  const setSelected = useCallback(
    (selected) => {
      props.onSetSelected(selected);
    },
    [props.onSetSelected]
  );

  const focus = useCallback(() => {
    inputRef.current.focus({preventScroll: true});
  }, []);

  const gridProps = {
    style: {
      // Disable double-tap-to-zoom as it delays clicks by up to 300ms (to see if it becomes a double-tap)
      touchAction: 'manipulation',
    },
  };
  const inputProps = {
    style: {
      opacity: 0,
      width: 0,
      height: 0,
    },
    autoComplete: 'none',
    autoCapitalize: 'none',
  };
  return (
    <div
      className="grid-controls"
      tabIndex="1"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...gridProps}
    >
      <div className="grid--content">{props.children}</div>
      <input tabIndex={-1} name="grid" ref={inputRef} {...inputProps} />
    </div>
  );
}
