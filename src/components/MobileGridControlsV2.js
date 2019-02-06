import './css/mobileGridControls.css';

import React from 'react';
import Flex from 'react-flexview';
import Clue from './ClueText';
import GridControls from './GridControls';
import MobileKeyboard from './MobileKeyboard';
import classnames from 'classnames';
import _ from 'lodash';
import GridObject from '../utils/Grid';
import * as gameUtils from '../gameUtils';
import {focusKeyboard, unfocusKeyboard} from './MobileKeyboard';

const CLUE_ANIMATION_TIME = 0.3; // in seconds

export default class MobileGridControls extends GridControls {
  constructor() {
    super();
    this.state = {
      touchingClueBar: false,
      anchors: [],
      transform: {scale: 1, translateX: 0, translateY: 0},
    };
    this.prvInput = '';
    this.zoomContainer = React.createRef();
  }

  componentDidMount() {
    focusKeyboard(this._handleKeyDown);
  }

  componentDidUpdate(prevProps) {
    if (this.state.anchors.length === 0) {
      this.fitOnScreen();
    }
    if (prevProps.selected.r !== this.props.selected.r || prevProps.selected.c !== this.props.selected.c) {
      this.fitOnScreen(true);
    }
  }

  fitOnScreen(fitCurrentClue) {
    if (!fitCurrentClue && this.state.lastFitOnScreen > Date.now() - 100) return;

    const rect = this.zoomContainer.current.getBoundingClientRect();
    let {scale, translateX, translateY} = this.state.transform;
    if (scale < 1) scale = 1;
    const minTranslateX = -rect.width * (scale - 1);
    const maxTranslateX = 0;
    const minTranslateY = -rect.height * (scale - 1);
    const maxTranslateY = 0;
    translateX = _.clamp(translateX, minTranslateX, maxTranslateX);
    translateY = _.clamp(translateY, minTranslateY, maxTranslateY);

    if (fitCurrentClue) {
      const {selected, size} = this.props;
      const posX = selected.c * size;
      const posY = selected.r * size;
      const paddingX = (rect.width - this.grid.cols * size) / 2;
      const paddingY = (rect.height - this.grid.rows * size) / 2;
      const tX = (posX + paddingX) * scale;
      const tY = (posY + paddingY) * scale;
      translateX = _.clamp(translateX, -tX, rect.width - tX - size * scale);
      translateY = _.clamp(translateY, -tY, rect.height - tY - size * scale);
    }

    this.setState({
      transform: {
        scale,
        translateX,
        translateY,
      },
      lastFitOnScreen: Date.now(),
    });
  }

  handleClueBarTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    this.setState({
      touchingClueBarCurrent: touch,
    });
  };

  handleClueBarTouchEnd = (e) => {
    e.preventDefault();
    const clueBarGesture = this.clueBarGesture;
    let stateUpdates = {
      touchingClueBarStart: null,
      touchingClueBarCurrent: null,
    };

    if (!this.previewClue) {
      // nothing to do if cannot perform action :|
    } else if (Math.abs(clueBarGesture.x) > 50) {
      this.selectNextClue(clueBarGesture.x > 0);
      stateUpdates = {
        ...stateUpdates,
        previousGesture: {
          x: clueBarGesture.x > 0 ? 1 : -1,
        },
        previousClue: this.mainClue,
      };
    } else if (!clueBarGesture.x) {
      this.flipDirection();
      stateUpdates = {
        ...stateUpdates,
        previousGesture: {
          y: clueBarGesture.y > 0 ? 1 : -1,
        },
        previousClue: this.mainClue,
      };
    }
    this.setState(stateUpdates);
  };

  handleClueBarTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    this.setState({
      touchingClueBarStart: touch,
      touchingClueBarCurrent: touch,
      previousGesture: null,
    });
  };

  handleTouchStart = (e) => {
    console.log('touch start', e.touches.length);
    if (e.touches.length === 2) {
      this.props.onSetCursorLock(true);
    }
    this.handleTouchMove(e);
  };

  handleTouchMove = (e) => {
    e.preventDefault(); // annoying -- https://www.chromestatus.com/features/5093566007214080
    e.stopPropagation();

    const transform = this.state.transform;
    const rect = this.zoomContainer.current.getBoundingClientRect();
    const previousAnchors = e.touches.length >= this.state.anchors.length && this.state.anchors;
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
    const dbgstr = JSON.stringify(_.map(anchors, ({touchPosition}) => touchPosition), null, 2);
    this.setState({
      anchors,
      transform: this.getTransform(anchors, transform),
      dbgstr,
    });
  };

  handleTouchEnd = (e) => {
    console.log('touch end', e.touches.length);
    if (e.touches.length === 0 && this.state.anchors.length === 1) {
      this.props.onSetCursorLock(false);
    }
    e.preventDefault();
    this.handleTouchMove(e);
  };

  handleRightArrowTouchEnd = (e) => {
    if (this.props.direction === 'across') {
      this.handleAction('right');
    } else {
      this.handleAction('down');
    }
  };

  handleLeftArrowTouchEnd = (e) => {
    if (this.props.direction === 'across') {
      this.handleAction('left');
    } else {
      this.handleAction('up');
    }
  };

  getTransform(anchors, {scale, translateX, translateY}) {
    const getCenterAndDistance = (point1, point2) => {
      if (!point1) {
        return {
          center: {x: 1, y: 1},
          distance: 1,
        };
      }
      if (!point2) {
        return {
          center: point1,
          distance: 1,
        };
      }
      return {
        center: {
          x: (point1.x + point2.x) / 2,
          y: (point1.y + point2.y) / 2,
        },
        distance: Math.sqrt(
          (point1.x - point2.x) * (point1.x - point2.x) + (point1.y - point2.y) * (point1.y - point2.y)
        ),
      };
    };
    const {center: pixelCenter, distance: pixelDistance} = getCenterAndDistance(
      ..._.map(anchors, ({pixelPosition}) => pixelPosition)
    );
    const {center: touchCenter, distance: touchDistance} = getCenterAndDistance(
      ..._.map(anchors, ({touchPosition}) => touchPosition)
    );
    if (anchors.length >= 2) {
      scale = touchDistance / pixelDistance;
    }

    if (anchors.length >= 1) {
      translateX = touchCenter.x - scale * pixelCenter.x;
      translateY = touchCenter.y - scale * pixelCenter.y;
    }

    return {
      scale,
      translateX,
      translateY,
    };
  }

  get grid() {
    return new GridObject(this.props.grid);
  }

  getClueAbbreviation({clueNumber = '', direction = ''} = {}) {
    return `${clueNumber}${direction.substring(0, 1).toUpperCase()}`;
  }

  getClueText({clueNumber = '', direction = ''} = {}) {
    return this.props.clues[direction][clueNumber];
  }

  get mainClue() {
    if (this.previousGesture) {
      return this.state.previousClue;
    } else {
      return {clueNumber: this.getSelectedClueNumber(), direction: this.props.direction};
    }
  }

  get previewClue() {
    const clueNumber = this.getSelectedClueNumber();
    if (this.previousGesture) {
      return {clueNumber, direction: this.props.direction};
    } else {
      const {x} = this.clueBarGesture;
      if (x) {
        return this.grid.getNextClue(clueNumber, this.props.direction, this.props.clues, x > 0);
      } else {
        const oppositeDirection = gameUtils.getOppositeDirection(this.props.direction);
        if (this.canSetDirection(oppositeDirection)) {
          const oppositeClueNumber = this.grid.getParent(
            this.props.selected.r,
            this.props.selected.c,
            oppositeDirection
          );
          return {direction: oppositeDirection, clueNumber: oppositeClueNumber};
        } else {
          return; // cannot preview this clue
        }
      }
    }
  }

  get clueBarGesture() {
    const {touchingClueBarStart, touchingClueBarCurrent} = this.state;
    if (!touchingClueBarStart || !touchingClueBarCurrent) return {};
    const x = touchingClueBarCurrent.pageX - touchingClueBarStart.pageX;
    const y = _.clamp(1.7 * (touchingClueBarCurrent.pageY - touchingClueBarStart.pageY), -62, 62);
    return Math.max(Math.abs(x), Math.abs(y)) > 10 ? (Math.abs(x) > Math.abs(y) ? {x} : {y}) : {y: 0};
  }

  get previousGesture() {
    return this.state.previousGesture;
  }

  renderGridContent() {
    const {scale, translateX, translateY} = this.state.transform;
    const style = {
      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
      transition: this.state.anchors.length === 0 ? '.3s transform ease-out' : '',
    };
    return (
      <Flex
        grow={1}
        shrink={1}
        basis={1}
        className="mobile-grid-controls--grid-content"
        onTouchStart={this.handleTouchStart}
        onTouchMove={this.handleTouchMove}
        onTouchEnd={this.handleTouchEnd}
      >
        <div
          style={{display: 'flex', flexGrow: 1}}
          className="mobile-grid-controls--zoom-container"
          ref={this.zoomContainer}
        >
          <Flex grow={1} className="mobile-grid-controls--zoom-content" style={style}>
            {this.props.children}
          </Flex>
        </div>
      </Flex>
    );
  }

  renderClueBar() {
    const {x, y} = this.clueBarGesture;

    const {x: px = 0, y: py = 0} = this.previousGesture || {};
    const X = px || x;
    const Y = py || y;
    const style = {
      flexDirection: X > 0 ? 'row-reverse' : X < 0 ? 'row' : Y >= 0 ? 'column-reverse' : 'column',
      [X ? 'width' : 'height']: '200%',
      transform: px || py ? `translate(${px * 50}%, ${py * 50}%)` : `translate(${x || 0}px, ${y || 0}px)`,
      left: X > 0 ? '-100%' : 0,
      top: Y >= 0 ? '-100%' : 0,
      transition: x === undefined && y === undefined ? `${CLUE_ANIMATION_TIME}s transform ease-out` : '',
    };
    return (
      <Flex className="mobile-grid-controls--clue-bar-container">
        <div className="mobile-grid-controls--intra-clue left" onTouchEnd={this.handleLeftArrowTouchEnd}>
          {'<'}
        </div>
        <Flex
          grow={1}
          vAlignContent="center"
          className={classnames('mobile-grid-controls--clue-bar', {touching: this.state.touchingClueBar})}
          onTouchStart={this.handleClueBarTouchStart}
          onTouchEnd={this.handleClueBarTouchEnd}
          onTouchMove={this.handleClueBarTouchMove}
        >
          <div className="mobile-grid-controls--clue-bar--clues--container" style={style}>
            <div className="mobile-grid-controls--clue-bar--main">
              <div className="mobile-grid-controls--clue-bar--number">
                <Clue text={this.getClueAbbreviation(this.mainClue)} />
              </div>
              <Flex className="mobile-grid-controls--clue-bar--text" grow={1}>
                <Clue text={this.getClueText(this.mainClue)} />
              </Flex>
            </div>
            <div className="mobile-grid-controls--clue-bar--preview">
              <div className="mobile-grid-controls--clue-bar--number">
                <Clue text={this.getClueAbbreviation(this.previewClue)} />
              </div>
              <Flex className="mobile-grid-controls--clue-bar--text" grow={1}>
                <Clue text={this.getClueText(this.previewClue)} />
              </Flex>
            </div>
          </div>
        </Flex>
        <div
          className="mobile-grid-controls--intra-clue left"
          onTouchStart={this.handleRightArrowTouchStart}
          onTouchEnd={this.handleRightArrowTouchEnd}
        >
          {'>'}
        </div>
      </Flex>
    );
  }

  renderMobileKeyboard() {
    return (
      <Flex className="mobile-grid-controls--keyboard">
        <MobileKeyboard />
      </Flex>
    );
  }

  render() {
    return (
      <div ref="gridControls" className="mobile-grid-controls">
        {this.renderGridContent()}
        {this.renderClueBar()}
        {this.renderMobileKeyboard()}
        {/*this.state.dbgstr*/}
      </div>
    );
  }
}
