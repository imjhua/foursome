
import React, { useState } from 'react';
import type { TeamAwardStats, Team } from '../types/golf';
import './AwardResults.css';

interface AwardResultsProps {
  awards: TeamAwardStats;
  teams: Team[];
}

const AwardResults: React.FC<AwardResultsProps> = ({ awards, teams }) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  // 모든 어워드를 통합하여 순위별로 정리 (그룹 정렬 적용)
  const createRankingData = () => {
    // 어워드 타입 목록
    const awardTypes = ['다버디상', '다파상', '다보기상', '다양파상'] as const;
    const rankings: { [rank: number]: { [key in typeof awardTypes[number]]: typeof awards.다파상 } } = {};
    // 각 어워드별로 상위 3개 점수 그룹 추출
    awardTypes.forEach(type => {
      const awardList = awards[type];
      // 점수 내림차순 정렬
      const sorted = [...awardList].sort((a, b) => b.count - a.count);
      // 상위 3개 점수 그룹 추출
      const topCounts: number[] = [];
      sorted.forEach(a => {
        if (!topCounts.includes(a.count) && topCounts.length < 3) {
          topCounts.push(a.count);
        }
      });
      topCounts.forEach((count, idx) => {
        if (!rankings[idx + 1]) {
          rankings[idx + 1] = { 다버디상: [], 다파상: [], 다보기상: [], 다양파상: [] };
        }
        rankings[idx + 1][type] = awardList.filter(a => a.count === count);
      });
    });
    return rankings;
  };

  const rankings = createRankingData();

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'rank-first';
    if (rank === 2) return 'rank-second';
    if (rank === 3) return 'rank-third';
    return 'rank-other';
  };

  const renderWinners = (winners: typeof awards.다파상) => {
    if (winners.length === 0) {
      return <span className="no-winner">-</span>;
    }

    // 같은 팀이 여러 번 나오지 않도록 팀별로 한 번만, count가 가장 높은 값으로 표시
    const teamMap = new Map<string, { teamName: string; count: number }>();
    winners.forEach(winner => {
      if (!teamMap.has(winner.teamName) || teamMap.get(winner.teamName)!.count < winner.count) {
        teamMap.set(winner.teamName, { teamName: winner.teamName, count: winner.count });
      }
    });
    const uniqueTeams = Array.from(teamMap.values());

    return (
      <div className="winners-list">
        {uniqueTeams.map((winner, idx) => (
          <div key={`${winner.teamName}-${idx}`} className="winner-item" onClick={() => {
            const team = teams.find(t => t.name === winner.teamName);
            if (team) setSelectedTeam(team);
          }} style={{ cursor: 'pointer' }}>
            <span className="team-name">{winner.teamName}</span>
            {/* 팀의 플레이어 이름 표시 */}
            <ul className="team-players">
              {(() => {
                const team = teams.find(t => t.name === winner.teamName);
                return team ? team.players.map(p => <li key={p.id}>{p.name}</li>) : null;
              })()}
            </ul>
            <span className="count-badge">{winner.count}개</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="award-results">
      <div className="results-header">
        <h2>어워드 결과</h2>
      </div>
      <div className="award-table-container">
        <table className="award-table">
          <thead>
            <tr>
              <th className="rank-column">순위</th>
              <th className="award-column birdie-column">
                <div className="award-header-content">
                  <span className="award-name">다버디상</span>
                </div>
              </th>
              <th className="award-column par-column">
                <div className="award-header-content">
                  <span className="award-name">다파상</span>
                </div>
              </th>
              <th className="award-column bogey-column">
                <div className="award-header-content">
                  <span className="award-name">다보기상</span>
                </div>
              </th>
              <th className="award-column doublepar-column">
                <div className="award-header-content">
                  <span className="award-name">다양파상</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 3 }, (_, i) => i + 1).map(rank => {
              const rankData = rankings[rank];
              const rankClass = getRankClass(rank);
              return (
                <tr key={rank} className={`award-row ${rankClass}`}>
                  <td className="rank-cell">
                    <div className="rank-badge">
                      <span className="rank-number">{rank}</span>
                      <span className="rank-suffix">위</span>
                    </div>
                  </td>
                  <td className="award-cell birdie-cell">
                    {renderWinners(rankData?.다버디상 || [])}
                  </td>
                  <td className="award-cell par-cell">
                    {renderWinners(rankData?.다파상 || [])}
                  </td>
                  <td className="award-cell bogey-cell">
                    {renderWinners(rankData?.다보기상 || [])}
                  </td>
                  <td className="award-cell doublepar-cell">
                    {renderWinners(rankData?.다양파상 || [])}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* 팀 오버레이: 선택된 팀의 플레이어 정보 */}
      {selectedTeam && (
        <div
          className="team-overlay team-overlay-modal"
          onClick={() => setSelectedTeam(null)}
        >
          <div
            className="team-overlay-content team-overlay-modal-content"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="team-overlay-modal-close"
              onClick={() => setSelectedTeam(null)}
              aria-label="닫기"
            >
              &times;
            </button>
            <h3>{selectedTeam.name}</h3>
            <ul className="team-overlay-player-list">
              {selectedTeam.players.map(p => (
                <li className="team-overlay-player-item" key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AwardResults;
