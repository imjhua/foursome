import { useState, useMemo, useEffect } from 'react';
import { checkGeminiConnection } from './utils/imageScoreExtractor';
import ImageScoreUploader from './components/ImageScoreUploader';
import TeamScorecardTable from './components/TeamScorecardTable';
import AwardResults from './components/AwardResults';
import { mockTeams, mockScorecards } from './data/mockData';
import { calculateTeamAwards } from './utils/scoreCalculator';
import type { Team, Scorecard } from './types/golf';
import './App.css';

function App() {
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [scorecards, setScorecards] = useState<Scorecard[]>(mockScorecards);
  const [isUsingUploadedData, setIsUsingUploadedData] = useState(false);
  const [hasUploadedImages, setHasUploadedImages] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // 서버 연결 상태 체크 (최초 마운트 시 1회)
  useEffect(() => {
    let mounted = true;
    const fetchConnection = async () => {
      const connected = await checkGeminiConnection();
      if (mounted) setIsConnected(connected);
    };
    fetchConnection();
    return () => { mounted = false; };
  }, []);

  const handleScoresExtracted = (scorecards: Scorecard[], teams: Team[]) => {
    setScorecards(scorecards);
    setTeams(teams);
    setIsUsingUploadedData(true);
  };

  const handleImagesUploaded = (hasImages: boolean) => {
    setHasUploadedImages(hasImages);
    if (!hasImages) {
      // 이미지가 없으면 mockData로 돌아가기
      setScorecards(mockScorecards);
      setTeams(mockTeams);
      setIsUsingUploadedData(false);
    }
  };

  const handleImageUploadError = (error: string) => {
    alert(`이미지 업로드 오류: ${error}`);
  };

  // 어워드를 메모이제이션하여 scorecards나 teams가 변경될 때만 다시 계산
  const awards = useMemo(() => {
    return calculateTeamAwards(scorecards, teams);
  }, [scorecards, teams]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏌️‍♂️ 포썸 어워드</h1>
        <p>팀별 스코어카드와 어워드 현황을 확인해보세요</p>
      </header>

      <main className="app-main">
        {/* 서버 연결 상태에 따라 분기 렌더링 */}
        {/* 서버 연결 상태에 따라 분기 렌더링 */}
        {isConnected === null ? (
          <div className="status-message-content">
            서버 연결 상태를 확인 중입니다...
          </div>
        ) : isConnected === false ? (
          <div className="server-error-message" style={{
            background: '#fff3f3',
            color: '#c62828',
            border: '2px solid #f8d7da',
            borderRadius: '12px',
            padding: '2rem',
            margin: '2rem auto',
            maxWidth: '480px',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '1.1rem',
            boxShadow: '0 2px 12px rgba(220,53,69,0.08)'
          }}>
            <span style={{fontSize: '2rem', marginBottom: '0.5rem', display: 'block'}}>🚫</span>
            서버 에러로 업로드가 불가능합니다.<br />API 키를 확인하거나, 관리자에게 문의하세요.
          </div>
        ) : (
          <>
            {/* 이미지 업로드 섹션 */}
            <ImageScoreUploader 
              onScoresExtracted={handleScoresExtracted}
              onError={handleImageUploadError}
              onImagesUploaded={handleImagesUploaded}
              isConnected={isConnected}
            />

            {/* 팀별 스코어카드 테이블 */}
            <section className="scorecards-section">
              <h2>📋 팀별 통합 스코어카드</h2>
              {hasUploadedImages && !isUsingUploadedData ? (
                <div className="upload-guide-message">
                  <div className="guide-card">
                    <span className="guide-icon">💡</span>
                    <p>스코어사진 업로드 후 [팀 스코어카드 생성]버튼을 눌러 주세요.</p>
                  </div>
                </div>
              ) : (
                <TeamScorecardTable teams={teams} scorecards={scorecards} />
              )}
            </section>

            {/* 어워드 결과 */}
            <section className="awards-section">
              {hasUploadedImages && !isUsingUploadedData ? (
                <div className="upload-guide-message">
                  <div className="guide-card">
                    <span className="guide-icon">🏆</span>
                    <p>스코어 생성 후 어워드 결과를 확인하실 수 있습니다.</p>
                  </div>
                </div>
              ) : (
                <AwardResults awards={awards} />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
