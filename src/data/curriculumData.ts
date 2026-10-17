import { Experiment, UniversityInfo } from '../types/mechatronics';

export const YEMENI_UNIVERSITIES: UniversityInfo[] = [
  {
    id: 'sanaa',
    nameAr: 'جامعة صنعاء',
    nameEn: "Sana'a University",
    city: 'صنعاء',
    departmentAr: 'قسم هندسة الميكاترونكس - كلية الهندسة'
  },
  {
    id: 'aden',
    nameAr: 'جامعة عدن',
    nameEn: 'University of Aden',
    city: 'عدن',
    departmentAr: 'كلية الهندسة - قسم الهندسة الإلكترونية والميكانيكية'
  },
  {
    id: 'taiz',
    nameAr: 'جامعة تعز',
    nameEn: 'Taiz University',
    city: 'تعز',
    departmentAr: 'كلية الهندسة وتكنولوجيا المعلومات'
  },
  {
    id: 'thamar',
    nameAr: 'جامعة ذمار',
    nameEn: 'Thamar University',
    city: 'ذمار',
    departmentAr: 'كلية الهندسة'
  },
  {
    id: 'ust',
    nameAr: 'جامعة العلوم والتكنولوجيا (UST)',
    nameEn: 'University of Science and Technology',
    city: 'صنعاء',
    departmentAr: 'قسم هندسة الميكاترونكس'
  },
  {
    id: 'ibb',
    nameAr: 'جامعة إب',
    nameEn: 'Ibb University',
    city: 'إب',
    departmentAr: 'كلية الهندسة والعمارة'
  },
  {
    id: 'hadhramout',
    nameAr: 'جامعة حضرموت',
    nameEn: 'Hadhramout University',
    city: 'المكلا',
    departmentAr: 'كلية الهندسة والبترول'
  }
];

export const EXPERIMENTS_CATALOG: Experiment[] = [
  // ================= YEAR 1 =================
  {
    id: 'exp-101',
    title: 'قانون أوم وتوصيل المقاومات (توالي وتوازي)',
    titleEn: "Ohm's Law & Series/Parallel Resistors",
    year: 1,
    category: 'circuits',
    levelBadge: 'السنة الأولى - الترم 1',
    difficulty: 'مبتدئ',
    mode: 'circuit',
    objectives: [
      'التحقق العملي من العلاقة بين الجهد (V) والتيار (I).',
      'حساب المقاومة المكافئة في حالتي التوالي والتوازي.',
      'قياس هبوط الجهد باستخدام جهاز الملتيميتر الرقمي.'
    ],
    theory: 'ينص قانون أوم على أن شدة التيار المار في موصل تتناسب طردياً مع فرق الجهد بين طرفيه (V = I × R). في التوصيل على التوالي تجمع المقاومات (Req = R1 + R2) بينما في التوازي يتجزأ التيار (1/Req = 1/R1 + 1/R2).',
    equations: [
      { name: 'قانون أوم', formula: 'V = I \\times R', explanation: 'الجهد يساوي شدة التيار مضروباً في قيمة المقاومة' },
      { name: 'القدرة الكهربائية المستهلكة', formula: 'P = V \\times I = I^2 \\times R', explanation: 'القدرة بالواط' },
      { name: 'المقاومة المكافئة على التوازي', formula: 'R_{eq} = \\frac{R_1 \\times R_2}{R_1 + R_2}', explanation: 'لمقاومتين متصلتين على التوازي' }
    ],
    componentsNeeded: ['وحدة تغذية DC قابلة للضبط (0-15V)', 'مقاومات كربونية (220Ω, 1kΩ, 4.7kΩ)', 'جهاز ملتيميتر DMM', 'لوحة تجارب Breadboard', 'أسلاك توصيل'],
    steps: [
      'قم بتوصيل المقاومة R1 على لوحة التجارب.',
      'اضبط مصدر الجهد على 10V وقم بتوصيل القطب الموجب والسالب.',
      'ضع مجسات الملتيميتر على طرفي المقاومة لقياس الجهد وملاحظة التيار المتدفق (I = V / R).',
      'كرر التجربة عند ربط مقاومتين على التوالي وعلى التوازي وقارن النتائج النظرية بالعملية.'
    ],
    expectedResults: 'تطابق قراءات الجهد والتيار مع قانون أوم بنسبة خطأ أقل من 2%.'
  },
  {
    id: 'exp-102',
    title: 'قوانين كيرشوف للجهد والتيار (KVL & KCL)',
    titleEn: "Kirchhoff's Voltage and Current Laws",
    year: 1,
    category: 'circuits',
    levelBadge: 'السنة الأولى - الترم 1',
    difficulty: 'مبتدئ',
    mode: 'circuit',
    objectives: [
      'التحقق من قانون كيرشوف للتيار (KCL): مجموع التيارات الداخلة لعقدة يساوي الخارجة منها.',
      'التحقق من قانون كيرشوف للجهد (KVL): مجموع الجهود في أي مسار مغلق يساوي صفراً.',
      'تحليل الدوائر المعقدة متعددة الحلقات.'
    ],
    theory: 'ينص قانون كيرشوف الأول (KCL) على حفظ الشحنة حيث Σ I_in = Σ I_out عند أي نقطة تفرع (Node). بينما ينص قانون كيرشوف الثاني (KVL) على حفظ الطاقة حيث Σ V_loop = 0 عبر أي مسار مغلق.',
    equations: [
      { name: 'قانون كيرشوف للتيار KCL', formula: '\\sum I_{in} = \\sum I_{out}', explanation: 'مجموع التيارات الداخلة لعقدة يساوي الخارجة منها' },
      { name: 'قانون كيرشوف للجهد KVL', formula: '\\sum V_{drop} = V_{source}', explanation: 'مجموع الهبوط في الجهد يساوي جهد المصدر' }
    ],
    componentsNeeded: ['مصدر تغذية 12V', 'مقاومات مختلفة (330Ω, 560Ω, 1kΩ)', 'أميتر وفولتميتر', 'لوحة تجارب'],
    steps: [
      'قم ببناء شبكة ذات حلقتين بجهد مصدر 12V.',
      'قس الجهد عبر كل مقاومة واجمعها للتأكد من انطباق KVL.',
      'قس التيارات الداخلة والخارجة من العقدة المركزية للتأكد من KCL.'
    ],
    expectedResults: 'مجموع فروق الجهد في الحلقة المغلقة يساوي جهد المصدر تماماً.'
  },
  {
    id: 'exp-103',
    title: 'دائرة الشحن والتفريغ للمكثف RC وزمن الاستجابة',
    titleEn: 'RC Circuit Transient Response & Time Constant',
    year: 1,
    category: 'circuits',
    levelBadge: 'السنة الأولى - الترم 2',
    difficulty: 'متوسط',
    mode: 'circuit',
    objectives: [
      'دراسة شحن وتفريغ المكثف مع الزمن.',
      'تحديد ثابت الزمن τ = R × C عملياً والتحقق من وصول الجهد إلى 63.2% من قيمته القصوى خلال τ.',
      'رسم منحنى الاستجابة باستخدام راسم الإشارة (Oscilloscope) ورؤية شحنة وتفريغ المكثف.'
    ],
    theory: 'تخضع معادلة شحن المكثف لدالة أسية: V_c(t) = V_s × (1 - e^(-t/τ)). يمثل ثابت الزمن τ = R × C الزمن اللازم لشحن المكثف بنسبة 63.2% من الجهد الكلي.',
    equations: [
      { name: 'ثابت الزمن RC', formula: '\\tau = R \\times C', explanation: 'الزمن اللازم للشحن بنسبة 63.2% (بالثواني)' },
      { name: 'معادلة شحن المكثف', formula: 'V_c(t) = V_{in} (1 - e^{-t/\\tau})', explanation: 'جهد المكثف أثناء الشحن' },
      { name: 'معادلة تفريغ المكثف', formula: 'V_c(t) = V_0 \\cdot e^{-t/\\tau}', explanation: 'جهد المكثف أثناء التفريغ' }
    ],
    componentsNeeded: ['مولد نبضات (Square wave 100Hz)', 'راسم إشارة Oscilloscope ثنائي القناة', 'مكثف كيميائي 10μF', 'مقاومة 10kΩ'],
    steps: [
      'وصل القناة CH1 على دخل الإشارة المربعة والقناة CH2 على طرفي المكثف.',
      'اضبط مقياس الزمن Time/Div لملاحظة منحنى الشحن والتفريغ المتكرر.',
      'قس الزمن اللازم للوصول إلى 63.2% من جهد الدخل وتأكد من مطابقته لـ R × C.'
    ],
    expectedResults: 'حساب ثابت الزمن عملياً = 0.1s وتطابقه مع النظري.'
  },
  {
    id: 'exp-104',
    title: 'منظومات التروس الميكانيكية ونسبة التخفيض والعزم',
    titleEn: 'Gear Trains Ratio, Speed & Torque Multiplication',
    year: 1,
    category: 'robotics',
    levelBadge: 'السنة الأولى - الترم 2',
    difficulty: 'مبتدئ',
    mode: 'robotics',
    objectives: [
      'فهم النسبة بين سرعة الدوران والعزم في التروس (Gear Ratio).',
      'حساب وتطبيق نسبة التخفيض ونقل الحركة الدورانية.',
      'دراسة التروس الدودية والمخروطية والمستقيمة.'
    ],
    theory: 'العلاقة الميكانيكية الأساسية للتروس: Gear Ratio (i) = N_driven / N_driving = ω_in / ω_out = T_out / T_in.',
    equations: [
      { name: 'نسبة التخفيض', formula: 'i = \\frac{N_2}{N_1} = \\frac{\\omega_1}{\\omega_2}', explanation: 'نسبة عدد الأسنان إلى سرعة الدوران' },
      { name: 'مضاعفة العزم', formula: 'T_{out} = T_{in} \\times i \\times \\eta', explanation: 'العزم الخارج مع كفاءة المنظومة' }
    ],
    componentsNeeded: ['محرك DC مع مشفر سرعة Encoder', 'مجموعة تروس بنسب 1:5 و 1:20', 'جهاز قياس العزم والسرعة'],
    steps: [
      'ثبت الترس القائد على عمود المحرك والترس المقاد على عمود الحمل.',
      'قس سرعة الدخل والخرج عند نسبة 10 أسنان إلى 50 سناً (نسبة 1:5).',
      'لاحظ انخفاض السرعة إلى الخمس وتضاعف العزم الميكانيكي إلى 5 أضعاف.'
    ],
    expectedResults: 'التحقق من مبدأ حفظ الطاقة الميكانيكية.'
  },

  // ================= YEAR 2 =================
  {
    id: 'exp-201',
    title: 'خواص الدايود (Diode) ودوائر التوحيد وتنعيم الجهد',
    titleEn: 'Diode Characteristics, Full-Wave Rectifier & Filtering',
    year: 2,
    category: 'electronics',
    levelBadge: 'السنة الثانية - الترم 1',
    difficulty: 'متوسط',
    mode: 'circuit',
    objectives: [
      'دراسة منحنى خواص الدايود (I-V curve) في الانحياز الأمامي والعكسي وجهد العتبة (0.7V).',
      'بناء دائرة قنطرة التوحيد الكاملة (Full-wave Bridge Rectifier).',
      'إضافة مكثف التنعيم وحساب معامل التموج (Ripple Factor).'
    ],
    theory: 'يمرر الدايود السيليكوني التيار في اتجاه واحد فقط عندما يتجاوز الجهد الأمامي جهد العتبة (0.7V). تُستخدم القنطرة لتحويل الجهد المتردد AC إلى نبضات مستمرة، ثم يُستخدم المكثف لتقليل التموج.',
    equations: [
      { name: 'جهد الخرج المستمر DC', formula: 'V_{dc} = \\frac{2 V_p}{\\pi} - 1.4V', explanation: 'لقنطرة توحيد كاملة مع فقد دايودين' },
      { name: 'جهد التموج بعد التنعيم', formula: 'V_{ripple} = \\frac{I_{load}}{2 f C}', explanation: 'سعة المكثف تقلل التموج' }
    ],
    componentsNeeded: ['محول جهد AC 12V 50Hz', '4 دايودات 1N4007', 'مكثفات تنعيم (100μF, 470μF, 1000μF)', 'مقاومة حمل', 'راسم إشارة Oscilloscope'],
    steps: [
      'قم بتركيب قنطرة الدايودات على لوحة التجارب.',
      'صل دخل الـ AC وافحص شكل إشارة الخرج على الأوسيلوسكوب.',
      'أضف مكثف 470μF على التوازي مع الحمل ولاحظ استقرار خط الجهد المستمر.',
      'قس جهد التموج (Ripple Voltage) وسجل تأثير زيادة سعة المكثف.'
    ],
    expectedResults: 'تحويل كامل لموجة AC إلى DC نقي ومستقر.'
  },
  {
    id: 'exp-202',
    title: 'الترانزستور كقاطع إلكتروني ومشغل للمرحلات BJT Switch',
    titleEn: 'BJT Transistor as an Electronic Switch & Relay Driver',
    year: 2,
    category: 'electronics',
    levelBadge: 'السنة الثانية - الترم 1',
    difficulty: 'متوسط',
    mode: 'circuit',
    objectives: [
      'دراسة عمل ترانزستور BJT نوع NPN في منطقتي القطع (Cut-off) والتشبع (Saturation).',
      'استخدام إشارة منطقية منخفضة (5V / 10mA) للتحكم بحمل كبير (12V Motor / Relay).',
      'فهم أهمية دايود الحماية العكسي (Flyback Diode) عند تشغيل الأحمال الحثية.'
    ],
    theory: 'عند حقن تيار كافٍ في القاعدة (Ib > Ic / β) يدخل الترانزستور في التشبع ويكون الجهد Vce في أدنى قيمة له (0.2V) ليعمل كمفتاح مغلق. تولد الملفات الحثية جهداً عكسياً ضخماً (Back-EMF) عند الإطفاء يتم تبديده عبر Flyback Diode.',
    equations: [
      { name: 'شرط تشبع الترانزستور', formula: 'I_b = \\frac{V_{in} - 0.7V}{R_b} > \\frac{I_c}{\\beta_{min}}', explanation: 'تيار القاعدة المطلوب للتشبع التام' },
      { name: 'جهد التشبع', formula: 'V_{CE(sat)} \\approx 0.1V - 0.2V', explanation: 'هبوط الجهد كمفتاح مغلق' }
    ],
    componentsNeeded: ['ترانزستور 2N2222 أو BD139', 'مقاومة قاعدة 1kΩ', 'مرحل Relay 5V/12V', 'دايود 1N4007', 'مصدر 12V DC'],
    steps: [
      'صل طرف Emitter بالأرضي المشترك وطرف Collector بملف المرحل المتصل بـ 12V.',
      'ركب دايود الحماية 1N4007 بالتوازي العكسي مع ملف المرحل.',
      'طبق نبضة 5V على مقاومة القاعدة ولاحظ إغلاق المرحل وتشغيل المحرك.',
      'قس Vce عند التشغيل وتأكد من وصوله إلى 0.2V تقريباً.'
    ],
    expectedResults: 'تحكم عالي الموثوقية بالأحمال الحثية دون تلف الترانزستور.'
  },
  {
    id: 'exp-203',
    title: 'مكبر العمليات (Op-Amp 741) في التطبيقات الخطية والمقارن',
    titleEn: 'Operational Amplifier (Inverting, Non-Inverting & Comparator)',
    year: 2,
    category: 'electronics',
    levelBadge: 'السنة الثانية - الترم 2',
    difficulty: 'متوسط',
    mode: 'circuit',
    objectives: [
      'بناء واختبار المكبر العاكس (Inverting Amplifier) وحساب معامل التكبير (Gain).',
      'بناء واختبار المكبر غير العاكس (Non-Inverting Amplifier).',
      'استخدام مكبر العمليات كمقارن جهد (Voltage Comparator) لاستشعار المستويات.'
    ],
    theory: 'يمتلك مكبر العمليات المثالي مقاومة دخل لا نهائية ومقاومة خرج صفرية. في المكبر العاكس: Av = -Rf / R1. وفي غير العاكس: Av = 1 + (Rf / R1).',
    equations: [
      { name: 'كسب المكبر العاكس', formula: 'A_v = -\\frac{R_f}{R_1}', explanation: 'عكس الإشارة بمقدار 180 درجة وتكبيرها' },
      { name: 'كسب المكبر غير العاكس', formula: 'A_v = 1 + \\frac{R_f}{R_1}', explanation: 'إشارة الخرج بنفس طور الدخل' }
    ],
    componentsNeeded: ['مكبر عمليات Op-Amp LM741 أو LM358', 'مقاومات دقيقة (10kΩ, 100kΩ, 1kΩ)', 'مولد إشارات', 'راسم إشارة Oscilloscope'],
    steps: [
      'غذِ المكبر بجهد مزدوج +12V و -12V (أو مفرد مع LM358).',
      'طبق إشارة جيبية دخل 0.5Vpp بتردد 1kHz.',
      'اضبط المقاومة Rf = 100kΩ و R1 = 10kΩ للحصول على كسب 10.',
      'افحص إشارة الخرج على الأوسيلوسكوب وقارن سعتها مع الدخل.'
    ],
    expectedResults: 'تكبير نقي بدون تشويه (Clipping).'
  },
  {
    id: 'exp-204',
    title: 'البوابات المنطقية الرقمية وشاشات العرض 7-Segment',
    titleEn: 'Digital Logic Gates (AND, OR, NOT, NAND) & 7-Segment Display',
    year: 2,
    category: 'embedded',
    levelBadge: 'السنة الثانية - الترم 2',
    difficulty: 'مبتدئ',
    mode: 'circuit',
    objectives: [
      'التحقق من جداول الصواب (Truth Tables) للبوابات الأساسية.',
      'تنفيذ دوائر مدمجة باستخدام بوابات NAND العامة.',
      'قيادة شاشة إظهار الأرقام 7-Segment وفك التشفير الثنائي.'
    ],
    theory: 'تعتمد الأنظمة الرقمية على المنطق الثنائي 0 (GND) و 1 (5V). تتكون شاشة 7-segment من دايودات ضوئية مرتبة بأحرف (a, b, c, d, e, f, g).',
    equations: [
      { name: 'بوابة AND', formula: 'Y = A \\cdot B', explanation: 'الخرج 1 فقط إذا كان كل الدخول 1' },
      { name: 'بوابة OR', formula: 'Y = A + B', explanation: 'الخرج 1 إذا كان أي دخل 1' },
      { name: 'نظرية ديمورجان', formula: '\\overline{A \\cdot B} = \\overline{A} + \\overline{B}', explanation: 'التحويل بين البوابات' }
    ],
    componentsNeeded: ['دوائر متكاملة TTL (7408 AND, 7432 OR, 7404 NOT, 7400 NAND)', 'مفاتيح DIP Switches', 'دايودات LED', 'شاشة 7-Segment ومقاومات 330Ω'],
    steps: [
      'غذِّ الدائرة بـ 5V من وحدة التغذية.',
      'صل الدخول بمفاتيح منطقية مع مقاومات Pull-down 10kΩ.',
      'تحقق من خرج كل بوابة لجميع الحالات (00, 01, 10, 11) عبر مؤشرات LED.',
      'صل شريحة فك التشفير BCD to 7-Segment واعرض الأرقام من 0 إلى 9.'
    ],
    expectedResults: 'تطابق كامل مع جداول الصواب الرقمية.'
  },

  // ================= YEAR 3 =================
  {
    id: 'exp-301',
    title: 'التحكم بسرعة واتجاه محرك DC بتضمين النبض PWM وجسر L298N H-Bridge',
    titleEn: 'DC Motor Speed & Direction Control via PWM & H-Bridge Driver',
    year: 3,
    category: 'embedded',
    levelBadge: 'السنة الثالثة - الترم 1',
    difficulty: 'متوسط',
    mode: 'circuit',
    objectives: [
      'تطبيق مبدأ تضمين عرض النبضة (Pulse Width Modulation - PWM) للتحكم بمتوسط الجهد والسرعة.',
      'فهم عمل دائرة H-Bridge لعكس قطبية الجهد وبالتالي اتجاه دوران المحرك (مع عقارب الساعة وعكسها).',
      'قياس إشارة الـ PWM والتردد ونسبة الامتلاء على راسم الإشارة.'
    ],
    theory: 'من خلال تعديل نسبة الامتلاء (Duty Cycle D = Ton / T) لإشارة PWM بتردد ثابت، يتغير متوسط الجهد المؤثر V_avg = D × V_max. يتيح جسر L298N قيادة تيار يصل إلى 2A مع حماية كاملة للمتحكم الدقيق.',
    equations: [
      { name: 'متوسط جهد PWM', formula: 'V_{avg} = \\frac{T_{on}}{T_{period}} \\times V_{cc} = \\text{Duty Cycle} \\times V_{cc}', explanation: 'الجهد الفعال الواصل للمحرك' },
      { name: 'عزم المحرك المغناطيسي', formula: 'T_m = K_t \\times I_a', explanation: 'العزم يتناسب مع تيار العضو الدوار' }
    ],
    componentsNeeded: ['متحكم Arduino Uno لتوليد إشارة PWM', 'شريحة مشغل المحركات L298N Dual H-Bridge', 'محرك تيار مستمر 12V مع تروس', 'راسم إشارة Oscilloscope', 'مصدر قدرة خارجي 12V'],
    steps: [
      'صل مداخل IN1 و IN2 من المشغل بالمخارج الرقمية للأردوينو للتحكم بالاتجاه.',
      'صل طرف ENA بمخرج PWM (مثل Pin 9 ذو التردد 490Hz).',
      'غير قيمة الـ Duty Cycle برمجياً من 0% إلى 100% ولاحظ التدرج في سرعة المحرك.',
      'اعكس الإشارة بين IN1 و IN2 ولاحظ انعكاس اتجاه دوران المحرك فورياً مع قفل الفرملة (Brake).'
    ],
    expectedResults: 'تحكم سلس بالسرعة من 0 إلى أقصى RPM مع إمكانية عكس الحركة بدقة.'
  },
  {
    id: 'exp-302',
    title: 'التحكم بزاوية السيرفو موتور (Servo Motor Position Control)',
    titleEn: 'Precision Servo Motor Angular Control (0° - 180°)',
    year: 3,
    category: 'robotics',
    levelBadge: 'السنة الثالثة - الترم 1',
    difficulty: 'مبتدئ',
    mode: 'circuit',
    objectives: [
      'فهم عمل محركات السيرفو ذات التغذية العكسية المغلقة (Internal Closed-loop Servo).',
      'توليد نبضات التحكم الزمنية (1ms = 0°, 1.5ms = 90°, 2ms = 180°) بتردد 50Hz.',
      'معايرة الزاوية واستخدام المقاومة المتغيرة لتوجيه الذراع.'
    ],
    theory: 'يتطلب محرك السيرفو إشارة نبضية بعرض يتراوح بين 1ms و 2ms تتكرر كل 20ms (تردد 50Hz). تقوم دائرة المقارنة الداخلية بمطابقة وضع العمود مع جهد مقاومة التغذية العكسية لتحقيق زاوية دقيقة.',
    equations: [
      { name: 'عرض نبضة الزاوية', formula: 'T_{pulse} = 1.0\\text{ms} + \\left(\\frac{\\theta}{180^\\circ}\\right) \\times 1.0\\text{ms}', explanation: 'حساب عرض النبضة المطلوب للزاوية المرغوبة' }
    ],
    componentsNeeded: ['محرك سيرفو SG90 أو MG996R عالي العزم', 'مقاومة متغيرة Potentiometer 10kΩ', 'متحكم أردوينو Uno', 'أسلاك توصيل'],
    steps: [
      'صل سلك الإشارة البرتقالي بـ Pin 9 وسلك التغذية بـ 5V والأرضي بـ GND.',
      'صل المقاومة المتغيرة بالمدخل التماثلي A0 لقراءة القيمة من 0 إلى 1023.',
      'استخدم دالة التحويل map(val, 0, 1023, 0, 180) لتحويل القراءة إلى زاوية.',
      'حرك المقاومة المتغيرة ولاحظ تتبع ذراع السيرفو للزاوية بدقة متناهية.'
    ],
    expectedResults: 'دوران وتثبيت زاوية دقيق ضمن مجال 180 درجة.'
  },
  {
    id: 'exp-303',
    title: 'مستشعر المسافة فوق الصوتي HC-SR04 وشاشة القراءة',
    titleEn: 'Ultrasonic Distance Measurement HC-SR04 with LCD Readout',
    year: 3,
    category: 'embedded',
    levelBadge: 'السنة الثالثة - الترم 2',
    difficulty: 'متوسط',
    mode: 'circuit',
    objectives: [
      'تطبيق مبدأ قياس زمن ارتداد الموجة الصوتية (Time of Flight - ToF).',
      'إرسال نبضة الإطلاق (Trigger 10μs) واستقبال نبضة الصدى (Echo Pulse Width).',
      'حساب المسافة الدقيقة اعتماداً على سرعة الصوت في الهواء (340 m/s).'
    ],
    theory: 'يطلق المستشعر 8 نبضات صوتية بتردد 40kHz عند تحفيز طرف Trigger. يظل طرف Echo في حالة HIGH طوال فترة ذهاب وعودة الموجة الصوتية، فتكون المسافة = (الزمن × سرعة الصوت) / 2.',
    equations: [
      { name: 'المسافة بالسنتيمتر', formula: 'd = \\frac{t_{\\mu s} \\times 0.0343}{2}', explanation: 'حيث سرعة الصوت تساوي 0.0343 cm/μs والمسافة مقسومة على 2' }
    ],
    componentsNeeded: ['مستشعر فوق صوتي HC-SR04', 'لوحة Arduino Uno', 'شاشة عرض I2C LCD 16x2 أو Serial Monitor', 'مسطرة قياس للمعايرة'],
    steps: [
      'صل طرف Trig بـ Pin 9 وطرف Echo بـ Pin 8.',
      'اكتب كود إرسال نبضة 10 ميكروثانية واستقبل زمن الـ Echo بواسطة دالة pulseIn().',
      'ضع جسماً عازلاً على مسافات معلومة: 10cm, 20cm, 50cm, 100cm.',
      'سجل قراءات المستشعر وقارنها بالمسافة الحقيقية للتحقق من دقة المعايرة.'
    ],
    expectedResults: 'قياس دقيق للمسافة من 2cm إلى 400cm بخطأ لا يتجاوز 3mm.'
  },
  {
    id: 'exp-304',
    title: 'قيادة محرك الخطوة (Stepper Motor) والتحكم بخطوات Microstepping',
    titleEn: 'Stepper Motor Driver (A4988 / 28BYJ) & Step-by-Step Positioning',
    year: 3,
    category: 'robotics',
    levelBadge: 'السنة الثالثة - تطبيقات 3D / CNC',
    difficulty: 'متوسط',
    mode: 'robotics',
    objectives: [
      'فهم آلية تحريك محركات الخطوة ثنائية القطب (Bipolar Stepper Motor).',
      'استخدام شريحة القيادة A4988 وتطبيق تقنية الخطوات الدقيقة Microstepping.',
      'التحكم بالتموضع الزاوي في طابعات 3D وماكينات الـ CNC الصناعية.'
    ],
    theory: 'يدور محرك الخطوة بزاوية محددة لكل نبضة (عادة 1.8° = 200 خطوة لكل دورة). تتيح شريحة A4988 تجزئة الخطوة إلى 1/16 لتحقيق دوران فائق النعومة والدقة.',
    equations: [
      { name: 'زاوية الخطوة الواحدة', formula: '\\theta_s = \\frac{360^\\circ}{\\text{Steps per revolution}}', explanation: 'لمحرك 200 خطوة تكون الزاوية 1.8°' },
      { name: 'سرعة الدوران RPM', formula: '\\text{RPM} = \\frac{f_{\\text{pulse}} \\times 60}{\\text{Steps} \\times \\text{Microstep Factor}}', explanation: 'السرعة تعتمد على تردد النبضات' }
    ],
    componentsNeeded: ['محرك خطوة NEMA 17 أو 28BYJ-48', 'مشغل A4988 Driver Module', 'متحكم أردوينو', 'مصدر قدرة خارجي 12V DC مستقل'],
    steps: [
      'صل ملفات المحرك الأربعة بأطراف 1A, 1B, 2A, 2B.',
      'صل مدخل STEP ومدخل DIR بمخارج الأردوينو.',
      'ارسل نبضات بترددات مختلفة ولاحظ التسارع Acceleration لتجنب فقدان الخطوات (Step Loss).',
      'اعكس مدخل DIR لعكس اتجاه الدوران.'
    ],
    expectedResults: 'تموضع زاوي دقيق وثبات عزم احتجاز عالي.'
  },

  // ================= YEAR 4 =================
  {
    id: 'exp-401',
    title: 'تصميم ومعايرة متحكم PID للأنظمة الديناميكية المغلقة',
    titleEn: 'PID Controller Design & Tuning (Proportional, Integral, Derivative)',
    year: 4,
    category: 'control',
    levelBadge: 'السنة الرابعة - أنظمة التحكم الآلي',
    difficulty: 'متقدم',
    mode: 'pid',
    objectives: [
      'فهم تأثير المعامل التناسبي (Kp) والتكاملي (Ki) والتفاضلي (Kd).',
      'تطبيق طريقة Ziegler-Nichols لمعايرة المتحكم عملياً.',
      'تحسين معايير الاستجابة العابرة (Step Response): تقليل زمن الصعود، التجاوز Mp%، وزمن الاستقرار Ts.'
    ],
    theory: 'يجمع متحكم التناسبي-التكاملي-التفاضلي (PID) بين سرعة الاستجابة لمعامل Kp، وإلغاء خطأ الحالة المستقرة (Steady-state error) لمعامل Ki، والتنبؤ بالتغيرات المستقبلية وتقليل التذبذبات لمعامل Kd.',
    equations: [
      { name: 'معادلة خرج متحكم PID', formula: 'u(t) = K_p e(t) + K_i \\int_0^t e(\\tau) d\\tau + K_d \\frac{de(t)}{dt}', explanation: 'إشارة التحكم في المجال الزمني' },
      { name: 'دالة التحويل للمتحكم', formula: 'C(s) = K_p + \\frac{K_i}{s} + K_d s', explanation: 'في مجال التردد s-domain' }
    ],
    componentsNeeded: ['نظام ديناميكي (محرك مؤازر أو كرة ورافعة)', 'وحدة تحكم PID رقمية', 'راسم بياني للاستجابة الخطوية Step Input'],
    steps: [
      'اضبط Ki = 0 و Kd = 0 وزد Kp تدريجياً حتى يبدأ النظام بالتذبذب المستمر.',
      'سجل الكسب الحرج Kcr والزمن الدوري للتذبذب Pcr (طريقة Ziegler-Nichols).',
      'احسب المعاملات: Kp = 0.6 Kcr, Ki = 2 Kp / Pcr, Kd = Kp Pcr / 8.',
      'طبق صدمة إزاحة واختبر قدرة المتحكم على إرجاع النظام للوضع المرجعي (Disturbance Rejection).'
    ],
    expectedResults: 'استقرار تام للنظام مع تجاوز أصغري (Overshoot < 10%) وانعدام خطأ الحالة الدائمة.'
  },
  {
    id: 'exp-402',
    title: 'منظومات الكهرو-نيوماتيك والصمامات التوجيهية 5/2 والأسطوانات المزدوجة',
    titleEn: 'Electro-Pneumatics: 5/2 Solenoid Valve & Double-Acting Cylinders',
    year: 4,
    category: 'pneumatics',
    levelBadge: 'السنة الرابعة - الأتمتة الهيدروليكية والنيوماتيكية',
    difficulty: 'متقدم',
    mode: 'pneumatics',
    objectives: [
      'فهم المخططات الهوائية والكهرو-نيوماتيكية ورموز الصمامات (5/2 Solenoid Valves).',
      'التحكم بتقدم ورجوع الأسطوانة مزدوجة الفعل (Double-Acting Cylinder A+ A-).',
      'دمج الحساسات المغناطيسية (Reed Sensors / Limit Switches) لأتمتة الحركة الدورية المتتابعة.'
    ],
    theory: 'يستخدم الصمام 5/2 ذو الملف الكهربائي خمس فتحات وموضعين لتوجيه الهواء المضغوط إلى إحدى غرفتي الأسطوانة لتحريك المكبس، بينما يتم تنفيس الغرفة الأخرى، مما يوفر شوطي تقدم (Extension) ورجوع (Retraction) بقوى عالية.',
    equations: [
      { name: 'قوة شوط التقدم للأسطوانة', formula: 'F = P \\times A = P \\times \\left( \\frac{\\pi D^2}{4} \\right)', explanation: 'حيث P ضغط الهواء و D قطر المكبس' },
      { name: 'قوة شوط الرجوع', formula: 'F_{retract} = P \\times \\frac{\\pi (D^2 - d_{rod}^2)}{4}', explanation: 'طرح مساحة مقطع ذراع المكبس' }
    ],
    componentsNeeded: ['وحدة خدمة الهواء FRL (فلتر، منظم، مزيتة)', 'صمام 5/2 كهرو-نيوماتيكي Solenoid 24V DC', 'أسطوانة مزدوجة الفعل مع مخمدات', 'صمامات خنق أحادية الاتجاه One-way flow control'],
    steps: [
      'اضبط ضغط الهواء عند 6 Bar باستخدام وحدة الخدمة FRL.',
      'صل خطوط الهواء الرئيسية بالصمام والأسطوانة وفق المعايير الصناعية ISO 1219.',
      'غذِّ ملف الصمام بجهد 24V لتنفيذ شوط التقدم A+.',
      'اقطع التغذية أو نشط الملف الثاني لتنفيذ شوط الرجوع A- واضبط خانق السرعة.'
    ],
    expectedResults: 'حركة ترددية ناعمة ومنتظمة متوافقة مع متطلبات خطوط الإنتاج والتجميع.'
  },
  {
    id: 'exp-403',
    title: 'المرشحات الفعالة ومنحنى الاستجابة الترددية (Active Butterworth Low-Pass Filter)',
    titleEn: 'Active Butterworth Low-Pass Filter & Bode Frequency Response',
    year: 4,
    category: 'electronics',
    levelBadge: 'السنة الرابعة - معالجة الإشارات التماثلية',
    difficulty: 'متقدم',
    mode: 'circuit',
    objectives: [
      'تصميم مرشح تمرير منخفض فعال (Butterworth Low-Pass Filter) باستخدام مكبر العمليات.',
      'تحديد تردد القطع (Cutoff Frequency fc) عند هبوط الكسب بمقدار -3dB.',
      'رسم منحنى الاستجابة الترددية وحساب معدل الانحدار Roll-off (dB/decade).'
    ],
    theory: 'تتميز مرشحات بتروورث باستجابة ترددية مسطحة قدر الإمكان في نطاق التمرير دون أي تموجات (Flat Passband). تُستخدم لتنقية إشارات الحساسات في الميكاترونكس من الضجيج والتشويش الكهرومغناطيسي (EMI). ينحدر المرشح من الدرجة الأولى بمعدل -20dB لكل عقد.',
    equations: [
      { name: 'تردد القطع fc', formula: 'f_c = \\frac{1}{2 \\pi R C}', explanation: 'التردد الذي يهبط عنده الجهد إلى 70.7% (-3dB)' },
      { name: 'كسب المرشح مع التردد', formula: '|A(f)| = \\frac{A_0}{\\sqrt{1 + (f/f_c)^{2n}}}', explanation: 'حيث n تمثل رتبة المرشح' }
    ],
    componentsNeeded: ['مكبر عمليات LM358 أو TL072', 'مقاومات دقيقة 10kΩ', 'مكثفات 10nF', 'مولد وظائف Function Generator', 'أوسيلوسكوب'],
    steps: [
      'صمم المرشح بتردد قطع fc = 1kHz باستخدام R = 10kΩ و C = 15.9nF.',
      'طبق إشارة دخل جيبية 2Vpp وغير التردد من 100Hz إلى 10kHz.',
      'قس سعة إشارة الخرج عند كل تردد وارسم منحنى الكسب مقابل التردد (Bode Plot).',
      'تأكد من أن الكسب يهبط عند 1kHz إلى 1.414V (-3dB) وينحدر بحدة عند 10kHz.'
    ],
    expectedResults: 'تصفية فعالة للإشارات عالية التردد مع الحفاظ الكامل على إشارة البيانات الأساسية.'
  },

  // ================= YEAR 5 / GRADUATION PROJECTS =================
  {
    id: 'exp-501',
    title: 'الكينماتيكا الأمامية والعكسية لذراع الروبوت الصناعي (Robotic Arm 3-DOF / 4-DOF)',
    titleEn: 'Robotic Arm Forward & Inverse Kinematics (DH Parameters & Trajectory)',
    year: 5,
    category: 'robotics',
    levelBadge: 'السنة الخامسة - هندسة الروبوتات المتقدمة',
    difficulty: 'متقدم',
    mode: 'robotics',
    objectives: [
      'تطبيق مصفوفات التحويل المتجانسة ومعاملات (Denavit-Hartenberg / DH Parameters).',
      'حساب الكينماتيكا الأمامية (Forward Kinematics): تحديد موضع القابض (X, Y, Z) بناءً على زوايا المفاصل (θ1, θ2, θ3).',
      'حل الكينماتيكا العكسية (Inverse Kinematics): استنتاج زوايا المفاصل لنقل القابض إلى نقطة إحداثية مستهدفة.',
      'محاكاة حركة مسار النقل والتوزيع (Pick and Place Industrial Task).'
    ],
    theory: 'تصف معادلات كينماتيكا الروبوت العلاقة الهندسية بين إحداثيات فضاء المفاصل (Joint Space) وفضاء العمل الكارتيزي (Cartesian Task Space) باستخدام مصفوفات الدوران والإزاحة المتجانسة.',
    equations: [
      { name: 'الكينماتيكا الأمامية للمستوى X-Y', formula: 'X = L_1 \\cos(\\theta_1) + L_2 \\cos(\\theta_1 + \\theta_2), \\quad Y = L_1 \\sin(\\theta_1) + L_2 \\sin(\\theta_1 + \\theta_2)', explanation: 'موقع القابض بدلالة أطوال الأذرع والزوايا' },
      { name: 'زاوية الكوع في الكينماتيكا العكسية', formula: '\\cos(\\theta_2) = \\frac{X^2 + Y^2 - L_1^2 - L_2^2}{2 L_1 L_2}', explanation: 'حساب زاوية المفصل الثاني من الهدف الكارتيزي (X, Y)' }
    ],
    componentsNeeded: ['ذراع روبوت صناعي مفصلي 3-DOF مجهز بسيرفوهات عالية العزم', 'متحكم الحركة والموقع (Cartesian & Joint Space)', 'أجسام مناولة وقابض إمساك Gripper'],
    steps: [
      'حدد أطوال الوصلات L1, L2, L3 وأدخل معاملات جدول DH.',
      'حرك المفاصل بالزوايا θ1, θ2, θ3 وراقب تطابق موضع القابض المحسوب مع الفعلي (End-Effector X, Y, Z).',
      'انقر على نقطة مستهدفة في فضاء العمل (Target Coordinate) وتحقق من استجابة خوارزمية الكينماتيكا العكسية لتوجيه الذراع إليها.',
      'نفذ تسلسل مناولة ونقل آلي (Pick & Place) مع مراعاة تفادي حدود المفاصل الميكانيكية.'
    ],
    expectedResults: 'تتبع مسار دقيق وتطابق كامل بين الحسابات الرياضية ومصفوفات DH وحركة الروبوت.'
  },
  {
    id: 'exp-502',
    title: 'أتمتة خط إنتاج وفرز متكامل باستخدام مخطط السلم (PLC Ladder Diagram)',
    titleEn: 'Industrial PLC Ladder Logic Simulation for Automated Sorting & Packaging Line',
    year: 5,
    category: 'plc',
    levelBadge: 'السنة الخامسة - التحكم المنطقي المبرمج PLC',
    difficulty: 'متقدم',
    mode: 'plc',
    objectives: [
      'برمجة المتحكمات الصناعية بلغة مخطط السلم (Ladder Diagram - LD) وفق معيار IEC 61131-3.',
      'تطبيق تماسات التشغيل المفتوحة طبيعياً NO `[ ]` والمغلقة طبيعياً NC `[/]` والملفات Coils `( )`.',
      'برمجة دائرة القفل الذاتي (Latch / Seal-in circuit) وتأخير التشغيل بمؤقتات (ON-Delay Timer TON).',
      'تصميم حلقة أمان التوقف الطارئ المشروطة (E-Stop Safety Interlock) وتصنيف القطع عبر الحساسات.'
    ],
    theory: 'يعد الـ PLC العقل المدبر للمصانع وخطوط الإنتاج. ينفذ المتحكم دورة مسح دورية (Scan Cycle: Input Scan -> Program Execution -> Output Update). تحافظ دائرة القفل على تشغيل المحرك حتى بعد تحرير زر البدء اللحظي.',
    equations: [
      { name: 'زمن دورة مسح الـ PLC', formula: 'T_{\\text{scan}} = T_{\\text{inputs}} + T_{\\text{logic}} + T_{\\text{outputs}}', explanation: 'زمن تحديث الدخول والخروج وتنفيذ البرنامج' },
      { name: 'معادلة القفل المنطقي Latch', formula: 'Q = (\\text{Start} \\lor Q) \\land \\overline{\\text{Stop}} \\land \\overline{\\text{E-Stop}}', explanation: 'منطق تشغيل واستمرار وتوقف المحرك' }
    ],
    componentsNeeded: ['بيئة محاكاة برمجية لمتحكم PLC مع عارض Ladder Diagram متزامن', 'حزام ناقل كرتوني Conveyor Belt مجهز بمحرك قيادة', 'حساس ضوئي للكشف عن القطع Proximity Sensor', 'مكبس فرز نيوماتيكي Sorting Actuator'],
    steps: [
      'قم بإنشاء السطر الأول (Rung 0): زر تشغيل Start موصول بالتوازي مع تماسة المخرج Q0.0 (Latch) وبالتوالي مع زر إيقاف NC وزر طوارئ E-Stop.',
      'قم بإنشاء السطر الثاني (Rung 1): عند تفعيل الحساس I0.3 يُفعَّل المؤقت TON لمدة 400ms.',
      'قم بإنشاء السطر الثالث (Rung 2): خروج المؤقت T1.DN يطلق مكبس الفرز النيوماتيكي Q0.1 لدفع الصندوق إلى صندوق الفرز.',
      'شغل المحاكاة وتفاعل مع الأزرار والحساسات ولاحظ تدفق القدرة عبر خطوط السلم الأخضر المتوهج.'
    ],
    expectedResults: 'تشغيل صناعي مؤتمت بالكامل مع إيقاف آمن عند تفعيل مفتاح الطوارئ.'
  },
  {
    id: 'exp-503',
    title: 'مشروع تطبيقي يمني: متتبع الطاقة الشمسية الذكي ثنائي المحور (Dual-Axis Solar Tracker)',
    titleEn: 'Applied Yemen Project: Dual-Axis Smart Solar Tracker with MPPT & LDRs',
    year: 5,
    category: 'graduation',
    levelBadge: 'مشاريع التخرج والبيئة اليمنية',
    difficulty: 'متقدم',
    mode: 'circuit',
    objectives: [
      'استغلال مستشعرات الإضاءة LDRs للمقارنة التفاضلية لشدة الضوء وتوجيه الألواح الشمسية.',
      'زيادة كفاءة استخلاص الطاقة في المنظومات الكهروضوئية في اليمن بنسبة تصل إلى 40%.',
      'حماية الألواح من الرياح العاتية وتطبيق وضع السكون الليلي (Stow Position).'
    ],
    theory: 'من خلال التحكم بمحركي سيرفو لمحور الارتفاع (Azimuth) ومحور الميلان (Altitude) بناءً على قراءات 4 مقاومات ضوئية متصالبة، توجه المنظومة اللوح عمودياً مع أشعة الشمس طوال ساعات النهار لتقليل زاوية السقوط إلى الصفر.',
    equations: [
      { name: 'فرق جهد التوجيه الأفقي (السمت)', formula: '\\Delta V_{azimuth} = (V_{east} + V_{north\\_east}) - (V_{west} + V_{north\\_west})', explanation: 'إذا كان الفرق موجباً يتجه المحرك شرقاً' },
      { name: 'القدرة القصوى للوح الشمسي', formula: 'P = P_{max} \\times \\cos(\\theta_{\\text{incidence}})', explanation: 'تصل القدرة إلى أقصاها عندما تكون زاوية السقوط صفر' }
    ],
    componentsNeeded: ['4 حساسات ضوئية LDR مرتبة في حواجز متصالبة', 'محركا سيرفو معدنية التروس (أفقي ورأسي)', 'متحكم دقيق Arduino Uno / STM32', 'لوح شمسي بقدرة تجريبية مع مقياس جهد وتيار'],
    steps: [
      'قارن قراءات الحساسات الشرقية والغربية وأعطِ نبضات للمحرك الأفقي لتصغير الفرق إلى الصفر.',
      'طبق نطاق ميت برمجي (Deadband / Hysteresis) لمنع اهتزاز المحركات عند استقرار الضوء.',
      'قارن القراءات العلوية والسفلية لتوجيه محور الميلان الرأسي مع ارتفاع الشمس.',
      'قس القدرة المولدة من اللوح المتحرك وقارنها بلوح ثابت بزاوية 15 درجة جنوباً.'
    ],
    expectedResults: 'زيادة موثقة في الطاقة المستخلصة يومياً بنسبة 35-40% مقارنة بالأنظمة الثابتة في البيئة اليمنية.'
  },
  {
    id: 'exp-504',
    title: 'مشروع تطبيقي يمني: منظومة الضخ الشمسي لآبار المياه والتحكم بمستوى الخزان',
    titleEn: 'Applied Yemen Project: Automated Solar Well Water Pumping with Tank Level Feedback',
    year: 5,
    category: 'graduation',
    levelBadge: 'مشاريع التخرج والبيئة اليمنية',
    difficulty: 'متقدم',
    mode: 'circuit',
    objectives: [
      'تصميم منظومة ضخ مياه الآبار بالطاقة الشمسية مع تحكم أوتوماتيكي بالمستوى.',
      'حماية المضخة من التشغيل الجاف (Dry Run Protection) عند هبوط منسوب البئر.',
      'فصل التغذية تلقائياً عند امتلاء الخزان العلوي لحفظ المياه وتوفير الطاقة.'
    ],
    theory: 'يعتمد المزارعون في اليمن على منظومات الضخ الشمسي. تتطلب المنظومة الذكية مراقبة مستمرة لجهد وتيار الألواح ومستويات المياه في البئر والخزان لمنع احتراق الغاطس.',
    equations: [
      { name: 'معدل تدفق المياه النظري', formula: 'Q = \\frac{P_{\\text{electric}} \\times \\eta}{\\rho \\cdot g \\cdot H}', explanation: 'حيث P قدرة الألواح، H عمق البئر، ρ كثافة الماء' }
    ],
    componentsNeeded: ['مضخة غاطسة 12V/24V DC أو محرك BLDC مع انفرتر شمسي', 'حساسات عوامة ومجسات مياه إلكترونية (Water Level Probes)', 'مرحل كهرومغناطيسي Relay 30A مع دايود حماية', 'متحكم أردوينو مع شاشة إنذار'],
    steps: [
      'ركب حساس المنسوب السفلي داخل البئر لمنع تشغيل المضخة عند جفاف الماء.',
      'ركب حساس الامتلاء في الخزان العلوي لتوليد إشارة إيقاف (Float Switch).',
      'اكتب منطق التحكم: تشغيل المضخة فقط إذا كانت طاقة الشمس كافية + منسوب البئر آمن + الخزان غير ممتلئ.',
      'اختبر الحماية ضد التشغيل الجاف برفع حساس البئر وتأكد من فصل التغذية فورياً.'
    ],
    expectedResults: 'حماية متكاملة 100% للمضخة ومنع هدر المياه في الخزانات الزراعية والمنزلية.'
  }
];
