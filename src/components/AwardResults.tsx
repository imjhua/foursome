
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
    const rankings: { [rank: number]: { 
      다버디상: typeof awards.다파상;
      다파상: typeof awards.다파상;
      다보기상: typeof awards.다파상;
      다양파상: typeof awards.다파상;
    }} = {};

    // 팀명의 그룹 번호를 추출하는 함수
    const getGroupNumber = (teamName: string): number => {
      const match = teamName.match(/^(\d+)-/);
      return match ? parseInt(match[1]) : 999; // prefix가 없으면 맨 뒤로
    };

    // 각 어워드별로 순위 생성 (그룹 순서로 정렬)
    const addToRankings = (awardList: typeof awards.다파상, awardType: keyof typeof rankings[1]) => {
      // 먼저 그룹 번호로 정렬
      const sortedAwards = [...awardList].sort((a, b) => {
        if (a.count !== b.count) {
          return b.count - a.count; // 개수 내림차순
        }
        return getGroupNumber(a.teamName) - getGroupNumber(b.teamName); // 그룹 번호 오름차순
      });

      let currentRank = 1;
      let prevCount = -1;

      sortedAwards.forEach((award, index) => {
        if (award.count !== prevCount) {
          currentRank = index + 1;
          prevCount = award.count;
        }
        
        if (!rankings[currentRank]) {
          rankings[currentRank] = { 다버디상: [], 다파상: [], 다보기상: [], 다양파상: [] };
        }
        
        rankings[currentRank][awardType].push(award);
      });
    };

    addToRankings(awards.다버디상, '다버디상');
    addToRankings(awards.다파상, '다파상');
    addToRankings(awards.다보기상, '다보기상');
    addToRankings(awards.다양파상, '다양파상');

    return rankings;
  };

  const rankings = createRankingData();
  const maxRank = Math.max(...Object.keys(rankings).map(Number), 0);

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
        <p>팀별 순위표 (동점자는 같은 순위)</p>
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
            {maxRank === 0 ? (
              <tr>
                <td colSpan={5} className="no-data">
                  아직 어워드 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              Array.from({ length: Math.min(maxRank, 3) }, (_, i) => i + 1).map(rank => {
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
              })
            )}
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
