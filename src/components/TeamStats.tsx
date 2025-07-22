
import React from 'react';
import type { Team, Scorecard } from '../types/golf';
import { calculateTeamTotals } from '../utils/scoreCalculator';
import './TeamStats.css';

interface TeamStatsProps {
  teams: Team[];
  scorecards: Scorecard[];
}

const TeamStats: React.FC<TeamStatsProps> = ({ teams, scorecards }) => {
  // scoreCalculator의 calculateTeamTotals만 사용하여 통계 일원화
  const teamTotals = calculateTeamTotals(scorecards, teams);

  // 팀명 그룹 번호 추출 및 정렬 함수만 남김
  const getGroupNumber = (teamName: string): number => {
    const match = teamName.match(/^(\d+)-/);
    return match ? parseInt(match[1]) : 999;
  };
  const sortedTeams = [...teams].sort((a, b) => getGroupNumber(a.name) - getGroupNumber(b.name));

  // 실제 사용하는 부분만 남김
  return (
    <div className="team-stats">
      <div className="team-stats-header">
        <h2>📊 팀별 통계</h2>
        <p>각 팀의 버디, 파, 보기 총합을 확인해보세요.</p>
      </div>
      <div className="stats-grid">
        {sortedTeams.map(team => {
          const stats = teamTotals[team.id];
          const total = stats.birdie + stats.par + stats.bogey;
          return (
            <div key={team.id} className="team-stat-card">
              <div className="team-header">
                <h3>{team.name}</h3>
                <div className="player-list">
                  {team.players.map(player => (
                    <span key={player.id} className="player-name">{player.name}</span>
                  ))}
                </div>
              </div>
              <div className="stats-content">
                <div className="stats-row">
                  <div className="stat-item eagle">
                    <div className="stat-icon">🦅</div>
                    <div className="stat-info">
                      <div className="stat-label">이글</div>
                      <div className="stat-value">{stats.eagle}</div>
                    </div>
                  </div>
                  <div className="stat-item par">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-info">
                      <div className="stat-label">파</div>
                      <div className="stat-value">{stats.par}</div>
                    </div>
                  </div>
                  <div className="stat-item bogey">
                    <div className="stat-icon">�</div>
                    <div className="stat-info">
                      <div className="stat-label">보기</div>
                      <div className="stat-value">{stats.bogey}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="total-info">
                <span>총 홀: {total}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamStats;
