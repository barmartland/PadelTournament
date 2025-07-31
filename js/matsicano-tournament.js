/**
 * Matsicano Tournament Implementation
 * Extends the base TournamentEngine with Matsicano-specific logic
 * First plays one round of Americano, then continues with Mexicano format
 * Trademark and inventor: Mats T.
 */

class MatsicanoTournament extends TournamentEngine {
    constructor() {
        super('matsicano');
        this.americanoPhase = true;  // Start with Americano phase
        this.americanoRoundCompleted = false;
    }

    initializePlayers() {
        super.initializePlayers();
        
        // Add partnerships tracking for Americano phase
        this.players.forEach(player => {
            player.partnerships = new Set();
            player.opponents = new Set();
        });
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
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
        if (this.americanoPhase && !this.americanoRoundCompleted) {
            // First round: Use Americano logic (everyone partners with everyone)
            return this.generateAmericanoMatches();
        } else {
            // Subsequent rounds: Use Mexicano logic (rank-based pairing)
            return this.generateMexicanoMatches();
        }
    }

    generateAmericanoMatches() {
        const playerIds = this.players.map(p => p.id);
        const allPartnerships = this.generatePartnerships(playerIds);
        
        // Filter partnerships that haven't been used yet
        const availablePartnerships = allPartnerships.filter(([p1, p2]) => {
            const player1 = this.players.find(p => p.id === p1);
            const player2 = this.players.find(p => p.id === p2);
            return !player1.partnerships.has(p2) && !player2.partnerships.has(p1);
        });

        // If no partnerships available, switch to Mexicano phase
        if (availablePartnerships.length === 0) {
            this.americanoPhase = false;
            this.americanoRoundCompleted = true;
            return this.generateMexicanoMatches();
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

    generateMexicanoMatches() {
        const roundMatches = [];
        
        // Rank-based pairing (Mexicano style)
        const sortedPlayers = [...this.players].sort((a, b) => b.totalPoints - a.totalPoints);
        
        if (this.playerCount === 4) {
            // 1st & 3rd vs 2nd & 4th
            roundMatches.push({
                id: `round-${this.currentRound}-match-0`,
                team1: [sortedPlayers[0].id, sortedPlayers[2].id],
                team2: [sortedPlayers[1].id, sortedPlayers[3].id],
                team1Score: 0,
                team2Score: 0,
                pointsAwarded: false,
                team1PointsAwarded: 0,
                team2PointsAwarded: 0
            });
        } else {
            // 8 players: 1st&3rd vs 2nd&4th, 5th&7th vs 6th&8th
            roundMatches.push({
                id: `round-${this.currentRound}-match-0`,
                team1: [sortedPlayers[0].id, sortedPlayers[2].id],
                team2: [sortedPlayers[1].id, sortedPlayers[3].id],
                team1Score: 0,
                team2Score: 0,
                pointsAwarded: false,
                team1PointsAwarded: 0,
                team2PointsAwarded: 0
            });
            roundMatches.push({
                id: `round-${this.currentRound}-match-1`,
                team1: [sortedPlayers[4].id, sortedPlayers[6].id],
                team2: [sortedPlayers[5].id, sortedPlayers[7].id],
                team1Score: 0,
                team2Score: 0,
                pointsAwarded: false,
                team1PointsAwarded: 0,
                team2PointsAwarded: 0
            });
        }

        return roundMatches;
    }

    awardPointsForMatch(match) {
        // Award points and track partnerships (only during Americano phase)
        match.team1PointsAwarded = match.team1Score;
        match.team2PointsAwarded = match.team2Score;
        
        this.players.forEach(player => {
            if (match.team1.includes(player.id)) {
                if (this.americanoPhase || !this.americanoRoundCompleted) {
                    const partner = match.team1.find(id => id !== player.id);
                    player.partnerships.add(partner);
                    match.team2.forEach(oppId => player.opponents.add(oppId));
                }
                player.totalPoints += match.team1Score;
            } else if (match.team2.includes(player.id)) {
                if (this.americanoPhase || !this.americanoRoundCompleted) {
                    const partner = match.team2.find(id => id !== player.id);
                    player.partnerships.add(partner);
                    match.team1.forEach(oppId => player.opponents.add(oppId));
                }
                player.totalPoints += match.team2Score;
            }
        });
    }

    nextRound() {
        // Simple check: Americano phase ends after fixed number of rounds
        if (this.americanoPhase) {
            const maxAmericanoRounds = this.playerCount === 4 ? 3 : 7;
            
            if (this.currentRound >= maxAmericanoRounds) {
                this.americanoPhase = false;
                this.americanoRoundCompleted = true;
            }
        }
        
        // Continue with normal next round logic
        super.nextRound();
    }

    shouldEndTournament() {
        // Matsicano can continue indefinitely after Americano phase is complete
        return false;
    }

    updateRoundHeader() {
        const phaseText = this.americanoPhase ? "Americano Phase" : "Mexicano Phase";
        document.getElementById('round-header').textContent = `Round ${this.currentRound} - ${phaseText}`;
        
        // Update pairing explanation
        const explanation = document.getElementById('pairing-explanation');
        if (explanation) {
            if (this.americanoPhase) {
                explanation.innerHTML = `
                    <strong>🔄 Americano Phase:</strong> Everyone partners with everyone else exactly once to establish initial rankings.
                `;
            } else {
                const pairingText = this.playerCount === 4 
                    ? "🏆 Mexicano Phase: Rank-based pairing - 1st & 3rd place vs 2nd & 4th place"
                    : "🏆 Mexicano Phase: Rank-based pairing - 1st & 3rd vs 2nd & 4th, 5th & 7th vs 6th & 8th";
                explanation.innerHTML = `<strong>${pairingText}</strong>`;
            }
        }
    }

    resetTournament() {
        this.americanoPhase = true;
        this.americanoRoundCompleted = false;
        super.resetTournament();
    }

    saveRoundState() {
        const state = {
            round: this.currentRound,
            americanoPhase: this.americanoPhase,
            americanoRoundCompleted: this.americanoRoundCompleted,
            players: JSON.parse(JSON.stringify(this.players.map(p => ({
                ...p,
                partnerships: Array.from(p.partnerships),
                opponents: Array.from(p.opponents)
            })))),
            matches: JSON.parse(JSON.stringify(this.matches))
        };
        this.roundHistory.push(state);
    }

    goBackRound() {
        if (this.roundHistory.length === 0) return;
        
        if (confirm('Are you sure you want to go back to the previous round? Current round progress will be lost.')) {
            const previousState = this.roundHistory.pop();
            this.currentRound = previousState.round;
            this.americanoPhase = previousState.americanoPhase;
            this.americanoRoundCompleted = previousState.americanoRoundCompleted;
            
            // Restore players state
            this.players = previousState.players.map(p => ({
                ...p,
                partnerships: new Set(p.partnerships),
                opponents: new Set(p.opponents)
            }));
            
            this.matches = previousState.matches;
            this.tournamentComplete = false;
            
            this.updateUI();
        }
    }
}