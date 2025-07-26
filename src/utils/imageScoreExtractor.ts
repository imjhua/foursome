import { GoogleGenerativeAI } from '@google/generative-ai';
import { getScoreType } from './scoreCalculator';
import type { Player, Team, Scorecard, HoleScore } from '../types/golf';

// 여러 Gemini API 키 지원
const API_KEYS = (import.meta.env.VITE_GEMINI_API_KEYS || '').split(',').map((k: string) => k.trim()).filter(Boolean);

let cachedGenAI: GoogleGenerativeAI | null = null;
let cachedKey: string | null = null;

const getWorkingGenAI = async (): Promise<GoogleGenerativeAI | null> => {
  // 이미 연결된 인스턴스가 있으면 재사용
  if (cachedGenAI && cachedKey && API_KEYS.includes(cachedKey)) {
    return cachedGenAI;
  }
  for (const key of API_KEYS) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("test");
      const response = await result.response;
      if (response.text()) {
        console.info('성공', key);
        cachedGenAI = genAI;
        cachedKey = key;
        return genAI;
      }
    } catch (e){
      console.log(e);
      console.error('에러', key);
      // 1초 대기 후 다음 키 시도
      await new Promise(res => setTimeout(res, 1000));
      continue;
    }
  }
  cachedGenAI = null;
  cachedKey = null;
  return null;
}

// 이미지 추출 결과 캐시 (같은 이미지에 대해 일관성 보장)
const extractionCache = new Map<string, ExtractedScoreData>();

export interface ExtractedScoreData {
  teams: {
    teamName: string;
    scores: number[];
    players: {
      name: string;
    }[];
  }[];
  holes: number;
  pars: number[]; // 각 홀의 파 정보 추가
  success: boolean;
  error?: string;
}

/**
 * 이미지를 base64로 변환
 */
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Google Gemini를 사용해서 이미지에서 골프 스코어 추출
 */
export const extractScoresFromImage = async (file: File): Promise<ExtractedScoreData> => {
  try {
    // 연결 가능한 genAI 인스턴스 확보
    const genAI = await getWorkingGenAI();
    if (!genAI) {
      throw new Error('모든 Gemini API 키 연결에 실패했습니다.');
    }

    // 이미지를 Base64로 변환
    const base64Image = await imageToBase64(file);

    // 캐시 키 생성 (파일 이름 + 크기 + 수정시간으로 고유 식별)
    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;

    // 캐시된 결과가 있으면 반환
    if (extractionCache.has(cacheKey)) {
      return extractionCache.get(cacheKey)!;
    }

    // Gemini Vision 모델 사용 (temperature를 낮춰서 일관성 향상)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
      }
    });

    const geminiResult = await model.generateContent([
      PROMPT,
      {
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: file.type
        }
      }
    ]);

    const response = await geminiResult.response;
    const content = response.text();

    if (!content) {
      throw new Error('Gemini에서 응답을 받지 못했습니다.');
    }

    // JSON 파싱
    let parsedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      throw new Error('Gemini 응답을 JSON으로 변환할 수 없습니다.');
    }

    // 데이터 검증
    if (!parsedData.teams || !Array.isArray(parsedData.teams) || parsedData.teams.length === 0) {
      throw new Error('팀 정보가 없습니다. 올바른 스코어카드 이미지를 업로드해주세요.');
    }

    // 팀과 스코어 검증 및 정리
    const validatedTeams = parsedData.teams.map((team: { teamName?: string; scores?: unknown[]; players?: unknown[] }, teamIndex: number) => {
      // 팀별 scores 검증
      const scores = Array.isArray(team.scores) ? team.scores : [];
      while (scores.length < 18) scores.push(4);
      scores.splice(18);
      const validatedScores = scores.map((score: unknown) => {
        const num = parseInt(String(score));
        return isNaN(num) || num < 1 || num > 12 ? 4 : num;
      });

      // 플레이어 이름만 추출
      const players = Array.isArray(team.players) ? team.players : [];
      const validatedPlayers = players.map((playerData: unknown, playerIndex: number) => {
        const player = playerData as { name?: string };
        return {
          name: player.name || `플레이어 ${playerIndex + 1}`
        };
      });

      return {
        teamName: team.teamName || ('팀 ' + (teamIndex + 1)),
        scores: validatedScores,
        players: validatedPlayers
      };
    });

    // 파 정보 검증 및 정리
    const validatePars = (pars: unknown[]): number[] => {
      if (!Array.isArray(pars) || pars.length !== 18) {
        return [4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5];
      }

      const validatedPars = pars.map((par) => {
        const num = typeof par === 'number' ? par : parseInt(String(par));
        if (num >= 3 && num <= 5) {
          return num;
        } else {
          return 4;
        }
      });

      return validatedPars;
    };

    const extractedPars = parsedData.pars ? validatePars(parsedData.pars) : [4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5];

    // teams가 실제로 유효한지(빈 배열인지) 최종 체크
    const isValidTeams = Array.isArray(validatedTeams) && validatedTeams.length > 0;
    const result: ExtractedScoreData = {
      teams: validatedTeams,
      holes: 18,
      pars: extractedPars,
      success: isValidTeams
    };

    extractionCache.set(cacheKey, result);

    return result;

  } catch (error) {
    console.error('스코어 추출 오류:', error);
    const errorResult: ExtractedScoreData = {
      teams: [],
      holes: 18,
      pars: [4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5],
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    };

    return errorResult;
  }
};

// 표준 18홀 파 정보
const standardPars = [4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5];

/**
 * 추출된 스코어 데이터를 앱의 스코어카드 형식으로 변환 (업로드 순서 prefix 포함)
 */
export const convertToAppFormat = (extractedData: ExtractedScoreData, imageOrder: number): { teams: Team[], scorecards: Scorecard[] } => {
  const teams: Team[] = [];
  const scorecards: Scorecard[] = [];
  const pars = extractedData.pars && extractedData.pars.length === 18 ? extractedData.pars : standardPars;
  extractedData.teams.forEach((teamData, teamIndex) => {
    const teamId = `team-${imageOrder}-${teamIndex + 1}`;
    const teamName = `${imageOrder}-${teamData.teamName}`;
    const teamPlayers: Player[] = teamData.players.map((player, playerIndex) => ({
      id: `player-${imageOrder}-${teamIndex + 1}-${playerIndex + 1}`,
      name: player.name
    }));
    const team: Team = {
      id: teamId,
      name: teamName,
      players: teamPlayers
    };
    teams.push(team);
    // 팀별 scores를 사용해 HoleScore 생성
    const holes: HoleScore[] = teamData.scores.map((score: number, holeIndex: number) => {
      const par = pars[holeIndex] || 4;
      return {
        hole: holeIndex + 1,
        par,
        score,
        displayType: getScoreType(score, par)
      };
    });
    // Scorecard 생성 (팀별)
    const scorecard: Scorecard = {
      id: `scorecard-${teamId}`,
      teamId: teamId,
      roundDate: new Date().toISOString().split('T')[0],
      holes: holes
    };
    scorecards.push(scorecard);
  });
  return { teams, scorecards };
};

/**
 * 여러 Gemini API 키를 순차적으로 시도하여 연결 확인
 */
export const checkGeminiConnection = async (): Promise<boolean> => {
  const genAI = await getWorkingGenAI();
  return !!genAI;
};

/**
 * 사용 가능한 Gemini 모델 목록 반환
 */
export const getAvailableVisionModels = async (): Promise<string[]> => {
  try {
    if (!API_KEYS) {
      return [];
    }
    // Gemini에서 사용 가능한 Vision 모델들
    return ["gemini-1.5-flash", "gemini-1.5-pro"];
  } catch {
    // 에러 발생 시 빈 배열 반환
    return [];
  }
};



const PROMPT = `
이 골프 스코어카드 이미지를 매우 주의깊고 일관성 있게 분석해서 다음 JSON 형식으로 정확히 반환해주세요:

{
  "teams": [
    {
      "teamName": "팀명",
      "scores": [4, 3, 5, 4, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5],
      "players": [
        {
          "name": "플레이어명"
        }
      ]
    }
  ],
  "holes": 18,
  "pars": [4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5]
}

🔍 **정확한 데이터 추출 가이드:**

📌 **팀명 추출 규칙:**
- 스코어카드에서 "A Team", "B Team", "팀A", "팀B" 등의 팀 표시를 정확히 찾으세요
- 영어 표기가 있으면 영어를 우선하여 "A Team", "B Team" 형식으로 추출하세요
- 한글 표기만 있으면 "팀A", "팀B" 형식으로 추출하세요
- 팀 구분이 불명확하면 상단/좌측부터 "팀1", "팀2"로 명명하세요

👤 **플레이어명 추출 규칙:**
- 각 팀 섹션에서 플레이어 이름을 정확히 읽으세요
- 한글 이름은 완전한 형태로 추출하세요 (예: "홍길동", "김철수")
- 영어/숫자 조합도 정확히 추출하세요 (예: "max", "5274156")
- 이름이 불분명하면 "플레이어1", "플레이어2"로 명명하세요

🏌️ **스코어 추출 규칙:**
- 각 플레이어의 1-18번 홀 스코어를 순서대로 정확히 읽으세요
- 빈 칸이나 읽을 수 없는 스코어는 해당 홀의 파 값으로 대체하세요
- 스코어 범위는 1-12 사이여야 합니다

⛳ **홀별 파 정보 추출 가이드:**
1. **파 정보 위치 확인**: 스코어카드 상단에서 각 홀 번호와 함께 "Par 3", "Par 4", "Par 5" 표기를 찾으세요
2. **홀 순서 준수**: 1번 홀부터 18번 홀까지 순서대로 파 값을 배열로 만드세요
3. **파 값 범위**: 반드시 3, 4, 또는 5만 사용하세요
4. **표준 골프장 패턴**: 불분명한 경우 일반적인 패턴 적용
   - 짧은 홀: Par 3 (보통 4개 홀)
   - 보통 홀: Par 4 (보통 10개 홀)  
   - 긴 홀: Par 5 (보통 4개 홀)

⚠️ **일관성 보장 규칙:**
- 동일한 이미지는 항상 동일한 결과를 반환해야 합니다
- 애매한 부분은 합리적인 추정을 사용하되, 일관성을 유지하세요
- 반드시 유효한 JSON 형식으로만 응답해주세요
- 다른 설명이나 주석 없이 JSON만 반환해주세요
`;
