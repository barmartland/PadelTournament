/**
 * Mexicano Tournament Implementation
 * Extends the base TournamentEngine with Mexicano-specific logic
 */

class MexicanoTournament extends TournamentEngine {
    constructor() {
        super('mexicano');
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    generateRoundMatches() {
        const roundMatches = [];

        if (this.currentRound === 1) {
            // First round: Random pairing
            const shuffledPlayers = this.shuffleArray(this.players.map(p => p.id));
            
            if (this.playerCount === 4) {
                roundMatches.push({
                    id: `round-${this.currentRound}-match-0`,
                    team1: [shuffledPlayers[0], shuffledPlayers[1]],
                    team2: [shuffledPlayers[2], shuffledPlayers[3]],
                    team1Score: 0,
                    team2Score: 0,
                    pointsAwarded: false,
                    team1PointsAwarded: 0,
                    team2PointsAwarded: 0
                });
            } else {
                // 8 players: 2 matches
                roundMatches.push({
                    id: `round-${this.currentRound}-match-0`,
                    team1: [shuffledPlayers[0], shuffledPlayers[1]],
                    team2: [shuffledPlayers[2], shuffledPlayers[3]],
                    team1Score: 0,
                    team2Score: 0,
                    pointsAwarded: false,
                    team1PointsAwarded: 0,
                    team2PointsAwarded: 0
                });
                roundMatches.push({
                    id: `round-${this.currentRound}-match-1`,
                    team1: [shuffledPlayers[4], shuffledPlayers[5]],
                    team2: [shuffledPlayers[6], shuffledPlayers[7]],
                    team1Score: 0,
                    team2Score: 0,
                    pointsAwarded: false,
                    team1PointsAwarded: 0,
                    team2PointsAwarded: 0
                });
            }
        } else {
            // Subsequent rounds: Rank-based pairing
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
        }

        return roundMatches;
    }

    shouldEndTournament() {
        // Mexicano can continue indefinitely, no specific end condition
        return false;
    }

    updateRoundHeader() {
        document.getElementById('round-header').textContent = `Round ${this.currentRound}`;
        
        // Update pairing explanation
        const explanation = document.getElementById('pairing-explanation');
        if (explanation) {
            if (this.currentRound === 1) {
                explanation.textContent = "🎲 First round: Players are paired randomly to establish initial rankings.";
            } else {
                const pairingText = this.playerCount === 4 
                    ? "🏆 Rank-based pairing: 1st & 3rd place vs 2nd & 4th place"
                    : "🏆 Rank-based pairing: 1st & 3rd vs 2nd & 4th, 5th & 7th vs 6th & 8th";
                explanation.textContent = pairingText;
            }
        }
    }
}