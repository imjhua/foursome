import type { Team, Scorecard, TeamAward, TeamAwardStats } from '../types/golf';

// 홀별 스코어 타입 계산
export const getScoreType = (score: number, par: number): 'doublepar' | 'eagle' | 'birdie' | 'par' | 'bogey' | 'double-bogey' | 'triple-bogey' | 'other' => {
  if (score === par * 2) return 'doublepar'; // 양파: 파 × 2
  const diff = score - par;
  if (diff === -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  // 더블보기, 트리플보기 제거
  return 'other';
};

// 플레이어별 스코어 통계 계산
// playerId가 제거되어 플레이어별 통계 함수는 더 이상 사용하지 않음


// 어워드 계산
// 플레이어별 어워드 계산은 playerId 제거로 인해 비활성화됨
// 필요시 팀별 어워드만 사용
// 팀별 총합 계산 - 각 홀에서 팀의 최고 성과를 기준으로 계산
export const calculateTeamTotals = (scorecards: Scorecard[], teams: Team[]) => {
  // 포섬: 팀별로 scorecard 1개만 사용, 그 holes만 카운트
  const teamTotals: { [teamId: string]: { doublepar: number; eagle: number; birdie: number; par: number; bogey: number; teamName: string } } = {};

  teams.forEach(team => {
    teamTotals[team.id] = {
      doublepar: 0,
      eagle: 0,
      birdie: 0,
      par: 0,
      bogey: 0,
      teamName: team.name
    };
    // 해당 팀의 scorecard 1개만 사용
    const teamScorecard = scorecards.find(scorecard => scorecard.teamId === team.id);
    if (teamScorecard) {
      // displayType이 있는 경우만 카운트 (없으면 0)
      const counts = { doublepar: 0, eagle: 0, birdie: 0, par: 0, bogey: 0 };
      teamScorecard.holes.forEach(hole => {
        if (typeof hole.displayType === 'string') {
          const type = hole.displayType;
          
          if (type === 'eagle') counts.eagle++;
          if (type === 'birdie') counts.birdie++;
          if (type === 'par') counts.par++;
          if (type === 'bogey') counts.bogey++;
          if (type === 'doublepar') counts.doublepar++;
        }
      });
      
      teamTotals[team.id] = { ...counts, teamName: team.name };
    }
  });

  return teamTotals;
};

// 팀별 어워드 계산 (3위까지, 동점 처리)
export const calculateTeamAwards = (scorecards: Scorecard[], teams: Team[]): TeamAwardStats => {
  const teamTotals = calculateTeamTotals(scorecards, teams);
  
  // 각 카테고리별 팀 데이터 수집
  const eagleTeams = Object.entries(teamTotals)
    .map(([teamId, stats]) => ({
      type: 'eagle' as const,
      count: stats.eagle,
      teamId,
      teamName: stats.teamName,
      rank: 1
    }))
    .filter(team => team.count > 0);

  const birdieTeams = Object.entries(teamTotals)
    .map(([teamId, stats]) => ({
      type: 'birdie' as const,
      count: stats.birdie,
      teamId,
      teamName: stats.teamName,
      rank: 1
    }))
    .filter(team => team.count > 0);

  const parTeams = Object.entries(teamTotals)
    .map(([teamId, stats]) => ({
      type: 'par' as const,
      count: stats.par,
      teamId,
      teamName: stats.teamName,
      rank: 1
    }))
    .filter(team => team.count > 0);

  const bogeyTeams = Object.entries(teamTotals)
    .map(([teamId, stats]) => ({
      type: 'bogey' as const,
      count: stats.bogey,
      teamId,
      teamName: stats.teamName,
      rank: 1
    }))
    .filter(team => team.count > 0);


  const doubleparTeams = Object.entries(teamTotals)
    .map(([teamId, stats]) => ({
      type: 'doublepar' as const,
      count: stats.doublepar,
      teamId,
      teamName: stats.teamName,
      rank: 1
    }))
    .filter(team => team.count > 0);

  // 순위 계산 함수 (동점 처리, 3위까지)
  const calculateRanks = (teams: TeamAward[]): TeamAward[] => {
    // 개수별로 내림차순 정렬
    teams.sort((a, b) => b.count - a.count);
    
    if (teams.length === 0) return [];
    
    const rankedTeams: TeamAward[] = [];
    let currentRank = 1;
    let previousCount = teams[0].count;
    
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      
      // 이전 팀과 점수가 다르면 순위 업데이트
      if (team.count !== previousCount) {
        currentRank = i + 1;
        previousCount = team.count;
      }
      
      // 3위까지만 포함
      if (currentRank <= 3) {
        rankedTeams.push({
          ...team,
          rank: currentRank
        });
      } else {
        break;
      }
    }
    
    return rankedTeams;
  };

  return {
    다이글상: calculateRanks(eagleTeams),
    다버디상: calculateRanks(birdieTeams),
    다파상: calculateRanks(parTeams),
    다보기상: calculateRanks(bogeyTeams),
    다양파상: calculateRanks(doubleparTeams)
  };
};
