import { ExerciseTemplate } from '../types';

export const DEFAULT_EXERCISES: ExerciseTemplate[] = [
  // PEITO
  {
    id: 'bench-press-barbell',
    title: 'Supino Reto (Barra)',
    primary_muscle_group: 'peito',
    secondary_muscle_groups: ['triceps', 'ombros'],
    equipment: 'barra',
    type: 'weight_reps',
    animation_type: 'bench_press',
    gif_id: '0025',
    muscles_pt: 'Peitoral Maior, Tríceps Braquial, Deltoide Anterior',
    instructions: 'Deite-se no banco com os olhos diretamente abaixo da barra. Mantenha os pés firmes no chão, retraia as escápulas, desça a barra até a altura do peito médio e empurre com potência.',
    steps: [
      'Deite-se no banco com os pés bem firmes e apoiados no chão.',
      'Aperte as escápulas juntas contra o banco (peito aberto) e segure a barra com pegada ligeiramente mais larga que os ombros.',
      'Tire a barra do suporte e desça de forma controlada até encostar suavemente na linha dos mamilos.',
      'Empurre a barra de volta à posição inicial travando os braços sem relaxar a tensão muscular.'
    ],
    tips: [
      'Mantenha os cotovelos em um ângulo de 45° a 75° do tronco, nunca a 90° para proteger os ombros.',
      'Inspire na descida e expire no ponto máximo de esforço ao empurrar a barra.'
    ]
  },
  {
    id: 'incline-dumbbell-press',
    title: 'Supino Inclinado (Halteres)',
    primary_muscle_group: 'peito',
    secondary_muscle_groups: ['ombros', 'triceps'],
    equipment: 'halteres',
    type: 'weight_reps',
    animation_type: 'bench_press',
    gif_id: '0047',
    muscles_pt: 'Porção Clavicular do Peitoral (Superior), Deltoide Anterior',
    instructions: 'Ajuste o banco em uma inclinação de 30° a 45°. Empurre os halteres para cima mantendo os cotovelos alinhados, contraindo a parte superior do peito.',
    steps: [
      'Sente-se no banco inclinado e apoie os halteres sobre os joelhos.',
      'Use os joelhos para ajudar a subir os pesos na altura do peito enquanto deita.',
      'Suba os halteres em trajetória ligeiramente convergente, sem encostar um no outro no topo.',
      'Desça até sentir um bom alongamento no peitoral superior.'
    ],
    tips: [
      'Evite inclinar o banco em mais de 45°, pois isso transfere o foco excessivo para os ombros.',
      'Mantenha o punho reto alinhado com o antebraço.'
    ]
  },
  {
    id: 'cable-crossover',
    title: 'Crucifixo na Polia (Crossover)',
    primary_muscle_group: 'peito',
    secondary_muscle_groups: ['ombros'],
    equipment: 'polia',
    type: 'weight_reps',
    animation_type: 'bench_press',
    gif_id: '0188',
    muscles_pt: 'Peitoral Maior (Foco em Fechamento e Pico de Contração)',
    instructions: 'Posicione as polias na altura média ou alta. Una as mãos à frente do peito com uma leve flexão nos cotovelos, espremendo o peitoral no final.',
    steps: [
      'Dê um passo à frente para criar tensão nos cabos, com tronco ligeiramente inclinado.',
      'Com os cotovelos levemente flexionados, traga os braços para frente em arco.',
      'Aperte e esprema o peitoral por 1 segundo no centro do movimento.',
      'Retorne lentamente resistindo ao peso da máquina.'
    ],
    tips: [
      'O movimento deve parecer um abraço em volta de uma árvore grande.',
      'Não deixe o peso puxar seus ombros para trás de maneira descontrolada.'
    ]
  },

  // COSTAS & DORSAL
  {
    id: 'deadlift-barbell',
    title: 'Levantamento Terra (Barra)',
    primary_muscle_group: 'costas',
    secondary_muscle_groups: ['isquiotibiais', 'gluteos', 'quadriceps', 'antebraco'],
    equipment: 'barra',
    type: 'weight_reps',
    animation_type: 'deadlift',
    gif_id: '0032',
    muscles_pt: 'Eretores da Espinha, Trapézio, Grande Dorsal, Glúteos e Posteriores',
    instructions: 'Barra sobre o meio do pé, pegada justa rente às canelas, coluna neutra. Empurre o chão com os pés e projete os quadris para a frente até a extensão total.',
    steps: [
      'Posicione os pés na largura do quadril, com a barra cortando o meio dos pés.',
      'Flexione o quadril para trás até alcançar a barra sem arquear as costas.',
      'Ative as dorsais, trave o abdômen e empurre o chão com força total com as pernas.',
      'Fique completamente em pé travando os glúteos no topo (sem hiperextender a lombar).'
    ],
    tips: [
      'Pense no levantamento terra como "empurrar o chão para longe", não apenas puxar com as costas.',
      'A barra deve deslizar rente à sua canela e coxas durante todo o trajeto.'
    ]
  },
  {
    id: 'lat-pulldown',
    title: 'Puxada Alta (Polia / Frente)',
    primary_muscle_group: 'lats',
    secondary_muscle_groups: ['biceps', 'costas'],
    equipment: 'polia',
    type: 'weight_reps',
    animation_type: 'lat_pulldown',
    gif_id: '0198',
    muscles_pt: 'Latíssimo do Dorso (Asas), Bíceps, Redondo Maior',
    instructions: 'Segure a barra com pegada ligeiramente maior que os ombros. Incline o tronco sutilmente para trás e puxe a barra na direção do peito superior puxando pelos cotovelos.',
    steps: [
      'Ajuste o apoio das pernas para travar seus joelhos firmemente.',
      'Puxe a barra para baixo guiando com os cotovelos até a altura da clavícula.',
      'Concentre-se em espremer as costas na parte baixa.',
      'Estenda os braços completamente no retorno permitindo que a dorsal se alongue.'
    ],
    tips: [
      'Não use o impulso do corpo para balançar a carga para trás.',
      'Foque em puxar com os cotovelos e não com a força dos punhos.'
    ]
  },
  {
    id: 'barbell-row',
    title: 'Remada Curvada (Barra)',
    primary_muscle_group: 'costas',
    secondary_muscle_groups: ['lats', 'biceps'],
    equipment: 'barra',
    type: 'weight_reps',
    animation_type: 'deadlift',
    gif_id: '0027',
    muscles_pt: 'Trapézio Médio/Inferior, Romboides, Grande Dorsal',
    instructions: 'Incline o tronco para a frente a cerca de 45° mantendo a lombar firme. Puxe a barra em direção ao umbigo, fechando bem as escápulas.',
    steps: [
      'Segure a barra com pegada pronada ou supinada na largura dos ombros.',
      'Jogue o quadril para trás e mantenha o abdômen totalmente travado.',
      'Puxe a barra em direção à parte inferior do abdômen/umbigo.',
      'Desça o peso com controle sem deixar a coluna arredondar.'
    ],
    tips: [
      'Mantenha o pescoço em posição neutra alinhado com a coluna vertebral.'
    ]
  },
  {
    id: 'pull-up',
    title: 'Barra Fixa (Pronada)',
    primary_muscle_group: 'lats',
    secondary_muscle_groups: ['biceps', 'costas'],
    equipment: 'peso_corporal',
    type: 'bodyweight_reps',
    animation_type: 'pull_up',
    gif_id: '0652',
    muscles_pt: 'Latíssimo do Dorso, Bíceps Braquial, Core',
    instructions: 'Segure a barra com as palmas voltadas para a frente. Puxe seu corpo para cima até que seu queixo passe da linha da barra.',
    steps: [
      'Comece com os braços completamente estendidos (alongamento total).',
      'Ative as escápulas puxando-as para baixo e para trás.',
      'Puxe o corpo para cima até passar o queixo da barra.',
      'Desça de maneira controlada sem despencar.'
    ],
    tips: [
      'Evite cruzar ou chutar as pernas para conseguir impulso.'
    ]
  },

  // OMBROS
  {
    id: 'overhead-press-barbell',
    title: 'Desenvolvimento Militar (Barra)',
    primary_muscle_group: 'ombros',
    secondary_muscle_groups: ['triceps', 'peito'],
    equipment: 'barra',
    type: 'weight_reps',
    animation_type: 'bench_press',
    gif_id: '0091',
    muscles_pt: 'Deltoide Anterior, Deltoide Lateral, Tríceps',
    instructions: 'Em pé, segure a barra nos ombros. Contraia glúteos e abdômen, empurre a barra em linha vertical direta acima da cabeça travando os cotovelos.',
    steps: [
      'Apoie a barra na parte frontal dos ombros com pegada na largura dos ombros.',
      'Trave os glúteos e o abdômen para proteger a coluna lombar.',
      'Empurre a barra para cima, passando o rosto e finalizando sobre a cabeça.',
      'Retorne a barra com controle até o topo do peito.'
    ],
    tips: [
      'Não incline a coluna para trás para transformar em supino inclinado.'
    ]
  },
  {
    id: 'lateral-raise-dumbbell',
    title: 'Elevação Lateral (Halteres)',
    primary_muscle_group: 'ombros',
    secondary_muscle_groups: ['ombros'],
    equipment: 'halteres',
    type: 'weight_reps',
    animation_type: 'curl',
    gif_id: '0334',
    muscles_pt: 'Deltoide Lateral (Ombro Cabeça Média)',
    instructions: 'Segure halteres ao lado do corpo. Levante os braços até a altura dos ombros liderando pelos cotovelos, com leve inclinação para a frente.',
    steps: [
      'Fique em pé com leve inclinação do tronco para a frente.',
      'Suba os halteres pelas laterais liderando pelos cotovelos.',
      'Suba até a altura da linha dos ombros.',
      'Desça devagar controlando a gravidade em 2 a 3 segundos.'
    ],
    tips: [
      'Imagine que está despejando duas jarras de água no topo do movimento.',
      'Evite balançar o tronco ou usar cargas excessivas.'
    ]
  },

  // PERNAS - QUADRÍCEPS & GLÚTEOS
  {
    id: 'squat-barbell',
    title: 'Agachamento Livre (Barra)',
    primary_muscle_group: 'quadriceps',
    secondary_muscle_groups: ['gluteos', 'isquiotibiais', 'abdomen'],
    equipment: 'barra',
    type: 'weight_reps',
    animation_type: 'squat',
    gif_id: '0043',
    muscles_pt: 'Quadríceps, Glúteo Máximo, Isquiotibiais e Core',
    instructions: 'Barra posicionada no trapézio. Desça o quadril abaixo da linha dos joelhos mantendo o peito erguido e empurre o chão com os calcanhares para subir.',
    steps: [
      'Posicione os pés ligeiramente mais largos que os ombros com pontas apontando 15° para fora.',
      'Inspire profundamente, trave o abdômen e inicie a descida projetando os joelhos na direção das pontas dos pés.',
      'Agache até que as coxas fiquem pelo menos paralelas ao chão.',
      'Suba explodindo a força através de todo o pé.'
    ],
    tips: [
      'Não deixe os joelhos desabarem para dentro (valgo dinâmico) ao subir.',
      'Mantenha o peito alto e os olhos focados para frente.'
    ]
  },
  {
    id: 'leg-press',
    title: 'Leg Press 45°',
    primary_muscle_group: 'quadriceps',
    secondary_muscle_groups: ['gluteos', 'panturrilha'],
    equipment: 'maquina',
    type: 'weight_reps',
    animation_type: 'squat',
    gif_id: '0739',
    muscles_pt: 'Quadríceps e Glúteos',
    instructions: 'Pés na plataforma na largura dos ombros. Destrave a máquina, desça o trenó até os joelhos formarem 90° e empurre sem travar os joelhos no topo.',
    steps: [
      'Apoie as costas e o quadril completamente no encosto da máquina.',
      'Desça o trenó com controle até atingir máxima amplitude sem tirar a lombar do encosto.',
      'Empurre o peso de volta mantendo a tensão contínua nas pernas.'
    ],
    tips: [
      'Nunca estenda os joelhos completamente com estalo no topo para evitar lesões articulares.'
    ]
  },
  {
    id: 'leg-extension',
    title: 'Cadeira Extensora',
    primary_muscle_group: 'quadriceps',
    secondary_muscle_groups: [],
    equipment: 'maquina',
    type: 'weight_reps',
    animation_type: 'squat',
    gif_id: '0585',
    muscles_pt: 'Quadríceps (Isolamento)',
    instructions: 'Ajuste o rolo sobre a parte inferior da canela. Estenda as pernas totalmente, aperte o quadríceps no topo por 1 segundo e desça com controle.',
    steps: [
      'Ajuste o banco de modo que a articulação do joelho fique alinhada com o eixo da máquina.',
      'Estenda as pernas completamente até o topo.',
      'Segure a contração isométrica por 1 segundo.',
      'Desça lentamente controlando a fase excêntrica.'
    ],
    tips: [
      'Excelente exercício para finalizar o treino de quadríceps com técnica de drop set.'
    ]
  },

  // PERNAS - POSTERIOR & GLÚTEO
  {
    id: 'romanian-deadlift',
    title: 'Stiff / RDL (Barra ou Halteres)',
    primary_muscle_group: 'isquiotibiais',
    secondary_muscle_groups: ['gluteos'],
    equipment: 'barra',
    type: 'weight_reps',
    animation_type: 'deadlift',
    gif_id: '0085',
    muscles_pt: 'Isquiotibiais (Posterior de Coxa), Glúteo Máximo',
    instructions: 'Joelhos com leve flexão fixa. Projete o quadril para trás mantendo as costas retas até sentir um alongamento forte nos posteriores de coxa.',
    steps: [
      'Segure a barra junto às coxas com pés na largura do quadril.',
      'Empurre o bumbum para trás como se fosse fechar uma porta com o quadril.',
      'Desça a barra rente à perna até logo abaixo dos joelhos mantendo a lombar neutra.',
      'Retorne empurrando o quadril para frente contraindo os glúteos.'
    ],
    tips: [
      'Não dobre mais os joelhos durante a descida; o movimento é exclusivamente do quadril.'
    ]
  },
  {
    id: 'standing-calf-raise',
    title: 'Panturrilha em Pé (Máquina)',
    primary_muscle_group: 'panturrilha',
    secondary_muscle_groups: [],
    equipment: 'maquina',
    type: 'weight_reps',
    animation_type: 'squat',
    gif_id: '1372',
    muscles_pt: 'Gastrocnêmio e Sóleo',
    instructions: 'Apoie a ponta dos pés na borda da plataforma. Desça os calcanhares para alongamento máximo e suba ficando na ponta dos pés, contraindo forte no topo.',
    steps: [
      'Desça o calcanhar o máximo possível sentindo alongar a panturrilha.',
      'Pause 1 segundo embaixo para eliminar o reflexo elástico.',
      'Suba com força na ponta dos pés e aperte no topo por 2 segundos.'
    ],
    tips: [
      'A pausa em cima e embaixo é o verdadeiro segredo para o crescimento das panturrilhas.'
    ]
  },

  // BRAÇOS - BÍCEPS
  {
    id: 'barbell-curl',
    title: 'Rosca Direta (Barra W ou Reta)',
    primary_muscle_group: 'biceps',
    secondary_muscle_groups: ['antebraco'],
    equipment: 'barra',
    type: 'weight_reps',
    animation_type: 'curl',
    gif_id: '0031',
    muscles_pt: 'Bíceps Braquial, Braquial',
    instructions: 'Cotovelos colados ao lado do corpo. Flexione os braços subindo a barra sem balançar o tronco e desça lentamente.',
    steps: [
      'Segure a barra com pegada supinada (palmas para cima).',
      'Mantenha os cotovelos firmes na linha do tronco.',
      'Suba a barra até a altura do peito superior contraindo o bíceps.',
      'Desça estendendo quase completamente o braço.'
    ],
    tips: [
      'Não jogue os cotovelos para a frente para descansar o peso no topo do movimento.'
    ]
  },
  {
    id: 'dumbbell-hammer-curl',
    title: 'Rosca Martelo (Halteres)',
    primary_muscle_group: 'biceps',
    secondary_muscle_groups: ['antebraco'],
    equipment: 'halteres',
    type: 'weight_reps',
    animation_type: 'curl',
    gif_id: '0165',
    muscles_pt: 'Braquiorradial, Braquial e Bíceps',
    instructions: 'Palmas voltadas uma para a outra durante todo o movimento para desenvolver a espessura do braço e antebraço.',
    steps: [
      'Segure os halteres com pegada neutra.',
      'Suba os pesos simultaneamente ou alternadamente.',
      'Aperte no topo e desça com cadência controlada.'
    ],
    tips: [
      'Excelente exercício para dar aspecto de braço denso e antebraço forte.'
    ]
  },

  // BRAÇOS - TRÍCEPS
  {
    id: 'triceps-rope-pushdown',
    title: 'Tríceps Corda (Polia Alta)',
    primary_muscle_group: 'triceps',
    secondary_muscle_groups: [],
    equipment: 'polia',
    type: 'weight_reps',
    animation_type: 'lat_pulldown',
    gif_id: '0201',
    muscles_pt: 'Tríceps (Cabeça Lateral e Medial)',
    instructions: 'Cotovelos fixos ao lado das costelas. Empurre a corda para baixo abrindo as pontas no final do movimento para contração máxima.',
    steps: [
      'Incline ligeiramente o tronco para a frente.',
      'Estenda os braços para baixo empurrando a corda.',
      'No final do percurso, abra as pontas da corda para os lados.',
      'Retorne até formar um ângulo de 90° no cotovelo.'
    ],
    tips: [
      'Não deixe os cotovelos subirem ou balançarem para frente e para trás.'
    ]
  },

  // ABDÔMEN & CÁRDIO
  {
    id: 'hanging-leg-raise',
    title: 'Elevação de Pernas na Barra Fixa',
    primary_muscle_group: 'abdomen',
    secondary_muscle_groups: [],
    equipment: 'peso_corporal',
    type: 'bodyweight_reps',
    animation_type: 'pull_up',
    gif_id: '0472',
    muscles_pt: 'Reto Abdominal (Foco Inferior) e Flexores do Quadril',
    instructions: 'Pendure-se na barra e eleve as pernas retas ou dobradas até a altura da cintura sem embalo.',
    steps: [
      'Pendure-se firmemente com as pernas esticadas.',
      'Enrole a bacia elevando os joelhos ou pernas em direção ao peito.',
      'Desça lentamente sem balançar o corpo.'
    ],
    tips: [
      'O segredo é enrolar o quadril e não apenas levantar a coxa.'
    ]
  },
  {
    id: 'treadmill-running',
    title: 'Corrida na Esteira (Cárdio)',
    primary_muscle_group: 'cardio',
    secondary_muscle_groups: ['quadriceps', 'panturrilha'],
    equipment: 'maquina',
    type: 'distance_duration',
    animation_type: 'squat',
    gif_id: '3656',
    muscles_pt: 'Sistema Cardiovascular, Resistência Muscular',
    instructions: 'Corrida contínua ou intervalada (HIIT) para queima de gordura e condicionamento aeróbico.',
    steps: [
      'Inicie com 3 minutos de caminhada rápida para aquecer.',
      'Aumente a velocidade para o ritmo alvo de corrida.',
      'Mantenha a postura ereta e respiração cadenciada.'
    ]
  }
];
