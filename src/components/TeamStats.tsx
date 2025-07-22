import React from 'react';
import type { Team, Scorecard } from '../types/golf';
import { calculateTeamTotals } from '../utils/scoreCalculator';
import './TeamStats.css';

interface TeamStatsProps {
  teams: Team[];
  scorecards: Scorecard[];
}

const TeamStats: React.FC<TeamStatsProps> = ({ teams, scorecards }) => {
  const teamTotals = calculateTeamTotals(scorecards, teams);

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
