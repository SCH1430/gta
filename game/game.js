"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
const THREE = require("../engine/three.module.min.js");
const world_js_1 = require("./world.js");
const house_js_1 = require("./house.js");
const house_layout_js_1 = require("./house-layout.js");
const world_layout_js_1 = require("./world-layout.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const collision_js_1 = require("./collision.js");
const tracks_js_1 = require("./tracks.js");
const boot_contact_shadow_js_1 = require("./boot-contact-shadow.js");
const boarding = require("./vehicle-boarding.js");
const world_railway_js_1 = require("./world-railway.js");
const models_js_1 = require("./models.js");
const human_kits_js_1 = require("./human-kits.js");
const { streetPerformancePose } = require("./character-performance.js");
const { courtyardShelter } = require("./world-life-discoveries.js");
const sim_js_1 = require("./sim.js");
const ui_js_1 = require("./ui.js");
const audio_js_1 = require("./audio.js");
const dialogue_js_1 = require("./dialogue.js");
const storage_js_1 = require("./storage.js");
const camera_js_1 = require("./camera.js");
const impact_camera_js_1 = require("./impact-camera.js");
const camera_volume_js_1 = require("./camera-volume.js");
const story_recovery_js_1 = require("./story-recovery.js");
const atmosphere_js_1 = require("./atmosphere.js");
const story_js_1 = require("./story.js");
const story_catalog_js_1 = require("./story-catalog.js");
const story_ui_js_1 = require("./story-ui.js");
const story_scenery_js_1 = require("./story-scenery.js");
const vehicle_tools_js_1 = require("./vehicle-tools.js");
const vehicle_world_js_1 = require("./vehicle-world.js");
const vehicle_systems_js_1 = require("./vehicle-systems.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const patrol_view_js_1 = require("./patrol-view.js");
const vehicle_view_js_1 = require("./vehicle-view.js");
const tram_interior_js_1 = require("./tram-interior.js");
const interior_layout_js_1 = require("./interior-layout.js");
const residence_js_1 = require("./residence.js");
const exploration_view_js_1 = require("./exploration-view.js");
const city_life_view_js_1 = require("./city-life-view.js");
const city_clock_js_1 = require("./city-clock.js");
const field_services_js_1 = require("./field-services.js");
const frame_trial_js_1 = require("./frame-trial.js");
const night_benchmark_js_1 = require("./night-benchmark.js");
const outer_tour_js_1 = require("./outer-tour.js");
const fleet_guide_js_1 = require("./fleet-guide.js");
const garage_log_js_1 = require("./garage-log.js");
const garage_service_js_1 = require("./garage-service.js");
const garage_bay_js_1 = require("./garage-bay.js");
const parcel_hands_js_1 = require("./parcel-hands.js");
const parcel_view_js_1 = require("./parcel-view.js");
const free_drive_js_1 = require("./free-drive.js");
const player_outfit_js_1 = require("./player-outfit.js");
const weather_js_1 = require("./weather.js");
const radio_news_js_1 = require("./radio-news.js");
const pedestrian_controller_js_1 = require("./pedestrian-controller.js");
const replay_js_1 = require("./replay.js");
const replay_view_js_1 = require("./replay-view.js");
const ladoga_history_js_1 = require("./ladoga-history.js");
const ladoga_photo_js_1 = require("./ladoga-photo.js");
const blackout_js_1 = require("./blackout.js");
const sound_guide_js_1 = require("./sound-guide.js");
const sound_captions_js_1 = require("./sound-captions.js");
const local_soundscape_js_1 = require("./local-soundscape.js");
const acoustic_space_js_1 = require("./acoustic-space.js");
const cargo_rail_js_1 = require("./cargo-rail.js");
const cargo_rail_view_js_1 = require("./cargo-rail-view.js");
const graphics_quality_js_1 = require("./graphics-quality.js");
const population_performance_js_1 = require("./population-performance.js");
const road_advisory_js_1 = require("./road-advisory.js");
const traffic_bypass_js_1 = require("./traffic-bypass.js");
let canvas = document.querySelector('#city');
const debug = new URLSearchParams(location.search).has('diagnostics');
async function start(boot, listen) {
    const saved = await (0, storage_js_1.loadGame)().catch(() => null);
    await Promise.allSettled([document.fonts.load('700 20px K77Display', 'Канал'), document.fonts.load('400 18px K77Body', 'Смена')]);
    let sim = new sim_js_1.Simulation(saved?.game);
    const patrolLight = (car) => sim.patrolActive(car);
    const trafficLight = (car) => (0, traffic_bypass_js_1.trafficIndicator)(car, sim.elapsed);
    const options = { alpha: false, antialias: true, powerPreference: 'high-performance' };
    let gl = canvas.getContext('webgl2', options);
    if (gl) {
        const driver = gl.getExtension('WEBGL_debug_renderer_info');
        const device = driver ? String(gl.getParameter(driver.UNMASKED_RENDERER_WEBGL)) : '';
        if (/swiftshader|llvmpipe|software rasterizer/i.test(device)) {
            gl.getExtension('WEBGL_lose_context')?.loseContext();
            const replacement = canvas.cloneNode(false);
            canvas.replaceWith(replacement);
            canvas = replacement;
            gl = null;
        }
    }
    const renderer = gl ? new THREE.WebGLRenderer({ canvas, context: gl, ...options }) :
        new (await Promise.resolve().then(() => require("./software.js"))).SoftwareRenderer(canvas);
    if (renderer instanceof THREE.WebGLRenderer)
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    const displayProfile = () => ({ coarse: matchMedia('(pointer:coarse)').matches, software: !gl, ratio: window.devicePixelRatio,
        width: canvas.clientWidth || window.innerWidth, height: canvas.clientHeight || window.innerHeight });
    const graphics = new graphics_quality_js_1.GraphicsQuality((0, graphics_quality_js_1.graphicsMode)(saved?.graphics), displayProfile());
    const populationPerformance = new population_performance_js_1.PopulationPerformance();
    const scene = new THREE.Scene();
    const weather = (0, atmosphere_js_1.createAtmosphere)(scene);
    const world = (0, world_js_1.createWorld)(scene);
    const freightView = (0, cargo_rail_view_js_1.createCargoRailView)(scene), recordedFreight = new cargo_rail_js_1.CargoRail();
    const tracks = (0, tracks_js_1.createTracks)(scene);
    const recorder = new replay_js_1.ReplayRecorder();
    const impactCamera = new impact_camera_js_1.ImpactCamera(), replayImpacts = [];
    let archiveReplay = null;
    let replayView;
    const replayHidden = new Map();
    let jobs = new story_js_1.DistrictJobs(saved?.districtJobs);
    let tour = new outer_tour_js_1.OuterTour(saved?.outerTour);
    let garage = new garage_log_js_1.GarageLog(saved?.garage, sim.savedCar?.id);
    let parcels = new parcel_hands_js_1.ParcelHands(saved?.parcels);
    const outfit = (0, player_outfit_js_1.playerOutfit)(), showCrates = (0, parcel_view_js_1.crateScene)(scene), footCrew = (0, patrol_view_js_1.createPatrolView)(scene), garageBay = (0, garage_bay_js_1.createGarageBay)(scene);
    const albumCamera = new ladoga_photo_js_1.LadogaPhoto();
    let roll = 1;
    let freeSelection = { ...free_drive_js_1.defaultFreeSelection };
    let mainSession = null;
    const calendarMinutes = () => Math.floor((0, city_clock_js_1.districtCalendarMinutes)(sim.elapsed) + garage.calendarWait);
    const clockMinutes = () => calendarMinutes() % 1440;
    const storyBlock = () => sim.mission === 0 && sim.stage === 1;
    const stories = (0, story_scenery_js_1.createStoryScenery)(scene), motorWorld = (0, vehicle_world_js_1.createMotorWorld)(scene), explore = (0, exploration_view_js_1.createExploration)(scene), crew = (0, city_life_view_js_1.createRepairVisual)(scene);
    const glass = (0, vehicle_view_js_1.createCabinGlass)(canvas);
    let house;
    let showingHouse = false;
    let restoringIndoorView = sim.home.inside;
    const threshold = document.createElement('div');
    threshold.className = 'k-threshold';
    canvas.insertAdjacentElement('afterend', threshold);
    const follow = new camera_js_1.FollowCamera(Number.isFinite(saved?.yaw) ? saved.yaw : sim.hero.yaw);
    const camera = follow.camera;
    const guidePhoto = require('./notebook-atlas.js').createGuidePhotos(renderer, canvas, scene, world, camera,
        () => sim.home.inside && house ? house.scene : scene);
    const { ShiftJournal } = require('./shift-journal.js');
    let journal = new ShiftJournal(saved?.shiftJournal);
    const firstMarket = { x:30, z:26, label:'Прилавок Инны' };
    const campaignPay = sim_js_1.campaign.map(order => order.reward);
    let portrait = null;
    const portraitEye = new THREE.Vector3(), portraitDirection = new THREE.Vector3(), framing = new THREE.Vector3();
    let previousPortrait = null;
    const hero = (0, models_js_1.createPerson)('hero');
    const contactShadow = (0, boot_contact_shadow_js_1.createBootContactShadow)();
    scene.add(hero.root, contactShadow.root);
    const tramPassengers = new THREE.Group();
    scene.add(tramPassengers);
    const cars = new Map();
    const people = new Map();
    const peoplePoseAt = new Map();
    let lastPopulationRevision = -1;
    const necks = new Map();
    const heroNeck = hero.root.getObjectByName('neck');
    if (heroNeck)
        necks.set('hero', heroNeck);
    const variants = new Map(sim.people.map((person, i) => [person.id, i]));
    const audio = new audio_js_1.GameAudio();
    const townNews = new radio_news_js_1.TownRadioNews();
    const ui = (0, ui_js_1.createUI)(document.querySelector('#hud'), action);
    const districtPlay = require('./district-play.js').createDistrictPlay(scene, ui, (dt, conditions) => ({
        sim, player:sim.player, car:sim.activeCar() ?? null, dt, minutes:clockMinutes(), calendarMinutes:calendarMinutes(),
        waitUntil(minute) {
            if (!Number.isInteger(minute) || minute < 0 || minute >= 1440 || sim.wanted || sim.transition || sim.home.door || sim.tramRider.onboard || Math.abs(sim.player.speed) >= .45)
                return false;
            garage.setTime(minute, clockMinutes());
            return true;
        },
        weather:conditions ?? (0, weather_js_1.weatherAt)(sim.elapsed, clockMinutes()),
        scene, camera, ui, world, follow, guidePhoto, hero, people, cars, audio, garage, jobs, parcels, zone:sim.home.zone, indoorScene:house?.scene, interiorScene:house?.scene
    }), () => persist());
    districtPlay.restore(saved?.districtPlay);
    ui.update({ districtDestinations: districtPlay.destinations });
    audio.onDialogueResume = text => ui.notify(text);
    audio.onDistrictBulletin = text => {
        journal.add('Депо · эфир', text, calendarMinutes());
        ui.notify(text);
    };
    const hud = document.querySelector('#hud');
    const showSound = (0, sound_guide_js_1.createSoundGuide)(hud);
    const soundCaptions = new sound_captions_js_1.SoundCaptions();
    let previousSoundCaption = -Infinity;
    const showRoadAdvisory = (0, road_advisory_js_1.createRoadAdvisory)(hud);
    void (0, storage_js_1.readLocalReplay)().then(replay_js_1.unpackReplay).then(value => {
        if (value) {
            archiveReplay = value;
            ui.refreshPanel();
        }
    }).catch(() => { });
    if (saved?.settings)
        ui.setSettings(saved.settings);
    function applySoundSettings() {
        audio.setVolume(ui.settings.volume);
        audio.setSoundProfile(ui.settings.soundProfile);
        audio.setRadio(ui.settings.radio);
        audio.setStation(ui.settings.radioStation);
    }
    function applyPopulationSettings() {
        sim.setPopulation({ pedestrians: ui.settings.pedestrianDensity, traffic: ui.settings.trafficDensity });
    }
    function prunePopulationModels() {
        if (lastPopulationRevision === sim.populationRevision)
            return;
        lastPopulationRevision = sim.populationRevision;
        const liveCars = new Set(sim.cars.map(car => car.id)), livePeople = new Set(sim.people.map(person => person.id));
        for (const [id, record] of cars)
            if (!liveCars.has(id)) {
                record.model.dispose();
                cars.delete(id);
            }
        for (const [id, model] of people)
            if (!livePeople.has(id)) {
                if (model.root.parent) {
                    model.root.removeFromParent();
                    model.resetMotion();
                }
                peoplePoseAt.delete(id);
            }
        if (portrait && portrait.id !== 'hero' && !livePeople.has(portrait.id))
            portrait = null;
    }
    applySoundSettings();
    applyPopulationSettings();
    if (!storage_js_1.canSaveGame())
        ui.notify('Не удалось загрузить профиль. Автосохранение приостановлено. Откройте «Сохранения и диагностика».');
    const snapshot = () => mainSession ? { ...mainSession, settings: { ...ui.settings }, graphics: graphics.mode } : ({ version: 1, game: sim.snapshot(), settings: { ...ui.settings }, yaw: follow.yaw, districtJobs: jobs.save(), outerTour: tour.save(), garage: garage.save(), parcels: parcels.save(), districtPlay: districtPlay.save(), shiftJournal: journal.save(), graphics: graphics.mode });
    const jobFrame = (dt = 0) => ({ x: sim.player.x, z: sim.player.z, yaw: follow.yaw, space: sim.home.zone, car: sim.activeCar() ?? null, vehicles: sim.cars, busy: !!sim.transition || !!sim.home.door || sim.tramRider.onboard, wanted: sim.wanted, elapsed: sim.elapsed, clockMinutes: clockMinutes(), heroSpeed: sim.player.speed, heroY: sim.player.y, tramTime: sim.tramTime, campaignMission: sim.mission, cargo: sim.cargoRail.passage, dt });
    const trialCamera = new THREE.PerspectiveCamera();
    const sampleHome = new residence_js_1.Residence();
    sampleHome.avatar = { x: 4.3, z: 0, y: 3.06, yaw: 0, speed: 0 };
    let trial = null;
    let benchmark = null;
    const trialBox = document.createElement('aside');
    trialBox.className = 'k-trial';
    trialBox.hidden = true;
    const trialText = document.createElement('span'), stopTrial = document.createElement('button');
    stopTrial.textContent = 'Завершить';
    trialBox.append(trialText, stopTrial);
    document.body.append(trialBox);
    const desk = new field_services_js_1.FieldServices(snapshot, () => ui.refreshPanel(), (long, mode) => {
        if (mode === 'chase') {
            benchmark = (0, night_benchmark_js_1.createNightBenchmark)(scene);
            hero.root.visible = false;
            contactShadow.root.visible = false;
            for (const record of cars.values())
                record.model.root.visible = false;
            for (const actor of people.values())
                actor.root.visible = false;
            footCrew.update(0, [], sim.hero, false);
            showCrates([], 0, 0, false);
        }
        else
            house ??= (0, house_js_1.createHouse)();
        trial = new frame_trial_js_1.FrameTrial(long, mode);
        trialBox.hidden = false;
        ui.close();
        document.querySelector('#hud').hidden = true;
    }, r => { offlinePhase = r.bad.length ? 'error' : 'ready'; offlineTotal = r.total; ui.setOffline(r.bad.length ? 0 : r.total, r.total, !r.bad.length, !!r.bad.length, r.bad.length ? 'Нужна докачка в диагностике' : undefined); });
    function startQuarterTrial() {
        trial = new frame_trial_js_1.FrameTrial(false,'quarter');
        trialBox.hidden=false; ui.close(); document.querySelector('#hud').hidden=true;
    }
    function endTrial(completed) {
        const quarter=trial?.mode==='quarter';
        const report=quarter && completed ? trial.report(gl?'WebGL 2':'Canvas 2D') : null;
        if (!trial)
            return;
        if (completed)
            void desk.remember(trial.report(gl ? 'WebGL 2' : 'Canvas 2D')).catch(() => ui.notify('Не удалось сохранить замер.'));
        benchmark?.dispose();
        benchmark = null;
        trial = null;
        trialBox.hidden = true;
        document.querySelector('#hud').hidden = false;
        for (const record of cars.values())
            record.model.root.visible = true;
        for (const actor of people.values())
            actor.root.visible = true;
        if (report) ui.chooseGraphicsReport(report);
        else ui.open(quarter ? 'laptop' : 'services');
    }
    stopTrial.onclick = () => endTrial(false);
    ui.registerPanel('services', 'Сохранения и диагностика', () => desk.draw());
    ui.registerPanel('replay', 'Режиссёр повтора', () => (0, replay_view_js_1.replayPanel)(recorder.duration, archiveReplay));
    ui.registerPanel('graphics', 'Изображение и FPS', () => (0, graphics_quality_js_1.graphicsPanel)(graphics, gl ? 'WebGL 2' : 'Canvas 2D'));
    ui.registerPanel('transport', 'Бортовой журнал и автосервис', () => (0, vehicle_tools_js_1.vehiclePanel)(sim));
    const atWardrobe = () => sim.atGarage() && !sim.driven || sim.home.inside && sim.home.zone === 'house' && (0, house_layout_js_1.houseRoom)(sim.player.x, sim.player.z, sim.player.y).includes('кв. 7');
    const ladoga = () => sim.cars.find(car => car.id === ladoga_history_js_1.ladogaId);
    const canServiceLadoga = () => sim.atGarage() && !sim.wanted;
    ui.registerPanel(ladoga_history_js_1.ladogaPanel, 'История «Ладоги 04»', () => garage.ladoga.draw(ladoga(), canServiceLadoga(), sim.money));
    ui.registerPanel('garage-log', 'Гаражный журнал', () => garage.draw(sim.cars, sim.player, sim.mission + jobs.save().receipts.length + Number(tour.complete), sim.home.coat, atWardrobe(), sim.atGarage() && !sim.driven));
    ui.registerPanel('free-drive', 'Свободная поездка', () => (0, free_drive_js_1.freeDrivePanel)(freeSelection, !!mainSession));
    ui.registerPanel('outer-tour', outer_tour_js_1.tourTitle, () => tour.draw());
    ui.registerPanel('fleet', 'Автопарк', () => (0, fleet_guide_js_1.fleetGuide)(sim.cars, sim.player, sim.driven));
    ui.registerPanel('district-jobs', 'Заказы района', () => (0, story_ui_js_1.jobBoard)(jobs, jobFrame()));
    const escaped = (v) => v.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const callsigns = ['Депо', 'Участок', 'Вышка'];
    let radioChannel = 0, radioAnswer = '';
    ui.registerPanel('shift-radio', 'Рация смены', () => {
        const reply = radioAnswer ? '<p role="status">'+escaped(radioAnswer)+'</p>' : '';
        return '<div class="k-radio-lcd"><span>КАНАЛ 0'+(radioChannel + 1)+'</span><strong>'+callsigns[radioChannel]+'</strong></div>'+reply+
            '<div class="k-list"><button class="k-panel-row" data-action="shift-tune">Сменить канал</button><button class="k-panel-row" data-action="shift-call">Нажать тангенту · запросить сводку</button></div>';
    });
    ui.registerPanel('reports', 'Сводка дежурной смены', () => sim.cityLife.incidents.length ? sim.cityLife.incidents.slice().reverse().map(i => '<p>' + escaped(i.text) + '</p>').join('') : '<p>В районе пока спокойно.</p>');
    if (storage_js_1.recoveryNotice)
        ui.notify(storage_js_1.recoveryNotice);
    let saveWarned = false;
    function persist() {
        if (!storage_js_1.canSaveGame() || desk.changing || trial)
            return;
        void (0, storage_js_1.saveGame)(snapshot()).catch(() => {
            if (!saveWarned)
                ui.notify('Не удалось сохранить прогресс на устройстве.');
            saveWarned = true;
        });
    }
    let audioStarted = false;
    function phoneSignal() {
        audio.tone(165, 135, .11, .065, 'triangle');
        audio.tone(165, 135, .11, .055, 'triangle', .18);
        ui.messageFeedback();
    }
    function unlock() {
        audio.unlock();
        if (!audioStarted && !mainSession && sim.mission === 0 && sim.stage === 0) {
            phoneSignal();
            ui.notify('Канальск · февраль 2022. Семён оставил сообщение о последнем рейсе.');
        }
        audioStarted = true;
    }
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    const parcelRear = (c, p) => sim.motorPool.rearNear(c, p);
    function canWait() {
        const car = sim.activeCar();
        return !sim.wanted && !sim.home.inside && !sim.transition && !sim.tramRider.onboard && Math.abs(sim.player.speed) < .45 &&
            (!!car || parcel_hands_js_1.restPoints.some(p => Math.hypot(p.x - sim.hero.x, p.z - sim.hero.z) < 2.7));
    }
    function swapWorld(next, yaw = next.player.yaw) {
        sim = next;
        lastPopulationRevision = -1;
        applyPopulationSettings();
        prunePopulationModels();
        sim.populationPressure = populationPerformance.pressure;
        audio.resetDialogue();
        recorder.clear();
        soundCaptions.reset();
        previousSoundCaption = -Infinity;
        showSound([]);
        impactCamera.clear();
        replayImpacts.length = 0;
        follow.reset(yaw);
        hero.resetMotion();
        tracks.clear();
        ui.clearRoute();
        portrait = null;
        garageBay.clear();
        roll = sim.cityLife.shutter;
        for (const record of cars.values())
            record.model.dispose();
        cars.clear();
        for (const model of people.values())
            model.resetMotion();
        peoplePoseAt.clear();
        ui.close();
        syncHUD();
        persist();
    }
    function action(id, value) {
        if (id.startsWith('district:') && districtPlay.act(id)) return;
        if (id === 'shift-tune' || id === 'shift-call') {
            if (id === 'shift-tune') { radioChannel = (radioChannel + 1) % callsigns.length; radioAnswer = ''; }
            else {
                const rail = (0, world_railway_js_1.linePose)(sim.tramTime);
                const weather = (0, weather_js_1.weatherAt)(sim.elapsed,clockMinutes());
                const bulletins = districtPlay.radio();
                radioAnswer = radioChannel === 0 ? (rail.visible ? 'Вагон на линии. ' + sim.tramRider.stopName(sim.tramTime) : 'Вагон сейчас в депо.') :
                    radioChannel === 1 ? (bulletins.find(b => b.subtitle)?.subtitle || 'Текущий участок · ' + sim.district()) :
                    'По метеопосту ' + Math.round(weather.temperature) + ' °C.';
                audio.burst(2100,.055,.07);
                audio.tone(640,600,.08,.035,'sine',.12);
                journal.add(callsigns[radioChannel]+' · эфир',radioAnswer,calendarMinutes());
            }
            ui.refreshPanel();
            return;
        }
        if (id === 'quarter-trial') {
            startQuarterTrial();
            return;
        }
        if (id === 'graphics-set') {
            graphics.select((0, graphics_quality_js_1.graphicsMode)(value), displayProfile());
            resize();
            ui.refreshPanel();
            persist();
            return;
        }
        if (id === 'graphics-test') {
            void desk.act('desk-chase');
            return;
        }
        if (id === 'replay-open' || id === 'replay-load') {
            const clip = id === 'replay-open' ? recorder.clip() : archiveReplay;
            if (clip)
                beginReplay(clip);
            return;
        }
        if (id.startsWith('ladoga-') && id !== ladoga_history_js_1.ladogaPanel) {
            const car = ladoga(), result = garage.ladoga.act(id, value, car, canServiceLadoga(), sim.money, sim.elapsed);
            if (!result)
                return;
            if (car && result.cost && result.service) {
                sim.commitGarageService(car, result.cost);
                garageBay.flash(car, sim.elapsed, result.service);
            }
            if (result.message)
                ui.notify(result.message);
            if (result.capture || result.service)
                ui.close();
            else
                ui.refreshPanel();
            handleEvents();
            syncHUD();
            persist();
            return;
        }
        if (id.startsWith('free-')) {
            if (id === 'free-car' && typeof value === 'string' && Object.hasOwn(vehicle_cabin_js_1.vehicleNames, value))
                freeSelection.kind = value;
            if (id === 'free-place' && free_drive_js_1.startLocations[Number(value)])
                freeSelection.location = Number(value);
            if (id === 'free-time' && free_drive_js_1.times[Number(value)])
                freeSelection.time = Number(value);
            if (id === 'free-start' && !mainSession) {
                const ride = (0, free_drive_js_1.createFreeDrive)(freeSelection);
                if (!ride) {
                    ui.notify('На площадке сейчас тесно. Выберите другое место старта.');
                    return;
                }
                mainSession = snapshot();
                jobs = new story_js_1.DistrictJobs();
                tour = new outer_tour_js_1.OuterTour();
                garage = new garage_log_js_1.GarageLog({ cars: [], records: {}, walking: 0, outfit: { ...garage.outfit }, wait: 0 });
                parcels = new parcel_hands_js_1.ParcelHands();
                garage.setTime(Math.round(ride.hour * 60), (0, city_clock_js_1.districtMinutes)(ride.sim.elapsed));
                districtPlay.restore();
                journal = new ShiftJournal({ opening:3 });
                swapWorld(ride.sim);
                return;
            }
            if (id === 'free-return' && mainSession) {
                const original = mainSession;
                mainSession = null;
                jobs = new story_js_1.DistrictJobs(original.districtJobs);
                tour = new outer_tour_js_1.OuterTour(original.outerTour);
                garage = new garage_log_js_1.GarageLog(original.garage, original.game.savedCar?.id);
                parcels = new parcel_hands_js_1.ParcelHands(original.parcels);
                districtPlay.restore(original.districtPlay);
                journal = new ShiftJournal(original.shiftJournal);
                swapWorld(new sim_js_1.Simulation(original.game), original.yaw);
                return;
            }
            ui.refreshPanel();
            return;
        }
        if (id === 'street:strike' || id === 'street:dodge' || id === 'street:cover') {
            sim.streetAction(id);
            handleEvents();
            syncHUD();
            persist();
            return;
        }
        if (id === 'rest-hour') {
            if (canWait()) {
                garage.pause(1);
                ui.notify('Прошёл час');
                syncHUD();
                persist();
            }
            return;
        }
        if (id.startsWith('crate-')) {
            if (sim.driven || sim.transition || sim.home.inside || sim.tramRider.onboard)
                return;
            const result = parcels.act(id, typeof value === 'string' ? value : undefined, sim.hero, sim.cars, parcelRear, storyBlock(), (point, y) => (0, collision_js_1.clearDisc)(point, .29, y, sim.cars));
            if (result) {
                audio.effect('switch');
                ui.notify(result);
                syncHUD();
                persist();
            }
            return;
        }
        if (id.startsWith('garage-') && id !== 'garage-log') {
            if (id === 'garage-forget' && typeof value === 'string') {
                garage.remove(value);
                if (sim.savedCar?.id === value)
                    sim.savedCar = null;
            }
            if (id === 'garage-light' && sim.atGarage() && !sim.driven)
                garage.toggleLights();
            if (id === 'garage-shutter' && sim.atGarage() && !sim.driven)
                garage.toggleShutter(sim.cityLife.shutter);
            if (id === 'garage-recall' && typeof value === 'string' && sim.atGarage() && !sim.driven && !sim.wanted && garage.has(value)) {
                const vehicle = sim.cars.find(c => c.id === value);
                if (!vehicle || vehicle.carriedBy || Math.abs(vehicle.speed) > .5) {
                    ui.notify('Машина сейчас недоступна');
                    return;
                }
                const places = [[-38, 47], [-33, 48], [-38, 51], [-33, 52], [-43, 47], [-43, 51]];
                const target = places.map(([x, z]) => ({ x, z, yaw: Math.PI / 2 })).find(p => (0, collision_js_1.hullFits)(vehicle, p, sim.cars, [...sim.people, sim.hero]));
                if (!target) {
                    ui.notify('Все места у ворот заняты');
                    return;
                }
                Object.assign(vehicle, target, { y: (0, world_layout_js_1.groundHeight)(target.x, target.z), speed: 0, vx: 0, vz: 0, returning: false, auto: false });
                ui.notify('Машина у Канальных гаражей');
            }
            if (id === 'garage-coat' && atWardrobe()) {
                sim.home.coat = (sim.home.coat + 1) % 3;
                portrait = { id: 'hero', until: sim.elapsed + 2.5 };
            }
            if (id === 'garage-wear' && typeof value === 'string' && atWardrobe()) {
                const name = garage.cycle(value);
                if (name)
                    ui.notify(name);
            }
            if (id === 'garage-find' && !sim.home.inside && typeof value === 'string') {
                const car = sim.cars.find(c => c.id === value && garage.has(c.id));
                if (car) {
                    ui.open('map');
                    ui.focusDestination({ ...car, label: vehicle_cabin_js_1.vehicleNames[car.kind] });
                }
            }
            else if (id === 'garage-find')
                ui.notify('Выйдите на улицу, чтобы проложить путь');
            syncHUD();
            ui.refreshPanel();
            persist();
            return;
        }
        if (desk.handles(id)) {
            void desk.act(id, value);
            return;
        }
        if (id === 'fleet-find' && typeof value === 'string') {
            if (sim.home.inside) {
                ui.notify('Выйдите на улицу, чтобы проложить путь к машине');
                return;
            }
            const parked = (0, fleet_guide_js_1.nearestParked)(sim.cars, sim.player, value, sim.driven);
            if (parked) {
                ui.open('map');
                ui.focusDestination({ ...parked, label: vehicle_cabin_js_1.vehicleNames[parked.kind] });
            }
            return;
        }
        if (id.startsWith('tour-')) {
            if (id === 'tour-start') {
                tour.start();
                ui.clearRoute();
                ui.close();
            }
            if (id === 'tour-pause') {
                ui.clearRoute(tour.next);
                tour.suspend();
            }
            if (id === 'tour-route' && tour.next) {
                ui.open('map');
                ui.focusDestination(tour.next);
            }
            if (id === 'tour-check') {
                const point = tour.next, result = tour.advance(tourFrame());
                if (result) {
                    ui.clearRoute(point);
                    if (result.reward) {
                        sim.creditDistrictReward(result.reward);
                        audio.effect('cash');
                        ui.notify(outer_tour_js_1.tourTitle + ' · +4 600 ₽');
                    }
                    else {
                        audio.effect('switch');
                        ui.notify(result.label + ' · отметка записана');
                    }
                }
            }
            syncHUD();
            ui.refreshPanel();
            persist();
            return;
        }
        if (id.startsWith('job-')) {
            const result = jobs.act(id, jobFrame());
            jobResult(result);
            if (id.startsWith('job-accept') && jobs.active)
                ui.close();
            else
                ui.refreshPanel();
            syncHUD();
            persist();
            return;
        }
        if (id.startsWith('motor-')) {
            const r = (0, vehicle_tools_js_1.vehicleAction)(sim, id);
            if (r.message)
                ui.notify(r.message);
            if (r.inspectHood)
                ui.close();
            else
                ui.refreshPanel();
            syncHUD();
            persist();
            return;
        }
        if (id.startsWith('home:')) {
            const r = sim.home.act(id, sim.hero, sim.elapsed, p => (0, collision_js_1.clearDisc)(p, .31, (0, world_layout_js_1.groundHeight)(p.x, p.z), sim.cars) && !sim.people.some(n => !n.onboard && Math.hypot(n.x - p.x, n.z - p.z) < .55), calendarMinutes());
            if (r) {
                if ('untilHour' in r && typeof r.untilHour === 'number')
                    garage.setTime(r.untilHour * 60, clockMinutes());
                if (id === 'home:coat')
                    portrait = { id: 'hero', until: sim.elapsed + 2.5 };
                if (r.text)
                    ui.notify(r.text);
                if (r.sound)
                    audio.effect(r.sound);
                if (r.bulletin) {
                    jobs.act('job-show-' + r.bulletin.split('-').at(-1), jobFrame());
                    ui.open('district-jobs');
                }
            }
            syncHUD();
            persist();
            return;
        }
        switch (id) {
            case 'interact':
                sim.interact(typeof value === 'string' ? value : undefined);
                break;
            case 'jump':
                sim.jump();
                break;
            case 'leaveCar':
                sim.leaveCar();
                break;
            case 'light':
                sim.toggleLights();
                break;
            case 'horn':
                sim.horn();
                break;
            case 'restart':
                if (jobs.active) {
                    jobResult(jobs.restart());
                    break;
                }
                sim.restart();
                tracks.clear();
                follow.reset(sim.player.yaw);
                break;
            case 'repair': {
                const car = sim.garageCar();
                const ok = sim.garage('repair');
                if (car && ok) {
                    garageBay.flash(car, sim.elapsed, 'repair');
                    ui.close();
                }
                break;
            }
            case 'repairPart': {
                const car = sim.garageCar();
                if (car && sim.garage('repairPart', typeof value === 'string' ? value : undefined))
                    garageBay.flash(car, sim.elapsed, value === 'polish' ? 'paint' : 'repair');
                break;
            }
            case 'saveCar': {
                const candidate = sim.garageCar();
                if (candidate && !garage.canAdd(candidate.id)) {
                    ui.notify('Все четыре места заняты. Освободите место в гаражном журнале.');
                    return;
                }
                if (sim.garage('save') && sim.savedCar) {
                    const result = garage.add(sim.savedCar.id);
                    if (result)
                        ui.notify(result);
                }
                break;
            }
            case 'paint': {
                const car = sim.garageCar(), ok = sim.garage('paint', typeof value === 'string' ? value : undefined);
                if (car && ok) {
                    garageBay.flash(car, sim.elapsed, 'paint');
                    ui.close();
                }
                break;
            }
            case 'settings':
                applySoundSettings();
                applyPopulationSettings();
                break;
        }
        handleEvents();
        syncHUD();
        persist();
    }
    function jobResult(result) {
        if (result.resume) {
            (0, story_recovery_js_1.restoreJobPosition)(sim, result.resume);
            tracks.clear();
            follow.reset(sim.player.yaw);
        }
        if (result.patrol)
            sim.setDistrictPursuit(result.patrol, result.patrolReason);
        if (result.tramHold)
            sim.holdNextDepotDeparture(result.tramHold);
        if (result.cargoTrain === 'launch')
            sim.cargoRail.launch(result.cargoCrossing);
        if (result.garageHelp) {
            const car = sim.cars.find(c => c.id === result.garageHelp?.carId) ?? sim.garageCar();
            if (car && Math.abs(car.speed) < 1.4) {
                (0, vehicle_road_js_1.repairEquipment)(car, true);
                garageBay.flash(car, sim.elapsed, 'repair');
            }
        }
        for (const gate of result.unlockGates ?? [])
            sim.home.openedGates.add(gate);
        if (result.reward) {
            sim.creditDistrictReward(result.reward);
            audio.effect('cash');
        }
        if (result.cargo) {
            const car = sim.cars.find(c => c.id === result.cargo.carId);
            if (car) {
                const kit = (0, vehicle_systems_js_1.equipment)(car);
                kit.cargo = result.cargo.loaded ? 'calibrator' : 'empty';
                kit.load = result.cargo.loaded ? 65 : 0;
                kit.high = false;
            }
        }
        if (result.radio?.length)
            audio.broadcast(result.radio);
        if (result.sound)
            audio.effect(result.sound);
        if (result.message)
            ui.notify(result.message);
    }
    const soundBearing = () => follow.yaw + (ui.input.rear ? Math.PI : 0);
    function ringTram(rail = (0, world_railway_js_1.linePose)(sim.tramTime)) {
        if (sim.home.inside || !rail.visible)
            return;
        const sound = (0, blackout_js_1.soundDirection)('bell', { ...sim.player, yaw: soundBearing() }, rail, 40);
        if (sound.distance >= 37)
            return;
        soundCaptions.pulse('bell', sim.elapsed, rail);
        audio.tramBell(sound.pan, sound.strength);
    }
    function handleEvents() {
        const notices = [];
        let shouldSave = false, feedback = 0;
        for (const event of sim.drainEvents()) {
            const clip = event.clip;
            const impact = event.impact;
            if (impact) {
                const dx = impact.x - sim.player.x, dz = impact.z - sim.player.z;
                const distance = Math.hypot(dx, dz);
                const driver = sim.driven ?? sim.transition?.carId;
                const involved = driver != null && (driver === impact.carId || driver === impact.otherId);
                if (!sim.home.inside && distance < 30) {
                    const yaw = soundBearing(), lateral = dx * Math.cos(yaw) - dz * Math.sin(yaw);
                    const pan = THREE.MathUtils.clamp(lateral / Math.max(involved ? .75 : 2, distance * (involved ? .82 : 1)), -1, 1);
                    const cabin = sim.activeCar();
                    const seal = cabin && sim.motorPool.cockpit && !sim.transition ? ((0, vehicle_systems_js_1.equipment)(cabin).windowsOpen ? .08 : involved ? .24 : .86) : 0;
                    audio.interruptDialogue(impact.strength * Math.max(0, 1 - distance / 15) * (1 - seal * .6));
                    audio.vehicleImpact(impact.surface, impact.strength, pan, impact.tangentSpeed > Math.max(3, impact.normalSpeed * 1.45), !!impact.glass, 1 - distance / 32, seal);
                    if (involved || impact.strength >= .25)
                        soundCaptions.pulse(event.text === 'pole' ? 'fixture' : impact.glass ? 'glass' : 'impact', sim.elapsed, impact);
                }
                if (involved) {
                    const sign = driver === impact.carId ? 1 : -1;
                    impactCamera.kick(sign * impact.nx, sign * impact.nz, impact.strength);
                    feedback = Math.max(feedback, impact.strength);
                }
                if ((involved || distance < 23) && impact.strength >= .10 && replayImpacts.length < 16) {
                    const { time, x, y, z, strength, carId, otherId, crash } = impact;
                    replayImpacts.push({ time, x, y, z, strength, carId, otherId, crash });
                }
                if (event.text === 'pole' || event.text === 'fence')
                    shouldSave = true;
            }
            else if (event.type === 'sound') {
                const fx = clip ?? (event.text === 'door' ? (sim.driven ? 'enter' : 'exit') : event.text);
                if (fx === 'tram')
                    ringTram();
                else
                    audio.effect(fx);
                if (fx === 'alert')
                    soundCaptions.pulse('warning', sim.elapsed);
                if (fx === 'impact' && sim.driven)
                    soundCaptions.pulse('impact', sim.elapsed, sim.player);
                if (fx === 'impact' && sim.driven)
                    feedback = Math.max(feedback, .24);
                if (fx === 'pole')
                    shouldSave = true;
            }
            else if (event.type === 'speech') {
                const subtitle = (event.who ? event.who + ' · ' : '') + event.text;
                notices.push(subtitle);
                const speaker = clip === 'resident' || clip === 'witness' || clip?.startsWith('local-') ? sim.lastSpeaker : clip ? (0, dialogue_js_1.dialogueActor)(clip) : undefined;
                const person = sim.people.find(p => p.id === speaker);
                const position = person ? (0, blackout_js_1.soundDirection)('voice', { ...sim.player, yaw: soundBearing() }, person, 20) : undefined;
                const scene = { phone: !!position && position.distance > 5.2, pan: position?.pan, distance: position?.distance, subtitle };
                if (scene.phone && journal.add(event.who || 'Диспетчер', event.text, calendarMinutes(), true))
                    phoneSignal();
                if (clip)
                    audio.voice(clip, speaker, scene);
                if (person && clip && !(0, dialogue_js_1.dialogueDelivery)(clip, scene).phone && !sim.home.inside && !sim.driven && (position?.distance ?? Infinity) < 3.2)
                    portrait = { id: person.id, until: sim.elapsed + 2 };
            }
            else if (event.type === 'reward') {
                const car = ladoga();
                garage.ladoga.complete(sim.mission, sim.elapsed, !!car && !sim.home.inside && Math.hypot(car.x - sim.hero.x, car.z - sim.hero.z) < 6);
                notices.push(event.text);
                audio.effect('cash');
            }
            else if (event.type === 'toast')
                notices.push(event.text);
            else if (event.type === 'garage') {
                syncHUD();
                ui.open('garage');
            }
            else if (event.type === 'checkpoint')
                shouldSave = true;
            else if (event.type === 'district-capture') {
                jobResult(jobs.restart());
                shouldSave = true;
            }
        }
        if (feedback > 0)
            ui.buzzImpact(feedback);
        if (notices.length)
            ui.notify(notices.join('  /  '));
        if (shouldSave)
            persist();
    }
    const tourFrame = () => ({ ...sim.player, inside: sim.home.inside, busy: !!sim.transition || sim.tramRider.onboard || !!sim.home.door });
    const availableTourStop = () => jobs.active ? null : tour.next;
    function actions() {
        if (districtPlay.lookout)
            return districtPlay.actions();
        const base = sim.interactionOptions().map(label => ({ id: 'interact', label, value: label }));
        const more = sim.driven || sim.transition || sim.tramRider.onboard ? [] : sim.home.options(sim.hero, sim.elapsed, calendarMinutes());
        const stop = availableTourStop(), visit = stop && tour.canInteract(tourFrame()) ? [{ id: 'tour-check', label: stop.action }] : [];
        const carry = sim.driven || sim.transition || sim.home.inside || sim.tramRider.onboard ? [] : parcels.actions(sim.hero, sim.cars, parcelRear, storyBlock());
        const rest = canWait() ? [{ id: 'rest-hour', label: 'Подождать час' }] : [];
        const nearby = parcels.held ? base.filter(a => !a.label.startsWith('Сесть')) : base;
        return [...visit, ...jobs.actions(jobFrame()), ...carry, ...nearby, ...sim.streetActions(), ...more.filter(a => !nearby.some(b => b.label === a.label)), ...districtPlay.actions(), ...rest];
    }
    const targetPoint = () => {
        if (jobs.active) return jobs.target(jobFrame());
        const stop = availableTourStop();
        if (stop && sim.home.inside) {
            const floor = interior_layout_js_1.annexes[sim.home.zone];
            return require('./campus-layout.js').wayOutFrom(floor, sim.player.x, sim.player.z) ?? stop;
        }
        return stop ?? sim.target();
    };
    function syncHUD() {
        const active = sim.activeCar(), stop = availableTourStop(), campaignObjective = sim.objective();
        const objective = stop ? { title: outer_tour_js_1.tourTitle, goal: stop.action, reward: outer_tour_js_1.tourReward } : jobs.current() ?? campaignObjective, opts = actions();
        const minutes = clockMinutes(), time = [Math.floor(minutes / 60), minutes % 60].map(x => String(x).padStart(2, '0')).join(':');
        const conditions = (0, weather_js_1.weatherAt)(sim.elapsed, minutes), air = Math.round(conditions.temperature);
        const clock = time + ' · ' + (air < 0 ? '−' + Math.abs(air) : air > 0 ? '+' + air : '0') + ' °C';
        const serviceCar = sim.garageCar(), displayCar = active ?? serviceCar;
        const pursuitInfo = sim.pursuitStatus;
        showRoadAdvisory(active ? (0, road_advisory_js_1.roadAhead)(active, conditions, sim.cargoRail.blocksTraffic(active)) : '');
        const description = pursuitInfo.vehicle;
        if (!mainSession && journal.order(sim.mission, calendarMinutes()) && audioStarted) phoneSignal();
        ui.update({ shiftMessages: journal.messages, campaignPay, campaignStage:sim.stage, tramTime: sim.tramRider.onboard ? sim.tramTime : null,
            pursuitVehicle: description ? { name: vehicle_cabin_js_1.vehicleNames[description.kind], color: description.color, abandoned: description.abandoned } : undefined, pursuitOnFoot: pursuitInfo.onFoot, campaignObjective, sidePanel: stop ? 'outer-tour' : undefined, sideStage: stop ? { step: tour.stage + 1, total: tour.total } : jobs.active ? { step: jobs.active.stage + 1, total: (0, story_catalog_js_1.districtJob)(jobs.active.id).steps.length } : undefined, archiveMap: sim.home.archiveMap, actions: opts, clock, interiorId: sim.home.zone, interiorPlan: sim.home.inside ? (0, interior_layout_js_1.interiorAtlas)(sim.home.zone) : undefined, cockpit: !!active && sim.motorPool.cockpit, inside: sim.home.inside, x: sim.player.x, z: sim.player.z, heading: sim.player.yaw, driving: !!active, money: sim.money, wanted: sim.wanted, missionIndex: sim.mission,
            missionTitle: objective.title, objective: objective.goal, reward: objective.reward, hint: opts[0]?.label, target: targetPoint(), district: sim.district(),
            search: sim.search, pursuit: pursuitInfo, population: sim.home.inside ? null : sim.populationStatus, lastContact: pursuitInfo.lastSeen, police: sim.wanted ? [...sim.cars.filter(patrolLight), ...sim.footPatrols] : [], atGarage: sim.atGarage(), speed: active?.speed ?? 0,
            vehicleName: displayCar ? vehicle_cabin_js_1.vehicleNames[displayCar.kind] : undefined, damage: displayCar ? 1 - displayCar.health / 100 : 0,
            repairCost: serviceCar ? (0, vehicle_road_js_1.garageRepairCost)(serviceCar) : 0, garageParts: serviceCar ? (0, garage_service_js_1.workshopJobs)(serviceCar) : undefined,
            garageHood: (0, vehicle_tools_js_1.canInspectHood)(sim, serviceCar) ? !!serviceCar.systems?.hood : undefined, lights: active?.lights });
    }
    let previousRatio = window.devicePixelRatio;
    function resize() {
        if (window.devicePixelRatio !== previousRatio) {
            previousRatio = window.devicePixelRatio;
            graphics.select(graphics.mode, displayProfile());
        }
        const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
        graphics.setViewport(w, h);
        camera.aspect = w / h;
        camera.fov = h > w ? 68 : 58;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(graphics.scale);
        renderer.setSize(w, h, false);
    }
    new ResizeObserver(resize).observe(canvas);
    resize();
    let contextLost = false;
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); contextLost = true; persist(); boot.hidden = false; boot.textContent = 'Видеопамять освобождена. Возвращаем изображение…'; });
    canvas.addEventListener('webglcontextrestored', () => { location.reload(); });
    let hidden = document.hidden, lastPersist = performance.now(), lastHud = -1000, stabilize = 2;
    const frameClock = new graphics_quality_js_1.FrameClock(lastPersist);
    let offlinePhase = 'checking', offlineTotal = 0;
    listen(p => { offlinePhase = p.phase; offlineTotal = p.total; ui.setOffline(p.loaded, p.total, p.phase === 'ready', p.phase === 'error', p.error); });
    const localStats = { fps: 0, renderMs: 0, calls: 0, triangles: 0 };
    if (debug) {
        Object.defineProperty(window, 'konturDiagnostics', { get: () => ({
                ...localStats, districtPlay:districtPlay.save(), scale: graphics.scale, quality: graphics.quality, graphics: graphics.mode, release: '3.3.0', population: sim.populationStatus, garage: garage.save(), replay: { duration: recorder.duration, viewing: !!replayView?.active }, parcels: parcels.save(), freeDrive: !!mainSession, outerTour: tour.save(), zone: sim.home.zone, actions: actions(), jobs: jobs.save(), tramOnboard: sim.tramRider.onboard, interior: sim.home.inside, room: sim.home.inside ? (0, house_layout_js_1.houseRoom)(sim.player.x, sim.player.z, sim.player.y) : null,
                fixtureState: world.getFixtureState(), outsidePosition: { ...sim.hero }, houseDoorOpen: sim.home.open, district: sim.district(), brokenFixtures: structuredClone(sim.brokenFixtures), darkJunctions: [...sim.darkJunctions], transition: sim.transition ? structuredClone(sim.transition) : null, handoff: sim.handoff,
                groundY: sim.home.inside ? (0, house_layout_js_1.houseFloor)(sim.player.x, sim.player.z, sim.player.y) : (0, world_layout_js_1.groundHeight)(sim.hero.x, sim.hero.z), surface: sim.home.inside ? 'concrete' : (0, world_layout_js_1.surfaceAt)(sim.hero.x, sim.hero.z), street: world.getStreetState(), trackCount: tracks.activeCount,
                cameraArm: follow.distance, eye: { x: camera.position.x, y: camera.position.y, z: camera.position.z }, renderer: gl ? 'WebGL 2' : 'Canvas 2D software', width: canvas.width, height: canvas.height, position: { ...sim.player }, cameraYaw: follow.yaw,
                mission: sim.mission, stage: sim.stage, driven: sim.driven, target: targetPoint(), hint: actions()[0]?.label, money: sim.money, search: sim.search ? { ...sim.search } : null, wanted: sim.wanted, pursuit: sim.pursuitStatus,
                elapsed: sim.elapsed, savedCar: sim.savedCar ? { ...sim.savedCar } : null, offline: offlinePhase, bytes: offlineTotal, settings: { ...ui.settings }, input: { ...ui.input },
                footing: hero.getFootContacts().map(f => ({ x: f.x, y: f.y, z: f.z, planted: f.planted, pitch: f.pitch, stamp: f.stamp })),
                drive: sim.activeCar() ? { yaw: sim.activeCar().yaw, speed: sim.activeCar().speed } : null
            }) });
    }
    let soundedAtTurn = false;
    function updateAudio(dt, paused) {
        const c = sim.activeCar(), player = sim.player, conditions = (0, weather_js_1.weatherAt)(sim.elapsed, clockMinutes());
        if (!paused)
            townNews.update(sim);
        const direction = soundBearing(), anchor = sim.home.inside ? sim.hero : player;
        const listener = { x: anchor.x, z: anchor.z, yaw: direction };
        let distance = 106, side = 0;
        let nearbyPatrol;
        if (sim.wanted && !sim.home.inside)
            for (const patrol of sim.cars) {
                if (!sim.patrolActive(patrol))
                    continue;
                const dx = patrol.x - player.x, dz = patrol.z - player.z, range = Math.hypot(dx, dz);
                if (range >= distance)
                    continue;
                distance = range;
                nearbyPatrol = patrol;
                side = (dx * Math.cos(direction) - dz * Math.sin(direction)) / Math.max(range, .1);
            }
        const kit = c ? (0, vehicle_systems_js_1.equipment)(c) : undefined;
        const road = c && kit ? { vehicleId:c.id,
            kind: c.kind, surface: (0, weather_js_1.footstepSurface)((0, world_layout_js_1.surfaceAt)(c.x, c.z), c.x, c.z, conditions), accelerator: Number(ui.input.gas ?? 0), interior: sim.motorPool.cockpit, enclosure: sim.transition ? 0 : kit.windowsOpen ? .18 : sim.motorPool.cockpit ? 1 : .58,
            load: Math.min(1, (kit.load + kit.towedMass) / 600), punctures: kit.punctures, cargo: kit.cargo, turn: c.steer, shock: Math.min(1, kit.shock / 8),
            wearLeft: Math.max(kit.dents.leftSide ?? 0, kit.dents.frontLeft ?? 0, kit.dents.rearLeft ?? 0, kit.wheelDamage?.[0] ?? 0, kit.wheelDamage?.[2] ?? 0, kit.leftMirror ? .16 : 0),
            wearRight: Math.max(kit.dents.rightSide ?? 0, kit.dents.frontRight ?? 0, kit.dents.rearRight ?? 0, kit.wheelDamage?.[1] ?? 0, kit.wheelDamage?.[3] ?? 0, kit.rightMirror ? .16 : 0),
            slip: Math.min(1, Math.abs(c.vx * Math.cos(c.yaw) - c.vz * Math.sin(c.yaw)) / 7 + (ui.input.handbrake ? .35 : 0))
        } : undefined;
        const power = (0, blackout_js_1.blackoutField)(jobs.blackoutPhase, listener.x, listener.z);
        const clue = (0, blackout_js_1.blackoutCues)(jobs.blackoutPhase, { ...listener, space: sim.home.zone }, sim.elapsed, sim.tramTime, nearbyPatrol);
        const soundMinutes = clockMinutes(), tramSoundPose = (0, world_railway_js_1.linePose)(sim.tramTime);
        const enteringCurve = tramSoundPose.visible && Math.abs(tramSoundPose.speed) > 1 && tramSoundPose.z > 9 && tramSoundPose.z < 24;
        if (!paused) {
            if (enteringCurve && !soundedAtTurn) ringTram(tramSoundPose);
            soundedAtTurn = enteringCurve;
        }
        const landmarks = paused ? [] : (0, local_soundscape_js_1.landmarkSoundField)(listener, sim.elapsed, conditions, power, soundMinutes, tramSoundPose);
        const cargoRail = sim.home.inside ? undefined : sim.cargoRail.soundAt({ ...player, yaw: direction }) ?? undefined;
        const sealed = sim.home.inside ? 1 - sim.home.open * .65 : road?.enclosure ?? 0;
        const dialogueNoise = (0, dialogue_js_1.dialogueNoiseAt)(listener, (0, world_railway_js_1.linePose)(sim.tramTime), cargoRail?.distance, Math.abs(cargoRail?.speed ?? 0) / 4, sealed);
        if (paused)
            showSound([]);
        else if (sim.elapsed < previousSoundCaption || sim.elapsed - previousSoundCaption >= .08) {
            previousSoundCaption = sim.elapsed;
            if (cargoRail?.crossing && cargoRail.distance < 35)
                soundCaptions.pulse('crossing', sim.elapsed, cargoRail);
            if (nearbyPatrol && distance < 42)
                soundCaptions.pulse('siren', sim.elapsed, nearbyPatrol);
            showSound(soundCaptions.lines(sim.elapsed, listener, clue.primary, clue.sources, sim.home.inside ? [] : landmarks));
        }
        audio.update(dt, { x: player.x, z: player.z, train: sim.tramRider.onboard, doorOpen: sim.home.open,
            acousticRoom: (0, acoustic_space_js_1.acousticRoom)(sim.home.zone, player), doorDistance: (0, acoustic_space_js_1.doorwayDistance)(player, sim.home.inside), lookout: !!(sim.home.lookout || districtPlay.lookout),
            courtyardShelter: sim.home.inside ? 0 : courtyardShelter(player.x, player.z),
            roomMix: sim.home.acoustics(sim.hero, sim.elapsed), broadcast: jobs.broadcast, archive: jobs.archive, townNews, districtRadio: districtPlay.radio,
            inside: sim.home.inside, tramTime: sim.tramTime, district: sim.district(), driving: !!c, speed: c?.speed ?? player.speed,
            wanted: sim.wanted, moving: Math.abs(player.speed) > .15, running: player.speed > 3.5, paused, road, weather: conditions,
            minutes: soundMinutes, depotKeysReturned: !!sim.depotKeysReturned,
            pursuit: { tracking: sim.wanted > 0 && !sim.search, distance, side, phase: sim.pursuitStatus.phase }, soundGuide: clue.sources, blackout: power, landmarks, cargoRail, dialogueNoise });
    }
    document.addEventListener('visibilitychange', () => {
        hidden = document.hidden;
        frameClock.reset(performance.now());
        stabilize = 1;
        graphics.discard();
        if (hidden) {
            persist();
            updateAudio(0, true);
        }
    });
    window.addEventListener('pagehide', persist);
    const projection = new THREE.Vector3();
    const point = { x: 0, z: 0 };
    function indoorFloor(x, z) { return house_layout_js_1.houseFloor(x, z, sim.player.y); }
    function heroFloor(x, z) { point.x = x; point.z = z; return (0, collision_js_1.footFloor)(point, sim.hero.y, .075, sim.cars); }
    let houseScheduled = false;
    function warmHouse() {
        if (house || houseScheduled || Math.hypot(sim.hero.x + 35, sim.hero.z - 16) > 28)
            return;
        houseScheduled = true;
        const prepare = () => {
            houseScheduled = false;
            if (house)
                return;
            house = (0, house_js_1.createHouse)();
            house.update(0, 0, sampleHome, sim.cars, sim.mission, sim.elapsed, sim.tramTime, jobs.effects);
            if (renderer instanceof THREE.WebGLRenderer)
                void renderer.compileAsync(house.scene, camera).catch(() => { });
        };
        if ('requestIdleCallback' in window)
            window.requestIdleCallback(prepare, { timeout: 700 });
        else
            setTimeout(prepare, 80);
    }
    function adapt(elapsed, measurePopulation = true) {
        const frameLimit = ui.settings.battery && !trial ? 30 : 60;
        const scale = graphics.scale, stats = graphics.sample(elapsed, frameLimit);
        if (!stats)
            return;
        if (measurePopulation)
            sim.populationPressure = populationPerformance.measure(stats);
        localStats.fps = stats.fps;
        localStats.calls = renderer.info.render.calls;
        localStats.triangles = renderer.info.render.triangles;
        if (Math.abs(graphics.scale - scale) > .01)
            resize();
    }
    function renderTrial(ms) {
        if (!trial || ms <= 0)
            return;
        const { s, t, indoor } = trial.stage, c = trialCamera;
        c.aspect = camera.aspect;
        c.fov = camera.fov;
        c.near = camera.near;
        c.far = camera.far;
        c.updateProjectionMatrix();
        c.position.set(s.eye[0] + (s.end[0] - s.eye[0]) * t, s.eye[1] + (s.end[1] - s.eye[1]) * t, s.eye[2] + (s.end[2] - s.eye[2]) * t);
        c.lookAt(s.look[0], s.look[1], s.look[2]);
        c.updateMatrixWorld();
        const drawStart = performance.now();
        let visibility;
        if (benchmark && trial.mode === 'chase') {
            const sample = benchmark.update(trial.seconds, ms / 1000, c);
            const clock = 22 * 60, conditions = (0, weather_js_1.weatherAt)(130, clock);
            visibility = sample.visibility;
            world.update(trial.seconds, -1, sample.focus, sim.brokenFixtures, 'normal', conditions.daylight);
            weather(ms / 1000, sample.focus, true, sample.cars, [], trial.seconds, c, sim.brokenFixtures, graphics.quality, car => car.police, { weather: conditions, wanted: 3, fast: true, clock });
            world.cull(c);
            renderer.render(scene, c);
        }
        else if (indoor) {
            house.update(ms / 1000, 0, sampleHome, sim.cars, 0, trial.seconds, trial.seconds, {});
            renderer.render(house.scene, c);
        }
        else {
            const focus = { x: c.position.x, z: c.position.z };
            const daylight = (0, weather_js_1.daylightAt)(trial.mode==='quarter' ? 21*60 : clockMinutes());
            world.update(trial.seconds, trial.seconds, focus, sim.brokenFixtures, jobs.blackoutPhase, daylight);
            world.cull(c);
            renderer.render(scene, c);
        }
        const drawMs = performance.now() - drawStart;
        localStats.renderMs = drawMs;
        adapt(ms / 1000, false);
        trial.record(ms, drawMs, visibility);
        trialText.textContent = s.name + ' · ' + Math.floor(trial.seconds) + ' / ' + trial.duration + ' с';
        if (trial.done)
            endTrial(true);
    }
    function saveReplayPhoto() {
        canvas.toBlob(blob => {
            if (!blob)
                return;
            const url = URL.createObjectURL(blob), link = document.createElement('a');
            link.href = url;
            link.download = 'Kontur-77-kadr.png';
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 12000);
        }, 'image/png');
    }
    function beginReplay(clip) {
        replayView ??= (0, replay_view_js_1.createReplayView)(scene, { leave: endReplay, save: async (savedClip) => {
                await (0, storage_js_1.writeLocalReplay)(await (0, replay_js_1.packReplay)(savedClip));
                archiveReplay = savedClip;
            }, photo: saveReplayPhoto });
        const live = [hero.root, contactShadow.root, tramPassengers, tracks.root, ...[...cars.values()].map(record => record.model.root), ...[...people.values()].map(model => model.root)];
        for (const object of live) {
            replayHidden.set(object, object.visible);
            object.visible = false;
        }
        footCrew.update(0, [], sim.hero, false);
        showCrates([], 0, 0, false);
        glass.hide();
        updateAudio(0, true);
        ui.close();
        hud.hidden = true;
        replayView.show(clip);
    }
    function endReplay() {
        replayView.hide();
        for (const [object, visible] of replayHidden)
            object.visible = visible;
        replayHidden.clear();
        hud.hidden = false;
        syncHUD();
        ui.open('replay');
    }
    function drawReplay(dt) {
        const replay = replayView.frame(dt, camera);
        if (!replay)
            return;
        const { frame, camera: shot, cars: vehicles, focus } = replay;
        const conditions = (0, weather_js_1.weatherAt)(frame.time, frame.clock);
        world.setTramCabin(false);
        world.update(frame.time, frame.tram, focus, sim.brokenFixtures, frame.power, conditions.daylight, frame.calendar ?? frame.clock);
        motorWorld.updateCrashDebris(replay.crashes, frame.time, focus);
        motorWorld.updateFences(frame.fences ?? sim.motorPool.props, frame.time);
        recordedFreight.restore(frame.freight);
        freightView.update(recordedFreight, frame.time, focus);
        weather(dt, focus, !!frame.driven, vehicles, [], frame.time, shot, sim.brokenFixtures, graphics.quality, car => frame.cars.some(c => c.id === car.id && c.active), { weather: conditions, wanted: frame.wanted, fast: Math.abs(focus.speed) > 11, clock: frame.calendar ?? frame.clock, blackout: frame.power });
        world.cull(shot);
        renderer.render(scene, shot);
        replayView.afterDraw();
    }
    function frame(now) {
        requestAnimationFrame(frame);
        const elapsed = frameClock.take(now, ui.settings.battery && !trial && !replayView?.active);
        if (elapsed === null)
            return;
        if (hidden || contextLost)
            return;
        if (trial) {
            renderTrial(elapsed * 1000);
            return;
        }
        if (replayView?.active) {
            drawReplay(Math.min(.12, Math.max(elapsed, 0)));
            return;
        }
        if (ui.isPaused()) {
            updateAudio(0, true);
            return;
        }
        const dt = Math.min(.12, Math.max(0, elapsed));
        const look = ui.takeLook(dt);
        if (Math.abs(look.x) + Math.abs(look.y) > 1 || Math.abs(ui.input.moveX) + Math.abs(ui.input.moveY) > .12)
            portrait = null;
        follow.carFollow = ui.settings.carFollow;
        follow.freeOrbit = ui.settings.freeOrbit;
        follow.stepMotion = ui.settings.cameraStep;
        follow.shoulder = ui.settings.shoulder;
        follow.rear = ui.input.rear;
        follow.distancePreset = ui.settings.cameraDistance;
        follow.setFootIntent(ui.input.moveX, ui.input.moveY);
        follow.look(look.x, look.y);
        const input = { ...ui.input, cameraYaw: follow.yaw, populationYaw: follow.yaw + (ui.input.rear ? Math.PI : 0) };
        const before = { x: sim.player.x, z: sim.player.z }, wasDriving = sim.activeCar(), zoneBefore = sim.home.zone;
        sim.clockOffset = garage.calendarWait;
        sim.tick(dt, input);
        prunePopulationModels();
        if (!sim.tramRider.onboard && !sim.transition && zoneBefore === sim.home.zone) {
            garage.travel(before, sim.player, wasDriving ?? null, dt);
            garage.ladoga.step(wasDriving, before, sim.player, dt, { wanted: sim.wanted, district: sim.district(), elapsed: sim.elapsed, canPhoto: !sim.motorPool.cockpit });
        }
        parcels.reconcile(sim.cars);
        handleEvents();
        const jobUpdate = jobs.tick(jobFrame(dt));
        if (jobUpdate) {
            jobResult(jobUpdate);
            persist();
        }
        warmHouse();
        const car = sim.activeCar(), p = sim.player, inside = sim.home.inside;
        if (inside !== showingHouse) {
            if (inside && !house)
                house = (0, house_js_1.createHouse)();
            (inside ? house.scene : scene).add(hero.root, contactShadow.root);
            hero.resetMotion();
            follow.reset(restoringIndoorView && Number.isFinite(saved?.yaw) ? saved.yaw : p.yaw);
            restoringIndoorView = false;
            showingHouse = inside;
            persist();
        }
        const fade = sim.home.fade;
        if (fade > 0 || threshold.style.opacity !== '0')
            threshold.style.opacity = String(fade);
        world.setHouseDoor(sim.home.open);
        world.setTramCabin(sim.tramRider.onboard);
        const floor = inside ? indoorFloor : heroFloor, conditions = (0, weather_js_1.weatherAt)(sim.elapsed, clockMinutes());
        districtPlay.update(dt, conditions);
        const opening = !mainSession && journal.walk(sim, calendarMinutes());
        if (opening) {
            if (opening.route) {
                if (opening.text) phoneSignal();
                ui.openingRoute(firstMarket, sim.player);
            }
            if (opening.bell) {
                const turn = { x:17, z:15 };
                const direction = (0, blackout_js_1.soundDirection)('bell', { ...sim.player, yaw:soundBearing() }, turn, 45);
                audio.tramBell(direction.pan, .45);
                soundCaptions.pulse('bell', sim.elapsed, turn);
            }
            if (opening.arrived) ui.clearRoute(firstMarket);
            if (opening.text) ui.notify(opening.text);
        }
        const streetLookout = districtPlay.lookout, lookout = streetLookout ?? sim.home.lookout;
        const outside = !inside || !!lookout, focus = lookout ? { ...lookout, speed: 0 } : p;
        const transfer = sim.transition, exchange = sim.handoffRole;
        const transitionCar = transfer ? sim.cars.find(c => c.id === transfer.carId) : undefined;
        const carried = storyBlock() || jobs.carryFinale;
        const speaker = outside && portrait && sim.elapsed <= portrait.until ? sim.people.find(n => n.id === portrait.id) : undefined;
        const listening = speaker ? Math.atan2(p.x - speaker.x, p.z - speaker.z) - p.yaw : 0;
        hero.root.visible = (!car || !!transfer) && !sim.tramRider.onboard && !lookout;
        hero.root.position.set(p.x, p.y, p.z);
        hero.root.rotation.y = p.yaw;
        if (hero.root.visible) {
            outfit(hero.root, garage.outfit);
            const airborne = (!inside && !transfer && p.vault == null && sim.jumpVelocity !== 0)
                || p.y > floor(p.x, p.z) + .07;
            hero.update(dt, p.speed, airborne, {
                ...sim.streetPose, conversation: !!speaker, glance: speaker ? Math.atan2(Math.sin(listening), Math.cos(listening)) : 0,
                ground: floor, pushDoor: sim.home.grip, coat: sim.home.coat, carry: carried ? 'block' : parcels.held ? 'crate' : jobs.carryNightTape || sim.mission === 2 && sim.stage > 0 ? 'tape' : undefined, wetness: inside ? 0 : .52, vault: p.vault, vaultHand: p.vaultHand, squeeze: p.squeeze, duck: p.duck,
                hasBlock: carried, handoff: sim.handoff, handoffRole: exchange, handTarget: sim.handoffPoint ?? undefined,
                ...boarding.actorPose(transitionCar, transfer, floor),
                neighbourhood: !transfer && !exchange && !car ? sim.neighbourhoodPose : undefined
            });
            if (hero.footfall && !transfer && !sim.home.door) {
                const sole = hero.footfall;
                if (!inside)
                    tracks.footprint(sole, sim.elapsed);
                const schoolPlan = inside && interior_layout_js_1.annexes[sim.home.zone];
                const mat = inside && (sim.home.zone === 'house' && sole.y < .45 && Math.abs(sole.x+.85)<.82 && sole.z>5.68 ||
                    schoolPlan?.number === 1 && Math.hypot(sole.x-schoolPlan.entrance.x,sole.z-schoolPlan.entrance.z)<1.15);
                const indoorSurface = mat ? 'rubber' : schoolPlan?.number ? (schoolPlan.number === 1 ? 'school-tile' : 'school-vinyl') : 'concrete';
                audio.footstep(inside ? indoorSurface : (0, weather_js_1.footstepSurface)((0, world_layout_js_1.surfaceAt)(sole.x, sole.z), sole.x, sole.z, conditions), p.speed > 3.5);
            }
        }
        if (outside)
            for (const c of sim.cars) {
                const range = (c.x - focus.x) ** 2 + (c.z - focus.z) ** 2;
                let record = cars.get(c.id);
                const occupied = c.id === sim.driven, transferring = c.id === transfer?.carId;
                if (range > (record?.model.root.parent ? 155 : 142) ** 2 && !occupied && !transferring) {
                    if (record) {
                        record.model.root.removeFromParent();
                        record.poseAt = undefined;
                    }
                    continue;
                }
                if (!record) {
                    record = { model: (0, models_js_1.createVehicle)(c.police ? 'patrol' : c.kind, c.color, false, c.id), color: c.color };
                    cars.set(c.id, record);
                }
                const model = record.model;
                if (!model.root.parent)
                    scene.add(model.root);
                model.root.position.set(c.x, c.y, c.z);
                model.root.rotation.y = c.yaw;
                if (c.color !== record.color) {
                    model.setColor(c.color);
                    record.color = c.color;
                }
                const critical = occupied || transferring || patrolLight(c);
                if (range > 75 ** 2 && !critical) {
                    model.setLights(c.lights, c.braking, c.systems);
                    record.poseAt = undefined;
                    continue;
                }
                const poseDt = record.poseAt === undefined ? dt : sim.elapsed - record.poseAt;
                if (record.poseAt !== undefined && poseDt < (0, population_performance_js_1.populationPoseInterval)(range, sim.populationPressure, 'car', critical))
                    continue;
                record.poseAt = sim.elapsed;
                const door = transferring ? transfer : undefined, pursuitDoor = sim.patrolDoorFor(c.id);
                model.update(Math.min(.14, poseDt), c.speed, c.steer, c.lights, c.braking, 1 - c.health / 100, {
                    doorSide: door?.side ?? pursuitDoor?.side, doorOpen: door?.doorOpen ?? pursuitDoor?.open, occupied: occupied && !door, hasBlock: carried && occupied,
                    cameraDistance: camera.position.distanceTo(model.root.position),
                    npcDriver: !door && c.id !== sim.driven && (c.auto || c.police && Math.abs(c.speed) > .2),
                    scrapes: c.scrapes, systems: c.systems, impactLean: sim.impactLean(c), coat: sim.home.coat, patrolActive: patrolLight(c), patrolClock: sim.elapsed, indicator: trafficLight(c),
                    cockpit: sim.motorPool.cockpit && c.id === sim.driven, groundHeight: (x, z) => c.carriedBy ? c.y : sim.motorPool.road(x, z, sim)
                });
            }
        if (car)
            outfit(cars.get(car.id)?.model.root.getObjectByName('seated-player'), garage.outfit);
        showCrates(parcels.ground, focus.x, focus.z, outside);
        footCrew.update(dt, sim.footPatrols, p, outside);
        const rail = (0, world_railway_js_1.linePose)(sim.tramTime);
        tramPassengers.position.set(rail.x, 0, rail.z);
        tramPassengers.rotation.y = rail.yaw;
        if (outside)
            for (const npc of sim.people) {
                if (npc.cab) {
                    people.get(npc.id)?.root.removeFromParent();
                    peoplePoseAt.delete(npc.id);
                    continue;
                }
                const range = (npc.x - focus.x) ** 2 + (npc.z - focus.z) ** 2;
                let model = people.get(npc.id);
                if (range > (model?.root.parent ? 124 : 110) ** 2) {
                    if (model?.root.parent) {
                        model.root.removeFromParent();
                        model.resetMotion();
                        peoplePoseAt.delete(npc.id);
                    }
                    continue;
                }
                if (!model) {
                    const role = npc.role === 'walker' ? 'resident' : npc.role;
                    const slot = npc.id.startsWith('ambient-walker-') ? Number(npc.id.slice('ambient-walker-'.length)) : variants.get(npc.id) ?? 0;
                    model = (0, models_js_1.createPerson)(role, (0, human_kits_js_1.streetWardrobe)(npc.id, Number.isFinite(slot) ? slot : 0));
                    people.set(npc.id, model);
                    const neck = model.root.getObjectByName('neck');
                    if (neck)
                        necks.set(npc.id, neck);
                }
                const riding = npc.onboard && !npc.platformStep;
                const parent = riding ? tramPassengers : scene;
                if (model.root.parent !== parent) {
                    parent.add(model.root);
                    model.resetMotion();
                    peoplePoseAt.delete(npc.id);
                }
                model.root.position.set(npc.x, npc.y, npc.z);
                if (riding)
                    tramPassengers.worldToLocal(model.root.position);
                model.root.rotation.y = npc.yaw - (riding ? rail.yaw : 0);
                const previousPose = peoplePoseAt.get(npc.id);
                const poseDt = previousPose === undefined ? dt : sim.elapsed - previousPose;
                const participating = exchange === npc.role;
                const interval = (0, population_performance_js_1.populationPoseInterval)(range, sim.populationPressure, 'person', participating || speaker?.id === npc.id || riding);
                if (previousPose !== undefined && poseDt < interval)
                    continue;
                peoplePoseAt.set(npc.id, sim.elapsed);
                const speech = audio.mouth(npc.id), closeFace = speaker?.id === npc.id || range < 6 ** 2 && (participating || speech > 0);
                model.update(poseDt, npc.speed, false, {
                    ...streetPerformancePose(npc, conditions, sim.cityLife.witnesses[npc.id], sim.elapsed),
                    passing: npc.speed > .15 && range < 16 ** 2 ? (0, pedestrian_controller_js_1.passingAngle)(npc, sim.people) : 0,
                    anticipation: !car && !lookout && range < 4.2 ** 2,
                    railNear: npc.role === 'dispatcher' && rail.visible && Math.hypot(rail.x - npc.x, rail.z - npc.z) < 19,
                    conversation: participating || speaker?.id === npc.id, speech, closeFace, speechShape: closeFace ? audio.mouthShape(npc.id) : 0, wetness: .48, carry: npc.purchase ? 'parcel' : npc.id === 'pass-12' ? 'cup' : undefined, ground: npc.onboard ? () => npc.y : undefined, nod: sim.elapsed < (npc.lookUntil ?? 0) ? 1 : 0, glance: npc.lookYaw, reaction: npc.reaction, handoff: participating ? sim.handoff : -1, handoffRole: participating ? exchange : null,
                    handTarget: participating ? sim.handoffPoint ?? undefined : undefined, hasBlock: carried
                });
                if (!npc.onboard && model.footfall && (npc.x - p.x) ** 2 + (npc.z - p.z) ** 2 < 26 ** 2)
                    tracks.footprint(model.footfall, sim.elapsed);
            }
        if (inside)
            house.update(dt, sim.home.open, sim.home, sim.cars, sim.mission, sim.elapsed, sim.tramTime, jobs.effects);
        if (outside) {
            explore.update(sim.elapsed, sim.home, focus, sim.tramTime, sim.cars, sim.cityTraffic, sim.cityCalendarMinutes, sim.stage === 0 && (sim.mission === 0 || sim.mission === 2));
            const shutter = garage.shutter === undefined ? sim.cityLife.shutter : Number(garage.shutter);
            roll = THREE.MathUtils.damp(roll, shutter, 5.2, dt);
            crew.update(sim.cityLife.repair, sim.elapsed, roll);
            motorWorld.update(sim, dt);
            tracks.update(sim.elapsed, focus, sim.cars, graphics.quality, conditions);
            if (world.update(sim.elapsed, sim.tramTime, focus, sim.brokenFixtures, jobs.blackoutPhase, conditions.daylight, calendarMinutes(), conditions.wet).bell)
                ringTram(rail);
            freightView.update(sim.cargoRail, sim.elapsed, focus);
        }
        follow.update(dt, p, transfer ? null : car, sim.cars, transfer?.carId ?? car?.id, inside ? undefined : rail, inside, !!car && !transfer && sim.motorPool.cockpit, transitionCar, transfer?.side);
        if (lookout) {
            camera.position.set(lookout.x, lookout.y, lookout.z);
            camera.rotation.order = 'YXZ';
            if (streetLookout?.aim)
                camera.lookAt(streetLookout.aim.x, streetLookout.aim.y, streetLookout.aim.z);
            else
                camera.rotation.set(sim.home.peek === 'roof' ? -follow.lookPitch : -.11, sim.home.peek === 'roof' ? follow.yaw : lookout.yaw, 0);
            camera.updateMatrixWorld();
        }
        else if (sim.tramRider.onboard)
            (0, tram_interior_js_1.rideView)(camera, sim.tramTime, follow.yaw, follow.lookPitch, sim.tramRider);
        else if (car && !transfer && sim.motorPool.cockpit)
            (0, vehicle_view_js_1.applyCockpitCamera)(camera, car, follow.yaw, ui.input.rear, follow.lookPitch);
        if (car && !transfer && !lookout)
            impactCamera.update(camera, dt, follow.yaw + (ui.input.rear ? Math.PI : 0), ui.settings.impactMotion, sim.motorPool.cockpit);
        else
            impactCamera.clear();
        const portraitNeck = portrait && sim.elapsed <= portrait.until && !car && !sim.tramRider.onboard && !lookout ? necks.get(portrait.id) : undefined;
        let portraitFramed = false;
        if (portraitNeck) {
            portraitEye.set(0, .115, -.055);
            portraitNeck.localToWorld(portraitEye);
            if (previousPortrait !== portraitNeck)
                framing.copy(portraitEye);
            else
                framing.lerp(portraitEye, 1 - Math.exp(-9 * dt));
            previousPortrait = portraitNeck;
            const actorYaw = portrait.id === 'hero' ? p.yaw : speaker?.yaw ?? p.yaw;
            portraitDirection.set(-Math.sin(actorYaw + .26), .09, -Math.cos(actorYaw + .26)).normalize();
            const arm = portrait.id === 'hero' ? 1.24 : 1.04;
            let reach = inside ? (0, house_layout_js_1.houseClearance)(framing, portraitDirection, arm, .10) : (0, camera_volume_js_1.cameraClearance)(framing, portraitDirection, arm, .10, sim.cars);
            if (reach < arm * .75) {
                const otherAngle = actorYaw - .47;
                portraitEye.set(-Math.sin(otherAngle), .09, -Math.cos(otherAngle)).normalize();
                const otherReach = inside ? (0, house_layout_js_1.houseClearance)(framing, portraitEye, arm, .10) : (0, camera_volume_js_1.cameraClearance)(framing, portraitEye, arm, .10, sim.cars);
                if (otherReach > reach + .12) {
                    portraitDirection.copy(portraitEye);
                    reach = otherReach;
                }
            }
            if (reach > .43) {
                camera.position.copy(framing).addScaledVector(portraitDirection, reach);
                camera.lookAt(framing);
                camera.updateMatrixWorld();
                portraitFramed = true;
                if (speaker) {
                    const dx = p.x - framing.x, dz = p.z - framing.z, along = dx * portraitDirection.x + dz * portraitDirection.z;
                    if (along > .14 && along < reach + .22 && Math.abs(dx * portraitDirection.z - dz * portraitDirection.x) < .24)
                        hero.root.visible = false;
                }
            }
        }
        else
            previousPortrait = null;
        const windshieldHidden = ui.input.rear || follow.lookPitch > .38 || (car && Math.cos(follow.yaw - car.yaw) < .74);
        glass.update(sim, dt, conditions, windshieldHidden);
        stories.update(jobs, jobFrame(dt), camera);
        if (!car && !transfer && follow.distance < .34 && !(portraitFramed && portrait?.id === 'hero'))
            hero.root.visible = false;
        if (!inside && sim.mission === 0 && sim.stage === 2 && sim.tramTime < 6 && !car && Math.hypot(p.x - 12, p.z + 39) < 7 && p.speed < .2) {
            const tram = world.getTramPosition();
            camera.position.set(11.5, 4.7, -44);
            camera.lookAt(tram.x, tram.y + 1.55, tram.z);
            camera.updateMatrixWorld();
        }
        garageBay.update(sim.elapsed, garage.lights, camera, conditions.daylight);
        contactShadow.root.visible = hero.root.visible && !transfer;
        if (contactShadow.root.visible)
            contactShadow.update(hero.getFootContacts(), hero.root.scale.x, floor);
        if (outside)
            weather(dt, focus, !!car || !!lookout || sim.tramRider.onboard, sim.cars, sim.people, sim.elapsed, camera, sim.brokenFixtures, graphics.quality, patrolLight, { weather: conditions, wanted: sim.wanted, fast: Math.abs(car?.speed ?? 0) > 11, clock: calendarMinutes(), blackout: jobs.blackoutPhase });
        updateAudio(dt, false);
        if (now - lastHud >= 100) {
            syncHUD();
            lastHud = now;
        }
        const target = targetPoint();
        if (target && !lookout) {
            projection.set(target.x, (inside ? indoorFloor : world_layout_js_1.groundHeight)(target.x, target.z) + 2.65, target.z).project(camera);
            ui.setWaypoint((projection.x + 1) / 2, (1 - projection.y) / 2, projection.z > 0 && projection.z < 1 && Math.abs(projection.x) < .94 && Math.abs(projection.y) < .8);
        }
        else
            ui.setWaypoint(0, 0, false);
        const portraitCar = garage.ladoga.pendingPhoto && outside ? ladoga() : undefined;
        const albumShot = portraitCar && Math.hypot(portraitCar.x - focus.x, portraitCar.z - focus.z) < 28 ? albumCamera.frame(portraitCar, sim.cars, camera.aspect) : null;
        if (albumShot) {
            world.cull(albumShot);
            renderer.render(scene, albumShot);
            if (garage.ladoga.captureFrame(canvas))
                persist();
        }
        if (outside)
            world.cull(camera);
        if (!inside && !sim.tramRider.onboard)
            recorder.capture({ time: sim.elapsed, clock: calendarMinutes(), tram: sim.tramTime, wanted: sim.wanted,
                power: jobs.blackoutPhase, freight: sim.cargoRail.poses.length ? sim.cargoRail.save() : undefined, hero: sim.hero, driven: sim.driven, transfer: sim.transition, cars: sim.cars, people: sim.people, props: sim.motorPool.props, patrol: patrolLight, signal: trafficLight, impacts: replayImpacts, impactLean: c => sim.impactLean(c) });
        replayImpacts.length = 0;
        const drawStart = performance.now();
        if (!outside && house.scene.userData.interiorZone === 'campus') {
            camera.updateMatrixWorld();
            house.scene.userData.campusView.update(p, camera);
        }
        renderer.render(outside ? scene : house.scene, camera);
        localStats.renderMs = performance.now() - drawStart;
        boot.hidden = true;
        if (garage.ladoga.pendingPhoto && outside && garage.ladoga.captureFrame(canvas))
            persist();
        if (now - lastPersist >= 1400) {
            persist();
            lastPersist = now;
        }
        if (stabilize > 0) {
            stabilize -= dt;
            return;
        }
        adapt(elapsed);
    }
    syncHUD();
    requestAnimationFrame(frame);
}
