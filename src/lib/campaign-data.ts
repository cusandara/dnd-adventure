import { Scene, Choice } from '@/types/dnd';
import { rollDie } from './adventure-logic';

// ============================================================
// THE LOST FORGE OF THE STARFALL DWARVES — Campaign Data
// ============================================================

export interface ChapterData {
    id: number;
    title: string;
    description: string;
    levelRange: [number, number];
    storyScenes: StorySceneTemplate[];
    fillerPool: FillerEncounter[];
    sideQuests: SideQuestTemplate[];
    boss: BossTemplate;
}

export interface StorySceneTemplate {
    id: string;
    title: string;
    description: string;
    type: 'exploration' | 'combat' | 'roleplay';
    npcDialogue?: { name: string; text: string }[];
    choices: Choice[];
    enemy?: { name: string; hp: number; ac: number; xpReward?: number; attackBonus?: number; damageDice?: string };
    enemies?: { name: string; hp: number; ac: number; xpReward?: number; attackBonus?: number; damageDice?: string }[];
    setFlags?: Record<string, boolean>;
    requiredFlags?: Record<string, boolean>;
}

export interface FillerEncounter {
    type: 'combat' | 'exploration' | 'roleplay';
    description: string;
    enemy?: string;
    hp?: number;
    ac?: number;
    xp?: number;
    id?: string;
}

export interface SideQuestTemplate {
    title: string;
    description: string;
    objectiveBase: { type: 'kill' | 'collect' | 'visit'; target: string; count: number };
    rewardBase: { xp: number; gp: number };
}

export interface BossTemplate {
    id: string;
    name: string;
    title: string;
    description: string;
    npcDialogue: { name: string; text: string }[];
    hp: number;
    ac: number;
    xpReward: number;
    attackBonus: number;
    damageDice: string;
    victoryFlag: string;
    defeatText: string;
}

// ============================================================
// CHAPTER 1: THE AMBUSH (Levels 1–2)
// ============================================================
const CHAPTER_1: ChapterData = {
    id: 1,
    title: 'The Ambush',
    description: 'You are hired by the dwarf merchant Gundrik Ironvein to escort a wagon of supplies to the frontier town of Ashvale. But danger lurks on the road ahead...',
    levelRange: [1, 2],
    storyScenes: [
        {
            id: 'ch1_intro',
            title: 'The Road to Ashvale',
            description: 'The morning sun filters through the canopy as your wagon rattles along the Triboar Trail. Gundrik Ironvein, a stout dwarf with a braided beard, hums a mining song from the driver\'s seat.',
            type: 'roleplay',
            npcDialogue: [
                { name: 'Gundrik Ironvein', text: '"Ah, adventurer! Good to have someone watchful on the road. My cousin Sildar told me these paths have gotten dangerous lately. Goblins, bandits... bad for business, I tell you."' },
                { name: 'Gundrik Ironvein', text: '"We should reach Ashvale by nightfall. There\'s a matter there I need help with — something my family lost long ago. But first, let\'s survive the journey, eh?"' }
            ],
            choices: [
                { id: 'ask_about_forge', text: 'Ask Gundrik about his family\'s lost treasure.', consequence: { success: '"The Starfall Forge. An ancient smithy my ancestors built deep beneath the mountains. It was said to craft weapons of incredible power. But it was lost when the mines collapsed centuries ago. Recently... I found a map."', failure: '' } },
                { id: 'keep_watch', text: 'Keep your eyes on the road.', requiredCheck: { skill: 'Perception', dc: 12 }, consequence: { success: 'You notice broken arrows and disturbed earth ahead — signs of an ambush! You have time to prepare.', failure: 'The road seems peaceful enough. You relax your guard.' } },
                { id: 'continue', text: 'Enjoy the ride and chat.', consequence: { success: 'The journey continues pleasantly as Gundrik shares tales of dwarven craftsmanship.', failure: '' } }
            ],
            setFlags: { met_gundrik: true }
        },
        {
            id: 'ch1_wolves',
            title: 'Wolves on the Trail',
            description: 'As the wagon rounds a bend, a pack of wolves emerges from the undergrowth. Their eyes gleam with hunger and they circle the wagon, snarling. Gundrik reaches for a crossbow under the seat.',
            type: 'combat',
            npcDialogue: [
                { name: 'Gundrik Ironvein', text: '"Wolves! Stand firm — don\'t let them near the supplies!"' }
            ],
            enemies: [
                { name: 'Wolf', hp: 11, ac: 13, xpReward: 50, attackBonus: 4, damageDice: '1d6' },
                { name: 'Wolf', hp: 11, ac: 13, xpReward: 50, attackBonus: 4, damageDice: '1d6' }
            ],
            choices: [
                { id: 'melee', text: 'Draw your weapon and fight!', consequence: { success: '', failure: '' } },
                { id: 'magic', text: 'Cast a spell!', consequence: { success: '', failure: '' } },
                { id: 'run', text: 'Try to scare them off!', consequence: { success: '', failure: '' } }
            ],
            setFlags: { wolves_defeated: true }
        },
        {
            id: 'ch1_camp',
            title: 'Roadside Camp',
            description: 'With the wolves dealt with, Gundrik suggests stopping at a roadside camp to rest and tend to any wounds. A small clearing with an old fire pit seems safe enough. A traveling peddler has set up a humble stall nearby.',
            type: 'roleplay',
            npcDialogue: [
                { name: 'Gundrik Ironvein', text: '"Good work with those wolves. Let\'s catch our breath before moving on. That peddler over there might have some useful supplies."' },
                { name: 'Traveling Peddler', text: '"Ho there, travelers! I have potions, bandages, and a few trinkets. Care to browse?"' }
            ],
            choices: [
                { id: 'shop', text: 'Browse the peddler\'s wares.', consequence: { success: 'You browse the peddler\'s humble selection of goods.', failure: '' } },
                { id: 'rest', text: 'Take a short rest by the fire.', consequence: { success: 'You sit by the fire and catch your breath. The warmth soothes your aches.', failure: '' } },
                { id: 'continue', text: 'Press on — no time to waste.', consequence: { success: 'You thank the peddler and continue down the road.', failure: '' } }
            ]
        },
        {
            id: 'ch1_ambush',
            title: 'Goblin Ambush!',
            description: 'Without warning, arrows fly from the treeline! A group of goblins leaps from the bushes, screeching war cries. One of them grabs Gundrik and drags him into the forest before you can react!',
            type: 'combat',
            npcDialogue: [
                { name: 'Goblin Raider', text: '"Get the dwarf! The boss wants him alive! Kill the other one!"' }
            ],
            enemies: [
                { name: 'Goblin Raider', hp: 7, ac: 13, xpReward: 50, attackBonus: 4, damageDice: '1d6' },
                { name: 'Goblin Raider', hp: 7, ac: 13, xpReward: 50, attackBonus: 4, damageDice: '1d6' },
                { name: 'Goblin Archer', hp: 5, ac: 12, xpReward: 50, attackBonus: 4, damageDice: '1d4' }
            ],
            choices: [
                { id: 'melee', text: 'Draw your weapon and fight!', consequence: { success: '', failure: '' } },
                { id: 'magic', text: 'Cast a spell!', consequence: { success: '', failure: '' } },
                { id: 'run', text: 'Try to flee!', consequence: { success: '', failure: '' } }
            ],
            setFlags: { ambush_survived: true }
        },
        {
            id: 'ch1_trail',
            title: 'The Goblin Trail',
            description: 'The goblins fled deeper into the forest, dragging Gundrik with them. Fresh tracks lead into the dense undergrowth. The trail is littered with scraps of torn cloth from Gundrik\'s robes.',
            type: 'exploration',
            choices: [
                { id: 'track', text: 'Follow the trail carefully.', requiredCheck: { skill: 'Survival', dc: 10 }, consequence: { success: 'You follow the tracks expertly, avoiding two concealed snare traps along the way. The trail leads to a cave entrance.', failure: 'You stumble into a snare trap! A net yanks you into the air.', damage: 3 } },
                { id: 'stealth', text: 'Move quietly through the forest.', requiredCheck: { skill: 'Stealth', dc: 13 }, consequence: { success: 'You move like a shadow through the trees, arriving at a cave mouth undetected.', failure: 'A branch snaps under your foot. You hear goblin sentries chattering nervously ahead.' } },
                { id: 'investigate', text: 'Look for clues about who sent the goblins.', requiredCheck: { skill: 'Investigation', dc: 12 }, consequence: { success: 'Among the debris, you find a crude note: "Bring the dwarf to Klarg. The Spider wants the map." Who is the Spider?', failure: 'You find nothing useful among the debris.' } }
            ],
            setFlags: { found_trail: true }
        },
        {
            id: 'ch1_cave_sentries',
            title: 'Cave Sentries',
            description: 'At the mouth of Cragmaw Cave, two goblin sentries stand watch by a small fire. They haven\'t spotted you yet. Beyond them, the cave descends into darkness.',
            type: 'combat',
            enemies: [
                { name: 'Goblin Sentry', hp: 7, ac: 13, xpReward: 50, attackBonus: 4, damageDice: '1d6' },
                { name: 'Goblin Sentry', hp: 7, ac: 13, xpReward: 50, attackBonus: 4, damageDice: '1d6' }
            ],
            choices: [
                { id: 'melee', text: 'Rush them before they can raise the alarm!', consequence: { success: '', failure: '' } },
                { id: 'magic', text: 'Cast a spell!', consequence: { success: '', failure: '' } },
                { id: 'run', text: 'Try to sneak past!', consequence: { success: '', failure: '' } }
            ],
            setFlags: { cleared_sentries: true }
        },
        {
            id: 'ch1_cave',
            title: 'Cragmaw Cave',
            description: 'A dark cave mouth yawns before you, the stench of goblin filth wafting from within. You can hear the sound of rushing water from a stream that flows out of the entrance. Crude totems made of bones decorate the entry.',
            type: 'exploration',
            npcDialogue: [
                { name: 'Captured Guard', text: '"Please... help me! The goblins took me three days ago. Their leader, Klarg, serves someone called the Black Spider. They took a dwarf deeper into the caves just hours ago!"' }
            ],
            choices: [
                { id: 'sneak_in', text: 'Sneak through the cave entrance.', requiredCheck: { skill: 'Stealth', dc: 14 }, consequence: { success: 'You slip past the goblin sentries undetected, moving deeper into the cave system.', failure: 'A goblin spots you! "Intruder!" he screeches, alerting the others.', damage: 4 } },
                { id: 'charge', text: 'Storm the entrance with weapons drawn.', requiredCheck: { skill: 'Athletics', dc: 11 }, consequence: { success: 'You burst in, catching the sentries off guard! They scramble to defend themselves.', failure: 'You trip on the slippery cave floor as goblins swarm you!', damage: 3 } },
                { id: 'rescue_guard', text: 'Free the captured guard first.', consequence: { success: 'You cut the guard\'s bonds. He thanks you profusely and tells you everything he knows about the cave layout.', failure: '' } }
            ],
            setFlags: { entered_cragmaw: true }
        }
    ],
    fillerPool: [
        { type: 'combat', description: 'A pair of wolves stalks you through the underbrush.', enemy: 'Wolf', hp: 11, ac: 13, xp: 50 },
        { type: 'combat', description: 'A goblin scout stumbles upon you!', enemy: 'Goblin', hp: 7, ac: 15, xp: 50 },
        { type: 'exploration', description: 'You find an abandoned campsite with still-warm embers.', id: 'abandoned_camp' },
        { type: 'roleplay', description: 'A wounded traveler lies by the roadside, groaning in pain.', id: 'wounded_traveler' }
    ],
    sideQuests: [
        { title: 'Wolf Problem', description: 'Wolves have been attacking travelers on the road. Thin the pack.', objectiveBase: { type: 'kill', target: 'Wolf', count: 3 }, rewardBase: { xp: 75, gp: 15 } }
    ],
    boss: {
        id: 'klarg',
        name: 'Klarg',
        title: 'Klarg, the Goblin Boss',
        description: 'In the deepest chamber of Cragmaw Cave, a massive bugbear sits on a throne of bones. Klarg, the goblin boss, snarls at your approach. Gundrik lies bound at his feet. A mangy wolf growls at Klarg\'s side.',
        npcDialogue: [
            { name: 'Klarg', text: '"You dare enter Klarg\'s domain?! The Black Spider promised Klarg gold and power for the dwarf and his map. You will die here, little adventurer!"' },
            { name: 'Gundrik Ironvein', text: '"Don\'t let him take the map! The Starfall Forge must not fall into evil hands!"' }
        ],
        hp: 20,
        ac: 14,
        xpReward: 200,
        attackBonus: 3,
        damageDice: '1d8',
        victoryFlag: 'klarg_defeated',
        defeatText: 'Klarg crashes to the ground with a thunderous thud. You free Gundrik, who clutches his map tightly. "Thank the gods you came! We must get to Ashvale — and we must find the Forge before the Black Spider does."'
    }
};

// ============================================================
// CHAPTER 2: TROUBLE IN ASHVALE (Levels 3–4)
// ============================================================
const CHAPTER_2: ChapterData = {
    id: 2,
    title: 'Trouble in Ashvale',
    description: 'You arrive in the frontier town of Ashvale, but all is not well. A gang called the Redclaws has been terrorizing the townsfolk. Meanwhile, Gundrik studies his map, trying to decode the route to the Starfall Forge.',
    levelRange: [3, 4],
    storyScenes: [
        {
            id: 'ch2_arrival',
            title: 'Welcome to Ashvale',
            description: 'Ashvale\'s wooden palisade walls come into view as dusk falls. The town is smaller than you expected — a cluster of timber buildings around a central square. Smoke rises from the inn\'s chimney. But the streets are eerily empty for this hour.',
            type: 'roleplay',
            npcDialogue: [
                { name: 'Innkeeper Elsa', text: '"Welcome to the Sleeping Giant Inn. You look like you\'ve been through trouble. Everyone has, lately. The Redclaws — a gang of thugs — have been shaking down merchants and bullying honest folk. Their leader, a wizard called Glasstaff, operates from an old manor on the hill."' },
                { name: 'Gundrik Ironvein', text: '"I\'ll be studying the map upstairs. If you could deal with these Redclaw ruffians, I\'d be grateful. The town won\'t help us find the Forge while they live in fear."' }
            ],
            choices: [
                { id: 'ask_about_redclaws', text: 'Ask Elsa for more details about the Redclaws.', consequence: { success: '"There are about a dozen of them. They drink at the other tavern — the Rusty Nail. Their hideout is beneath the old Tresendar Manor on the eastern hill. People go in... and don\'t come out."', failure: '' } },
                { id: 'check_board', text: 'Check the town notice board for work.', consequence: { success: 'Several notices are pinned to the board — requests for help from desperate townsfolk.', failure: '' } },
                { id: 'rest', text: 'Rest for the night and plan.', consequence: { success: 'You take a room and get a good night\'s sleep. Tomorrow, you deal with the Redclaws.', failure: '' } }
            ],
            setFlags: { arrived_ashvale: true }
        },
        {
            id: 'ch2_market',
            title: 'Ashvale Market',
            description: 'In the morning you explore Ashvale\'s small market square. Despite the Redclaw threat, a few hardy merchants still ply their trade. A blacksmith hammers at an anvil and an herbalist arranges dried plants under a canvas shade.',
            type: 'roleplay',
            npcDialogue: [
                { name: 'Blacksmith Harven', text: '"Looking for weapons or armor? I\'ve got some fine steel. You\'ll need it if you\'re going after the Redclaws."' },
                { name: 'Herbalist Mirna', text: '"I can sell you healing potions — you\'ll want a few before tangling with those thugs."' }
            ],
            choices: [
                { id: 'shop', text: 'Browse the blacksmith\'s weapons and armor.', consequence: { success: 'You examine the blacksmith\'s collection of blades and shields.', failure: '' } },
                { id: 'find_quest', text: 'Check the town job board.', consequence: { success: 'You look for work.', failure: 'Nothing catches your eye.' } },
                { id: 'continue', text: 'Head out to find the Redclaws.', consequence: { success: 'You steel yourself and head toward the Rusty Nail tavern.', failure: '' } }
            ]
        },
        {
            id: 'ch2_confrontation',
            title: 'Redclaw Confrontation',
            description: 'As you walk through town, four Redclaw thugs block your path. They wear matching scarlet bandanas and carry crude weapons. Their leader, a burly man with a scar across his nose, sneers.',
            type: 'combat',
            npcDialogue: [
                { name: 'Redclaw Thug', text: '"Fresh meat! This is Redclaw territory, outsider. Pay the tax — 50 gold — or we\'ll take it from your corpse."' }
            ],
            enemies: [
                { name: 'Redclaw Thug', hp: 18, ac: 12, xpReward: 100, attackBonus: 4, damageDice: '1d8' },
                { name: 'Redclaw Thug', hp: 18, ac: 12, xpReward: 100, attackBonus: 4, damageDice: '1d8' }
            ],
            choices: [
                { id: 'melee', text: 'Teach them a lesson!', consequence: { success: '', failure: '' } },
                { id: 'magic', text: 'Cast a spell!', consequence: { success: '', failure: '' } },
                { id: 'run', text: 'Try to flee!', consequence: { success: '', failure: '' } }
            ],
            setFlags: { fought_redclaws: true }
        },
        {
            id: 'ch2_tavern_intel',
            title: 'The Rusty Nail',
            description: 'After beating the street thugs, you push open the door of the Rusty Nail tavern. Inside, a handful of nervous Redclaw members reach for their weapons, but the barkeep raises a hand.',
            type: 'roleplay',
            npcDialogue: [
                { name: 'Barkeep Grem', text: '"Easy now. You\'ve already proven you can handle yourself. I\'m no friend of the Redclaws — they forced me to serve them or they\'d burn the place down."' },
                { name: 'Barkeep Grem', text: '"Glasstaff is in the manor basement. He\'s got maybe six or seven guards left down there, plus some kind of magical guardian. If you supply me, I\'ll tell you everything I know about the layout."' }
            ],
            choices: [
                { id: 'persuade', text: 'Convince the barkeep to help for free.', requiredCheck: { skill: 'Persuasion', dc: 12 }, consequence: { success: '"Alright, alright. The basement has three levels. Glasstaff is on the bottom. There\'s a hidden armory on the middle level — might find something useful."', failure: '"I need compensation for the risk I\'m taking, friend."' } },
                { id: 'shop', text: 'Buy supplies from the barkeep.', consequence: { success: 'You buy a few drinks and rations for the road.', failure: '' } },
                { id: 'leave', text: 'Head straight for the manor.', consequence: { success: 'You drain your mug and head for Tresendar Manor.', failure: '' } }
            ]
        },
        {
            id: 'ch2_investigation',
            title: 'Investigating the Redclaws',
            description: 'With the thugs defeated, you search their bodies and find a note: "Report to the manor at midnight. Glasstaff has new orders from the Spider." The townsfolk start to approach you, grateful but still afraid.',
            type: 'roleplay',
            npcDialogue: [
                { name: 'Farmer Daran', text: '"You actually stood up to them! Listen — I used to be an adventurer too. There\'s a secret tunnel that leads into the manor basement. It opens behind the old windmill east of town. Be careful in there."' },
                { name: 'Sister Garaele', text: '"The Redclaws have been working with something dark. I\'ve sensed necromantic energy flowing from the manor. Glasstaff may be dabbling in forbidden magic."' }
            ],
            choices: [
                { id: 'tunnel', text: 'Use the secret tunnel to infiltrate the manor.', requiredCheck: { skill: 'Stealth', dc: 13 }, consequence: { success: 'You find the hidden entrance behind the windmill and slip into the dark passages beneath the manor.', failure: 'You find the tunnel but trigger an alarm ward at the entrance! They know you\'re coming.' } },
                { id: 'front_door', text: 'Storm the front entrance of Tresendar Manor.', requiredCheck: { skill: 'Athletics', dc: 14 }, consequence: { success: 'You kick down the rotting front doors and charge in before the guards can react!', failure: 'The doors are barricaded! You force your way through but take hits from crossbow bolts.', damage: 6 } },
                { id: 'gather_info', text: 'Ask the townsfolk for more intelligence first.', requiredCheck: { skill: 'Persuasion', dc: 11 }, consequence: { success: 'The townsfolk share everything they know: guard rotations, tunnel layout, even a map of the basement.', failure: 'The townsfolk are too afraid to share more.' } }
            ],
            setFlags: { investigated_redclaws: true }
        },
        {
            id: 'ch2_dungeon',
            title: 'The Manor Basement',
            description: 'The ancient stone corridors beneath Tresendar Manor are damp and cold. Torchlight flickers off iron cell doors. You can hear the sound of arcane chanting echoing from deeper within.',
            type: 'combat',
            enemies: [
                { name: 'Redclaw Guard', hp: 22, ac: 13, xpReward: 100, attackBonus: 4, damageDice: '1d8' },
                { name: 'Redclaw Guard', hp: 22, ac: 13, xpReward: 100, attackBonus: 4, damageDice: '1d8' },
                { name: 'Redclaw Mage', hp: 15, ac: 11, xpReward: 200, attackBonus: 5, damageDice: '2d6' }
            ],
            choices: [
                { id: 'melee', text: 'Charge the guards!', consequence: { success: '', failure: '' } },
                { id: 'magic', text: 'Cast a spell!', consequence: { success: '', failure: '' } },
                { id: 'run', text: 'Try to flee!', consequence: { success: '', failure: '' } }
            ],
            setFlags: { cleared_dungeon: true }
        }
    ],
    fillerPool: [
        { type: 'combat', description: 'Redclaw scouts patrol the outskirts of town!', enemy: 'Redclaw Thug', hp: 18, ac: 12, xp: 100 },
        { type: 'combat', description: 'A group of bandits attacks on the road!', enemy: 'Bandit', hp: 11, ac: 12, xp: 25 },
        { type: 'roleplay', description: 'A merchant sells their wares in the town square.', id: 'merchant_caravan' },
        { type: 'exploration', description: 'You discover a hidden shrine in the hills outside town.', id: 'shrine' }
    ],
    sideQuests: [
        { title: 'Orcs at the Well', description: 'Orcs have taken over the old well east of town. Clear them out and restore the water supply.', objectiveBase: { type: 'kill', target: 'Orc Warrior', count: 3 }, rewardBase: { xp: 150, gp: 30 } },
        { title: 'The Missing Necklace', description: 'Sister Garaele lost a blessed necklace in the forest. Retrieve it.', objectiveBase: { type: 'collect', target: 'Blessed Necklace', count: 1 }, rewardBase: { xp: 100, gp: 25 } }
    ],
    boss: {
        id: 'glasstaff',
        name: 'Glasstaff',
        title: 'Glasstaff, the Redclaw Leader',
        description: 'In a candlelit study at the heart of the manor, a thin man in dark robes stands behind a desk covered in papers and potions. He holds a glass staff that crackles with arcane energy. His eyes narrow as he sees you.',
        npcDialogue: [
            { name: 'Glasstaff', text: '"Impressive — you made it past my guards. But you\'re too late. The Black Spider already has what she needs. The Starfall Forge will be hers, and nothing you do here will change that."' },
            { name: 'Glasstaff', text: '"Still, I can\'t have you reporting back to that meddlesome dwarf. Prepare to die."' }
        ],
        hp: 30,
        ac: 13,
        xpReward: 450,
        attackBonus: 4,
        damageDice: '1d10',
        victoryFlag: 'glasstaff_defeated',
        defeatText: 'Glasstaff\'s staff shatters as he collapses. Among his papers, you find letters from "The Black Spider" — a drow named Nezzara. She is searching for the Starfall Forge and has already sent agents into the Frostpeak Mountains. You must reach it first.'
    }
};

// ============================================================
// CHAPTER 3: THE WILDERNESS (Levels 5–6)
// ============================================================
const CHAPTER_3: ChapterData = {
    id: 3,
    title: 'The Wilderness',
    description: 'Armed with Gundrik\'s map and Glasstaff\'s stolen intelligence, you set out into the wild Frostpeak Mountains. Ancient ruins and forgotten dangers await in the untamed wilderness.',
    levelRange: [5, 6],
    storyScenes: [
        {
            id: 'ch3_departure',
            title: 'Into the Frostpeaks',
            description: 'Ashvale shrinks behind you as you climb the mountain path. Gundrik walks beside you, reading his map with excited enthusiasm. The air grows colder and the trees thinner as you ascend.',
            type: 'roleplay',
            npcDialogue: [
                { name: 'Gundrik Ironvein', text: '"According to this map, the Forge is deep in the mountains, past the ruins of Thundertree — an old settlement my people abandoned when undead overran it. That\'s our first landmark."' },
                { name: 'Gundrik Ironvein', text: '"I must warn you — the letters from Glasstaff mentioned a drow priestess commanding the Black Spider\'s forces. Drow are dangerous, cunning, and utterly ruthless."' }
            ],
            choices: [
                { id: 'scout', text: 'Scout the path ahead.', requiredCheck: { skill: 'Perception', dc: 14 }, consequence: { success: 'You spot fresh tracks — humanoid feet but with an unusual stride. Someone — or something — is also heading toward Thundertree.', failure: 'The mountain paths all look the same. You press on carefully.' } },
                { id: 'prepare', text: 'Set traps along your trail to prevent followers.', requiredCheck: { skill: 'Survival', dc: 13 }, consequence: { success: 'You set clever snares behind you. No one will follow without getting caught.', failure: 'Your traps are too obvious. A skilled tracker would spot them easily.' } },
                { id: 'move_fast', text: 'Travel quickly — speed is essential.', consequence: { success: 'You make excellent time up the mountain, but the pace is exhausting.', failure: '' } }
            ],
            setFlags: { entered_wilderness: true }
        },
        {
            id: 'ch3_thundertree',
            title: 'The Ruins of Thundertree',
            description: 'The ruins of Thundertree emerge from the mist like the bones of a fallen giant. Collapsed buildings and overgrown streets stretch before you. An unnatural silence hangs over the place — the silence of the dead.',
            type: 'combat',
            npcDialogue: [
                { name: 'Druid Reidoth', text: '"Wait! Don\'t go further without my warning. I am Reidoth, keeper of these woods. The undead that destroyed Thundertree still roam these ruins, and something worse lurks in the old tower — a creature of dark power."' }
            ],
            enemies: [
                { name: 'Zombie', hp: 22, ac: 8, xpReward: 50, attackBonus: 3, damageDice: '1d6' },
                { name: 'Zombie', hp: 22, ac: 8, xpReward: 50, attackBonus: 3, damageDice: '1d6' },
                { name: 'Ghoul', hp: 22, ac: 12, xpReward: 200, attackBonus: 4, damageDice: '2d6' }
            ],
            choices: [
                { id: 'melee', text: 'Draw your weapon!', consequence: { success: '', failure: '' } },
                { id: 'magic', text: 'Cast a spell!', consequence: { success: '', failure: '' } },
                { id: 'run', text: 'Try to flee!', consequence: { success: '', failure: '' } }
            ],
            setFlags: { reached_thundertree: true }
        },
        {
            id: 'ch3_reidoth',
            title: 'Counsel of the Druid',
            description: 'In a sheltered grove within the ruins, Druid Reidoth tends a tiny garden that has somehow survived the blight. He invites you to rest and share information.',
            type: 'roleplay',
            npcDialogue: [
                { name: 'Druid Reidoth', text: '"You seek the Starfall Forge? I know the way through the mountains, but the path goes through Wight Lord Morek\'s domain — the Barrow Downs. He was once a dwarven king who refused to die when his kingdom fell."' },
                { name: 'Druid Reidoth', text: '"I can guide you through the safer mountain passes if you help me first. There\'s a nest of venomous spiders in the old herbalist\'s shop that threatens this grove."' }
            ],
            choices: [
                { id: 'help', text: 'Agree to help Reidoth with the spiders.', consequence: { success: '"Thank you! Once the spiders are dealt with, I\'ll guide you safely through the mountains. The Barrow Downs are dangerous, but together we can pass through."', failure: '' } },
                { id: 'decline', text: 'Decline — you have no time to waste.', consequence: { success: '"Very well. But without my guidance, you\'ll have to face Morek\'s domain alone. May the forest spirits protect you."', failure: '' } },
                { id: 'insight', text: 'Ask if Reidoth knows more about the Black Spider.', requiredCheck: { skill: 'Insight', dc: 12 }, consequence: { success: '"The Black Spider... a drow priestess named Nezzara. She\'s been sending agents through these mountains for months. She seeks the Forge for its power to create weapons of terrible darkness."', failure: 'Reidoth shakes his head. "I know only whispers and shadows."' } }
            ],
            setFlags: { met_reidoth: true }
        },
        {
            id: 'ch3_barrow',
            title: 'The Barrow Downs',
            description: 'Ancient burial mounds rise from the misty highlands like stone crowns. The air is thick with the smell of damp earth and decay. Pale lights flicker between the barrows — the telltale glow of the restless dead.',
            type: 'combat',
            npcDialogue: [
                { name: 'Spectral Voice', text: '"Who dares tread upon the graves of kings? Turn back, mortal, or join us in eternal darkness..."' }
            ],
            enemies: [
                { name: 'Wight Soldier', hp: 30, ac: 14, xpReward: 200, attackBonus: 4, damageDice: '1d8' },
                { name: 'Skeleton Archer', hp: 13, ac: 13, xpReward: 50, attackBonus: 4, damageDice: '1d6' },
                { name: 'Skeleton Archer', hp: 13, ac: 13, xpReward: 50, attackBonus: 4, damageDice: '1d6' }
            ],
            choices: [
                { id: 'melee', text: 'Fight the undead!', consequence: { success: '', failure: '' } },
                { id: 'magic', text: 'Cast a spell!', consequence: { success: '', failure: '' } },
                { id: 'run', text: 'Try to flee!', consequence: { success: '', failure: '' } }
            ],
            setFlags: { cleared_barrow: true }
        }
    ],
    fillerPool: [
        { type: 'combat', description: 'An Owlbear charges from the tree line!', enemy: 'Owlbear', hp: 59, ac: 13, xp: 700 },
        { type: 'combat', description: 'A patrol of skeletons blocks the mountain path.', enemy: 'Skeleton', hp: 13, ac: 13, xp: 50 },
        { type: 'exploration', description: 'You find ancient dwarven ruins carved into the mountainside.', id: 'mysterious_obelisk' },
        { type: 'roleplay', description: 'A traveling herbalist offers you supplies.', id: 'merchant_caravan' }
    ],
    sideQuests: [
        { title: 'Spider Nest', description: 'Clear the venomous spider nest for Druid Reidoth.', objectiveBase: { type: 'kill', target: 'Spider', count: 4 }, rewardBase: { xp: 200, gp: 40 } },
        { title: 'Ancient Relics', description: 'Recover dwarven relics from the Barrow Downs before they are looted.', objectiveBase: { type: 'collect', target: 'Dwarven Relic', count: 2 }, rewardBase: { xp: 250, gp: 75 } }
    ],
    boss: {
        id: 'morek',
        name: 'Wight Lord Morek',
        title: 'Wight Lord Morek, the Undying King',
        description: 'In the central barrow, a towering figure in corroded dwarven plate armor rises from a stone sarcophagus. His eyes burn with cold blue fire. A rusted but still deadly greataxe rests in his hands.',
        npcDialogue: [
            { name: 'Wight Lord Morek', text: '"I am Morek, King of the Starfall Dwarves. In life, I guarded the Forge. In death... I guard it still. None shall pass."' },
            { name: 'Wight Lord Morek', text: '"The Forge\'s power is too great for mortal hands. I would rather see it destroyed than used for war again."' }
        ],
        hp: 42,
        ac: 14,
        xpReward: 1100,
        attackBonus: 5,
        damageDice: '1d10',
        victoryFlag: 'morek_defeated',
        defeatText: 'Morek falls to one knee, his blue eyes dimming. "You are... stronger than I expected. Perhaps the living can be trusted after all." His spectral form fades, leaving behind an ancient key — the Key to the Deep Roads. The path to the Forge lies open.'
    }
};

// ============================================================
// CHAPTER 4: THE SPIDER'S WEB (Levels 7–8)
// ============================================================
const CHAPTER_4: ChapterData = {
    id: 4,
    title: "The Spider's Web",
    description: 'The Deep Roads lead into the mountain\'s heart, but the Black Spider\'s agents have arrived first. Drow scouts and their monstrous allies infest the tunnels. The race to the Forge reaches a fever pitch.',
    levelRange: [7, 8],
    storyScenes: [
        {
            id: 'ch4_deep_roads',
            title: 'The Deep Roads',
            description: 'Ancient dwarven highway stretches before you — a marvel of engineering carved through solid granite. Luminous crystals embedded in the walls still glow faintly after centuries. But fresh bootprints in the dust tell you that you are not the first to walk these halls recently.',
            type: 'exploration',
            npcDialogue: [
                { name: 'Gundrik Ironvein', text: '"By my ancestors\' beards... the Deep Roads. I never thought I\'d see them with my own eyes. The Forge should be about two days\' journey deeper. But these tracks worry me — the drow are already here."' }
            ],
            choices: [
                { id: 'stealth', text: 'Move quietly through the tunnels.', requiredCheck: { skill: 'Stealth', dc: 15 }, consequence: { success: 'You slip silently through the ancient corridors, avoiding a drow patrol entirely.', failure: 'Your footsteps echo through the stone halls. You hear movement ahead — you\'ve been detected.' } },
                { id: 'investigate', text: 'Examine the drow tracks carefully.', requiredCheck: { skill: 'Investigation', dc: 13 }, consequence: { success: 'At least a dozen drow have passed through here in the last day. They set up camp ahead — and they have a prisoner.', failure: 'The tracks are numerous but hard to read in the dim light.' } },
                { id: 'press_on', text: 'Move forward with weapons ready.', consequence: { success: 'You advance steadily, ready for anything the darkness might throw at you.', failure: '' } }
            ],
            setFlags: { entered_deep_roads: true }
        },
        {
            id: 'ch4_ambush',
            title: 'Drow Ambush',
            description: 'The cavern widens into a massive chamber with soaring pillars carved in the likeness of dwarven warriors. Suddenly, crossbow bolts fly from the shadows! Drow warriors emerge from behind the pillars, their white hair streaming behind them.',
            type: 'combat',
            enemies: [
                { name: 'Drow Warrior', hp: 33, ac: 15, xpReward: 200, attackBonus: 5, damageDice: '1d8' },
                { name: 'Drow Warrior', hp: 33, ac: 15, xpReward: 200, attackBonus: 5, damageDice: '1d8' },
                { name: 'Drow Mage', hp: 27, ac: 13, xpReward: 450, attackBonus: 6, damageDice: '2d8' }
            ],
            choices: [
                { id: 'melee', text: 'Engage the drow!', consequence: { success: '', failure: '' } },
                { id: 'magic', text: 'Cast a spell!', consequence: { success: '', failure: '' } },
                { id: 'run', text: 'Try to flee!', consequence: { success: '', failure: '' } }
            ],
            setFlags: { fought_drow: true }
        },
        {
            id: 'ch4_betrayal',
            title: 'The Guardian\'s Warning',
            description: 'Deep in the tunnels, you discover an ancient dwarven construct — a mechanical sentinel still standing guard after centuries. Its crystal eyes flicker to life as you approach.',
            type: 'roleplay',
            npcDialogue: [
                { name: 'Forge Guardian', text: '"IDENTIFICATION REQUIRED... scanning... You carry the Key of Morek. Access granted. Warning: unauthorized entities detected in Forge approach corridors. Threat level: CRITICAL."' },
                { name: 'Forge Guardian', text: '"The entity known as Nezzara has breached the outer sanctum. She seeks to corrupt the Forge\'s Heartstone. If she succeeds, the Forge will produce weapons of shadow — instruments of conquest and death."' }
            ],
            choices: [
                { id: 'ask_defenses', text: 'Ask the Guardian about the Forge\'s defenses.', consequence: { success: '"The Forge is protected by a Spectral Guardian — the echo of Master Smith Bruni. Only those deemed worthy can approach the Heartstone. Nezzara seeks to destroy the Guardian and take the stone by force."', failure: '' } },
                { id: 'ask_weakness', text: 'Ask about Nezzara\'s weaknesses.', requiredCheck: { skill: 'Arcana', dc: 14 }, consequence: { success: '"Drow are vulnerable to bright light and radiant energy. Nezzara draws power from a dark relic — a Spider Amulet. Destroy it, and her magic will weaken significantly."', failure: '"Insufficient data on entity weaknesses. Proceed with caution."' } },
                { id: 'rush', text: 'There\'s no time — push forward immediately.', consequence: { success: '"Acknowledged. May the fires of the Forge protect you."', failure: '' } }
            ],
            setFlags: { met_guardian: true }
        },
        {
            id: 'ch4_sanctum',
            title: 'The Outer Sanctum',
            description: 'The tunnels open into a vast dwarven hall lined with forges that once burned bright. Now they are cold and dark, webbed with black silk. Drow banners hang from the ancient pillars. Nezzara has made this place her stronghold.',
            type: 'combat',
            enemies: [
                { name: 'Drow Elite Guard', hp: 45, ac: 16, xpReward: 450, attackBonus: 6, damageDice: '2d6' },
                { name: 'Giant Spider', hp: 26, ac: 14, xpReward: 200, attackBonus: 5, damageDice: '1d8' },
                { name: 'Giant Spider', hp: 26, ac: 14, xpReward: 200, attackBonus: 5, damageDice: '1d8' }
            ],
            choices: [
                { id: 'melee', text: 'Cut through the defenders!', consequence: { success: '', failure: '' } },
                { id: 'magic', text: 'Cast a spell!', consequence: { success: '', failure: '' } },
                { id: 'run', text: 'Try to flee!', consequence: { success: '', failure: '' } }
            ],
            setFlags: { cleared_sanctum: true }
        }
    ],
    fillerPool: [
        { type: 'combat', description: 'A Giant Spider descends from the cavern ceiling!', enemy: 'Giant Spider', hp: 26, ac: 14, xp: 200 },
        { type: 'combat', description: 'Drow scouts have set an ambush at a choke point!', enemy: 'Drow Warrior', hp: 33, ac: 15, xp: 200 },
        { type: 'exploration', description: 'You find an ancient dwarven workshop with still-functional tools.', id: 'shrine' },
        { type: 'exploration', description: 'A collapsed tunnel forces you to find an alternate route.', id: 'collapsed_bridge' }
    ],
    sideQuests: [
        { title: 'Spider Extermination', description: 'Clear out the giant spider nests infesting the tunnels.', objectiveBase: { type: 'kill', target: 'Giant Spider', count: 4 }, rewardBase: { xp: 300, gp: 50 } }
    ],
    boss: {
        id: 'nezzara',
        name: 'Nezzara',
        title: 'Nezzara, the Black Spider',
        description: 'In a chamber thick with magical darkness, a drow priestess stands before a pulsing web of shadow magic. Her eyes glow with violet energy, and a spider-shaped amulet at her throat radiates dark power. She turns to face you with a cruel smile.',
        npcDialogue: [
            { name: 'Nezzara', text: '"So, the dwarf\'s little pet has come. You\'ve been a thorn in my web for far too long. But it ends here. The Forge will be mine, and with it, I will forge an army of shadow."' },
            { name: 'Nezzara', text: '"Do you know why they call me the Black Spider? Because every strand of fate in this land leads back to me. You are merely another fly."' }
        ],
        hp: 55,
        ac: 15,
        xpReward: 2300,
        attackBonus: 6,
        damageDice: '2d8',
        victoryFlag: 'nezzara_defeated',
        defeatText: 'Nezzara\'s amulet shatters in a burst of violet light. The shadow webs dissolve. She falls, gasping. "This... changes nothing. The Spectral Guardian still protects the Forge. You will never be worthy..." With her defeat, the path to the innermost sanctum — and the Lost Forge itself — finally lies open.'
    }
};

// ============================================================
// CHAPTER 5: THE LOST FORGE (Levels 9–10)
// ============================================================
const CHAPTER_5: ChapterData = {
    id: 5,
    title: 'The Lost Forge',
    description: 'The deepest chambers of the mountain hold the legendary Starfall Forge. But the Spectral Guardian will test your worth, and Nezzara\'s dark rituals have left scars on the ancient magic. The final trial awaits.',
    levelRange: [9, 10],
    storyScenes: [
        {
            id: 'ch5_approach',
            title: 'The Heart of the Mountain',
            description: 'Beyond Nezzara\'s fallen stronghold, the tunnels open into a natural cavern of breathtaking beauty. Crystalline formations catch the light of an underground river that flows with luminescent water. The air hums with ancient magic.',
            type: 'exploration',
            npcDialogue: [
                { name: 'Gundrik Ironvein', text: '"We\'re close. I can feel it in my bones — the same way my grandfather described it. The Forge is alive with magic, and it\'s calling to us. Just a little further..."' },
                { name: 'Gundrik Ironvein', text: '"Whatever the Guardian\'s test is, I believe in you. You\'ve come this far against impossible odds. The Starfall Dwarves chose their champions well."' }
            ],
            choices: [
                { id: 'examine', text: 'Examine the magical crystals.', requiredCheck: { skill: 'Arcana', dc: 15 }, consequence: { success: 'The crystals resonate with the Forge\'s power. You feel yourself growing stronger as magical energy flows through you. (+5 temporary HP)', failure: 'The crystals are beautiful but inscrutable.' } },
                { id: 'rest', text: 'Rest and prepare for what lies ahead.', consequence: { success: 'You take a moment to catch your breath and focus your mind. Whatever comes next, you will face it ready.', failure: '' } },
                { id: 'press_on', text: 'No time to rest. Push forward.', consequence: { success: 'With determination, you press deeper into the mountain. The hum of magic grows louder with every step.', failure: '' } }
            ],
            setFlags: { reached_forge_approach: true }
        },
        {
            id: 'ch5_trial',
            title: 'The Guardian\'s Trial',
            description: 'A vast circular chamber carved from living rock, lit by the glow of molten metal that flows through channels in the floor. At the center, a spectral figure materializes — a dwarven smith of enormous stature, translucent and radiant.',
            type: 'roleplay',
            npcDialogue: [
                { name: 'Spectral Guardian Bruni', text: '"I am Bruni, Master Smith of the Starfall Forge. For centuries I have guarded this place from those who would misuse its power. The drow priestess tried to take it by force and failed. Now you stand before me."' },
                { name: 'Spectral Guardian Bruni', text: '"The Forge can create weapons of extraordinary power — weapons that can shape the destiny of nations. Such power demands a worthy wielder. Tell me, adventurer: why do you seek the Forge?"' }
            ],
            choices: [
                { id: 'protect', text: '"To protect the innocent from those who would destroy them."', requiredCheck: { skill: 'Persuasion', dc: 14 }, consequence: { success: '"A noble purpose. Protection requires strength and sacrifice. You speak with conviction. Let us see if your actions match your words."', failure: '"Words are wind, adventurer. I sense doubt in your heart."' } },
                { id: 'power', text: '"To gain power to defeat the darkness that threatens this land."', requiredCheck: { skill: 'Intimidation', dc: 16 }, consequence: { success: '"Power for a purpose. Ambition tempered by purpose is not a sin. The greatest of my kin were driven by a thirst for excellence."', failure: '"Power without wisdom is the most dangerous force of all. The Forge has destroyed those who sought it for power alone."' } },
                { id: 'honor', text: '"To honor the legacy of the Starfall Dwarves."', requiredCheck: { skill: 'History', dc: 13 }, consequence: { success: '"You know our history. The Forge was built as a gift to the world, not a weapon of conquest. Your respect for our legacy honors me deeply."', failure: '"Sentiment alone is not enough, but your heart is in the right place."' } }
            ],
            setFlags: { passed_trial: true }
        },
        {
            id: 'ch5_corruption',
            title: 'The Corrupted Forge',
            description: 'Bruni leads you to the Forge chamber — an enormous hall where rivers of molten starfall metal flow through ancient channels. But something is wrong. Dark tendrils of shadow magic writhe across the Heartstone at the Forge\'s center, remnants of Nezzara\'s rituals.',
            type: 'exploration',
            npcDialogue: [
                { name: 'Spectral Guardian Bruni', text: '"The drow\'s dark magic has corrupted the Heartstone! If it is not cleansed, the Forge will produce only weapons of shadow and death. You must destroy the corruption, but be warned — it will fight back."' },
                { name: 'Gundrik Ironvein', text: '"This is what we\'ve been working toward. Everything depends on this moment. Cleanse the Forge, and my people\'s legacy can be restored!"' }
            ],
            choices: [
                { id: 'arcana', text: 'Use your magical knowledge to unravel the corruption.', requiredCheck: { skill: 'Arcana', dc: 16 }, consequence: { success: 'You trace the dark tendrils to their source and begin to unravel Nezzara\'s spell. The corruption weakens — but the Heartstone fights back with shadow magic!', failure: 'The corruption resists your efforts. It lashes out with dark energy!', damage: 8 } },
                { id: 'force', text: 'Channel divine or arcane energy directly into the Heartstone.', requiredCheck: { skill: 'Constitution', dc: 15 }, consequence: { success: 'Raw magical energy floods the Heartstone. The corruption screams as pure power burns it away — but the strain is tremendous.', failure: 'The feedback is overwhelming! Dark energy courses through you.', damage: 10 } },
                { id: 'bruni', text: 'Ask Bruni to help you cleanse the Forge.', consequence: { success: '"Together, then. Place your hands on the stone. This will be difficult — the corruption has taken deep root. But together, we can overcome it."', failure: '' } }
            ],
            setFlags: { cleansed_corruption: true }
        }
    ],
    fillerPool: [
        { type: 'combat', description: 'Shadow creatures emerge from the corrupted stone!', enemy: 'Wraith', hp: 67, ac: 13, xp: 1800 },
        { type: 'combat', description: 'A troll wanders the deep caverns, hungry for prey.', enemy: 'Troll', hp: 84, ac: 15, xp: 1800 },
        { type: 'exploration', description: 'You find an ancient dwarven treasury, its lock rusted shut.', id: 'shrine' },
        { type: 'exploration', description: 'The air crackles with unstable wild magic from the corrupted Forge.', id: 'wild_magic' }
    ],
    sideQuests: [
        { title: 'Shadow Purge', description: 'Destroy the shadow creatures spawned by the Forge\'s corruption.', objectiveBase: { type: 'kill', target: 'Wraith', count: 2 }, rewardBase: { xp: 500, gp: 100 } }
    ],
    boss: {
        id: 'spectral_guardian',
        name: 'Corrupted Heartstone',
        title: 'The Corrupted Heartstone Guardian',
        description: 'As you cleanse the Heartstone, the corruption coalesces into a monstrous form — a vast shadow entity that takes the shape of a twisted dwarven warrior made of pure darkness. It roars with a voice that shakes the mountain.',
        npcDialogue: [
            { name: 'Corrupted Guardian', text: '"YOU CANNOT DESTROY ME! I AM THE SHADOW OF EVERY WEAPON EVER FORGED IN HATRED! I AM WAR ITSELF!"' },
            { name: 'Spectral Guardian Bruni', text: '"This is the final test! Destroy the corruption and the Forge will be yours! Fight, champion! Fight for the future!"' }
        ],
        hp: 85,
        ac: 16,
        xpReward: 5000,
        attackBonus: 7,
        damageDice: '2d10',
        victoryFlag: 'forge_reclaimed',
        defeatText: 'The shadow entity screams as it dissolves into nothing. The Heartstone pulses with pure, golden light. The Starfall Forge roars to life, its ancient fires burning bright for the first time in centuries.\n\nGundrik falls to his knees, tears streaming down his face. "We did it. After all these centuries... the Forge lives again."\n\nSpectral Guardian Bruni smiles. "You have proven yourself worthy, champion. The Forge is yours to command. Use it wisely, and the legacy of the Starfall Dwarves will endure forever."\n\n🏆 CONGRATULATIONS! You have completed The Lost Forge of the Starfall Dwarves! 🏆'
    }
};

// ============================================================
// EXPORT ALL CHAPTERS
// ============================================================
export const CAMPAIGN_CHAPTERS: ChapterData[] = [
    CHAPTER_1,
    CHAPTER_2,
    CHAPTER_3,
    CHAPTER_4,
    CHAPTER_5
];

export function getChapter(chapterNumber: number): ChapterData | undefined {
    return CAMPAIGN_CHAPTERS.find(c => c.id === chapterNumber);
}

export function createInitialCampaignState(): import('@/types/dnd').CampaignState {
    return {
        chapter: 1,
        sceneIndex: 0,
        flags: {},
        defeatedBosses: [],
        npcsRecruited: [],
        sideQuestsCompleted: 0,
        fillersSinceLastStory: 0,
        mode: 'campaign'
    };
}
