import _ from 'lodash';
import MobileGridControls from './MobileGridControls';

export default class MobileListViewControls extends MobileGridControls {
  actions: {[key: string]: (shiftKey?: boolean) => void} = {
    left: () => this.moveToPreviousCell(),
    up: () => this.selectPreviousClue(),
    down: (shiftKey?: boolean) => this.selectNextClue(shiftKey || false),
    right: () => this.moveToNextCell(),
    forward: (shiftKey?: boolean) => this.selectNextClue(shiftKey || false),
    backward: () => this.selectPreviousClue(),
    backspace: (shiftKey?: boolean) => this.backspace(!!shiftKey),
    home: () => this.moveToEdge(true),
    end: () => this.moveToEdge(false),
    delete: () => this.delete(),
    tab: (shiftKey?: boolean) => this.selectNextClue(shiftKey || false),
    space: () => this.flipDirection(),
  };

  moveToNextCell(): void {
    const {r, c} = this.props.selected;
    const nextCell = this.grid.getNextCell(r, c, this.props.direction);
    if (nextCell) {
      this.setSelected(nextCell);
      return;
    }
    this.selectNextClue(false);
  }

  moveToPreviousCell(): void {
    const {r, c} = this.props.selected;
    const previousCell = this.grid.getPreviousCell(r, c, this.props.direction);
    if (previousCell) {
      this.setSelected(previousCell);
      return;
    }
    this.selectPreviousClue();
  }

  selectPreviousClue(): void {
    this.selectNextClue(true);
  }

  backspace(shouldStay: boolean): void {
    if (!this.delete() && !shouldStay) {
      this.moveToPreviousCell();
      const {r, c} = this.props.selected;
      this.props.updateGrid(r, c, '');
    }
  }

  handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    const transform = this.state.transform;
    const rect = this.zoomContainer.current?.getBoundingClientRect();
    if (!rect) return;

    const previousAnchors = e.touches.length >= this.state.anchors.length ? this.state.anchors : [];
    const anchors = _.map(e.touches, ({pageX, pageY}, i) => {
      const x = pageX - rect.x;
      const y = pageY - rect.y;
      return {
        pixelPosition: {
          x: (x - transform.translateX) / transform.scale,
          y: (y - transform.translateY) / transform.scale,
        },
        ...(previousAnchors[i] || {}),
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
