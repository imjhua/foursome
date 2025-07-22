import React from 'react';
import type { Team, Scorecard, TeamAwardStats } from '../types/golf';
import { calculateTeamAwards } from '../utils/scoreCalculator';
import './TeamStatsAndAwards.css';

interface TeamStatsAndAwardsProps {
  teams: Team[];
  scorecards: Scorecard[];
}

const TeamStatsAndAwards: React.FC<TeamStatsAndAwardsProps> = ({ 
  teams, 
  scorecards
}) => {
  const teamAwards = calculateTeamAwards(scorecards, teams);

  const renderTeamAwardSection = (title: string, awardList: typeof teamAwards.다파상, emoji: string) => (
    <div className="award-section">
      <h4 className="award-title">
        <span className="award-emoji">{emoji}</span>
        {title}
      </h4>
      {awardList.length === 0 ? (
        <p className="no-awards">해당하는 팀이 없습니다.</p>
      ) : (
        <div className="award-list">
          {awardList.map((award, index) => (
            <div key={`${award.teamId}-${index}`} className={`award-item rank-${award.rank}`}>
              <div className="rank-badge">
                {award.rank === 1 ? '🥇' : award.rank === 2 ? '🥈' : '🥉'}
                <span className="rank-text">{award.rank}위</span>
              </div>
              <div className="team-info">
                <span className="team-name">{award.teamName}</span>
              </div>
              <div className="award-count">
                <span className="count-number">{award.count}</span>
                <span className="count-text">개</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="team-stats-and-awards">
      <div className="section-header">
        <h2>🏆 어워드 결과</h2>
        <p>각 팀의 최고 기록을 한눈에 확인해보세요.</p>
      </div>
      
      <div className="content-grid">
        {/* 어워드 결과 */}
        <div className="awards-section">
          <div className="awards-grid">
            {renderTeamAwardSection('다버디상', teamAwards.다버디상, '🦅')}
            {renderTeamAwardSection('다파상', teamAwards.다파상, '🎯')}
            {renderTeamAwardSection('다보기상', teamAwards.다보기상, '😅')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamStatsAndAwards;
