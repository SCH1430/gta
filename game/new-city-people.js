'use strict';

const T = require('../engine/three.module.min.js');
const { Batch, ring, tube, shell, glass } = require('./model-geometry.js');
const { createPerson } = require('./model-people.js');
const { groundHeight } = require('./world-layout.js');

const metal = '#b1bab5', rubber = '#253138', brass = '#b59b69', canvas = '#9b9378';
const row = (id, label, x, z, yaw, variant, note, design) => ({ id: 'city-person-' + id, label, x, z, yaw, variant, note, design });

function parts(parent, name, draw, material) {
    const b = new Batch();
    draw(b);
    const mesh = b.mesh(material);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
}

function loop(b, x, y, z, radius, color, sideOn = false) {
    b.add(ring, [x, y, z], [radius, radius, radius * .72], color, [0, sideOn ? Math.PI * .5 : 0, 0]);
}

function caseBody(b, w, h, d, color) {
    b.box(0, -h * .5 - .026, 0, w, h, d, color);
    b.box(0, -h * .12 - .026, -d * .51, w * .97, .014, .007, metal);
    b.rod([-w * .22, -.024, 0], [-w * .22, .015, 0], .009, rubber);
    b.rod([-w * .22, .015, 0], [w * .22, .015, 0], .011, rubber);
    b.rod([w * .22, .015, 0], [w * .22, -.024, 0], .009, rubber);
    for (const x of [-w * .31, w * .31])
        b.box(x, -h * .34 - .026, -d * .52, .028, .032, .009, metal);
}

function cylinder(b, x, y, z, diameter, height, color) {
    b.add(tube, [x, y, z], [diameter, height, diameter], color);
}

function apron(a, color, length, trim, width = .22) {
    a.body('apron', b => {
        const rows = [[.429, width * .57, -.143], [.328, width * .67, -.200], [.178, width, -.186], [-.025, width * 1.015, -.204], [-length, width * 1.06, -.198]];
        const panel = (y, w, z) => [[-w, y, z + .049], [-w * .24, y - .003, z], [w * .24, y, z - .004], [w, y + .004, z + .049]];
        const bands = rows.map(r => panel(...r));
        for (let i = 1; i < bands.length; i++)
            for (let j = 0; j < 3; j++)
                b.quad(bands[i - 1][j], bands[i][j], bands[i][j + 1], bands[i - 1][j + 1], j === 1 ? color : trim, [0, 0, -1]);
        for (const sign of [-1, 1]) {
            b.rod([sign * .085, .447, -.133], [sign * .105, .486, -.023], .011, trim, true);
            b.rod([sign * .105, .486, -.023], [sign * .109, .418, .134], .011, trim, true);
        }
        b.box(0, .134, -.207, width * .88, .064, .016, trim);
        b.box(0, .170, -.218, width * .89, .011, .010, color);
    });
}

function vest(a, color, trim, bib = false) {
    a.body('work-vest', b => {
        shell(b, [[-.202, .108, .04, .332, .418], [-.150, .213, .063, .356, .447], [.111, .207, .075, .359, .440], [.166, .125, .062, .335, .420]], color);
        for (const s of [-1, 1]) {
            b.box(s * .116, .248, -.208, .102, .077, .028, trim);
            b.box(s * .112, .294, -.213, .108, .018, .024, color);
            b.box(s * .126, .379, -.199, .089, .028, .015, bib ? '#d9dbc0' : trim);
            b.box(s * .126, .385, .137, .095, .022, .014, trim);
        }
        b.box(0, .228, -.212, .013, .339, .012, trim);
    });
}

function helmet(a, color, shield) {
    a.removeHat();
    a.head('helmet', b => {
        b.ball(0, .216, -.005, .219, .149, .264, color);
        b.ball(0, .166, -.030, .222, .028, .268, color);
        b.box(0, .181, -.127, .175, .032, .074, color, [.11, 0, 0]);
        for (const side of [-1, 1])
            b.box(side * .095, .151, -.017, .020, .058, .078, rubber);
    });
    if (shield)
        a.head('face-shield', b => b.quad([-.092, .184, -.155], [-.080, .084, -.140], [.080, .084, -.140], [.092, .184, -.155], '#8ba3a4'), glass);
}

function gauntlets(a, color, length = .18, width = .083) {
    for (const side of ['left', 'right'])
        a.equipment(`${side}-elbow`, 'gauntlet', b => {
            cylinder(b, 0, -.13, 0, width + .024, length, color);
            cylinder(b, 0, -.13 + length * .49, 0, width + .032, .024, rubber);
            b.ball(0, -.239, -.007, width * .84, .081, .069, color);
        });
}

function wheelchair(a) {
    a.removePack();
    a.seated = true;
    a.seatHeight = .53;
    a.seatedLegs = { thigh: 1.82, shin: -.27 };
    a.hands = [[-.339, .087, -.082], [.339, .087, -.082]];
    a.equipment('root', 'active-wheelchair-frame', b => {
        b.box(0, .491, .037, .476, .082, .439, '#334b55');
        b.box(0, .660, .249, .443, .299, .068, '#405762');
        for (const side of [-1, 1]) {
            const x = side * .215;
            b.rod([x, .495, .219], [x, .161, -.366], .020, '#68858a');
            b.rod([x, .475, -.161], [x, .176, -.36], .016, '#68858a');
            b.rod([x, .352, .218], [x, .721, .256], .019, '#68858a');
            b.rod([x, .726, .24], [x, .726, .355], .018, rubber);
            b.rod([x, .269, .166], [side * .311, .324, .062], .014, metal);
            loop(b, side * .199, .080, -.374, .070, rubber, true);
        }
        b.box(0, .145, -.358, .350, .052, .158, rubber);
    });
    for (const side of [-1, 1])
        a.equipment('root', 'wheel-and-push-rim', b => {
            const x = side * .309;
            loop(b, x, .326, .052, .299, rubber, true);
            loop(b, x + side * .025, .326, .052, .276, '#b6c5c6', true);
            for (let i = 0; i < 10; i++) {
                const angle = Math.PI * 2 * i / 10;
                b.rod([x, .326, .052], [x, .326 + Math.cos(angle) * .277, .052 + Math.sin(angle) * .277], .003, metal);
            }
            b.ball(x, .326, .052, .061, .066, .066, '#566e77');
        });
    a.equipment('root', 'blanket-across-knees', b => {
        for (let i = 0; i < 8; i++) {
            const x = (i - 3.5) * .044;
            const fold = .008 * Math.sin(i * 1.9);
            const color = i % 2 ? '#b09274' : '#a38465';
            b.quad([x - .023, .609, .032], [x - .023, .739 + fold, -.365], [x + .022, .738 + fold, -.373], [x + .022, .607, .032], color, [0, 1, 0]);
            b.quad([x - .023, .739 + fold, -.365], [x - .023, .582 + fold, -.449], [x + .022, .580 + fold, -.450], [x + .022, .738 + fold, -.373], color, [0, 0, -1]);
            b.rod([x, .582 + fold, -.45], [x, .550 - i % 3 * .006 + fold, -.460], .003, '#d3b59a');
        }
    });
}

const cast = [
    row('printer', 'Печатник', -104.7, 39.1, 2.7, 10, 'Литейный квартал. Плотные нарукавники, короткий фартук и наборная верстатка.', a => {
        apron(a, '#627068', .119, '#414e49');
        gauntlets(a, '#676a5e', .156);
        a.held('composing-stick', b => {
            b.box(0, 0, 0, .315, .045, .099, '#5e7178');
            b.box(0, .023, -.044, .320, .033, .018, metal);
            for (let i = 0; i < 9; i++) b.box((i - 4) * .027, .037, 0, .020, .016 + (i % 3) * .004, .061, '#aeb1a5');
        }, .29, .285);
    }),
    row('glassblower', 'Стеклодув', -109.2, 38.8, 3.1, 5, 'Двор Металлурга. Высокий фартук, щиток и цветная стеклянная заготовка.', a => {
        apron(a, '#896144', .243, '#745141'); helmet(a, '#8e7653', true);
        a.held('coloured-glass-blank', b => {
            b.rod([-.187, -.014, .014], [.186, -.014, .014], .011, metal);
            for (const x of [-.119, .119]) b.rod([x, -.020, .014], [x * .59, .064, -.005], .009, '#536369');
            b.ball(0, .077, .008, .182, .193, .153, '#79aeb2');
            b.ball(-.029, .124, -.034, .074, .058, .027, '#c8c797');
            b.ball(.029, .040, -.039, .070, .043, .028, '#a77471');
        }, .30, .30);
    }),
    row('laundry', 'Работница прачечной', -40.7, 12.2, -1.35, 3, 'Канальная улица. Водостойкий передник и корзина с формой.', a => {
        apron(a, '#62878b', .262, '#527279');
        a.equipment('left-elbow', 'blue-sleeve-cover', b => cylinder(b, 0, -.086, 0, .106, .164, '#6a9caa'));
        a.equipment('right-elbow', 'plum-sleeve-cover', b => cylinder(b, 0, -.086, 0, .105, .164, '#8d706d'));
        a.held('uniform-basket', b => {
            b.box(0, -.101, .016, .473, .043, .282, '#696f68');
            for (const x of [-.224, .224]) b.box(x, -.033, .016, .030, .197, .291, '#7e6352');
            for (const z of [-.126, .156]) {
                for (let j = 0; j < 4; j++) b.box(0, -.069 + j * .039, z, .446, .019, .025, '#926f56');
                for (let i = -4; i <= 4; i++) b.box(i * .045, -.023, z - .009, .014, .174, .021, '#775b4b');
            }
            for (let i = 0; i < 4; i++) b.ball((i - 1.5) * .090, .074 - i % 2 * .020, .008, .163, .108, .280, ['#96a7ae', '#6d777f', '#847766', '#a99e87'][i]);
        }, .46, .26);
    }),
    row('nursery', 'Воспитательница ночных яслей', -30.3, 17.2, 3.0, 1, 'Двор дома № 23. Мягкий жилет, мешок с варежками и фигурные жетоны.', a => {
        vest(a, '#8f6e71', '#a48586');
        a.hand('mitten-bag', b => {
            b.ball(0, -.141, .008, .196, .285, .131, '#8f8272');
            b.rod([-.054, -.043, .008], [-.025, .002, 0], .009, canvas);
            b.rod([-.025, .002, 0], [.050, -.044, .008], .008, canvas);
            b.ball(-.035, -.037, -.041, .055, .068, .037, '#b56965');
            b.ball(.035, -.042, -.041, .059, .053, .035, '#6a9b9d');
        });
        a.body('locker-tokens', b => {
            loop(b, .124, .289, -.227, .030, brass);
            for (let i = 0; i < 4; i++) b.ball(.101 + i * .015, .257 - i % 2 * .017, -.230, .023, .034, .008, ['#ad885f', '#82a290', '#86a7ab', '#c99782'][i]);
        });
    }),
    row('book-restorer', 'Реставратор книг', -235.8, 18.4, 3.15, 6, 'Школьный двор. Хлопковые перчатки, откидная лупа и раскрытый переплёт.', a => {
        apron(a, '#b3a88b', .165, '#8c806e'); gauntlets(a, '#ded2b6', .079, .055);
        a.head('hinged-magnifier', b => {
            b.rod([-.091, .134, -.035], [-.044, .132, -.132], .004, rubber);
            loop(b, -.042, .118, -.136, .032, brass);
            b.rod([-.043, .148, -.130], [-.043, .133, -.175], .004, metal);
        });
        a.held('open-book-on-support', b => {
            for (const side of [-1, 1]) {
                b.box(side * .087, 0, 0, .170, .029, .242, '#685854', [0, 0, side * .153]);
                b.box(side * .082, .020, -.001, .152, .019, .219, '#c9bc9a', [0, 0, side * .153]);
                for (let j = 0; j < 6; j++) b.box(side * .083, .036, -.070 + j * .025, .095 - (j % 3) * .009, .004, .0025, '#707262', [0, 0, side * .153]);
            }
        }, .31, .27);
    }),
    row('clockkeeper', 'Смотритель городских часов', 16.8, -35.8, 2.8, 13, 'Около трамвайного депо. Жилет и контрольный циферблат в футляре.', a => {
        vest(a, '#565d66', '#72736d');
        a.held('reference-clock-case', b => {
            b.box(0, 0, -.003, .327, .245, .072, '#755b4d');
            b.ball(0, .001, -.045, .211, .210, .031, '#d6cba7');
            loop(b, 0, 0, -.060, .105, brass);
            for (let i = 0; i < 12; i++) {
                const angle = Math.PI * i / 6;
                b.box(Math.sin(angle) * .081, Math.cos(angle) * .081, -.064, .005, .019, .005, rubber, [0, 0, -angle]);
            }
            b.rod([0, 0, -.069], [.047, .035, -.069], .004, rubber);
            b.rod([0, 0, -.071], [-.015, .068, -.071], .003, '#856746');
        }, .29, .283);
    }),
    row('accordionist', 'Дворовый музыкант', -24.2, 17.5, 2.85, 8, 'Двор Канальной. Короткая куртка, широкий ремень и гармонь.', a => {
        a.equipment('root','Потёртый футляр гармони', b => {
            b.box(.46,.17,.13,.52,.26,.28,'#59483c');
            b.box(.46,.23,.13,.53,.019,.29,'#a09478');
            for(const x of [.22,.70]) b.box(x,.27,.13,.045,.055,.28,'#84775e');
            b.rod([.38,.31,.13],[.53,.31,.13],.014,'#695746');
        });
        a.body('accordion-shoulder-strap', b => {
            b.rod([-.110, .447, -.089], [.009, .196, -.208], .024, '#45443c', true);
            b.rod([.140, .440, -.095], [.092, .191, -.203], .021, '#45443c', true);
        });
        a.held('accordion-ends', b => {
            for (const s of [-1, 1]) {
                b.box(s * .151, 0, 0, .116, .237, .185, '#865855');
                for (let i = 0; i < 7; i++) b.box(s * .163, .081 - i * .027, -.097, .051, .020, .008, '#c5bea2');
            }
        }, .34, .327);
        const bellows = a.held('accordion-bellows', b => {
            for (let i = 0; i < 10; i++) {
                b.box((i - 4.5) * .022, .001, .002, .018, .209, .174, i % 2 ? '#555450' : '#6f7070');
                b.box((i - 4.5) * .022, 0, -.090, .006, .204, .005, '#9a8a76');
            }
        });
        a.motion = time => { bellows.scale.x = 1 + .13 * Math.sin(time * 3); };
    }),
    row('umbrella-maker', 'Мастер по ремонту зонтов', 29.8, 25.4, 3.0, 4, 'Рынок «Спектр». Длинный жилет и каркасы зонтов.', a => {
        vest(a, '#514a54', '#787079');
        a.body('folded-umbrella-frames', b => {
            for (let i = 0; i < 3; i++) {
                const x = .164 + i * .043;
                b.rod([x + .123, -.420, .107], [x - .156, .556, .169], .012, metal);
                b.rod([x + .036, -.041, .117], [x - .049, .403, .139], .027, ['#84735d', '#615c73', '#687e74'][i]);
                b.rod([x - .145, .548, .167], [x - .103, .575, .178], .014, rubber);
            }
            b.rod([-.128, .428, -.139], [.150, .192, .190], .016, canvas, true);
        });
    }),
    row('radio-student', 'Подросток из радиокружка', -237.8, 21.1, 3.05, 4, 'У школьной дорожки. Пульт на ремешке и маленькая модель машины в кейсе.', a => {
        a.root.scale.multiplyScalar(.881);
        a.body('radio-controller', b => {
            b.rod([-.092, .490, -.092], [0, .230, -.209], .009, '#647d83');
            b.rod([.092, .485, -.103], [0, .230, -.209], .009, '#647d83');
            b.box(0, .217, -.215, .172, .093, .045, rubber);
            b.rod([.053, .256, -.221], [.051, .375, -.228], .006, metal);
            for (const x of [-.036, .036]) b.ball(x, .216, -.246, .024, .022, .017, '#b7a884');
        });
        a.hand('radio-car-in-case', b => {
            b.box(0, -.140, 0, .228, .021, .128, '#465c63');
            b.box(0, -.104, 0, .170, .045, .087, '#bf735f');
            for (const x of [-.054, .054]) for (const z of [-.043, .043]) b.ball(x, -.121, z, .046, .045, .033, rubber);
            b.rod([-.072, -.041, 0], [.072, -.041, 0], .012, metal);
        });
        a.hand('transparent-model-cover', b => b.box(0, -.091, 0, .222, .104, .120, '#9abaaf'), glass);
    }),
    row('astronomy-student', 'Участница астрокружка', -230.9, 20.1, 2.7, 11, 'У школы № 1430. Вязаная шапка, тубус со звёздной картой и красный фонарь.', a => {
        a.root.scale.multiplyScalar(.912);
        a.removeHat();
        a.head('knitted-astronomy-cap', b => {
            b.ball(0, .225, .004, .175, .163, .205, '#726380');
            b.ball(-.008, .299, .040, .128, .117, .150, '#80728d');
            b.ball(-.008, .358, .064, .052, .054, .054, '#c19ea0');
            cylinder(b, 0, .176, -.005, .182, .045, '#90839c');
        });
        a.body('star-map-tube', b => {
            b.rod([.257, -.155, .161], [-.146, .630, .171], .056, '#617980');
            b.rod([-.146, .629, .171], [-.162, .656, .171], .064, '#a99072');
            b.rod([-.135, .442, -.121], [.178, .133, -.204], .015, canvas, true);
            b.box(.148, .202, -.226, .051, .036, .044, '#a94d52');
        });
    }),
    row('rink-worker', 'Заливщик катка', -73.5, -591.4, 2.4, 10, 'Северный посёлок. Непромокаемый полукомбинезон и широкий скребок.', a => {
        apron(a, '#516e77', .232, '#45626a');
        for (const side of ['left', 'right']) a.equipment(`${side}-ankle`, 'waterproof-boot', b => cylinder(b, 0, .052, .015, .136, .192, '#384a50'));
        a.hand('wide-ice-scraper', b => {
            b.rod([0, .284, 0], [0, -.502, -.003], .014, '#816f5c');
            b.box(0, -.511, -.009, .365, .084, .032, '#9eafae', [.23, 0, 0]);
            for (const x of [-.113, .113]) b.rod([0, -.409, -.007], [x, -.492, -.006], .011, metal);
        });
    }),
    row('shift-skier', 'Лыжник после смены', -75.5, -627.9, 3.1, 7, 'У сквера Полярников. Лыжи с заснеженными креплениями и палки.', a => {
        a.removePack();
        vest(a, '#537c91', '#aaddcc', true);
        a.body('snow-covered-skis', b => {
            for (const x of [.139, .208]) {
                b.rod([x + .12, -.775, .226], [x - .23, .915, .252], .032, x < .15 ? '#9a7067' : '#68878f', true);
                b.rod([x - .228, .913, .252], [x - .263, 1.052, .232], .029, '#adbabc', true);
                b.box(x, -.051, .236, .071, .125, .071, '#475b60', [0, 0, .20]);
                b.box(x - .011, .013, .280, .059, .029, .021, '#c0d3d4');
            }
            b.rod([-.116, .447, -.106], [.183, .183, .232], .018, '#454e53', true);
        });
        a.hand('ski-poles', b => {
            for (const x of [-.035, .035]) {
                b.rod([x, .062, .038], [x, -.534, -.096], .009, metal);
                loop(b, x, -.49, -.083, .050, '#546972');
            }
        });
    }),
    row('wheelchair-resident', 'Горожанка в кресле-коляске', -36.7, 18.1, 3.2, 11, 'Тротуар у Канальной. Короткая куртка, плед и открытые ручные обода.', wheelchair),
    row('paramedic', 'Ночной фельдшер', -39.5, 38.1, 2.7, 14, 'Канальные гаражи. Тёмно-красная куртка и плоский медицинский чемоданчик.', a => {
        vest(a, '#803b43', '#c2a881', true);
        gauntlets(a, '#913f44', .094, .068);
        a.hand('medical-case', b => {
            caseBody(b, .347, .211, .137, '#7e444d');
            b.box(0, -.128, -.073, .112, .027, .008, '#d0c6ad');
            b.box(0, -.128, -.074, .027, .100, .008, '#d0c6ad');
        });
    }),
    row('firefighter', 'Пожарный', -52, 35.8, .9, 2, 'Выезд к Канальным гаражам. Каска, объёмная куртка и дыхательный аппарат.', a => {
        a.removePack();
        vest(a, '#544a41', '#b6a569', true); helmet(a, '#bc8d58', true); gauntlets(a, '#665547');
        a.body('breathing-apparatus', b => {
            b.box(0, .245, .201, .215, .384, .053, '#536264');
            for (const x of [-.074, .074]) {
                cylinder(b, x, .255, .266, .126, .344, '#718489');
                b.ball(x, .425, .264, .106, .090, .100, '#798c8b');
                b.box(x, .449, .267, .062, .050, .064, brass);
            }
            b.rod([.126, .425, .289], [.185, .451, .024], .018, rubber);
        });
    }),
    row('surveyor', 'Геодезист карьера', -404.8, -50.5, 2.6, 7, 'Старый карьер. Куртка, наколенники и высокая складная тренога.', a => {
        a.removePack();
        vest(a, '#6c7d63', '#b1ad7d');
        for (const side of ['left', 'right']) a.equipment(`${side}-knee`, 'survey-kneepad', b => b.ball(0, -.014, -.049, .101, .163, .070, '#4a5e59'));
        a.body('folded-survey-tripod', b => {
            for (let i = 0; i < 3; i++) b.rod([.239 + i * .030, -.545, .170], [-.133 + i * .028, .604, .224], .016, i === 0 ? '#95816f' : metal, true);
            b.box(-.099, .612, .217, .115, .065, .138, '#a48660', [0, 0, .31]);
            b.box(-.105, .678, .216, .096, .091, .111, '#6c9292');
            b.rod([-.117, .451, -.088], [.177, .180, .190], .018, rubber, true);
        });
    }),
    row('caster', 'Литейщик', -143.3, 22.2, 2.5, 5, 'Возле Литейной. Серебристый фартук до голеней, рукавицы и лицевой щиток.', a => {
        apron(a, '#a8afac', .516, '#858f90'); helmet(a, '#808986', true); gauntlets(a, '#a2aaa6', .171, .082);
        a.hand('long-foundry-gauge', b => {
            b.rod([0, -.383, -.003], [0, .302, .054], .012, metal, true);
            b.box(0, .302, -.004, .153, .028, .094, '#786553');
            for (const x of [-.059, .059]) b.box(x, .270, -.048, .022, .076, .021, '#5f5a52');
        });
    }),
    row('antenna-rigger', 'Монтажник антенн', -23.9, -303.9, 2.8, 0, 'Радиоцентр «Полюс». Каска, поясная обвязка и бухта кабеля.', a => {
        helmet(a, '#728996'); vest(a, '#5e737d', '#9ea99c');
        a.body('harness-and-cable', b => {
            for (const side of [-1, 1]) {
                b.rod([side * .126, .455, -.096], [side * .086, .061, -.211], .025, '#968367', true);
                b.rod([side * .133, .446, .094], [side * .171, .055, .126], .024, '#968367', true);
            }
            b.box(0, .070, -.216, .378, .043, .020, '#b8a277');
            b.box(0, .067, -.229, .064, .045, .019, metal);
            for (let i = 0; i < 4; i++) loop(b, .086, .243 - i * .022, .218 + i * .018, .117 - i * .003, '#323843');
        });
    }),
    row('diver', 'Портовый водолаз', -153, 108, 1.7, 2, 'Южный порт. Толстый костюм, круглый ворот и шлем под локтем.', a => {
        a.removePack();
        vest(a, '#565d53', '#7d7361'); gauntlets(a, '#746d61', .146, .094);
        a.body('drysuit-neck-seal', b => {
            cylinder(b, 0, .477, -.009, .209, .061, '#555758');
            cylinder(b, 0, .508, -.009, .182, .037, metal);
        });
        a.hand('diver-helmet-carried', b => {
            b.ball(0, -.121, .005, .244, .248, .236, '#a88960');
            b.ball(0, -.106, -.107, .145, .135, .057, '#687c79');
            loop(b, 0, -.107, -.132, .077, brass);
            cylinder(b, 0, -.233, .007, .198, .053, '#566367');
            b.rod([-.067, .023, .004], [.067, .023, .004], .014, metal);
        });
    }),
    row('signalman', 'Портовый сигнальщик', -138, 103, 3.55, 9, 'Причал 01. Вязаный капор, короткий плащ и два чехла для флажков.', a => {
        a.removeHat();
        a.head('knitted-dock-hood', b => {
            b.ball(0, .199, .031, .206, .164, .202, '#746754');
            b.ball(-.075, .132, .001, .074, .127, .115, '#8b7661');
            b.ball(.075, .132, .001, .074, .127, .115, '#8b7661');
        });
        apron(a, '#68765f', .145, '#566556');
        a.body('twin-flag-cases', b => {
            for (const x of [-.111, .119]) {
                b.rod([x + .109, -.138, .189], [x - .114, .661, .246], .029, '#5d6253');
                b.rod([x - .113, .653, .246], [x - .140, .737, .241], .016, x < 0 ? '#b97264' : '#e1bd77');
            }
            b.rod([-.115, .446, -.105], [.178, .170, -.194], .014, '#a29a78', true);
        });
    }),
    row('ferry-skipper', 'Шкипер парома', -6, 105, .55, 12, 'У Речного вокзала. Шерстяная куртка, жилет с пряжками и фонарь.', a => {
        vest(a, '#7a7154', '#a99a70');
        a.body('marine-buckles', b => {
            for (const y of [.266, .125]) {
                b.box(0, y, -.222, .298, .031, .018, '#474c46');
                b.box(0, y, -.238, .060, .040, .014, metal);
            }
        });
        a.hand('guarded-hand-lantern', b => {
            cylinder(b, 0, -.085, -.008, .126, .134, '#6f7a6e');
            b.ball(0, -.071, -.063, .098, .093, .052, '#ddc586');
            for (let i = -1; i <= 1; i++) b.rod([i * .032, -.133, -.083], [i * .032, -.020, -.085], .005, rubber);
            b.rod([-.059, -.019, -.004], [-.040, .029, -.003], .009, rubber);
            b.rod([-.041, .028, -.003], [.035, .028, -.002], .009, rubber);
            b.rod([.035, .028, -.002], [.058, -.019, -.006], .009, rubber);
        });
    }),
    row('river-lab', 'Лаборант речной станции', 134.2, 120.7, -1.5, 8, 'Южный порт. Прорезинённые нарукавники и термочемодан для проб.', a => {
        gauntlets(a, '#75848a', .173); vest(a, '#758467', '#a6b49e');
        a.held('sample-container', b => {
            b.box(0, -.041, .002, .377, .167, .215, '#7b8f91');
            b.box(0, .051, .075, .374, .041, .078, '#a5b4a9');
            for (let i = -2; i <= 2; i++) {
                cylinder(b, i * .058, .052, -.035, .039, .125, i % 2 ? '#9eb7b2' : '#9cafbd');
                cylinder(b, i * .058, .122, -.035, .047, .022, '#4e5c63');
            }
        }, .34, .280);
    }),
    row('meteorologist', 'Метеоролог карьера', -409.3, -50.8, 2.8, 14, 'Старый карьер. Глубокий капюшон, планшет и цилиндрический футляр.', a => {
        a.removeHat();
        a.head('drawn-weather-hood', b => {
            b.ball(0, .184, .034, .235, .229, .208, '#626c76');
            b.ball(-.097, .132, -.025, .075, .165, .162, '#73828a');
            b.ball(.097, .132, -.025, .075, .165, .162, '#73828a');
        });
        a.body('weather-tablet-and-case', b => {
            b.rod([.203, -.276, .181], [.155, .426, .171], .058, '#6a7d86');
            b.rod([.155, .431, .171], [.147, .478, .171], .063, '#a2a288');
            b.rod([-.106, .431, -.101], [0, .212, -.211], .011, brass);
            b.rod([.091, .441, -.114], [0, .212, -.211], .011, brass);
            b.box(0, .153, -.233, .154, .128, .024, '#455860', [.09, 0, 0]);
            b.box(0, .159, -.248, .128, .084, .008, '#91aba8', [.09, 0, 0]);
        });
    }),
    row('greenhouse-gardener', 'Садовник оранжереи', -11, -88.4, 3.05, 6, 'Северная ТЭЦ. Стёганый жилет, зелёный передник и кассета с рассадой.', a => {
        vest(a, '#65785d', '#87947d'); apron(a, '#556c49', .220, '#68775d');
        a.held('seedling-tray', b => {
            b.box(0, -.039, 0, .427, .056, .241, '#715f53');
            for (const x of [-.149, -.050, .050, .149]) for (const z of [-.067, .067]) {
                cylinder(b, x, -.013, z, .064, .061, '#5a473b');
                b.rod([x, .008, z], [x + .006, .102, z - .012], .005, '#718d58');
                b.ball(x - .021, .057, z, .050, .019, .042, '#829c60', [0, 0, .35]);
                b.ball(x + .021, .090, z - .007, .050, .021, .046, '#7b985e', [0, 0, -.32]);
            }
        }, .42, .275);
    }),
    row('tram-track-worker', 'Путеец трамвайной линии', 7.8, -38.4, 2.7, 5, 'Трамвайное депо. Укороченная куртка, фонарь и измерительное колесо.', a => {
        vest(a, '#8d7854', '#e2c08b', true); helmet(a, '#a08764');
        a.head('low-mounted-lamp', b => {
            b.box(0, .137, -.162, .060, .035, .037, '#49585a');
            b.box(0, .136, -.184, .042, .023, .007, '#ddc490');
        });
        a.body('Путевая сумка с инструментом',b=>{
            caseBody(b,.25,.22,.12,'#786a51');
            b.rod([0,-.05,0],[-.17,.37,.04],.016,'#72674f',true);
        }).position.set(.20,.04,.11);
        a.hand('track-measuring-wheel', b => {
            b.rod([.005, .031, -.001], [.001, -.378, -.074], .012, '#91a0a1');
            loop(b, .001, -.396, -.084, .111, '#576c73', true);
            for (let i = 0; i < 4; i++) {
                const phi = Math.PI * i / 2;
                b.rod([.003, -.396, -.084], [.003, -.396 + Math.sin(phi) * .100, -.084 + Math.cos(phi) * .100], .006, brass);
            }
        });
    })
];

function fabricate(site) {
    const actor = createPerson('resident', site.variant), { root } = actor;
    const spine = root.getObjectByName('spine'), neck = root.getObjectByName('neck');
    const [lod] = root.children;
    const near = lod.levels[0].object;
    root.name = site.label;
    root.userData.cityModel = site.id;
    root.position.set(site.x, groundHeight(site.x, site.z), site.z);
    root.rotation.y = site.yaw;
    const attire = {
        root,
        body(name, draw, mat) { return parts(spine, name, draw, mat); },
        head(name, draw, mat) { return parts(neck, name, draw, mat); },
        equipment(joint, name, draw, mat) { return parts(joint === 'root' ? near : root.getObjectByName(joint), name, draw, mat); },
        removeHat() {
            neck.traverse(child => { if (child.name.startsWith('headwear-')) child.visible = false; });
        },
        removePack() {
            const pack = root.getObjectByName('commuter-backpack');
            if (pack) pack.visible = false;
        },
        held(name, draw, width, y = .296) {
            const mesh = parts(spine, name, draw);
            mesh.position.set(0, y, -.363);
            if (width) this.hands = [[-width / 2, y, -.365], [width / 2, y, -.365]];
            return mesh;
        },
        hand(name, draw, mat) {
            const mesh = parts(root.getObjectByName('right-elbow'), name, draw, mat);
            mesh.position.set(0, -.265, -.038);
            mesh.rotation.x = -.075;
            this.hands = [null, [.247, .061, -.179]];
            return mesh;
        }
    };
    site.design(attire);
    lod.levels[1].distance = attire.seated ? 60 : 36;
    return { actor, attire };
}

function createCityPeople(scene) {
    const group = new T.Group(), models = new Map();
    const routines = require('./winter-residents.js').createWinterResidents(group);
    group.name = 'Новые персонажи города';
    scene.add(group);
    const sites = cast.map(({ id, label, x, z, note }) => ({ id, label, x, z, radius: 2.05, note, actionLabel: `Осмотреть · ${label}` }));
    function update(ctx) {
        group.visible = ctx.zone === 'street';
        if (!group.visible)
            return;
        const focus = ctx.focus ?? ctx;
        routines(ctx, focus);
        for (const site of cast) {
            const distance = Math.hypot(focus.x - site.x, focus.z - site.z);
            let entry = models.get(site.id);
            if (distance > 47) {
                if (entry) entry.actor.root.visible = false;
                continue;
            }
            if (!entry) {
                entry = fabricate(site);
                models.set(site.id, entry);
                group.add(entry.actor.root);
            }
            const { actor, attire } = entry;
            actor.root.visible = true;
            let turn = 0;
            if (distance < 5 && distance > .02) {
                const angle = Math.atan2(site.x - focus.x, site.z - focus.z) - site.yaw;
                turn = T.MathUtils.clamp(Math.atan2(Math.sin(angle), Math.cos(angle)), -.54, .54) * T.MathUtils.smoothstep(5 - distance, 0, 3.9);
            }
            actor.root.rotation.y = site.yaw + (attire.seated ? 0 : turn);
            actor.update(ctx.dt, 0, false, {
                ground: ctx.ground ?? groundHeight, handTargets: attire.hands,
                seated: attire.seated ? 1 : 0, seatHeight: attire.seatHeight, seatedLegs: attire.seatedLegs,
                glance: attire.seated ? turn * .42 : 0, conversation: distance < 2.5,
                wetness: Math.min(.65, (ctx.weather?.snow ?? 0) * .33)
            });
            attire.motion?.(ctx.elapsed);
        }
    }
    return { sites, update };
}

module.exports = { createCityPeople };
