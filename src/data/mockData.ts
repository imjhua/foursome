import type { Team, Player, Scorecard } from '../types/golf';
import { getScoreType } from '../utils/scoreCalculator';

// 더미 플레이어 데이터
export const mockPlayers: Player[] = [
  { id: '1', name: '김철수' },
  { id: '2', name: '이영희' },
  { id: '3', name: '박민수' },
  { id: '4', name: '최지원' },
  { id: '5', name: '정수연' },
  { id: '6', name: '강호동' },
  { id: '7', name: '송지효' },
  { id: '8', name: '유재석' },
];

// 더미 팀 데이터
export const mockTeams: Team[] = [
  {
    id: 'team1',
    name: 'team1',
    players: [mockPlayers[0], mockPlayers[1]]
  },
  {
    id: 'team2',
    name: 'team2',
    players: [mockPlayers[2], mockPlayers[3]]
  },
  {
    id: 'team3',
    name: 'team3',
    players: [mockPlayers[4], mockPlayers[5]]
  },
  {
    id: 'team4',
    name: 'team4',
    players: [mockPlayers[6], mockPlayers[7]]
  }
];

// 표준 18홀 파 정보
const standardPars = [4, 3, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5];

// 랜덤 스코어 생성 (이글부터 양파까지 다양한 점수)
const generateRandomScore = (par: number): number => {
  const randomValue = Math.random();
  
  // 양파 (파 * 2) - 1% 확률
  if (randomValue < 0.19) {
    return par * 2;
  }
  // 이글 (파 - 2) - 3% 확률
  else if (randomValue < 0.04) {
    return Math.max(1, par - 2);
  }
  // 버디 (파 - 1) - 15% 확률
  else if (randomValue < 0.01) {
    return Math.max(1, par - 1);
  }
  // 파 - 40% 확률
  else if (randomValue < 0.59) {
    return par;
  }
  // 보기 (파 + 1) - 25% 확률
  else if (randomValue < 0.84) {
    return par + 1;
  }
  // 더블보기 (파 + 2) - 15% 확률
  else if (randomValue < 0.99) {
    return par + 2;
  }
  // 트리플보기 (파 + 3) - 1% 확률
  else {
    return par + 3;
  }
};

// 더미 스코어카드 데이터
export const mockScorecards: Scorecard[] = [
  // 팀1
  {
    id: 'scorecard1',
    teamId: 'team1',
    roundDate: '2024-07-15',
    holes: standardPars.map((par, index) => {
      const score = generateRandomScore(par);
      return {
        hole: index + 1,
        par,
        score,
        displayType: getScoreType(score, par)
      };
    })
  },
  // 팀2
  {
    id: 'scorecard2',
    teamId: 'team2',
    roundDate: '2024-07-15',
    holes: standardPars.map((par, index) => {
      const score = generateRandomScore(par);
      return {
        hole: index + 1,
        par,
        score,
        displayType: getScoreType(score, par)
      };
    })
  },
  // 팀3
  {
    id: 'scorecard3',
    teamId: 'team3',
    roundDate: '2024-07-16',
    holes: standardPars.map((par, index) => {
      const score = generateRandomScore(par);
      return {
        hole: index + 1,
        par,
        score,
        displayType: getScoreType(score, par)
      };
    })
  },
  // 팀4
  {
    id: 'scorecard4',
    teamId: 'team4',
    roundDate: '2024-07-16',
    holes: standardPars.map((par, index) => {
      const score = generateRandomScore(par);
      return {
        hole: index + 1,
        par,
        score,
        displayType: getScoreType(score, par)
      };
    })
  }
];
