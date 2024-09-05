// Import necessary styles and dependencies
import './css/clues.css';
import React, {Component} from 'react';
import ClueText from './ClueText';

// Clues component for displaying crossword puzzle clues
export default class Clues extends Component {
  constructor() {
    super();
    // Initialize state with showClueLengths set to false
    this.state = {
      showClueLengths: false,
    };
    // Bind the toggleShowClueLengths method to the component instance
    this._toggleShowClueLengths = this.toggleShowClueLengths.bind(this);
  }

  // Method to toggle the display of clue lengths
  toggleShowClueLengths() {
    const {showClueLengths} = this.state;
    // Update state with the opposite of current showClueLengths value
    this.setState({showClueLengths: !showClueLengths});
  }

  render() {
    // Destructure props for easier access
    const {
      clues,
      clueLengths,
      isClueSelected,
      isClueHalfSelected,
      isClueFilled,
      scrollToClue,
      selectClue,
    } = this.props;
    // Get showClueLengths from state
    const {showClueLengths} = this.state;

    return (
      <div className="clues">
        {/* Secret button to toggle clue lengths display */}
        <div
          className="clues--secret"
          onClick={this._toggleShowClueLengths}
          title={showClueLengths ? '' : 'Show lengths'}
        />
        {
          // Render clues for 'across' and 'down' directions
          ['across', 'down'].map((dir, i) => (
            <div key={i} className="clues--list">
              {/* Display the direction title (ACROSS or DOWN) */}
              <div className="clues--list--title">{dir.toUpperCase()}</div>

              {/* Scrollable container for clues */}
              <div className={`clues--list--scroll ${dir}`} ref={`clues--list--${dir}`}>
                {/* Map through clues for the current direction */}
                {clues[dir].map(
                  (clue, i) =>
                    clue && (
                      <div
                        key={i}
                        // Apply CSS classes based on clue state (selected, half-selected, complete)
                        className={`${
                          (isClueSelected(dir, i) ? 'selected ' : ' ') +
                          (isClueHalfSelected(dir, i) ? 'half-selected ' : ' ') +
                          (isClueFilled(dir, i) ? 'complete ' : ' ')
                        }clues--list--scroll--clue`}
                        // Set ref for scrolling to selected or half-selected clues
                        ref={
                          isClueSelected(dir, i) || isClueHalfSelected(dir, i)
                            ? scrollToClue.bind(this, dir, i)
                            : null
                        }
                        // Handle click event to select the clue
                        onClick={selectClue.bind(this, dir, i)}
                      >
                        {/* Display clue number */}
                        <div className="clues--list--scroll--clue--number">{i}</div>
                        <div className="clues--list--scroll--clue--text">
                          {/* Render clue text using ClueText component */}
                          <ClueText text={clue} />
                          {/* Conditionally render clue length if showClueLengths is true */}
                          {showClueLengths ? (
                            <span className="clues--list--scroll--clue--hint">
                              {'  '}({clueLengths[dir][i]})
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          ))
        }
      </div>
    );
  }
}
