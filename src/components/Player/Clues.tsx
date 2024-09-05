import './css/clues.css';
import React, {useState, useRef, FC} from 'react';
import ClueText from './ClueText';

interface CluesProps {
  clues: {
    across: string[];
    down: string[];
  };
  clueLengths: {
    across: string[];
    down: string[];
  };
  isClueSelected: (direction: string, index: number) => boolean;
  isClueHalfSelected: (direction: string, index: number) => boolean;
  isClueFilled: (direction: string, index: number) => boolean;
  scrollToClue: (direction: string, index: number) => void;
  selectClue: (direction: string, index: number) => void;
}

type Direction = 'across' | 'down';

const Clues: FC<CluesProps> = ({
  clues,
  clueLengths,
  isClueSelected,
  isClueHalfSelected,
  isClueFilled,
  scrollToClue,
  selectClue,
}) => {
  const [showClueLengths, setShowClueLengths] = useState(false);
  const acrossRef = useRef<HTMLDivElement>(null);
  const downRef = useRef<HTMLDivElement>(null);

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
      {(['across', 'down'] as const).map((dir, i) => (
        <div key={i} className="clues--list">
          <div className="clues--list--title">{dir.toUpperCase()}</div>

          <div className={`clues--list--scroll ${dir}`} ref={dir === 'across' ? acrossRef : downRef}>
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
                        ? (el: HTMLDivElement | null) => el && scrollToClue(dir, i)
                        : undefined
                    }
                    onClick={() => selectClue(dir, i)}
                  >
                    <div className="clues--list--scroll--clue--number">{i}</div>
                    <div className="clues--list--scroll--clue--text">
                      <ClueText text={clue} />
                      {showClueLengths && (
                        <span className="clues--list--scroll--clue--hint">
                          {'  '}({clueLengths[dir][i]})
                        </span>
                      )}
                    </div>
                  </div>
                )
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Clues;
