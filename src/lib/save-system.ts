import { Character, Scene, Quest } from '@/types/dnd';

export interface SaveData {
    character: Character;
    scene: Scene | null;
    log: { text: string; type: 'narrative' | 'success' | 'failure' | 'info' }[];
    timestamp: number;
    version: number;
}

const SAVE_KEY_PREFIX = 'dnd_adventure_save_';
const MAX_SLOTS = 3;
const SAVE_VERSION = 1;

export function saveGame(
    slot: number,
    character: Character,
    scene: Scene | null,
    log: { text: string; type: string }[]
): boolean {
    if (slot < 0 || slot >= MAX_SLOTS) return false;

    try {
        const data: SaveData = {
            character,
            scene,
            log: log.slice(-50) as SaveData['log'],
            timestamp: Date.now(),
            version: SAVE_VERSION
        };
        localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Failed to save game:', e);
        return false;
    }
}
// ...
export function autoSave(
    character: Character,
    scene: Scene | null,
    log: { text: string; type: string }[]
): boolean {
    // Auto-save always goes to a special auto-save slot
    try {
        const data: SaveData = {
            character,
            scene,
            log: log.slice(-50) as SaveData['log'],
            timestamp: Date.now(),
            version: SAVE_VERSION
        };
        localStorage.setItem('dnd_adventure_autosave', JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Auto-save failed:', e);
        return false;
    }
}

// Auto-repair utility
function repairSaveData(data: SaveData): SaveData {
    if (!data.scene || !data.character.campaignState) return data;

    // Check if the scene is a chapter intro
    if (data.scene.id.startsWith('chapter_') && data.scene.id.endsWith('_intro')) {
        const match = data.scene.id.match(/chapter_(\d+)_intro/);
        if (match) {
            const chapterNum = parseInt(match[1], 10);
            if (data.character.campaignState.chapter < chapterNum) {
                console.warn(`[Save Repair] Fixing desynced campaign state (was Chapter ${data.character.campaignState.chapter}, repairing to Chapter ${chapterNum})`);
                data.character.campaignState = {
                    ...data.character.campaignState,
                    chapter: chapterNum,
                    sceneIndex: 0,
                    fillersSinceLastStory: 0
                };
            }
        }
    }
    return data;
}

export function loadGame(slot: number): SaveData | null {
    if (slot < 0 || slot >= MAX_SLOTS) return null;

    try {
        const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`);
        if (!raw) return null;

        const data: SaveData = JSON.parse(raw);
        if (data.version !== SAVE_VERSION) {
            console.warn('Save version mismatch, may have compatibility issues');
        }
        return repairSaveData(data);
    } catch (e) {
        console.error('Failed to load game:', e);
        return null;
    }
}

export function deleteSave(slot: number): boolean {
    if (slot < 0 || slot >= MAX_SLOTS) return false;

    try {
        localStorage.removeItem(`${SAVE_KEY_PREFIX}${slot}`);
        return true;
    } catch (e) {
        console.error('Failed to delete save:', e);
        return false;
    }
}

export function getSaveSlotInfo(): (SaveSlotInfo | null)[] {
    const slots: (SaveSlotInfo | null)[] = [];
    for (let i = 0; i < MAX_SLOTS; i++) {
        try {
            const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${i}`);
            if (!raw) {
                slots.push(null);
                continue;
            }
            const data: SaveData = JSON.parse(raw);
            slots.push({
                slot: i,
                characterName: data.character.name,
                level: data.character.level,
                className: data.character.class.name,
                raceName: data.character.race.name,
                timestamp: data.timestamp,
                hp: data.character.hp,
                gp: data.character.wallet.gp
            });
        } catch {
            slots.push(null);
        }
    }
    return slots;
}

export interface SaveSlotInfo {
    slot: number;
    characterName: string;
    level: number;
    className: string;
    raceName: string;
    timestamp: number;
    hp: { current: number; max: number };
    gp: number;
}



export function loadAutoSave(): SaveData | null {
    try {
        const raw = localStorage.getItem('dnd_adventure_autosave');
        if (!raw) return null;
        return repairSaveData(JSON.parse(raw));
    } catch {
        return null;
    }
}
