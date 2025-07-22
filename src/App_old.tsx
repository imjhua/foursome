import { useState } from 'react';
import ScorecardView from './components/ScorecardView';
import AwardResults from './components/AwardResults';
import TeamStats from './components/TeamStats';
import FileUpload from './components/FileUpload';
import { mockTeams, mockScorecards } from './data/mockData';
import type { Team, Scorecard } from './types/golf';
import './App.css';
import { calculateTeamAwards } from './utils/scoreCalculator';

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

  const awards = calculateTeamAwards(scorecards, teams);

  return (
    <div className="app">
      <header className="app-header">
        <h1>⛳️‍♂️ 골프 스코어카드 관리</h1>
        <p>팀별 스코어카드와 어워드 현황을 확인해보세요</p>
        <div className="data-source-controls">
          {isUsingUploadedData && (
            <button onClick={handleUseMockData} className="mock-data-btn">
              샘플 데이터로 돌아가기
            </button>
          )}
        </div>
      </header>
      <main>
        <section>
          <FileUpload onDataLoaded={handleDataLoaded} />
        </section>
        <section>
          <h2>팀별 스코어카드</h2>
          <div className="scorecards-list">
            {teams.map(team => (
              <div key={team.id} className="team-scorecard-section">
                <h3>{team.name}</h3>
                {scorecards
                  .filter(scorecard => scorecard.teamId === team.id)
                  .map(scorecard => (
                    <ScorecardView
                      key={scorecard.id}
                      scorecard={scorecard}
                      team={team}
                    />
                  ))}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2>어워드 결과</h2>
          <AwardResults awards={awards} />
        </section>
        <section>
          <h2>팀 통계</h2>
          <TeamStats teams={teams} scorecards={scorecards} />
        </section>
      </main>
      <footer className="app-footer">
        <p>© 2024 Golf Scorecard Manager</p>
      </footer>
    </div>
  );
}

export default App;
