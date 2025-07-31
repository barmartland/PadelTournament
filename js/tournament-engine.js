/**
 * Shared Tournament Engine
 * Contains common functionality for all tournament formats
 */

class TournamentEngine {
    constructor(tournamentType) {
        this.tournamentType = tournamentType;
        this.playerCount = 4;
        this.matchPoints = 21; // Default points per match
        this.players = [];
        this.currentRound = 0;
        this.matches = [];
        this.tournamentStarted = false;
        this.tournamentComplete = false;
        this.roundHistory = [];
        
        this.init();
    }

    init() {
        this.generatePlayerInputs();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('player-count').addEventListener('change', (e) => {
            this.playerCount = parseInt(e.target.value);
            this.generatePlayerInputs();
        });

        document.getElementById('match-points').addEventListener('change', (e) => {
            this.matchPoints = parseInt(e.target.value);
        });

        document.getElementById('start-tournament').addEventListener('click', () => this.startTournament());
        document.getElementById('reset-tournament').addEventListener('click', () => this.resetTournament());
        document.getElementById('complete-round').addEventListener('click', () => this.completeAllMatches());
        document.getElementById('next-round').addEventListener('click', () => this.nextRound());
        
        const backBtn = document.getElementById('back-round');
        const homeBtn = document.getElementById('home-button');
        const endBtn = document.getElementById('end-tournament');
        
        if (backBtn) backBtn.addEventListener('click', () => this.goBackRound());
        if (homeBtn) homeBtn.addEventListener('click', () => this.goHome());
        if (endBtn) endBtn.addEventListener('click', () => this.endTournament());
        
        // Prevent browser back button from losing data
        window.addEventListener('beforeunload', (e) => {
            if (this.tournamentStarted) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    generatePlayerInputs() {
        const container = document.getElementById('player-inputs');
        container.innerHTML = '';
        
        const defaultNames = this.playerCount === 4 
            ? ['Player A', 'Player B', 'Player C', 'Player D']
            : ['Player A', 'Player B', 'Player C', 'Player D', 'Player E', 'Player F', 'Player G', 'Player H'];

        for (let i = 0; i < this.playerCount; i++) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label>Player ${i + 1}</label>
                <input type="text" id="player-${i}" value="${defaultNames[i]}" placeholder="Player ${String.fromCharCode(65 + i)}">
            `;
            container.appendChild(div);
        }
    }

    initializePlayers() {
        this.players = [];
        for (let i = 0; i < this.playerCount; i++) {
            const name = document.getElementById(`player-${i}`).value || `Player ${String.fromCharCode(65 + i)}`;
            const player = {
                id: i,
                name: name,
                totalPoints: 0
            };
            
            // Add tournament-specific properties
            if (this.tournamentType === 'americano') {
                player.partnerships = new Set();
                player.opponents = new Set();
            }
            
            this.players.push(player);
        }
    }

    startTournament() {
        this.initializePlayers();
        this.currentRound = 1;
        this.matches = this.generateRoundMatches();
        this.tournamentStarted = true;
        
        document.getElementById('setup-phase').classList.add('hidden');
        document.getElementById('tournament-phase').classList.remove('hidden');
        
        this.updateUI();
    }

    updateMatchScore(matchId, team, score) {
        const match = this.matches.find(m => m.id === matchId);
        if (match) {
            const newScore = Math.max(0, parseInt(score) || 0);
            const oldScore = match[`${team}Score`];
            match[`${team}Score`] = newScore;
            
            // Auto-populate the other team's score if this score is valid and changed
            if (newScore !== oldScore && newScore > 0 && newScore <= this.matchPoints) {
                const otherTeam = team === 'team1' ? 'team2' : 'team1';
                const remainingPoints = this.matchPoints - newScore;
                if (remainingPoints >= 0) {
                    match[`${otherTeam}Score`] = remainingPoints;
                }
            }
            
            // If points were already awarded, update player points immediately
            if (match.pointsAwarded) {
                this.updatePlayerPointsForMatch(match);
            }
            
            this.renderMatches();
            this.renderLeaderboard();
        }
    }

    updatePlayerPointsForMatch(match) {
        // First, subtract the previously awarded points
        this.players.forEach(player => {
            if (match.team1.includes(player.id)) {
                player.totalPoints -= match.team1PointsAwarded;
            } else if (match.team2.includes(player.id)) {
                player.totalPoints -= match.team2PointsAwarded;
            }
        });
        
        // Then add the new points
        match.team1PointsAwarded = match.team1Score;
        match.team2PointsAwarded = match.team2Score;
        
        this.players.forEach(player => {
            if (match.team1.includes(player.id)) {
                player.totalPoints += match.team1PointsAwarded;
            } else if (match.team2.includes(player.id)) {
                player.totalPoints += match.team2PointsAwarded;
            }
        });
    }

    completeAllMatches() {
        let allValid = true;
        
        // Check if all matches have valid scores
        this.matches.forEach(match => {
            if (match.team1Score + match.team2Score !== this.matchPoints) {
                allValid = false;
            }
        });
        
        if (!allValid) {
            alert(`Please ensure all matches have scores that total exactly ${this.matchPoints} points.`);
            return;
        }

        this.matches.forEach(match => {
            if (!match.pointsAwarded && match.team1Score + match.team2Score === this.matchPoints) {
                this.awardPointsForMatch(match);
                match.pointsAwarded = true;
            }
        });
        this.updateUI();
    }

    awardPointsForMatch(match) {
        // Award points and track partnerships (tournament-specific logic)
        match.team1PointsAwarded = match.team1Score;
        match.team2PointsAwarded = match.team2Score;
        
        this.players.forEach(player => {
            if (match.team1.includes(player.id)) {
                if (this.tournamentType === 'americano') {
                    const partner = match.team1.find(id => id !== player.id);
                    player.partnerships.add(partner);
                    match.team2.forEach(oppId => player.opponents.add(oppId));
                }
                player.totalPoints += match.team1Score;
            } else if (match.team2.includes(player.id)) {
                if (this.tournamentType === 'americano') {
                    const partner = match.team2.find(id => id !== player.id);
                    player.partnerships.add(partner);
                    match.team1.forEach(oppId => player.opponents.add(oppId));
                }
                player.totalPoints += match.team2Score;
            }
        });
    }

    saveRoundState() {
        const state = {
            round: this.currentRound,
            players: JSON.parse(JSON.stringify(this.players.map(p => {
                if (this.tournamentType === 'americano') {
                    return {
                        ...p,
                        partnerships: Array.from(p.partnerships),
                        opponents: Array.from(p.opponents)
                    };
                }
                return p;
            }))),
            matches: JSON.parse(JSON.stringify(this.matches))
        };
        this.roundHistory.push(state);
    }

    nextRound() {
        // Save current state before moving to next round
        this.saveRoundState();
        
        if (this.shouldEndTournament()) {
            this.tournamentComplete = true;
            this.updateUI();
            return;
        }

        this.currentRound++;
        this.matches = this.generateRoundMatches();
        
        if (this.matches.length === 0) {
            this.tournamentComplete = true;
        }
        
        this.updateUI();
    }

    goBackRound() {
        if (this.roundHistory.length === 0) return;
        
        if (confirm('Are you sure you want to go back to the previous round? Current round progress will be lost.')) {
            const previousState = this.roundHistory.pop();
            this.currentRound = previousState.round;
            
            // Restore players state
            if (this.tournamentType === 'americano') {
                this.players = previousState.players.map(p => ({
                    ...p,
                    partnerships: new Set(p.partnerships),
                    opponents: new Set(p.opponents)
                }));
            } else {
                this.players = previousState.players;
            }
            
            this.matches = previousState.matches;
            this.tournamentComplete = false;
            
            this.updateUI();
        }
    }

    goHome() {
        if (this.tournamentStarted && confirm('Are you sure you want to return to home? All tournament progress will be lost.')) {
            window.location.href = 'index.html';
        } else if (!this.tournamentStarted) {
            window.location.href = 'index.html';
        }
    }

    endTournament() {
        if (confirm('Are you sure you want to end the tournament? Current standings will be the final results.')) {
            this.tournamentComplete = true;
            this.updateUI();
        }
    }

    resetTournament() {
        this.playerCount = parseInt(document.getElementById('player-count').value);
        this.matchPoints = parseInt(document.getElementById('match-points').value);
        this.players = [];
        this.currentRound = 0;
        this.matches = [];
        this.tournamentStarted = false;
        this.tournamentComplete = false;
        this.roundHistory = [];
        
        document.getElementById('setup-phase').classList.remove('hidden');
        document.getElementById('tournament-phase').classList.add('hidden');
        
        this.generatePlayerInputs();
    }

    renderMatches() {
        const container = document.getElementById('matches-container');
        container.innerHTML = '';

        this.matches.forEach(match => {
            const matchDiv = document.createElement('div');
            const totalScore = match.team1Score + match.team2Score;
            const hasError = totalScore > this.matchPoints;
            const isIncomplete = totalScore < this.matchPoints && totalScore > 0;
            
            let className = 'match-card';
            if (hasError) className += ' error';
            else if (isIncomplete) className += ' incomplete';
            
            matchDiv.className = className;
            
            const team1Names = `${this.players.find(p => p.id === match.team1[0]).name} & ${this.players.find(p => p.id === match.team1[1]).name}`;
            const team2Names = `${this.players.find(p => p.id === match.team2[0]).name} & ${this.players.find(p => p.id === match.team2[1]).name}`;
            
            let statusMessage = '';
            if (hasError) {
                statusMessage = `<div class="error-message">⚠️ Total score cannot exceed ${this.matchPoints} points</div>`;
            } else if (isIncomplete) {
                const remaining = this.matchPoints - totalScore;
                statusMessage = `<div class="info-message">ℹ️ Need ${remaining} more point${remaining === 1 ? '' : 's'} to reach ${this.matchPoints}</div>`;
            }
            
            // Disable inputs if tournament is complete
            const inputDisabled = this.tournamentComplete || match.pointsAwarded;
            
            matchDiv.innerHTML = `
                <div class="match-teams">
                    <div>${team1Names}</div>
                    <div class="match-vs">VS</div>
                    <div>${team2Names}</div>
                </div>
                <div class="match-score">
                    <div class="score-inputs">
                        <input type="number" class="score-input" min="0" max="${this.matchPoints}"
                               value="${match.team1Score || ''}" 
                               placeholder="0"
                               ${inputDisabled ? 'disabled' : ''}
                               onchange="tournament.updateMatchScore('${match.id}', 'team1', this.value)">
                        <span>-</span>
                        <input type="number" class="score-input" min="0" max="${this.matchPoints}"
                               value="${match.team2Score || ''}" 
                               placeholder="0"
                               ${inputDisabled ? 'disabled' : ''}
                               onchange="tournament.updateMatchScore('${match.id}', 'team2', this.value)">
                    </div>
                    ${match.pointsAwarded ? 
                        '<span style="color: #10b981; font-weight: 500;">✅ Points Awarded</span>' :
                        (this.tournamentComplete ? '<span style="color: #f59e0b; font-weight: 500;">🏁 Tournament Ended</span>' : '')
                    }
                </div>
                ${statusMessage}
            `;
            
            container.appendChild(matchDiv);
        });

        // Show complete round or next round button
        const allMatchesHaveScores = this.matches.every(match => match.team1Score + match.team2Score === this.matchPoints);
        const hasErrors = this.matches.some(match => match.team1Score + match.team2Score > this.matchPoints);
        const allPointsAwarded = this.matches.every(match => match.pointsAwarded);
        const completeRoundBtn = document.getElementById('complete-round');
        const nextRoundBtn = document.getElementById('next-round');
        
        if (allPointsAwarded && !this.tournamentComplete) {
            completeRoundBtn.classList.add('hidden');
            nextRoundBtn.classList.remove('hidden');
        } else if (allMatchesHaveScores && !hasErrors) {
            completeRoundBtn.classList.remove('hidden');
            nextRoundBtn.classList.add('hidden');
        } else {
            completeRoundBtn.classList.add('hidden');
            nextRoundBtn.classList.add('hidden');
        }

        // Hide buttons if tournament is complete
        if (this.tournamentComplete) {
            nextRoundBtn.classList.add('hidden');
            completeRoundBtn.classList.add('hidden');
            
            // Also hide End Tournament button
            const endBtn = document.getElementById('end-tournament');
            if (endBtn) {
                endBtn.style.display = 'none';
            }
        }
    }

    renderLeaderboard() {
        const container = document.getElementById('leaderboard-container');
        const sortedPlayers = [...this.players].sort((a, b) => b.totalPoints - a.totalPoints);
        
        container.innerHTML = '';
        
        // Track positions considering ties
        let currentRank = 1;
        let previousScore = null;
        
        sortedPlayers.forEach((player, index) => {
            const div = document.createElement('div');
            
            // Update rank only if score is different from previous
            if (previousScore !== null && player.totalPoints !== previousScore) {
                currentRank = index + 1;
            }
            
            // Determine styling - tied players get same styling
            let className = 'leaderboard-item ';
            if (currentRank === 1) className += 'first';
            else if (currentRank === 2) className += 'second';
            else if (currentRank === 3) className += 'third';
            else className += 'other';
            
            div.className = className;
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="player-rank">#${currentRank}${player.totalPoints === sortedPlayers[0].totalPoints && sortedPlayers.filter(p => p.totalPoints === sortedPlayers[0].totalPoints).length > 1 ? ' (tied)' : ''}</span>
                    <span style="font-weight: 500;">${player.name}</span>
                </div>
                <span class="player-points">${player.totalPoints}</span>
            `;
            
            container.appendChild(div);
            previousScore = player.totalPoints;
        });
        
        // Show winner banner if tournament is complete
        if (this.tournamentComplete && sortedPlayers.length > 0) {
            const winnerBanner = document.getElementById('winner-banner');
            if (winnerBanner) {
                const highestScore = sortedPlayers[0].totalPoints;
                const winners = sortedPlayers.filter(player => player.totalPoints === highestScore);
                
                const winnerNameElement = document.getElementById('winner-name');
                const winnerScoreElement = document.getElementById('winner-score');
                
                if (winners.length === 1) {
                    // Single winner
                    winnerNameElement.textContent = winners[0].name;
                    winnerBanner.querySelector('div:nth-child(2)').innerHTML = 
                        `<span style="font-size: 1.5rem; font-weight: bold; color: #10b981; margin-bottom: 0.5rem;">Tournament Winner: <span id="winner-name">${winners[0].name}</span>!</span>`;
                } else {
                    // Multiple winners (tie)
                    const winnerNames = winners.map(w => w.name).join(' & ');
                    winnerNameElement.textContent = winnerNames;
                    winnerBanner.querySelector('div:nth-child(2)').innerHTML = 
                        `<span style="font-size: 1.5rem; font-weight: bold; color: #10b981; margin-bottom: 0.5rem;">Tournament Winners (Tie): <span id="winner-name">${winnerNames}</span>!</span>`;
                }
                
                winnerScoreElement.textContent = highestScore;
                winnerBanner.classList.remove('hidden');
            }
        } else {
            const winnerBanner = document.getElementById('winner-banner');
            if (winnerBanner) winnerBanner.classList.add('hidden');
        }
    }

    updateUI() {
        this.updateRoundHeader();
        this.updateBackButton();
        this.renderMatches();
        this.renderLeaderboard();
    }

    updateBackButton() {
        const backBtn = document.getElementById('back-round');
        if (backBtn) {
            if (this.roundHistory.length > 0) {
                backBtn.classList.remove('hidden');
            } else {
                backBtn.classList.add('hidden');
            }
        }
    }

    // Tournament-specific methods to be overridden
    generateRoundMatches() {
        throw new Error('generateRoundMatches must be implemented by tournament subclass');
    }

    shouldEndTournament() {
        throw new Error('shouldEndTournament must be implemented by tournament subclass');
    }

    updateRoundHeader() {
        throw new Error('updateRoundHeader must be implemented by tournament subclass');
    }
}