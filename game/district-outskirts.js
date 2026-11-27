"use strict";

const { createOutskirtsView } = require('./outskirts-view.js');

const skver = { x: -70, z: -634 };
const hockey = { x: -73.3, z: -601.5, launch: -5.5, goal: 5.65, lanes: [-3.2, 0, 3.2] };
const scoreBoard = { x: -66.3, z: -607 };
const dam = { x: 891.6, z: -243.8, gateX: 901.1, gateZ: -236.15 };
const eveningStart = 18 * 60;
const waterSchedule = [18 * 60 + 30, 20 * 60 + 30, 22 * 60 + 30];
const gamesToKeep = 3;
const shotsPerGame = 3;
const shotDuration = .78;
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const clockLabel = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const waterTimes = waterSchedule.map(clockLabel).join(', ');
const waterScheduleText = `Белая плотина. У Водосброса № 2 открыта смотровая. Сброс в ${waterTimes}. Перед началом загораются янтарные фонари.`;
const rinkPin = 'Ледовая арена · три броска';
const damPin = 'Водосброс № 2 · смотровая';

const guides = [
    ['Сквер Полярников', skver.x, skver.z, 'От сквера идёт пешеходная дорожка к Ледовой арене.'],
    [rinkPin, hockey.x, hockey.z + hockey.launch, 'После 18:00. Три броска и доска результатов.'],
    [damPin, dam.x, dam.z, `Местное радио и вечерний сброс в ${waterTimes}.`]
];

function waterPhase(minutes) {
    const start = waterSchedule.find(time => minutes >= time - 8 && minutes < time + 12);
    if (start === undefined) return 'idle';
    return minutes < start ? 'warning' : 'running';
}

function nextWaterStart(minutes) {
    return waterSchedule.find(time => time > minutes) ?? waterSchedule[0];
}

function hockeyBlockerAt(time) {
    return Math.sin(time * 2.2 + .7) * 3.75;
}

function atShootingLine(player) {
    return Math.abs(player.x - hockey.x) <= 4.85 && Math.abs(player.z - hockey.z - hockey.launch) < 1.55;
}

function laneAt(player) {
    const relativeX = player.x - hockey.x;
    return relativeX < -1.6 ? hockey.lanes[0] : relativeX > 1.6 ? hockey.lanes[2] : hockey.lanes[1];
}

function onFoot(c) {
    return c.player && c.zone === 'street' && !c.car && !c.sim?.home?.door && !c.sim?.transition && !c.sim?.tramRider?.onboard;
}

function canWait(c) {
    return typeof c.waitUntil === 'function' && !c.sim?.wanted && Math.abs(c.player.speed ?? 0) < .45;
}

function newRound(results = []) {
    return { time: 0, results, shot: null };
}

function validScore(score) {
    return Number.isInteger(score) && score >= 0 && score <= shotsPerGame;
}

function createDistrictOutskirts(scene) {
    const view = scene ? createOutskirtsView(scene, { skver, hockey, scoreBoard, dam }) : null;
    let scores = [], round = null, lastPuck = null, waterSeen = false;
    let waterAnimationTime = 0, waterSoundIn = 0;

    function restore(raw) {
        scores = Array.isArray(raw?.scores) ? raw.scores.filter(validScore).sort((a, b) => b - a).slice(0, gamesToKeep) : [];
        const results = raw?.round;
        round = Array.isArray(results) && results.length < shotsPerGame && results.every(value => typeof value === 'boolean')
            ? newRound([...results]) : null;
        lastPuck = null;
        waterSeen = raw?.waterSeen === true;
        waterAnimationTime = 0;
        waterSoundIn = 0;
        view?.drawScores(scores);
    }

    function actions(c) {
        if (!onFoot(c)) return [];
        const rows = [];
        if (distance(c.player, skver) < 3) rows.push({ id: 'hockey-sign', label: 'Прочитать указатель к Ледовой арене' });
        if (atShootingLine(c.player)) {
            if (round && !round.shot) rows.push({ id: 'hockey-shot', label: `Бросить шайбу · ${round.results.length + 1}/${shotsPerGame}` });
            else if (!round) rows.push({ id: 'hockey-start', label: 'Три броска · Ледовая арена' });
        }
        if (distance(c.player, scoreBoard) < 2.6) rows.push({ id: 'hockey-scores', label: 'Посмотреть доску результатов' });
        if (distance(c.player, dam) < 3.6) {
            const phase = waterPhase(c.minutes);
            if (phase === 'running') rows.push({ id: 'water-watch', label: 'Посмотреть сброс со смотровой' });
            rows.push({ id: 'water-radio', label: 'Послушать местное радио' });
            if (phase !== 'running' && canWait(c)) rows.push({ id: 'water-wait', label: 'Дождаться сброса' });
        }
        return rows;
    }

    function act(id, c) {
        if (!actions(c).some(action => action.id === id)) return false;
        switch (id) {
            case 'hockey-sign':
                c.addMapPin(hockey.x, hockey.z + hockey.launch, rinkPin);
                c.notify('За Кедровой идите вдоль арены к синей ледовой площадке. Три броска после 18:00.');
                break;
            case 'hockey-start': {
                const entries = [];
                const open = c.minutes >= eveningStart;
                if (open) entries.push({ label: 'Начать серию из трёх бросков', run: () => {
                    round = newRound();
                    lastPuck = null;
                    c.follow?.reset(Math.PI);
                } });
                else if (canWait(c)) entries.push({ label: 'Подождать до 18:00', run: () => c.waitUntil(eveningStart) });
                entries.push({ label: 'Закрыть', run: () => {} });
                c.choose(open ? 'Встаньте на одну из трёх дорожек. Бросайте, когда щит у ворот уходит с вашей линии.' : 'Команда тренируется с 18:00 до полуночи.', entries);
                break;
            }
            case 'hockey-shot': {
                const lane = laneAt(c.player);
                const t = round.time + shotDuration;
                const hit = Math.abs(hockeyBlockerAt(t) - lane) >= 1.26;
                round.shot = { lane, at: round.time, t, hit };
                lastPuck = null;
                c.audio?.burst?.(1120, .09, .12);
                break;
            }
            case 'hockey-scores':
                c.choose(scores.length ? `Лучшие серии · ${scores.map(value => `${value}/${shotsPerGame}`).join(' · ')}` : 'Доска «Север-8». Здесь появятся ваши три лучших результата.', [{ label: 'Закрыть', run: () => {} }]);
                break;
            case 'water-radio':
                c.choose(waterScheduleText, [
                    { label: 'Записать расписание в блокнот', run: () => c.record(waterScheduleText) },
                    { label: 'Прослушать выпуск', run: () => c.audio?.say?.('fm-vodosbros', .75, { foreground: true, subtitle: waterScheduleText }) },
                    { label: 'Закрыть', run: () => {} }
                ]);
                break;
            case 'water-wait':
                if (c.waitUntil(nextWaterStart(c.minutes)))
                    c.notify('На водосбросе загорелись янтарные огни. Поток виден справа от смотровой.');
                break;
            case 'water-watch':
                if (!waterSeen) c.record('Водосброс № 2. Со смотровой видел, как поток ударил о бетон и поднял пар над каналом.');
                waterSeen = true;
                c.follow?.reset(Math.atan2(c.player.x - dam.gateX, c.player.z - dam.gateZ + 2.6));
                c.notify('Водосброс № 2 · янтарные фонари и пар над потоком.');
                break;
        }
        return true;
    }

    function advanceShot(c) {
        const shot = round.shot;
        if (!shot || round.time < shot.t) return;
        round.results.push(shot.hit);
        round.shot = null;
        lastPuck = { lane: shot.lane, z: hockey.goal - (shot.hit ? .06 : 1), remaining: .62 };
        const hits = round.results.filter(Boolean).length;
        if (round.results.length === shotsPerGame) {
            const record = !scores.length || hits > scores[0];
            scores = [...scores, hits].sort((a, b) => b - a).slice(0, gamesToKeep);
            round = null;
            c.record(`Ледовая арена · ${hits} из ${shotsPerGame}.${record ? ' Личный рекорд.' : ''}`);
            c.notify(`Серия завершена · ${hits} из ${shotsPerGame}${record ? ' · личный рекорд' : ''}`);
            view?.drawScores(scores);
            c.persist?.();
        } else {
            c.notify(`${shot.hit ? 'Попадание' : 'Щит отбил шайбу'} · ${hits}/${round.results.length}`);
        }
        if (shot.hit) c.audio?.tone?.(670, 530, .16, .09, 'triangle');
        else c.audio?.burst?.(600, .11, .16);
    }

    function update(c) {
        const dt = Math.max(0, c.dt ?? 0);
        if (round && (!onFoot(c) || distance(c.player, hockey) > 24)) round = null;
        if (lastPuck) {
            lastPuck.remaining -= dt;
            if (lastPuck.remaining <= 0) lastPuck = null;
        }
        if (round) {
            round.time += dt;
            advanceShot(c);
        }
        const nearRink = c.player && distance(c.player, hockey) < 95;
        if (view) {
            const shot = round?.shot;
            const flight = shot && Math.min(1, (round.time - shot.at) / shotDuration);
            const onLaunch = nearRink && onFoot(c) && atShootingLine(c.player);
            const puck = shot ? { lane: shot.lane, z: hockey.launch + (hockey.goal - (shot.hit ? .06 : 1) - hockey.launch) * flight } : lastPuck;
            view.drawHockey(nearRink, c.minutes >= eveningStart, round, onLaunch ? laneAt(c.player) : null, puck, hockeyBlockerAt(round?.time ?? 0), dt);
        }
        const phase = waterPhase(c.minutes);
        waterAnimationTime = phase === 'running' ? waterAnimationTime + dt : 0;
        const nearDam = c.player && distance(c.player, dam) < 105;
        if (phase === 'running' && nearDam && c.zone === 'street' && distance(c.player, dam) < 16) {
            waterSoundIn -= dt;
            if (waterSoundIn <= 0) {
                c.audio?.burst?.(445, .68, (1 - distance(c.player, dam) / 16) * .055);
                waterSoundIn = .45;
            }
        }
        else waterSoundIn = 0;
        view?.drawWater(nearDam, phase, waterAnimationTime, dt);
    }

    return {
        actions, act, update, restore,
        save: () => ({ scores: [...scores], waterSeen, round: round ? [...round.results] : null }),
        radio: () => [{ id: 'fm-vodosbros', station: 'dispatch', subtitle: waterScheduleText }],
        agenda: c => round ? [{ title: 'Ледовая арена', goal: `Броски: ${round.results.length}/${shotsPerGame}. Попадания: ${round.results.filter(Boolean).length}.` }]
            : c.player && distance(c.player, dam) < 90 ? [{ title: 'Водосброс № 2', goal: waterPhase(c.minutes) === 'running' ? 'Идёт сброс. Смотровая открыта.' : `Следующий сброс в ${clockLabel(nextWaterStart(c.minutes))}.` }]
                : []
    };
}

module.exports = { createDistrictOutskirts, guides, hockey, scoreBoard, dam, waterSchedule, waterScheduleText, waterPhase, hockeyBlockerAt };
