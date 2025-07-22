import type { Team, Scorecard, Award, AwardStats, TeamAward, TeamAwardStats } from '../types/golf';

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
export const calculatePlayerStats = (scorecards: Scorecard[], teams: Team[]) => {
  const playerStats: { [playerId: string]: { doublepar: number; eagle: number; birdie: number; par: number; bogey: number; playerName: string; teamId: string; teamName: string } } = {};

  scorecards.forEach(scorecard => {
    const team = teams.find(t => t.id === scorecard.teamId);
    if (!team) return;

    scorecard.holes.forEach(hole => {
      const player = team.players.find(p => p.id === hole.playerId);
      if (!player) return;

      if (!playerStats[hole.playerId]) {
        playerStats[hole.playerId] = {
          doublepar: 0,
          eagle: 0,
          birdie: 0,
          par: 0,
          bogey: 0,
          playerName: player.name,
          teamId: team.id,
          teamName: team.name
        };
      }

      const scoreType = getScoreType(hole.score, hole.par);
      if (scoreType === 'doublepar') playerStats[hole.playerId].doublepar++;
      else if (scoreType === 'eagle') playerStats[hole.playerId].eagle++;
      else if (scoreType === 'birdie') playerStats[hole.playerId].birdie++;
      else if (scoreType === 'par') playerStats[hole.playerId].par++;
      else if (scoreType === 'bogey') playerStats[hole.playerId].bogey++;
    });
  });

  return playerStats;
};

// 어워드 계산
export const calculateAwards = (scorecards: Scorecard[], teams: Team[]): AwardStats => {
  const playerStats = calculatePlayerStats(scorecards, teams);

  const eagleAwards: Award[] = [];
  const birdieAwards: Award[] = [];
  const parAwards: Award[] = [];
  const bogeyAwards: Award[] = [];
  const doubleparAwards: Award[] = [];

  // 각 플레이어별로 어워드 생성
  Object.keys(playerStats).forEach(playerId => {
    const stats = playerStats[playerId];
    
    if (stats.eagle > 0) {
      eagleAwards.push({
        type: 'eagle',
        count: stats.eagle,
        playerId,
        playerName: stats.playerName,
        teamId: stats.teamId,
        teamName: stats.teamName
      });
    }
    if (stats.birdie > 0) {
      birdieAwards.push({
        type: 'birdie',
        count: stats.birdie,
        playerId,
        playerName: stats.playerName,
        teamId: stats.teamId,
        teamName: stats.teamName
      });
    }
    if (stats.par > 0) {
      parAwards.push({
        type: 'par',
        count: stats.par,
        playerId,
        playerName: stats.playerName,
        teamId: stats.teamId,
        teamName: stats.teamName
      });
    }
    if (stats.bogey > 0) {
      bogeyAwards.push({
        type: 'bogey',
        count: stats.bogey,
        playerId,
        playerName: stats.playerName,
        teamId: stats.teamId,
        teamName: stats.teamName
      });
    }
    if (stats.doublepar > 0) {
      doubleparAwards.push({
        type: 'doublepar',
        count: stats.doublepar,
        playerId,
        playerName: stats.playerName,
        teamId: stats.teamId,
        teamName: stats.teamName
      });
    }
  });

  // 각 어워드를 개수별로 내림차순 정렬
  eagleAwards.sort((a, b) => b.count - a.count);
  birdieAwards.sort((a, b) => b.count - a.count);
  parAwards.sort((a, b) => b.count - a.count);
  bogeyAwards.sort((a, b) => b.count - a.count);
  doubleparAwards.sort((a, b) => b.count - a.count);

  return {
    다이글상: eagleAwards,
    다버디상: birdieAwards,
    다파상: parAwards,
    다보기상: bogeyAwards,
    다양파상: doubleparAwards
  };
}
// 팀별 총합 계산 - 각 홀에서 팀의 최고 성과를 기준으로 계산
export const calculateTeamTotals = (scorecards: Scorecard[], teams: Team[]) => {
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
  });

  // 팀별로 각 홀에서의 최고 성과를 계산
  teams.forEach(team => {
    // 각 홀(1-18)에 대해 팀 최고 점수 계산
    for (let holeNumber = 1; holeNumber <= 18; holeNumber++) {
      const teamScorecardsForHole = scorecards
        .filter(scorecard => scorecard.teamId === team.id)
        .map(scorecard => scorecard.holes.find(hole => hole.hole === holeNumber))
        .filter(hole => hole !== undefined);

      if (teamScorecardsForHole.length > 0) {
        // 각 홀에서 팀의 최고 점수 (가장 낮은 타수) 찾기
        const bestHole = teamScorecardsForHole.reduce((best, current) => {
          return current!.score < best!.score ? current : best;
        });

        if (bestHole) {
          const scoreType = getScoreType(bestHole.score, bestHole.par);
          if (scoreType === 'doublepar') teamTotals[team.id].doublepar++;
          else if (scoreType === 'eagle') teamTotals[team.id].eagle++;
          else if (scoreType === 'birdie') teamTotals[team.id].birdie++;
          else if (scoreType === 'par') teamTotals[team.id].par++;
          else if (scoreType === 'bogey') teamTotals[team.id].bogey++;
        }
      }
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
