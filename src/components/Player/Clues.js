import './css/clues.css';
import React, { useState } from 'react';
import ClueText from './ClueText';

const Clues = ({
  clues,
  clueLengths,
  isClueSelected,
  isClueHalfSelected,
  isClueFilled,
  scrollToClue,
  selectClue,
}) => {
  const [showClueLengths, setShowClueLengths] = useState(false);

  const toggleShowClueLengths = () => {
    setShowClueLengths(!showClueLengths);
  };

  return (
    <div className="clues">
      <div
        className="clues--secret"
        onClick={toggleShowClueLengths}
        title={showClueLengths ? '' : 'Show lengths'}
      />
      {
        // Clues component
        ['across', 'down'].map((dir, i) => (
          <div key={i} className="clues--list">
            <div className="clues--list--title">{dir.toUpperCase()}</div>

            <div className={`clues--list--scroll ${dir}`}>
              {clues[dir].map(
                (clue, i) =>
                  clue && (
                    <div
                      key={i}
                      className={`${
                        (isClueSelected(dir, i) ? 'selected ' : ' ') +
                        (isClueHalfSelected(dir, i) ? 'half-selected ' : ' ') +
                        (isClueFilled(dir, i) ? 'complete ' : ' ')
                      }clues--list--scroll--clue`}
                      ref={
                        isClueSelected(dir, i) || isClueHalfSelected(dir, i)
                          ? (el) => scrollToClue(dir, i, el)
                          : null
                      }
                      onClick={() => selectClue(dir, i)}
                    >
                      <div className="clues--list--scroll--clue--number">{i}</div>
                      <div className="clues--list--scroll--clue--text">
                        <ClueText text={clue} />
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
};

export default Clues;
