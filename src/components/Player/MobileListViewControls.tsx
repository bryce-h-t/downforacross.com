import _ from 'lodash';
import MobileGridControls from './MobileGridControls';

export default class MobileListViewControls extends MobileGridControls {
  actions: Record<string, () => void> = {
    left: () => this.moveToPreviousCell(),
    up: () => this.selectPreviousClue(),
    down: () => this.selectNextClue(),
    right: () => this.moveToNextCell(),
    forward: () => this.selectNextClue(),
    backward: () => this.selectPreviousClue(),
    backspace: () => this.backspace(),
    home: () => this.moveToEdge(true),
    end: () => this.moveToEdge(false),
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

  handleTouchMove: (e: any) => void = (e: any) => {
    const transform = this.state.transform;
    const rect = this.zoomContainer.current.getBoundingClientRect();
    const previousAnchors: any = e.touches.length >= this.state.anchors.length && this.state.anchors;
    const anchors = _.map(e.touches, ({pageX, pageY}, i) => {
      const x = pageX - rect.x;
      const y = pageY - rect.y;
      return {
        pixelPosition: {
          x: (x - transform.translateX) / transform.scale,
          y: (y - transform.translateY) / transform.scale,
        },
        ...previousAnchors[i],
        touchPosition: {x, y},
      };
    });
    const nTransform = this.getTransform(anchors, transform);
    if (nTransform) {
      this.lastTouchMove = Date.now();
    }

    this.setState({
      anchors,
      transform: nTransform ?? this.state.transform,
    });
  };
}
