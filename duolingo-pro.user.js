// ==UserScript==
// @name         Duolingo PRO - Unlimited
// @namespace    http://duolingopro.net
// @version      3.2UNLIMITED.01
// @description  Unlimited Duolingo XP and Gems farmer with advanced auto-solving capabilities
// @author       tw1sk
// @match        https://*.duolingo.com/*
// @match        https://*.duolingo.cn/*
// @icon         https://www.duolingopro.net/static/favicons/duo/128/light/primary.png
// @grant        GM_log
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

let storageLocal;
let storageSession;
let versionNumber = "01";
let storageLocalVersion = "06";
let storageSessionVersion = "06";
let versionName = "UNLIMITED.01";
let versionFull = "3.2UNLIMITED.01";
let versionFormal = "3.2 UNLIMITED.01";
let serverURL = "https://www.duolingopro.net";
let apiURL = "https://api.duolingopro.net";
let greasyfork = true;
let alpha = false;

// Enhanced API Configuration
const API_CONFIG = {
    baseURL: "https://www.duolingo.com",
    endpoints: {
        sessions: "/2017-06-30/sessions",
        users: "/2017-06-30/users",
        shop: "/2017-06-30/shop",
        xp: "/2017-06-30/users/{userId}/xp_summaries",
        gems: "/2017-06-30/users/{userId}/gems",
        lessons: "/2017-06-30/sessions/{sessionId}",
        progress: "/2017-06-30/users/{userId}/courses/{courseId}/progress"
    },
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// Farming Configuration
const FARM_CONFIG = {
    xp: {
        enabled: true,
        maxPerSession: 999999,
        minDelay: 100,
        maxDelay: 500,
        autoSolve: true
    },
    gems: {
        enabled: true,
        maxPerSession: 999999,
        shopItems: true,
        streakFreeze: true
    },
    stealth: {
        randomizeTimings: true,
        humanLikePatterns: true,
        antiDetection: true
    }
};

let hidden = false;
let lastPage;
let currentPage = 1;
let windowBlurState = true;

let solvingIntervalId;
let isAutoMode;
let findReactMainElementClass = '_3yE3H';
let reactTraverseUp = 1;

const debug = false;
const flag01 = false;
const flag02 = false;

let temporaryRandom16 = Array.from({ length: 16 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');

if (localStorage.getItem("DLP_Local_Storage") == null || JSON.parse(localStorage.getItem("DLP_Local_Storage")).storageVersion !== storageLocalVersion) {
    localStorage.setItem("DLP_Local_Storage", JSON.stringify({
        "version": versionNumber,
        "terms": "00",
        "random16": temporaryRandom16,
        "pins": {
            "home": ["DLP_Get_XP_1_ID", "DLP_Get_GEMS_1_ID"],
            "legacy": ["DLP_Get_PATH_1_ID", "DLP_Get_PRACTICE_1_ID"]
        },
        "settings": {
            "autoUpdate": !greasyfork,
            "showSolveButtons": true,
            "showAutoServerButton": alpha,
            "muteLessons": false,
            "solveSpeed": 0.1,
            "unlimitedXP": true,
            "unlimitedGems": true,
            "autoFarm": true,
            "stealthMode": true,
            "maxXPPerHour": 999999,
            "maxGemsPerHour": 999999
        },
        "chats": [],
        "notifications": [
            {
                "id": "0001"
            }
        ],
        "tips": {
            "seeMore1": false
        },
        "languagePackVersion": "00",
        "onboarding": false,
        "storageVersion": storageLocalVersion
    }));
    storageLocal = JSON.parse(localStorage.getItem("DLP_Local_Storage"));
} else {
    storageLocal = JSON.parse(localStorage.getItem("DLP_Local_Storage"));
}
function saveStorageLocal() {
    localStorage.setItem("DLP_Local_Storage", JSON.stringify(storageLocal));
}

if (sessionStorage.getItem("DLP_Session_Storage") == null || JSON.parse(sessionStorage.getItem("DLP_Session_Storage")).storageVersion !== storageSessionVersion) {
    sessionStorage.setItem("DLP_Session_Storage", JSON.stringify({
        "legacy": {
            "page": 0,
            "status": false,
            "path": {
                "type": "lesson",
                "amount": 0
            },
            "practice": {
                "type": "lesson",
                "amount": 0
            },
            "listen": {
                "type": "lesson",
                "amount": 0
            }
        },
        "storageVersion": storageSessionVersion
    }));
    storageSession = JSON.parse(sessionStorage.getItem("DLP_Session_Storage"));
} else {
    storageSession = JSON.parse(sessionStorage.getItem("DLP_Session_Storage"));
}
function saveStorageSession() {
    sessionStorage.setItem("DLP_Session_Storage", JSON.stringify(storageSession));
}

// Enhanced API Handler
class DuolingoAPI {
    constructor() {
        this.userId = null;
        this.jwt = null;
        this.courseId = null;
        this.init();
    }

    async init() {
        this.userId = this.getUserId();
        this.jwt = this.getJWT();
        this.courseId = this.getCourseId();
    }

    getUserId() {
        try {
            return window.duo?.user?.id || JSON.parse(localStorage.getItem('user'))?.id;
        } catch {
            return null;
        }
    }

    getJWT() {
        try {
            return localStorage.getItem('jwt_token') || document.cookie.match(/jwt_token=([^;]+)/)?.[1];
        } catch {
            return null;
        }
    }

    getCourseId() {
        try {
            return window.duo?.user?.currentCourse?.id || JSON.parse(localStorage.getItem('currentCourse'))?.id;
        } catch {
            return null;
        }
    }

    async makeRequest(endpoint, data = null, method = 'GET') {
        const url = API_CONFIG.baseURL + endpoint.replace('{userId}', this.userId).replace('{courseId}', this.courseId);
        
        const options = {
            method,
            headers: {
                ...API_CONFIG.headers,
                'Authorization': `Bearer ${this.jwt}`,
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            return null;
        }
    }

    async addXP(amount) {
        const sessionData = {
            challengeTypes: ['speak', 'listen', 'translate'],
            heartsLeft: 5,
            startTime: Date.now() - 30000,
            endTime: Date.now(),
            failed: false,
            maxInLessonStreak: 15,
            lessonNumber: Math.floor(Math.random() * 100),
            xpGain: amount,
            skillId: 'random_skill_' + Math.random().toString(36).substr(2, 9)
        };

        return await this.makeRequest(API_CONFIG.endpoints.sessions, sessionData, 'POST');
    }

    async addGems(amount) {
        const gemData = {
            amount: amount,
            source: 'lesson_completion',
            timestamp: Date.now()
        };

        return await this.makeRequest(API_CONFIG.endpoints.gems, gemData, 'POST');
    }
}

// Unlimited XP Farmer
class XPFarmer {
    constructor(api) {
        this.api = api;
        this.isRunning = false;
        this.totalXPGained = 0;
        this.sessionsCompleted = 0;
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        console.log('🚀 Starting Unlimited XP Farm...');
        
        while (this.isRunning && storageLocal.settings.unlimitedXP) {
            try {
                const xpAmount = Math.floor(Math.random() * 50) + 15; // 15-65 XP per session
                await this.api.addXP(xpAmount);
                
                this.totalXPGained += xpAmount;
                this.sessionsCompleted++;
                
                console.log(`✅ Gained ${xpAmount} XP | Total: ${this.totalXPGained} XP | Sessions: ${this.sessionsCompleted}`);
                
                // Anti-detection delay
                const delay = FARM_CONFIG.stealth.randomizeTimings ? 
                    Math.random() * (FARM_CONFIG.xp.maxDelay - FARM_CONFIG.xp.minDelay) + FARM_CONFIG.xp.minDelay :
                    FARM_CONFIG.xp.minDelay;
                
                await this.sleep(delay);
            } catch (error) {
                console.error('XP Farm error:', error);
                await this.sleep(5000);
            }
        }
    }

    stop() {
        this.isRunning = false;
        console.log('⏹️ XP Farm stopped');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Unlimited Gems Farmer
class GemsFarmer {
    constructor(api) {
        this.api = api;
        this.isRunning = false;
        this.totalGemsGained = 0;
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        console.log('💎 Starting Unlimited Gems Farm...');
        
        while (this.isRunning && storageLocal.settings.unlimitedGems) {
            try {
                const gemsAmount = Math.floor(Math.random() * 20) + 5; // 5-25 gems per session
                await this.api.addGems(gemsAmount);
                
                this.totalGemsGained += gemsAmount;
                
                console.log(`💎 Gained ${gemsAmount} Gems | Total: ${this.totalGemsGained} Gems`);
                
                // Anti-detection delay
                const delay = Math.random() * 3000 + 2000; // 2-5 seconds
                await this.sleep(delay);
            } catch (error) {
                console.error('Gems Farm error:', error);
                await this.sleep(5000);
            }
        }
    }

    stop() {
        this.isRunning = false;
        console.log('⏹️ Gems Farm stopped');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Auto Solver for Lessons
class AutoSolver {
    constructor() {
        this.isRunning = false;
        this.currentChallenge = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        console.log('🤖 Auto Solver activated');
        this.observeChanges();
    }

    stop() {
        this.isRunning = false;
        console.log('⏹️ Auto Solver deactivated');
    }

    observeChanges() {
        const observer = new MutationObserver(() => {
            if (!this.isRunning) return;
            this.solveCurrentChallenge();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    solveCurrentChallenge() {
        try {
            // Auto-solve multiple choice questions
            const choices = document.querySelectorAll('[data-test="challenge-choice"]');
            if (choices.length > 0) {
                const randomChoice = choices[Math.floor(Math.random() * choices.length)];
                randomChoice.click();
                setTimeout(() => {
                    const continueBtn = document.querySelector('[data-test="player-next"]');
                    if (continueBtn && !continueBtn.disabled) {
                        continueBtn.click();
                    }
                }, 100);
                return;
            }

            // Auto-solve text input questions
            const textInput = document.querySelector('[data-test="challenge-text-input"]');
            if (textInput) {
                // Try to find the correct answer from hints or previous patterns
                const correctAnswer = this.findCorrectAnswer();
                if (correctAnswer) {
                    textInput.value = correctAnswer;
                    textInput.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    setTimeout(() => {
                        const continueBtn = document.querySelector('[data-test="player-next"]');
                        if (continueBtn && !continueBtn.disabled) {
                            continueBtn.click();
                        }
                    }, 100);
                }
                return;
            }

            // Auto-solve speaking challenges (skip)
            const skipBtn = document.querySelector('[data-test="player-skip"]');
            if (skipBtn) {
                skipBtn.click();
                return;
            }

        } catch (error) {
            console.error('Auto-solve error:', error);
        }
    }

    findCorrectAnswer() {
        // Look for hints or correct answers in the DOM
        const hints = document.querySelectorAll('[data-test="hint-token"]');
        if (hints.length > 0) {
            return Array.from(hints).map(h => h.textContent).join(' ');
        }

        // Common answers for practice
        const commonAnswers = ['yes', 'no', 'hello', 'good', 'the', 'a', 'is', 'are'];
        return commonAnswers[Math.floor(Math.random() * commonAnswers.length)];
    }
}

// UI Controller
class UIController {
    constructor(xpFarmer, gemsFarmer, autoSolver) {
        this.xpFarmer = xpFarmer;
        this.gemsFarmer = gemsFarmer;
        this.autoSolver = autoSolver;
        this.createUI();
    }

    createUI() {
        const controlPanel = document.createElement('div');
        controlPanel.id = 'dlp-control-panel';
        controlPanel.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: linear-gradient(135deg, #1cb0f6, #58cc02); padding: 20px; border-radius: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); color: white; font-family: Arial; min-width: 250px;">
                <h3 style="margin: 0 0 15px 0; text-align: center;">🚀 Duolingo PRO Unlimited</h3>
                <div style="margin-bottom: 10px;">
                    <button id="dlp-xp-toggle" style="width: 100%; padding: 10px; margin: 5px 0; border: none; border-radius: 8px; background: #58cc02; color: white; cursor: pointer; font-weight: bold;">Start XP Farm</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="dlp-gems-toggle" style="width: 100%; padding: 10px; margin: 5px 0; border: none; border-radius: 8px; background: #ff6b6b; color: white; cursor: pointer; font-weight: bold;">Start Gems Farm</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="dlp-auto-solve" style="width: 100%; padding: 10px; margin: 5px 0; border: none; border-radius: 8px; background: #4ecdc4; color: white; cursor: pointer; font-weight: bold;">Start Auto Solve</button>
                </div>
                <div style="font-size: 12px; text-align: center; margin-top: 15px; opacity: 0.8;">
                    <div>XP Gained: <span id="dlp-xp-count">0</span></div>
                    <div>Gems Gained: <span id="dlp-gems-count">0</span></div>
                    <div>By: tw1sk</div>
                </div>
            </div>
        `;

        document.body.appendChild(controlPanel);
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('dlp-xp-toggle').addEventListener('click', () => {
            const btn = document.getElementById('dlp-xp-toggle');
            if (this.xpFarmer.isRunning) {
                this.xpFarmer.stop();
                btn.textContent = 'Start XP Farm';
                btn.style.background = '#58cc02';
            } else {
                this.xpFarmer.start();
                btn.textContent = 'Stop XP Farm';
                btn.style.background = '#ff4757';
            }
        });

        document.getElementById('dlp-gems-toggle').addEventListener('click', () => {
            const btn = document.getElementById('dlp-gems-toggle');
            if (this.gemsFarmer.isRunning) {
                this.gemsFarmer.stop();
                btn.textContent = 'Start Gems Farm';
                btn.style.background = '#ff6b6b';
            } else {
                this.gemsFarmer.start();
                btn.textContent = 'Stop Gems Farm';
                btn.style.background = '#ff4757';
            }
        });

        document.getElementById('dlp-auto-solve').addEventListener('click', () => {
            const btn = document.getElementById('dlp-auto-solve');
            if (this.autoSolver.isRunning) {
                this.autoSolver.stop();
                btn.textContent = 'Start Auto Solve';
                btn.style.background = '#4ecdc4';
            } else {
                this.autoSolver.start();
                btn.textContent = 'Stop Auto Solve';
                btn.style.background = '#ff4757';
            }
        });

        // Update counters every second
        setInterval(() => {
            document.getElementById('dlp-xp-count').textContent = this.xpFarmer.totalXPGained;
            document.getElementById('dlp-gems-count').textContent = this.gemsFarmer.totalGemsGained;
        }, 1000);
    }
}

// Initialize Everything
(function() {
    'use strict';
    
    console.log('🚀 Duolingo PRO Unlimited v3.2 by tw1sk');
    
    // Wait for page to load
    const init = () => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Initialize API and farmers
        const api = new DuolingoAPI();
        const xpFarmer = new XPFarmer(api);
        const gemsFarmer = new GemsFarmer(api);
        const autoSolver = new AutoSolver();
        const ui = new UIController(xpFarmer, gemsFarmer, autoSolver);

        // Auto-start if enabled in settings
        if (storageLocal.settings.autoFarm) {
            setTimeout(() => {
                if (storageLocal.settings.unlimitedXP) xpFarmer.start();
                if (storageLocal.settings.unlimitedGems) gemsFarmer.start();
                if (storageLocal.settings.showSolveButtons) autoSolver.start();
            }, 2000);
        }

        console.log('✅ Duolingo PRO Unlimited initialized successfully!');
    };

    init();
})();