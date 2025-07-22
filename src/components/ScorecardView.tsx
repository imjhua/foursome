import React from 'react';
import type { Scorecard, Team } from '../types/golf';
import { getScoreType } from '../utils/scoreCalculator';
import './ScorecardView.css';

interface ScorecardViewProps {
  scorecard: Scorecard;
  team: Team;
}

const ScorecardView: React.FC<ScorecardViewProps> = ({ scorecard, team }) => {
  // 홀별로 그룹화
  const groupedByHole = scorecard.holes.reduce((acc, hole) => {
    if (!acc[hole.hole]) {
      acc[hole.hole] = [];
    }
    acc[hole.hole].push(hole);
    return acc;
  }, {} as { [hole: number]: typeof scorecard.holes });

  const getScoreClass = (score: number, par: number): string => {
    const type = getScoreType(score, par);
    return `score-${type}`;
  };

  return (
    <div className="scorecard">
      <div className="scorecard-header">
        <h3>{team.name}</h3>
        <p className="round-date">{scorecard.roundDate}</p>
      </div>
      
      <div className="scorecard-table">
        <table>
          <thead>
            <tr>
              <th>홀</th>
              <th>파</th>
              {team.players.map(player => (
                <th key={player.id}>{player.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedByHole)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([hole, scores]) => (
                <tr key={hole}>
                  <td className="hole-number">{hole}</td>
                  <td className={`par par-${scores[0].par}`}>Par {scores[0].par}</td>
                  {scores.map((score, idx) => (
                    <td key={idx} className={getScoreClass(score.score, score.par)}>
                      {score.score}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScorecardView;
