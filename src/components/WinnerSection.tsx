import React from 'react';
import type { Team } from '../types/golf';
import './WinnerSection.css';


interface WinnerInfo {
  teamId: string;
  teamName: string;
  total: number;
  handicap: number;
}


interface WinnerSectionProps {
  winnerInfos: WinnerInfo[];
  teams: Team[];
  teamHandicaps: Record<string, number>;
  show: boolean;
  onShow: () => void;
  disabled: boolean;
}


const WinnerSection: React.FC<WinnerSectionProps> = ({ winnerInfos, teams, show, onShow, disabled }) => {
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
      {show && winnerInfos.length > 0 && (
        <div className="winner-team-info">
          <div className="winner-trophy">
            🏆 {winnerInfos.length > 1 ? '공동우승팀' : '우승팀'}
          </div>
          <span>(동타인 경우, 핸디캡이 높은 쪽이 우승)</span>
          <br />
          {winnerInfos.map((info) => {
            const winnerTeam = teams.find(t => t.id === info.teamId);
            return (
              <div key={info.teamId} className="winner-team-block">
                <div className="winner-team-name">{info.teamName}</div>
                <div className="winner-total">총타수: {info.total} (핸디: {info.handicap})</div>
                {winnerTeam && winnerTeam.players && winnerTeam.players.length > 0 && (
                  <div className="winner-players">
                    <span className="winner-players-title">플레이어</span>
                    <ul className="winner-players-list">
                      {winnerTeam.players.map((p, idx) => (
                        <li key={p.id || idx} className="winner-player-item">{p.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* 반짝이는 효과용 배경 장식 */}
      <div className="winner-bg-left" />
      <div className="winner-bg-right" />
    </div>
  );
};

export default WinnerSection;
