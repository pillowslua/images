// ==UserScript==
// @name         Duolingo PRO
// @namespace    http://duolingopro.net
// @version      3.1BETA.01
// @description  The fastest Duolingo XP gainer, working as of June 2025.
// @author       anonymousHackerIV
// @match        https://*.duolingo.com/*
// @match        https://*.duolingo.cn/*
// @icon         https://www.duolingopro.net/static/favicons/duo/128/light/primary.png
// @grant        GM_log
// ==/UserScript==

let storageLocal;
let storageSession;
let versionNumber = "01";
let storageLocalVersion = "05";
let storageSessionVersion = "05";
let versionName = "BETA.01";
let versionFull = "3.1BETA.01";
let versionFormal = "3.1 BETA.01";
let serverURL = "https://www.duolingopro.net";
let apiURL = "https://api.duolingopro.net";
let greasyfork = true;
let alpha = false;

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
            "solveSpeed": 0.9
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
            },
            "speak": {
                "type": "lesson",
                "amount": 0
            },
            "stories": {
                "type": "lesson",
                "amount": 0
            },
            "mistakes": {
                "type": "lesson",
                "amount": 0
            },
            "challenges": {
                "type": "lesson",
                "amount": 0
            },
            "lessons": {
                "type": "lesson",
                "amount": 0
            },
            "exercises": {
                "type": "lesson",
                "amount": 0
            },
            "quizzes": {
                "type": "lesson",
                "amount": 0
            },
            "tests": {
                "type": "lesson",
                "amount": 0
            },
            "reviews": {
                "type": "lesson",
                "amount": 0
            },
            "practices": {
                "type": "lesson",
                "amount": 0
            },
            "challenges": {
                "type": "lesson",
                "amount": 0
            },
            "stories": {
                "type": "lesson",
                "amount": 0
            },
            "mistakes": {
                "type": "lesson",
                "amount": 0
            },
            "listening": {
                "type": "lesson",
                "amount": 0
            },
            "speaking": {
                "type": "lesson",
                "amount": 0
            },
            "reading": {
                "type": "lesson",
                "amount": 0
            },
            "writing": {
                "type": "lesson",
                "amount": 0
            },
            "grammar": {
                "type": "lesson",
                "amount": 0
            },
            "vocabulary": {
                "type": "lesson",
                "amount": 0
            },
            "pronunciation": {
                "type": "lesson",
                "amount": 0
            },
            "comprehension": {
                "type": "lesson",
                "amount": 0
            },
            "translation": {
                "type": "lesson",
                "amount": 0
            },
            "matching": {
                "type": "lesson",
                "amount": 0
            },
            "fillInTheBlank": {
                "type": "lesson",
                "amount": 0
            },
            "multipleChoice": {
                "type": "lesson",
                "amount": 0
            },
            "trueFalse": {
                "type": "lesson",
                "amount": 0
            },
            "ordering": {
                "type": "lesson",
                "amount": 0
            },
            "typing": {
                "type": "lesson",
                "amount": 0
            },
            "listening": {
                "type": "lesson",
                "amount": 0
            },
            "speaking": {
                "type": "lesson",
                "amount": 0
            },
            "reading": {
                "type": "lesson",
                "amount": 0
            },
            "writing": {
                "type": "lesson",
                "amount": 0
            },
            "grammar": {
                "type": "lesson",
                "amount": 0
            },
            "vocabulary": {
                "type": "lesson",
                "amount": 0
            },
            "pronunciation": {
                "type": "lesson",
                "amount": 0
            },
            "comprehension": {
                "type": "lesson",
                "amount": 0
            },
            "translation": {
                "type": "lesson",
                "amount": 0
            },
            "matching": {
                "type": "lesson",
                "amount": 0
            },
            "fillInTheBlank": {
                "type": "lesson",
                "amount": 0
            },
            "multipleChoice": {
                "type": "lesson",
                "amount": 0
            },
            "trueFalse": {
                "type": "lesson",
                "amount": 0
            },
            "ordering": {
                "type": "lesson",
                "amount": 0
            },
            "typing": {
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