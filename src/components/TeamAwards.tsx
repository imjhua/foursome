import React from 'react';
import type { Team, Scorecard } from '../types/golf';
import { calculateTeamAwards } from '../utils/scoreCalculator';
import './TeamAwards.css';

interface TeamAwardsProps {
  teams: Team[];
  scorecards: Scorecard[];
}

const TeamAwards: React.FC<TeamAwardsProps> = ({ 
  teams, 
  scorecards
}) => {
  const teamAwards = calculateTeamAwards(scorecards, teams);

  // 팀명의 그룹 번호를 추출하는 함수
  const getGroupNumber = (teamName: string): number => {
    const match = teamName.match(/^(\d+)-/);
    return match ? parseInt(match[1]) : 999; // prefix가 없으면 맨 뒤로
  };

  // 그룹별로 정렬된 어워드 리스트를 반환하는 함수
  const sortAwardsByGroup = (awardList: typeof teamAwards.다파상) => {
    return [...awardList].sort((a, b) => {
      if (a.rank !== b.rank) {
        return a.rank - b.rank; // 랭크 오름차순
      }
      return getGroupNumber(a.teamName) - getGroupNumber(b.teamName); // 그룹 번호 오름차순
    });
  };

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
          {sortAwardsByGroup(awardList).map((award, index) => (
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
            {renderTeamAwardSection('다이글상', teamAwards.다이글상, '🦅')}
            {renderTeamAwardSection('다버디상', teamAwards.다버디상, '🐦')}
            {renderTeamAwardSection('다파상', teamAwards.다파상, '🎯')}
            {renderTeamAwardSection('다보기상', teamAwards.다보기상, '😅')}
            {renderTeamAwardSection('다더블보기상', teamAwards.다더블보기상, '💙')}
            {renderTeamAwardSection('다양파상', teamAwards.다양파상, '🔴')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamAwards;
