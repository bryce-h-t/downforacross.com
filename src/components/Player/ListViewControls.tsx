import GridControls from './GridControls';

export default class ListViewControls extends GridControls {
  actions: Record<string, () => void> = {
    left: () => this.moveToPreviousCell(),
    up: () => this.selectPreviousClue(),
    down: () => this.selectNextClue(),
    right: () => this.moveToNextCell(),
    forward: () => this.selectNextClue(),
    backward: () => this.selectPreviousClue(),
    home: () => this.moveToEdge(true),
    end: () => this.moveToEdge(false),
    backspace: () => this.backspace(),
    delete: () => this.delete(),
    tab: () => this.selectNextClue(),
    space: () => this.flipDirection(),
  };

  moveToNextCell() {
    const {r, c} = this.props.selected;
    const nextCell = this.grid.getNextCell(r, c, this.props.direction);
    if (nextCell) {
      this.setSelected(nextCell);
      return nextCell;
    }
    this.selectNextClue();
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

  backspace(): void {
    if (!this.delete()) {
      const cell = this.moveToPreviousCell();
      if (cell) {
        this.props.updateGrid(cell.r, cell.c, '');
      }
    }
  }
}
