import React, { useState, useRef } from 'react';
import type { Scorecard, Team, Player, HoleScore } from '../types/golf';
import './FileUpload.css';

interface FileUploadProps {
  onDataLoaded: (scorecards: Scorecard[], teams: Team[]) => void;
}

interface CSVRow {
  [key: string]: string;
}

type UploadedData = CSVRow[] | { scorecards: Scorecard[]; teams: Team[]; };

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let data: UploadedData;

      if (fileExtension === 'csv') {
        data = await parseCSVFile(file);
      } else if (fileExtension === 'json') {
        data = await parseJSONFile(file);
      } else {
        throw new Error('지원되지 않는 파일 형식입니다. CSV 또는 JSON 파일을 업로드해주세요.');
      }

      const { scorecards, teams } = processData(data);
      onDataLoaded(scorecards, teams);
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일을 처리하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const parseCSVFile = (file: File): Promise<CSVRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const rows = text.split('\n').filter(row => row.trim());
          if (rows.length < 2) {
            reject(new Error('CSV 파일이 비어있거나 헤더가 없습니다.'));
            return;
          }

          const headers = rows[0].split(',').map(h => h.trim());
          const data: CSVRow[] = [];

          for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',').map(v => v.trim());
            if (values.length === headers.length) {
              const rowData: CSVRow = {};
              headers.forEach((header, index) => {
                rowData[header] = values[index];
              });
              data.push(rowData);
            }
          }

          resolve(data);
        } catch {
          reject(new Error('CSV 파일을 파싱하는 중 오류가 발생했습니다.'));
        }
      };
      reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const parseJSONFile = (file: File): Promise<{ scorecards: Scorecard[]; teams: Team[]; }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text);
          resolve(data);
        } catch {
          reject(new Error('JSON 파일을 파싱하는 중 오류가 발생했습니다.'));
        }
      };
      reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const processData = (data: UploadedData): { scorecards: Scorecard[], teams: Team[] } => {
    // JSON 형식으로 직접 scorecards와 teams가 제공된 경우
    if (!Array.isArray(data) && data.scorecards && data.teams) {
      return {
        scorecards: data.scorecards,
        teams: data.teams
      };
    }

    // CSV 데이터의 경우 변환 처리
    if (Array.isArray(data)) {
      return convertArrayToGolfData(data);
    }

    throw new Error('지원되지 않는 데이터 형식입니다.');
  };

  const convertArrayToGolfData = (data: CSVRow[]): { scorecards: Scorecard[], teams: Team[] } => {
    const players: Player[] = [];
    const teams: Team[] = [];

    // 플레이어와 팀 추출
    const playersMap = new Map<string, Player>();
    const teamsMap = new Map<string, Team>();

    data.forEach(row => {
      // CSV 열 이름은 다양할 수 있으므로 유연하게 처리
      const playerName = row['플레이어'] || row['player'] || row['name'] || row['이름'];
      const teamName = row['팀'] || row['team'] || row['팀명'];
      
      if (!playerName) {
        throw new Error('플레이어 이름이 없는 행이 있습니다.');
      }

      // 플레이어 생성
      if (!playersMap.has(playerName)) {
        const player: Player = {
          id: `player_${players.length + 1}`,
          name: playerName
        };
        playersMap.set(playerName, player);
        players.push(player);
      }

      // 팀 생성
      if (teamName && !teamsMap.has(teamName)) {
        const team: Team = {
          id: `team_${teams.length + 1}`,
          name: teamName,
          players: []
        };
        teamsMap.set(teamName, team);
        teams.push(team);
      }
    });

    // 팀에 플레이어 할당
    data.forEach(row => {
      const playerName = row['플레이어'] || row['player'] || row['name'] || row['이름'];
      const teamName = row['팀'] || row['team'] || row['팀명'];
      
      if (playerName && teamName) {
        const player = playersMap.get(playerName);
        const team = teamsMap.get(teamName);
        
        if (player && team && !team.players.some(p => p.id === player.id)) {
          team.players.push(player);
        }
      }
    });

    // 기본 파 설정 (표준 18홀 파)
    const standardPars = [4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5];

    // 스코어카드 생성
    const scorecardMap = new Map<string, Scorecard>();
    
    data.forEach(row => {
      const playerName = row['플레이어'] || row['player'] || row['name'] || row['이름'];
      const teamName = row['팀'] || row['team'] || row['팀명'];
      
      const player = playersMap.get(playerName);
      const team = teamsMap.get(teamName);
      
      if (!player || !team) return;

      const scorecardId = `${team.id}_${player.id}`;
      
      if (!scorecardMap.has(scorecardId)) {
        scorecardMap.set(scorecardId, {
          id: scorecardId,
          teamId: team.id,
          roundDate: new Date().toISOString().split('T')[0],
          holes: []
        });
      }

      const scorecard = scorecardMap.get(scorecardId)!;
      
      // 홀별 스코어 추출 (hole1, hole2, ... 또는 1, 2, ... 형태)
      for (let i = 1; i <= 18; i++) {
        const scoreKey = row[`hole${i}`] || row[`홀${i}`] || row[`${i}`];
        if (scoreKey) {
          const score = parseInt(scoreKey, 10);
          if (!isNaN(score) && score > 0) {
            const holeScore: HoleScore = {
              hole: i,
              par: standardPars[i - 1],
              score: score,
              playerId: player.id
            };
            scorecard.holes.push(holeScore);
          }
        }
      }
    });

    return {
      scorecards: Array.from(scorecardMap.values()).filter(sc => sc.holes.length > 0),
      teams
    };
  };

  const downloadSampleFile = () => {
    const sampleData = `플레이어,팀,hole1,hole2,hole3,hole4,hole5,hole6,hole7,hole8,hole9,hole10,hole11,hole12,hole13,hole14,hole15,hole16,hole17,hole18
김철수,드래곤즈,4,3,5,6,4,3,4,4,5,4,3,4,5,4,3,4,4,5
이영희,드래곤즈,5,3,4,5,4,3,4,5,4,4,3,4,5,4,3,4,4,5
박민수,타이거즈,4,3,4,5,5,3,4,4,5,4,3,5,5,4,3,4,4,5`;
    
    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'golf_score_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="file-upload">
      <div className="upload-section">
        <h3>📁 스코어 데이터 업로드</h3>
        <p>CSV 또는 JSON 형식의 골프 스코어 파일을 업로드하세요.</p>
        
        <div className="upload-controls">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="file-input"
          />
          
          <button
            onClick={downloadSampleFile}
            className="sample-download-btn"
            disabled={isLoading}
          >
            📥 샘플 파일 다운로드
          </button>
        </div>

        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <span>파일을 처리하는 중...</span>
          </div>
        )}

        {error && (
          <div className="error">
            <span>❌ {error}</span>
          </div>
        )}

        <div className="format-info">
          <h4>지원되는 파일 형식:</h4>
          <ul>
            <li><strong>CSV:</strong> 플레이어, 팀, hole1-hole18 열이 포함된 파일</li>
            <li><strong>JSON:</strong> scorecards와 teams 속성이 포함된 파일</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
