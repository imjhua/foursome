// 골프 스코어 관련 타입 정의
export interface Player {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export interface HoleScore {
  hole: number; // 홀 번호 (1-18)
  par: number; // 홀의 파 수
  score: number; // 실제 스코어
  playerId: string;
}

export interface Scorecard {
  id: string;
  teamId: string;
  roundDate: string;
  holes: HoleScore[];
}

export interface Award {
  type: 'doublepar' | 'eagle' | 'birdie' | 'par' | 'bogey' | 'double-bogey';
  count: number;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
}

export interface TeamAward {
  type: 'doublepar' | 'eagle' | 'birdie' | 'par' | 'bogey' | 'double-bogey';
  count: number;
  teamId: string;
  teamName: string;
  rank: number;
}

export interface AwardStats {
  다양파상: Award[];
  다이글상: Award[];
  다버디상: Award[];
  다파상: Award[];
  다보기상: Award[];
}

export interface TeamAwardStats {
  다양파상: TeamAward[];
  다이글상: TeamAward[];
  다버디상: TeamAward[];
  다파상: TeamAward[];
  다보기상: TeamAward[];
}
