import React from 'react';
import type { Team, Scorecard } from '../types/golf';
import { getScoreType } from '../utils/scoreCalculator';
import './TeamScorecardTable.css';

interface TeamScorecardTableProps {
  teams: Team[];
  scorecards: Scorecard[];
}

// 표준 18홀 파 정보
const standardPars = [4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5];

const TeamScorecardTable: React.FC<TeamScorecardTableProps> = ({ teams, scorecards }) => {
  // 플레이어 이름 가져오기
  const getPlayerName = (playerId: string, teamId: string): string => {
    const team = teams.find(t => t.id === teamId);
    const player = team?.players.find(p => p.id === playerId);
    return player?.name || '알 수 없음';
  };

  // 스코어카드에서 플레이어 이름 추출
  const getPlayerNameFromScorecard = (scorecard: Scorecard): string => {
    if (scorecard.holes.length > 0) {
      return getPlayerName(scorecard.holes[0].playerId, scorecard.teamId);
    }
    return '알 수 없음';
  };

  return (
    <div className="team-scorecard-table">
      <div className="table-container">
        <table className="scorecard-table">
          <thead>
            <tr>
              <th className="team-header">팀</th>
              <th className="player-header">플레이어</th>
              {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => (
                <th key={hole} className={`hole-header ${hole === 9 ? 'front-nine-last' : hole === 18 ? 'back-nine-last' : ''}`}>
                  <div className="hole-info">
                    <div className="hole-number">{hole}</div>
                    <div className="par-number">Par {standardPars[hole - 1]}</div>
                  </div>
                </th>
              ))}
              <th className="total-header">전반</th>
              <th className="total-header">후반</th>
              <th className="final-total-header">합계</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => {
              const teamScorecards = scorecards.filter(sc => sc.teamId === team.id);
              
              return teamScorecards.map((scorecard, index) => {
                const player = team.players.find(p => scorecard.holes.some(h => h.playerId === p.id));
                const playerName = player ? player.name : getPlayerNameFromScorecard(scorecard);
                
                // 홀별 스코어 배열 생성
                const holeScores = Array.from({ length: 18 }, (_, i) => {
                  const hole = i + 1;
                  const holeScore = scorecard.holes.find(h => h.hole === hole);
                  return holeScore;
                });

                // 전반/후반/총합 계산
                const frontNine = holeScores.slice(0, 9).reduce((sum, score) => sum + (score?.score || 0), 0);
                const backNine = holeScores.slice(9, 18).reduce((sum, score) => sum + (score?.score || 0), 0);
                const total = frontNine + backNine;
                
                const frontNinePar = standardPars.slice(0, 9).reduce((sum, par) => sum + par, 0);
                const backNinePar = standardPars.slice(9, 18).reduce((sum, par) => sum + par, 0);
                const totalPar = frontNinePar + backNinePar;

                return (
                  <tr key={scorecard.id} className={index === 0 ? 'first-team-row' : 'additional-player-row'}>
                    <td className="team-name-cell">
                      {index === 0 && (
                        <span className="team-name">{team.name}</span>
                      )}
                    </td>
                    <td className="player-name-cell">{playerName}</td>
                    {holeScores.map((holeScore, holeIndex) => (
                      <td key={holeIndex + 1} className={`score-cell ${holeIndex === 8 ? 'front-nine-last' : holeIndex === 17 ? 'back-nine-last' : ''}`}>
                        {holeScore ? (
                          <span className={`score ${getScoreType(holeScore.score, holeScore.par)}`}>
                            {holeScore.score}
                          </span>
                        ) : (
                          <span className="no-score">-</span>
                        )}
                      </td>
                    ))}
                    <td className="subtotal-cell">
                      <div className="subtotal-score">{frontNine}</div>
                      <div className="subtotal-par">({frontNine - frontNinePar > 0 ? '+' : ''}{frontNine - frontNinePar})</div>
                    </td>
                    <td className="subtotal-cell">
                      <div className="subtotal-score">{backNine}</div>
                      <div className="subtotal-par">({backNine - backNinePar > 0 ? '+' : ''}{backNine - backNinePar})</div>
                    </td>
                    <td className="final-total-cell">
                      <div className="final-total">{total}</div>
                      <div className="final-par">({total - totalPar > 0 ? '+' : ''}{total - totalPar})</div>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamScorecardTable;
