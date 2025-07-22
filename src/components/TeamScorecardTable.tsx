import React from 'react';
import type { Team, Scorecard } from '../types/golf';
import { getScoreType, calculateTeamTotals } from '../utils/scoreCalculator';
import './TeamScorecardTable.css';

interface TeamScorecardTableProps {
  teams: Team[];
  scorecards: Scorecard[];
}

const TeamScorecardTable: React.FC<TeamScorecardTableProps> = ({ teams, scorecards }) => {
  const teamTotals = calculateTeamTotals(scorecards, teams);
  
  // 실제 파 정보를 스코어카드에서 추출
  const getParsFromScorecards = (): number[] => {
    if (scorecards.length > 0) {
      const firstScorecard = scorecards[0];
      const pars = firstScorecard.holes.map(hole => hole.par);
      if (pars.length === 18) {
        return pars;
      }
    }
    // 기본값
    return [4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5];
  };

  const actualPars = getParsFromScorecards();
  
  // 팀명의 그룹 번호를 추출하는 함수
  const getGroupNumber = (teamName: string): number => {
    const match = teamName.match(/^(\d+)-/);
    return match ? parseInt(match[1]) : 999; // prefix가 없으면 맨 뒤로
  };

  // 그룹별로 정렬된 팀 목록
  const sortedTeams = [...teams].sort((a, b) => {
    return getGroupNumber(a.name) - getGroupNumber(b.name);
  });
  
  return (
    <div className="team-scorecard-table">
      {/* 한 줄 범례: pill + 설명 나란히 */}
      <div className="score-legend-row">
        <span className="legend-score eagle">-2</span>
        <span className="legend-label">이글 (2타 적게)</span>
        <span className="legend-score birdie">-1</span>
        <span className="legend-label">버디 (1타 적게)</span>
        <span className="legend-score par">0</span>
        <span className="legend-label">파 (기준 타수)</span>
        <span className="legend-score bogey">+1</span>
        <span className="legend-label">보기 (1타 많게)</span>
        <span className="legend-score doublepar">x2</span>
        <span className="legend-label">양파 (기준 타수 x2)</span>
      </div>
      
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
                    <div className="par-number">Par {actualPars[hole - 1]}</div>
                  </div>
                </th>
              ))}
              <th className="total-header">전반</th>
              <th className="total-header">후반</th>
              <th className="final-total-header">합계</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map(team => {
              const teamScorecards = scorecards.filter(sc => sc.teamId === team.id);
              
              // 포썸: 2명이 한 팀이지만, 각 홀마다 하나의 스코어만 기록
              const player1 = team.players[0];
              const player2 = team.players[1];
              
              // 팀 전체의 홀별 스코어 수집 (포썸에서는 홀별로 하나의 스코어)
              const teamHoleScores = Array.from({ length: 18 }, (_, i) => {
                const hole = i + 1;
                // 해당 홀에서 기록된 스코어를 찾음 (어느 플레이어든)
                for (const scorecard of teamScorecards) {
                  const holeScore = scorecard.holes.find(h => h.hole === hole);
                  if (holeScore) {
                    return holeScore;
                  }
                }
                return null;
              });

              const frontNine = teamHoleScores.slice(0, 9).reduce((sum, score) => sum + (score?.score || 0), 0);
              const backNine = teamHoleScores.slice(9, 18).reduce((sum, score) => sum + (score?.score || 0), 0);
              const total = frontNine + backNine;
              
              const frontNinePar = actualPars.slice(0, 9).reduce((sum, par) => sum + par, 0);
              const backNinePar = actualPars.slice(9, 18).reduce((sum, par) => sum + par, 0);
              const totalPar = frontNinePar + backNinePar;

              const teamRows = [];
              
              // 팀 스코어 행 (포썸에서는 하나의 행으로 충분)
              teamRows.push(
                <tr key={`${team.id}-scores`} className="team-score-row">
                  <td className="team-name-cell" rowSpan={2}>
                    <div className="team-name">{team.name}</div>
                  </td>
                  <td className="players-cell">
                    <div className="player-names">
                      <div className="player-name">{player1?.name}</div>
                      <div className="player-name">{player2?.name}</div>
                    </div>
                  </td>
                  {teamHoleScores.map((holeScore, holeIndex) => (
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

              // 팀 성과 요약 행 추가
              const teamStats = teamTotals[team.id];
              if (teamStats) {
                teamRows.push(
                  <tr key={`${team.id}-stats`} className="team-stats-row">
                    <td className="stats-label-cell" colSpan={2}>
                      <div className="team-stats-label">팀 성과</div>
                    </td>
                    <td className="stats-content-cell" colSpan={18}>
                      <div className="team-performance-stats">
                        <span className="stat-item eagle-stat">
                          <span className="stat-label">이글</span>
                          <span className="stat-count">{teamStats.eagle}</span>
                        </span>
                        <span className="stat-item birdie-stat">
                          <span className="stat-label">버디</span>
                          <span className="stat-count">{teamStats.birdie}</span>
                        </span>
                        <span className="stat-item par-stat">
                          <span className="stat-label">파</span>
                          <span className="stat-count">{teamStats.par}</span>
                        </span>
                        <span className="stat-item bogey-stat">
                          <span className="stat-label">보기</span>
                          <span className="stat-count">{teamStats.bogey}</span>
                        </span>
                        <span className="stat-item doublepar-stat">
                          <span className="stat-label">양파</span>
                          <span className="stat-count">{teamStats.doublepar}</span>
                        </span>
                      </div>
                    </td>
                    <td className="stats-empty-cell" colSpan={3}></td>
                  </tr>
                );
              }

              return teamRows;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamScorecardTable;
