import GridControls from './GridControls';

export default class ListViewControls extends GridControls {
  actions: {[key: string]: (shiftKey?: boolean) => void} = {
    left: () => this.moveToPreviousCell(),
    up: () => this.selectPreviousClue(),
    down: (shiftKey?: boolean) => this.selectNextClue(shiftKey || false),
    right: () => this.moveToNextCell(),
    forward: (shiftKey?: boolean) => this.selectNextClue(shiftKey || false),
    backward: () => this.selectPreviousClue(),
    home: () => this.moveToEdge(true),
    end: () => this.moveToEdge(false),
    backspace: (shiftKey?: boolean) => this.backspace(!!shiftKey),
    delete: () => this.delete(),
    tab: (shiftKey?: boolean) => this.selectNextClue(shiftKey || false),
    space: () => this.flipDirection(),
  };

  moveToNextCell() {
    const {r, c} = this.props.selected;
    const nextCell = this.grid.getNextCell(r, c, this.props.direction);
    if (nextCell) {
      this.setSelected(nextCell);
      return nextCell;
    }
    this.selectNextClue(false);
  }

  moveToPreviousCell() {
    const {r, c} = this.props.selected;
    const previousCell = this.grid.getPreviousCell(r, c, this.props.direction);
    if (previousCell) {
      this.setSelected(previousCell);
      return previousCell;
    }
    this.selectPreviousClue();
  }

  selectPreviousClue() {
    this.selectNextClue(true);
  }

  backspace(shouldStay: any): void {
    if (!this.delete() && !shouldStay) {
      const cell = this.moveToPreviousCell();
      if (cell) {
        this.props.updateGrid(cell.r, cell.c, '');
      }
    }
  }
}
