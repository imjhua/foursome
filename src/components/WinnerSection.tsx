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
          className="winner-btn-glow winner-btn-glow-main"
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
          <span className='winner-info-note'>(동타인 경우, 핸디캡이 높은 쪽이 우승)</span>
          {winnerInfos.map((info) => {
            const winnerTeam = teams.find(t => t.id === info.teamId);
            return (
              <div key={info.teamId} className="winner-team-block">
                <div className="winner-team-name">{info.teamName}</div>
                <div className="winner-total">총타수: {info.total} (핸디: {info.handicap})</div>
                {winnerTeam && winnerTeam.players && winnerTeam.players.length > 0 && (
                  <div className="winner-players">
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
    </div>
  );
};

export default WinnerSection;
