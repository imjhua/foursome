import React, { useState, useCallback } from 'react';
import { extractScoresFromImage } from '../utils/imageScoreExtractor';
import type { ExtractedScoreData } from '../utils/imageScoreExtractor';
import type { Team, Scorecard, Player, HoleScore } from '../types/golf';
import { mockTeams, mockScorecards } from '../data/mockData';
import './ImageScoreUploader.css';
import { getScoreType } from '../utils/scoreCalculator';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  extractedData?: ExtractedScoreData;
  isProcessing?: boolean;
  error?: string;
}

interface ImageScoreUploaderProps {
  onScoresExtracted: (scorecards: Scorecard[], teams: Team[]) => void;
  onError: (error: string) => void;
  onImagesUploaded?: (hasImages: boolean) => void;
  isConnected: boolean | null;
}

const ImageScoreUploader: React.FC<ImageScoreUploaderProps> = ({
  onScoresExtracted,
  onError,
  onImagesUploaded,
  isConnected
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);

  // 업로드된 이미지가 없으면 기본으로 mockData 적용
  React.useEffect(() => {
    if (uploadedImages.length === 0) {
      onScoresExtracted(mockScorecards, mockTeams);
    }
  }, [uploadedImages.length, onScoresExtracted]);

  // 이미지 업로드 상태를 부모 컴포넌트에 알림
  React.useEffect(() => {
    onImagesUploaded?.(uploadedImages.length > 0);
  }, [uploadedImages.length, onImagesUploaded]);
  

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Gemini 연결 확인
    if (!isConnected) {
      onError('Google Gemini API에 연결할 수 없습니다. API 키가 설정되었는지 확인해주세요.');
      return;
    }

    for (const file of files) {
      // 중복 이미지 체크 (파일명+크기 기준)
      const isDuplicate = uploadedImages.some(img => img.file.name === file.name && img.file.size === file.size);
      if (isDuplicate) {
        continue;
      }

      // 이미지 파일 확인
      if (!file.type.startsWith('image/')) {
        onError(`${file.name}은 이미지 파일이 아닙니다.`);
        continue;
      }

      // 파일 크기 확인 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        onError(`${file.name}의 크기가 5MB를 초과합니다.`);
        continue;
      }

      // 미리보기 이미지 생성
      const reader = new FileReader();
      reader.onload = async (e) => {
        const preview = e.target?.result as string;
        const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const newImage: UploadedImage = {
          id: imageId,
          file,
          preview,
          isProcessing: true
        };

        setUploadedImages(prev => [...prev, newImage]);

        // 스코어 추출 시작
        try {
          const result = await extractScoresFromImage(file);
          
          if (!result.success) {
            throw new Error(result.error || '스코어 추출에 실패했습니다.');
          }

          setUploadedImages(prev => 
            prev.map(img => 
              img.id === imageId 
                ? { ...img, extractedData: result, isProcessing: false }
                : img
            )
          );

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
          setUploadedImages(prev => 
            prev.map(img => 
              img.id === imageId 
                ? { ...img, error: errorMessage, isProcessing: false }
                : img
            )
          );
        }
      };
      reader.readAsDataURL(file);
    }

    event.target.value = '';
  };

  // 이미지 삭제
  const handleDeleteImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  // 이미지 수정 (교체)
  const handleReplaceImage = (imageId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Gemini 연결 확인
      if (!isConnected) {
        onError('Google Gemini API에 연결할 수 없습니다. API 키가 설정되었는지 확인해주세요.');
        return;
      }

      // 이미지 파일 확인
      if (!file.type.startsWith('image/')) {
        onError(`${file.name}은 이미지 파일이 아닙니다.`);
        return;
      }

      // 파일 크기 확인 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        onError(`${file.name}의 크기가 5MB를 초과합니다.`);
        return;
      }

      // 기존 이미지를 처리 중 상태로 변경
      setUploadedImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { ...img, isProcessing: true, error: undefined, extractedData: undefined }
            : img
        )
      );

      // 새 이미지로 교체하고 추출 시작
      const reader = new FileReader();
      reader.onload = async (e) => {
        const preview = e.target?.result as string;

        // 이미지 정보 업데이트
        setUploadedImages(prev => 
          prev.map(img => 
            img.id === imageId 
              ? { ...img, file, preview }
              : img
          )
        );

        // 스코어 추출 시작
        try {
          const result = await extractScoresFromImage(file);
          
          if (!result.success) {
            throw new Error(result.error || '스코어 추출에 실패했습니다.');
          }

          // 성공한 경우 데이터 업데이트
          setUploadedImages(prev => 
            prev.map(img => 
              img.id === imageId 
                ? { ...img, extractedData: result, isProcessing: false }
                : img
            )
          );

        } catch (error) {
          // 실패한 경우 에러 업데이트
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
          setUploadedImages(prev => 
            prev.map(img => 
              img.id === imageId 
                ? { ...img, error: errorMessage, isProcessing: false }
                : img
            )
          );
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // 모든 추출된 스코어를 통합하여 팀과 스코어카드 생성 (수동 버튼용)
  const handleGenerateTeams = useCallback(() => {
    const allExtractedData: { data: ExtractedScoreData, order: number }[] = uploadedImages
      .map((img, index) => ({ data: img.extractedData!, order: index + 1 }))
      .filter(item => item.data && item.data.success);

    if (allExtractedData.length === 0) {
      onError('추출된 스코어 데이터가 없습니다.');
      return;
    }

    const teams: Team[] = [];
    const scorecards: Scorecard[] = [];
    
    // 첫 번째 사진의 파 정보를 기준으로 사용
    const firstImageData = allExtractedData[0].data;
    const pars = firstImageData.pars && Array.isArray(firstImageData.pars) && firstImageData.pars.length === 18
      ? firstImageData.pars
      : [4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5]; // 기본 파 정보
    

    // 각 사진별로 팀 생성 (사진 한 개당 2팀씩)
    allExtractedData.forEach(({ data, order }) => {
      data.teams.forEach((teamData, teamIndex) => {
        const teamId = `team-${order}-${teamIndex + 1}`;
        const teamName = `${order}-${teamData.teamName}`;
        
        // 팀의 플레이어들 생성
        const teamPlayers: Player[] = teamData.players.map((playerData, playerIndex) => ({
          id: `player-${order}-${teamIndex + 1}-${playerIndex + 1}`,
          name: playerData.name
        }));

        const team: Team = {
          id: teamId,
          name: teamName,
          players: teamPlayers
        };
        teams.push(team);

        // 각 플레이어의 스코어카드 생성
        teamData.players.forEach((playerData, playerIndex) => {
          const playerId = `player-${order}-${teamIndex + 1}-${playerIndex + 1}`;
          
          // HoleScore 배열 생성 (첫 번째 사진의 파 정보 사용)
          const holes: HoleScore[] = playerData.scores.map((score: number, holeIndex: number) => {
            const par = pars[holeIndex] || 4;
            return {
              hole: holeIndex + 1,
              par,
              score,
              displayType: getScoreType(score, par)
            };
          });
          
          // Scorecard 생성
          const scorecard: Scorecard = {
            id: `scorecard-${playerId}`,
            teamId: teamId,
            roundDate: new Date().toISOString().split('T')[0],
            holes: holes
          };
          
          scorecards.push(scorecard);
        });
      });
    });

    onScoresExtracted(scorecards, teams);
    
    // 성공 메시지
    alert(`${teams.length}개 팀의 스코어를 생성했습니다!`);
  }, [uploadedImages, onScoresExtracted, onError]);

  uploadedImages.forEach(image => {
    console.log(image.extractedData);
  });

  return (
    <div className="image-score-uploader">
      <div className="uploader-header">
        <div className="status-message-area">
        <h3>
          📸 스코어카드 이미지 업로드
          {isConnected === null ? (
            <span className="status-dot status-checking">●</span>
          ) : isConnected ? (
            <span className="status-dot status-connected">●</span>
          ) : (
            <span className="status-dot status-disconnected">●</span>
          )}
        </h3>
        <div className="status-message-content">
          {isConnected === null ? (
            <p>서버 연결 상태를 확인 중입니다...</p>
          ) : isConnected === true ? (
            <p>골프 스코어카드 사진을 업로드해주세요. (동일한 사진 중복업로드 불가)</p>
          ) : null}
        </div>
        </div>
      </div>

      {/* 파일 업로드 영역 */}
      {isConnected && (
        <div className="upload-area">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={!isConnected}
            id="image-upload"
            className="file-input"
            multiple
          />
          <label htmlFor="image-upload" className="upload-label">
            <div className="upload-prompt">
              <span className="upload-icon">📁</span>
              <span>스코어카드 이미지를 선택하세요 (다중 선택 가능)</span>
              <small>JPG, PNG 등 (최대 5MB per 파일)</small>
            </div>
          </label>
        </div>
      )}

      {/* 업로드된 이미지 목록 */}
      {uploadedImages.length > 0 && (
        <div className="uploaded-images">
          <div className="images-header">
            <h4>업로드된 이미지 ({uploadedImages.length}개)</h4>
          </div>
          
          <div className="images-grid">
            {uploadedImages.map((image, index) => (
              <div key={image.id} className="image-card">
                <div className="image-header">
                  <span className="image-number">이미지 {index + 1}</span>
                  <div className="image-actions">
                    <button 
                      onClick={() => handleReplaceImage(image.id)}
                      className="replace-btn"
                      title="수정"
                      disabled={image.isProcessing}
                    >
                      수정
                    </button>
                    <button 
                      onClick={() => handleDeleteImage(image.id)}
                      className="delete-btn"
                      title="삭제"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                
                <div className="image-preview-container">
                  <img 
                    src={image.preview} 
                    alt={`스코어카드 ${index + 1}`}
                    className="image-preview-small"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedImage(image)}
                  />
                </div>
      {/* 이미지 확대 모달 (별도 레이어, 알럿창 스타일) */}
      {selectedImage && (
        <div className="image-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }} onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            padding: '32px 32px 24px 32px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '100vw',
            maxHeight: '100vh',
          }} onClick={e => e.stopPropagation()}>
            <button className="image-modal-close" style={{
              position: 'absolute',
              top: '-28px',
              right: '-28px',
              width: '48px',
              height: '48px',
              fontSize: '2.2rem',
              background: 'rgba(255,255,255,0.95)',
              border: '2px solid #888',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              cursor: 'pointer',
              color: '#222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              transition: 'background 0.2s',
            }} onClick={() => setSelectedImage(null)}>
              &times;
            </button>
            <img
              src={selectedImage.preview}
              alt="확대 이미지"
              style={{
                width: 'calc(52vw)',
                maxWidth: '900px',
                height: 'auto',
                maxHeight: '80vh',
                borderRadius: '12px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
                objectFit: 'contain',
                transition: 'all 0.2s',
              }}
            />
          </div>
        </div>
      )}
                
                <div className="image-status">
                  {image.isProcessing ? (
                    <div className="processing">
                      <span className="spinner-small"></span>
                      <span>분석 중...</span>
                    </div>
                  ) : image.error ? (
                    <div className="error">
                      <span className="icon">❌ 추출실패</span>
                      <div className="error-message">{image.error}</div>
                    </div>
                  ) : image.extractedData ? (
                    <div className="success">
                      <span className="icon">✅ 추출완료</span>
                      <span>
                        <div className="extracted-teams">
                          {image.extractedData.teams.map((team, teamIndex) => (
                            <div key={teamIndex} className="team-group">
                              <div className="team-name">{team.teamName}</div>
                              <div className="team-players">
                                {team.players.map((player, playerIndex) => (
                                  <span key={playerIndex} className="player-name">
                                    {player.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={handleGenerateTeams}
            className="generate-teams-btn"
            disabled={uploadedImages.some(img => img.isProcessing) || uploadedImages.every(img => img.error)}
          >
            팀 스코어카드 생성
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageScoreUploader;
