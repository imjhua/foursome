import React from 'react';
import type { Team } from '../types/golf';
import './WinnerSection.css';

interface WinnerInfo {
  teamId: string;
  teamName: string;
  total: number;
}

interface WinnerSectionProps {
  winnerInfo: WinnerInfo | null;
  teams: Team[];
  show: boolean;
  onShow: () => void;
  disabled: boolean;
}

const WinnerSection: React.FC<WinnerSectionProps> = ({ winnerInfo, teams, show, onShow, disabled }) => {
  return (
    <div className="winner-section">
      {!show && (
        <button
          className="winner-btn-glow"
          style={{
            background: 'linear-gradient(90deg, #faad14 0%, #ffd666 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 48px',
            fontSize: '1.35rem',
            fontWeight: 800,
            cursor: disabled ? 'not-allowed' : 'pointer',
            marginBottom: '1.5rem',
            letterSpacing: '1px',
            transition: 'background 0.2s',
            position: 'relative',
            zIndex: 2,
            opacity: disabled ? 0.6 : 1,
          }}
          onClick={onShow}
          disabled={disabled}
        >
          {disabled ? '스코어 생성 후 우승팀 결과를 확인하실 수 있습니다.' : '우승팀 확인하기'}
        </button>
      )}
      {show && winnerInfo && (
        <div className="winner-team-info">
          <span className="winner-trophy">🏆</span>
          <span className="winner-team-name">{winnerInfo.teamName}</span><br />
          <span className="winner-total">총타수: {winnerInfo.total}</span>
          {/* 우승팀 멤버 정보 노출 */}
          {(() => {
            const winnerTeam = teams.find(t => t.id === winnerInfo.teamId);
            if (winnerTeam && winnerTeam.players && winnerTeam.players.length > 0) {
              return (
                <div className="winner-players">
                  <span className="winner-players-title">플레이어</span>
                  <ul className="winner-players-list">
                    {winnerTeam.players.map((p, idx) => (
                      <li key={p.id || idx} className="winner-player-item">{p.name}</li>
                    ))}
                  </ul>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
      {/* 반짝이는 효과용 배경 장식 */}
      <div className="winner-bg-left" />
      <div className="winner-bg-right" />
    </div>
  );
};

export default WinnerSection;
