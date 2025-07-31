/**
 * Americano Tournament Implementation
 * Extends the base TournamentEngine with Americano-specific logic
 */

class AmericanoTournament extends TournamentEngine {
    constructor() {
        super('americano');
    }

    generatePartnerships(playerIds) {
        const partnerships = [];
        for (let i = 0; i < playerIds.length; i++) {
            for (let j = i + 1; j < playerIds.length; j++) {
                partnerships.push([playerIds[i], playerIds[j]]);
            }
        }
        return partnerships;
    }

    generateRoundMatches() {
        const playerIds = this.players.map(p => p.id);
        const allPartnerships = this.generatePartnerships(playerIds);
        
        // Filter partnerships that haven't been used yet
        const availablePartnerships = allPartnerships.filter(([p1, p2]) => {
            const player1 = this.players.find(p => p.id === p1);
            const player2 = this.players.find(p => p.id === p2);
            return !player1.partnerships.has(p2) && !player2.partnerships.has(p1);
        });

        if (availablePartnerships.length < 2) {
            this.tournamentComplete = true;
            return [];
        }

        const roundMatches = [];

        if (this.playerCount === 4) {
            // Simple case: pick first available partnership and find opponents
            const team1 = availablePartnerships[0];
            const remainingPlayers = playerIds.filter(id => !team1.includes(id));
            const team2 = remainingPlayers;
            
            roundMatches.push({
                id: `round-${this.currentRound}-match-0`,
                team1: team1,
                team2: team2,
                team1Score: 0,
                team2Score: 0,
                pointsAwarded: false,
                team1PointsAwarded: 0,
                team2PointsAwarded: 0
            });
        } else {
            // For 8 players: more complex pairing needed
            const usedPlayers = new Set();
            let matchIndex = 0;
            const matchesPerRound = 2;
            
            for (const partnership of availablePartnerships) {
                if (matchIndex >= matchesPerRound) break;
                
                const [p1, p2] = partnership;
                if (usedPlayers.has(p1) || usedPlayers.has(p2)) continue;
                
                // Find opponents from remaining players
                const remainingPlayers = playerIds.filter(id => 
                    !usedPlayers.has(id) && !partnership.includes(id)
                );
                
                if (remainingPlayers.length >= 2) {
                    // Try to find a good opponent pair
                    let bestOpponentPair = null;
                    let minPreviousEncounters = Infinity;
                    
                    for (let i = 0; i < remainingPlayers.length; i++) {
                        for (let j = i + 1; j < remainingPlayers.length; j++) {
                            const opp1 = remainingPlayers[i];
                            const opp2 = remainingPlayers[j];
                            
                            if (usedPlayers.has(opp1) || usedPlayers.has(opp2)) continue;
                            
                            // Count previous encounters
                            const player1 = this.players.find(p => p.id === p1);
                            const player2 = this.players.find(p => p.id === p2);
                            const encounters = 
                                (player1.opponents.has(opp1) ? 1 : 0) +
                                (player1.opponents.has(opp2) ? 1 : 0) +
                                (player2.opponents.has(opp1) ? 1 : 0) +
                                (player2.opponents.has(opp2) ? 1 : 0);
                            
                            if (encounters < minPreviousEncounters) {
                                minPreviousEncounters = encounters;
                                bestOpponentPair = [opp1, opp2];
                            }
                        }
                    }
                    
                    if (bestOpponentPair) {
                        roundMatches.push({
                            id: `round-${this.currentRound}-match-${matchIndex}`,
                            team1: partnership,
                            team2: bestOpponentPair,
                            team1Score: 0,
                            team2Score: 0,
                            pointsAwarded: false,
                            team1PointsAwarded: 0,
                            team2PointsAwarded: 0
                        });
                        
                        partnership.forEach(id => usedPlayers.add(id));
                        bestOpponentPair.forEach(id => usedPlayers.add(id));
                        matchIndex++;
                    }
                }
            }
        }

        return roundMatches;
    }

    shouldEndTournament() {
        const maxRounds = this.playerCount === 4 ? 3 : 7;
        return this.currentRound >= maxRounds;
    }

    updateRoundHeader() {
        const maxRounds = this.playerCount === 4 ? 3 : 7;
        document.getElementById('round-header').textContent = 
            `Round ${this.currentRound} of ${maxRounds}${this.tournamentComplete ? ' - Tournament Complete!' : ''}`;
    }
}