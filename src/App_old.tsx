import { useState } from 'react';
import ScorecardView from './components/ScorecardView';
import AwardResults from './components/AwardResults';
import TeamStats from './components/TeamStats';
import FileUpload from './components/FileUpload';
import { mockTeams, mockScorecards } from './data/mockData';
import { calculateAwards } from './utils/scoreCalculator';
import type { Team, Scorecard } from './types/golf';
import './App.css';

function App() {
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [scorecards, setScorecards] = useState<Scorecard[]>(mockScorecards);
  const [isUsingUploadedData, setIsUsingUploadedData] = useState(false);

  const handleDataLoaded = (newScorecards: Scorecard[], newTeams: Team[]) => {
    setScorecards(newScorecards);
    setTeams(newTeams);
    setIsUsingUploadedData(true);
  };

  const handleUseMockData = () => {
    setScorecards(mockScorecards);
    setTeams(mockTeams);
    setIsUsingUploadedData(false);
  };

  const awards = calculateAwards(scorecards, teams);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏌️‍♂️ 골프 스코어카드 관리</h1>
        <p>팀별 스코어카드와 어워드 현황을 확인해보세요</p>
        <div className="data-source-controls">
          {isUsingUploadedData && (
            <button onClick={handleUseMockData} className="mock-data-btn">
              샘플 데이터로 돌아가기
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {/* 파일 업로드 섹션 */}
        <FileUpload onDataLoaded={handleDataLoaded} />

        {/* 팀별 통계 */}
        <TeamStats teams={teams} scorecards={scorecards} />

        {/* 어워드 결과 */}
        <AwardResults awards={awards} />

        {/* 스코어카드 목록 */}
        <section className="scorecards-section">
          <h2>📋 팀별 스코어카드</h2>
          <div className="scorecards-grid">
            {scorecards.map(scorecard => {
              const team = teams.find(t => t.id === scorecard.teamId);
              const player = team?.players.find(p => scorecard.holes.some(h => h.playerId === p.id));
              return (
                <ScorecardView
                  key={scorecard.id}
                  scorecard={scorecard}
                  team={team}
                  player={player}
                />
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
              return team ? (
                <ScorecardView 
                  key={scorecard.id} 
                  scorecard={scorecard} 
                  team={team} 
                />
              ) : null;
            })}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>© 2024 Golf Scorecard Manager</p>
      </footer>
    </div>
  );
}

export default App;
