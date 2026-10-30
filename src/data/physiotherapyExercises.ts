import { PhysiotherapyExercise, PhysiotherapyProtocol } from '../types';

export const PHYSIOTHERAPY_EXERCISES: PhysiotherapyExercise[] = [
  {
    id: 'knee-to-chest-single',
    title: 'Abraço Unilateral de Joelho (Knee to Chest)',
    region: 'lombar',
    region_label: 'Coluna & Lombar',
    clinical_objective: 'Descompressão das raízes nervosas lombares (L4-S1) e alívio da tensão na fáscia toracolombar.',
    execution_type: 'duration',
    default_duration_seconds: 30,
    default_sets: 3,
    unilateral: true,
    position: 'Deitado de barriga para cima no colchonete (decúbito dorsal).',
    steps: [
      'Deite-se de costas com a coluna e a cabeça apoiadas confortavelmente no chão.',
      'Flexione um dos joelhos e envolva a canela com ambas as mãos logo abaixo da patela.',
      'Puxe o joelho suavemente em direção ao abdômen e peito até sentir um alívio agradável na lombar e glúteo.',
      'Mantenha a outra perna relaxada ou com o joelho dobrado se a lombar for muito sensível.',
      'Sustente a posição respirando profundamente e repita com a outra perna.'
    ],
    feel_cue: 'Sensação de descompressão e relaxamento na parte baixa das costas e alongamento suave no glúteo.',
    caution: 'Não force o joelho se houver pinçamento na virilha. Não eleve a cabeça nem os ombros do solo.',
    breathing: 'Inspire pelo nariz enchendo o abdômen e solte todo o ar pela boca enquanto aproxima a perna.'
  },
  {
    id: 'knee-to-chest-double',
    title: 'Abraço Bilateral de Joelhos (Double Knee to Chest)',
    region: 'lombar',
    region_label: 'Coluna & Lombar',
    clinical_objective: 'Abertura passiva dos forames neurais intervertebrais e relaxamento profundo dos paravertebrais.',
    execution_type: 'duration',
    default_duration_seconds: 45,
    default_sets: 3,
    unilateral: false,
    position: 'Deitado de barriga para cima com o corpo relaxado.',
    steps: [
      'Deite-se de costas e dobre ambos os joelhos em direção ao peito simultaneamente.',
      'Abrace as duas canelas com os braços, entrelaçando os dedos ou segurando os antebraços.',
      'Permita que o sacro e a lombar aplanem suavemente contra o solo.',
      'Você pode realizar um leve e sutil balanço lateral (1 a 2 cm) para massagear a musculatura lombar.',
      'Mantenha os ombros relaxados e o queixo ligeiramente recolhido para não hiperestender o pescoço.'
    ],
    feel_cue: 'Sensação imediata de alívio e descanso no centro da coluna lombar e sacro.',
    caution: 'Não use força excessiva nos braços; o objetivo é relaxamento passivo por gravidade.',
    breathing: 'Respiração diafragmática lenta: 4 segundos inspirando e 6 segundos soltando o ar.'
  },
  {
    id: 'straight-leg-raise-90',
    title: 'Elevação de Perna Estendida a 90° em L (Straight Leg Raise)',
    region: 'quadril',
    region_label: 'Quadril & Pernas',
    clinical_objective: 'Controle motor lombo-pélvico, ativação isolada de quadríceps sem estresse patelar e flexibilidade neural.',
    execution_type: 'reps',
    default_reps: 12,
    default_sets: 3,
    unilateral: true,
    position: 'Deitado de costas no chão com braços relaxados ao longo do corpo.',
    steps: [
      'Deite-se de costas. Uma perna fica dobrada com o pé no chão para proteger a coluna.',
      'A outra perna deve ficar completamente estendida no solo com a ponta do pé puxada para você (dorsiflexão).',
      'Contraia a parte da frente da coxa (quadríceps) e suba a perna em linha reta até formar um ângulo reto de 90° em relação ao corpo (formando um L com o tronco).',
      'Faça uma pausa de 1 a 2 segundos no ponto mais alto mantendo o joelho travado e o abdômen firme.',
      'Desça de maneira lenta e controlada até quase encostar o calcanhar no solo.'
    ],
    feel_cue: 'Ativação firme na frente da coxa e sensação de alongamento na parte posterior da perna no topo.',
    caution: 'Não arqueie a coluna lombar ao elevar ou descer a perna. A lombar deve permanecer estável.',
    breathing: 'Expire pela boca durante a elevação da perna e inspire pelo nariz durante a descida controlada.'
  },
  {
    id: 'hamstring-stretch-band-90',
    title: 'Alongamento de Isquiotibiais 90° com Faixa/Toalha',
    region: 'quadril',
    region_label: 'Quadril & Pernas',
    clinical_objective: 'Restauração do comprimento da cadeia miofascial posterior sem sobrecarga discal.',
    execution_type: 'duration',
    default_duration_seconds: 40,
    default_sets: 3,
    unilateral: true,
    position: 'Deitado de costas no colchonete.',
    steps: [
      'Passe uma faixa elástica, cinto ou toalha comprida na planta do pé.',
      'Segure as pontas da faixa com as duas mãos e eleve a perna verticalmente a 90° em relação ao solo.',
      'Estenda o joelho o máximo possível sem dor aguda e puxe suavemente a faixa em sua direção.',
      'Mantenha a pelve totalmente encostada no chão sem deixar o glúteo do lado trabalhado levantar.',
      'Mantenha a posição sustentada de maneira contínua, permitindo que a musculatura relaxe.'
    ],
    feel_cue: 'Alongamento moderado e prazeroso atrás da coxa e panturrilha (escala de intensidade 5 a 6 de 10).',
    caution: 'Nunca force a ponto de sentir formigamento, queimação ou tremor incontrolável.',
    breathing: 'Mantenha a respiração contínua e calma. A cada expiração, relaxe ainda mais a perna.'
  },
  {
    id: 'legs-up-the-wall-90',
    title: 'Pernas Elevadas na Parede a 90° (Viparita Karani)',
    region: 'lombar',
    region_label: 'Coluna & Lombar',
    clinical_objective: 'Drenagem circulatória dos membros inferiores e descompressão por gravidade reversa da coluna.',
    execution_type: 'duration',
    default_duration_seconds: 120,
    default_sets: 1,
    unilateral: false,
    position: 'Deitado no solo com o glúteo encostado na parede e pernas verticais.',
    steps: [
      'Sente-se de lado bem próximo à parede e gire o corpo deitando as costas no chão enquanto estica as duas pernas para cima apoiadas na parede.',
      'O corpo e as pernas formam um ângulo perfeito de 90 graus (formato em L).',
      'Abra os braços para os lados com as palmas voltadas para cima para expandir o peito.',
      'Feche os olhos e deixe todo o peso da coluna e do quadril assentar no chão sem fazer força alguma.',
      'Permaneça nesta posição respirando com o abdômen.'
    ],
    feel_cue: 'Alívio instantâneo do cansaço nas pernas, relaxamento da lombar e desaceleração dos batimentos cardíacos.',
    caution: 'Se sentir dormência nos pés, dobre ligeiramente os joelhos e apoie a planta dos pés na parede.',
    breathing: 'Inspire lentamente sentindo a barriga subir e expire soltando o peso de todo o corpo no colchonete.'
  },
  {
    id: 'piriformis-figure-4',
    title: 'Alongamento de Piriforme em 4 (Figura 4 Deitado)',
    region: 'quadril',
    region_label: 'Quadril & Pernas',
    clinical_objective: 'Descompressão e relaxamento do músculo piriforme para alívio imediato de ciatalgia e dor no quadril.',
    execution_type: 'duration',
    default_duration_seconds: 35,
    default_sets: 3,
    unilateral: true,
    position: 'Deitado de costas no colchonete.',
    steps: [
      'Deite-se de costas com os joelhos flexionados e os pés apoiados no chão.',
      'Cruze o tornozelo direito sobre o joelho esquerdo, desenhando a forma de um número 4 com as pernas.',
      'Passe as mãos por trás da coxa esquerda e puxe-a suavemente em direção ao seu peito.',
      'Mantenha a cabeça e as escápulas apoiadas no colchonete.',
      'Sinta o alongamento no glúteo direito e respire profundamente antes de inverter os lados.'
    ],
    feel_cue: 'Alongamento profundo no centro do glúteo (onde passa o nervo ciático) e lateral do quadril.',
    caution: 'Não force o joelho dobrado para dentro; mantenha o tornozelo firme em dorsiflexão para proteger o joelho.',
    breathing: 'Solte o ar prolongadamente a cada tentativa de aproximar a perna 1 milímetro a mais.'
  },
  {
    id: 'cat-cow-mobility',
    title: 'Gato-Camelo / Cat-Cow (Mobilidade Vertebral)',
    region: 'lombar',
    region_label: 'Coluna & Lombar',
    clinical_objective: 'Restauração da mobilidade segmentar intervertebral torácica e lombar com sincronização respiratória.',
    execution_type: 'reps',
    default_reps: 10,
    default_sets: 3,
    unilateral: false,
    position: 'Posição de 4 apoios no solo.',
    steps: [
      'Apoie as mãos diretamente sob os ombros e os joelhos alinhados sob os quadris.',
      'Fase da Vaca: Ao inspirar, desça suavemente o abdômen em direção ao solo, abra o peito e olhe suavemente para frente/cima.',
      'Fase do Gato: Ao expirar, empurre o chão com as mãos, arredonde a coluna para cima e leve o queixo ao peito.',
      'Movimente a coluna vértebra por vértebra, como uma onda fluida e suave.',
      'Repita o ciclo de forma rítmica e calma, sem movimentos bruscos.'
    ],
    feel_cue: 'Sensação de massagem e destravamento suave por toda a extensão da coluna vertebral.',
    caution: 'Em casos de crise aguda de hérnia de disco lombar, limite a amplitude de flexão e foque na suavidade.',
    breathing: 'Inspire durante a extensão (olhando à frente) e expire completamente durante a flexão (arredondando).'
  },
  {
    id: 'bird-dog-core',
    title: 'Perdigueiro / Bird-Dog (Estabilidade Lombo-Pélvica)',
    region: 'lombar',
    region_label: 'Coluna & Lombar',
    clinical_objective: 'Ativação dos estabilizadores profundos (multífidos e transverso) com carga compressiva discal mínima.',
    execution_type: 'reps',
    default_reps: 10,
    default_sets: 3,
    unilateral: true,
    position: 'Posição de 4 apoios com coluna em posição neutra.',
    steps: [
      'Inicie em 4 apoios com punhos sob os ombros e joelhos sob o quadril.',
      'Mantenha o abdômen ativado como se fosse levar o umbigo levemente em direção à coluna.',
      'Estenda simultaneamente o braço direito para frente e a perna esquerda para trás até alinhá-los com o tronco.',
      'Mantenha a pelve perfeitamente nivelada, sem deixar o quadril girar ou abrir para o lado.',
      'Sustente 3 segundos no topo, retorne suavemente à posição inicial e alterne os membros.'
    ],
    feel_cue: 'Tensão firme no abdômen, glúteo e músculos das costas que mantêm o corpo equilibrado como uma mesa firme.',
    caution: 'Não suba a perna acima da linha do tronco para não hiperestender a lombar.',
    breathing: 'Expire ao estender os membros cruzados e inspire ao retornar à posição de 4 apoios.'
  },
  {
    id: 'glute-bridge-pelvic-tilt',
    title: 'Ponte de Glúteo com Báscula Pélvica',
    region: 'quadril',
    region_label: 'Quadril & Pernas',
    clinical_objective: 'Reeducação pélvica, despertar da musculatura glútea inibida e descompressão da sínfise púbica.',
    execution_type: 'reps',
    default_reps: 12,
    default_sets: 3,
    unilateral: false,
    position: 'Deitado de costas com joelhos dobrados a 90° e pés apoiados no chão.',
    steps: [
      'Deite-se de costas com os pés na largura dos quadris, próximos aos glúteos.',
      'Passo 1 (Báscula): Gire a pelve para trás aplanando a curvatura lombar no colchonete.',
      'Passo 2 (Subida): Com o abdômen firme, contraia os glúteos e erga o quadril até formar uma linha reta entre ombros e joelhos.',
      'Sustente 2 segundos no ponto alto apertando bem os glúteos.',
      'Desça desenrolando a coluna vértebra por vértebra, encostando primeiro a parte alta das costas e por último o cóccix.'
    ],
    feel_cue: 'Glúteos firmemente contraídos e ausência de dor ou pressão nas costas.',
    caution: 'Não suba o quadril em excesso empurrando com a lombar; o movimento deve vir 100% dos glúteos.',
    breathing: 'Inspire embaixo, expire na subida apertando o abdômen e glúteos, e inspire na descida.'
  },
  {
    id: 'lumbar-twist-knees',
    title: 'Rotação Lombar Deitado (Torção Suave de Tronco)',
    region: 'lombar',
    region_label: 'Coluna & Lombar',
    clinical_objective: 'Mobilização passiva dos ligamentos e discos intervertebrais com relaxamento do quadrado lombar.',
    execution_type: 'duration',
    default_duration_seconds: 35,
    default_sets: 3,
    unilateral: true,
    position: 'Deitado de costas com braços abertos em cruz (formato em T).',
    steps: [
      'Deite-se de costas no solo com os braços estendidos nas laterais e palmas no chão.',
      'Flexione os joelhos e una os pés.',
      'Lentamente, deixe os dois joelhos caírem juntos para o lado direito em direção ao solo.',
      'Mantenha ambos os ombros e escápulas firmemente colados no chão.',
      'Vire a cabeça suavemente para o lado oposto (esquerdo) para completar a rotação suave da coluna.',
      'Sustente a postura respirando fundo e depois repita para o lado esquerdo.'
    ],
    feel_cue: 'Alongamento em espiral reconfortante ao longo do tronco, flanco lombar e quadril.',
    caution: 'Se os joelhos não tocarem o chão sem erguer o ombro, coloque uma almofada sob os joelhos para apoio.',
    breathing: 'Solte o ar longo e devagar para permitir que a musculatura das costas relaxe progressivamente.'
  },
  {
    id: 'childs-pose-decompression',
    title: 'Posição da Criança / Child\'s Pose (Descompressão)',
    region: 'lombar',
    region_label: 'Coluna & Lombar',
    clinical_objective: 'Alongamento axial da coluna vertebral, tração passiva das facetas articulares e alívio do estresse.',
    execution_type: 'duration',
    default_duration_seconds: 60,
    default_sets: 2,
    unilateral: false,
    position: 'Ajoelhado no colchonete com os joelhos ligeiramente afastados.',
    steps: [
      'Ajoelhe-se unindo os polegares dos pés e afastando os joelhos na largura do colchonete.',
      'Sente-se com o quadril apoiado nos calcanhares.',
      'Incline o tronco para a frente e deslize as duas mãos no chão o mais longe que conseguir à frente.',
      'Apoie a testa confortavelmente no colchonete e solte o peso dos ombros e do peito em direção ao chão.',
      'Mantenha a posição, respirando com a parte de trás das costelas.'
    ],
    feel_cue: 'Abertura espaçosa entre as vértebras lombares e alongamento das axilas e dorsais.',
    caution: 'Se tiver dor aguda nos joelhos, coloque uma toalha enrolada entre a panturrilha e a coxa para diminuir a flexão.',
    breathing: 'Inspire sentindo o ar expandir a parte de trás das costas e expire afundando no colchonete.'
  },
  {
    id: 'sphinx-mckenzie-extension',
    title: 'Extensão Suave de Tronco / Posição da Esfinge (Método McKenzie)',
    region: 'lombar',
    region_label: 'Coluna & Lombar',
    clinical_objective: 'Centralização de desvios discais posteriores (hérnias e protusões) e alívio de dor irradiada.',
    execution_type: 'duration',
    default_duration_seconds: 40,
    default_sets: 3,
    unilateral: false,
    position: 'Deitado de barriga para baixo no colchonete (decúbito ventral).',
    steps: [
      'Deite-se de bruços com as pernas estendidas e relaxadas.',
      'Apoie os cotovelos no chão diretamente sob a linha dos ombros, antebraços paralelos apontando para frente.',
      'Eleve o peito suavemente para cima mantendo a pelve e as pernas 100% relaxadas no chão.',
      'Mantenha o olhar para frente em um ponto neutro, sem forçar o pescoço para trás.',
      'Sustente a extensão sem contrair os glúteos.'
    ],
    feel_cue: 'Curvatura natural e suave na região lombar. Se a dor nas pernas diminuir e centralizar nas costas, o exercício está surtindo efeito positivo.',
    caution: 'Se a dor irradiar mais forte para a perna (periferização), interrompa imediatamente e procure orientação médica.',
    breathing: 'Respire suavemente permitindo que o abdômen expanda contra o chão a cada inspiração.'
  },
  {
    id: 'clamshell-hip-stability',
    title: 'Ostra / Clamshell Deitado de Lado',
    region: 'quadril',
    region_label: 'Quadril & Pernas',
    clinical_objective: 'Fortalecimento do glúteo médio e rotadores externos para estabilização femoropatelar e prevenção de valgo dinâmico.',
    execution_type: 'reps',
    default_reps: 15,
    default_sets: 3,
    unilateral: true,
    position: 'Deitado de lado com a cabeça apoiada no braço estendido.',
    steps: [
      'Deite-se de lado, dobre os joelhos a cerca de 90° e alinhe os calcanhares com o quadril.',
      'Mantenha os dois pés unidos o tempo todo.',
      'Abra o joelho de cima o máximo que conseguir sem girar a bacia ou o tronco para trás.',
      'Segure 1 segundo na abertura máxima e desça lentamente.',
      'Execute as repetições e depois inverta o lado.'
    ],
    feel_cue: 'Sensação de cansaço e queimação controlada na parte lateral/alta do glúteo.',
    caution: 'Não jogue o quadril para trás ao abrir o joelho; coloque a mão no osso da bacia para garantir que ela não se mova.',
    breathing: 'Expire ao abrir o joelho e inspire ao fechá-lo de forma controlada.'
  },
  {
    id: 'dead-bug-therapeutic',
    title: 'Dead Bug Terapêutico (Controle Motor Lombo-Pélvico)',
    region: 'lombar',
    region_label: 'Coluna & Lombar',
    clinical_objective: 'Fortalecimento do core profundo e controle da transição lombo-sacra em cadeia cinética aberta.',
    execution_type: 'reps',
    default_reps: 10,
    default_sets: 3,
    unilateral: true,
    position: 'Deitado de costas no colchonete.',
    steps: [
      'Deite-se de costas com os braços apontados para o teto e os joelhos flexionados a 90° suspensos no ar.',
      'Ative o abdômen e certifique-se de que a coluna lombar está tocando o chão sem espaço para passar a mão.',
      'Lentamente, estenda o braço direito para trás e a perna esquerda para frente e para baixo.',
      'Vá apenas até o ponto em que sua coluna consiga permanecer colada ao solo.',
      'Retorne à posição central e repita com o braço esquerdo e perna direita.'
    ],
    feel_cue: 'Grande ativação do músculo transverso abdominal e estabilidade total da coluna lombar.',
    caution: 'Se a lombar sair do chão, não estenda a perna tão longe; diminua a amplitude.',
    breathing: 'Expire ao estender os membros cruzados (mantendo o umbigo para dentro) e inspire ao retornar ao centro.'
  },
  {
    id: 'vmo-terminal-knee-extension',
    title: 'Extensão Terminal de Joelho com Rolo/Toalha (Isometria de VMO)',
    region: 'joelho',
    region_label: 'Joelhos & Pernas',
    clinical_objective: 'Ativação seletiva do vasto medial oblíquo (VMO) para centralização e rastreamento da patela.',
    execution_type: 'reps',
    default_reps: 10,
    default_sets: 3,
    unilateral: true,
    position: 'Sentado ou deitado com as pernas esticadas.',
    steps: [
      'Coloque uma toalha enrolada firme ou um mini rolo logo abaixo da fossa poplítea (atrás do joelho).',
      'Contraia a parte interna da coxa e pressione ativamente o joelho para baixo contra a toalha.',
      'Ao pressionar para baixo, o calcanhar irá se erguer alguns centímetros do solo com o joelho totalmente estendido.',
      'Mantenha a contração isométrica por 5 segundos inteiros.',
      'Relaxe suavemente por 2 segundos e repita.'
    ],
    feel_cue: 'Contração forte na porção interna da coxa (imediatamente acima e ao lado da patela).',
    caution: 'Não dê trancos no joelho; a pressão deve ser firme, progressiva e constante.',
    breathing: 'Expire durante os 5 segundos de sustentação isométrica e inspire no breve relaxamento.'
  },
  {
    id: 'codman-pendulum-shoulder',
    title: 'Pêndulo de Codman para Ombro',
    region: 'ombro',
    region_label: 'Ombros & Escápulas',
    clinical_objective: 'Mobilização decoaptativa da articulação glenoumeral sem ativação muscular defensiva.',
    execution_type: 'duration',
    default_duration_seconds: 60,
    default_sets: 2,
    unilateral: true,
    position: 'Em pé com o tronco inclinado à frente apoiando a mão sã numa mesa.',
    steps: [
      'Fique em pé ao lado de uma mesa ou encosto de cadeira firme.',
      'Apoie a mão do braço saudável e incline o tronco para frente a cerca de 60° a 90°.',
      'Deixe o braço lesionado ou dolorido pender completamente solto em direção ao chão, como um pêndulo.',
      'Mova o tronco suavemente em círculos pequenos, deixando que o peso do próprio braço crie o movimento balançante.',
      'Faça 30 segundos no sentido horário e 30 segundos no sentido anti-horário sem usar os músculos do ombro.'
    ],
    feel_cue: 'Sensação de tração suave, abertura e descompressão dentro da articulação do ombro.',
    caution: 'Não use a força muscular do braço para fazer o círculo; o movimento deve ser gerado pelo balanço do tronco.',
    breathing: 'Respiração profunda e ritmada, ajudando a musculatura do pescoço e ombro a se soltar.'
  },
  {
    id: 'shoulder-external-rotation-side',
    title: 'Rotação Externa de Ombro Deitado de Lado',
    region: 'ombro',
    region_label: 'Ombros & Escápulas',
    clinical_objective: 'Fortalecimento dos rotadores externos do manguito rotador (infraespinal e redondo menor).',
    execution_type: 'reps',
    default_reps: 12,
    default_sets: 3,
    unilateral: true,
    position: 'Deitado de lado com a cabeça apoiada.',
    steps: [
      'Deite-se sobre o lado não dolorido.',
      'Dobre o cotovelo do braço de cima a 90° e mantenha-o colado à lateral da costela (use uma pequena toalha enrolada entre o cotovelo e o corpo).',
      'Com o antebraço cruzando a barriga, gire o antebraço para cima em direção ao teto de forma controlada.',
      'Pare quando o antebraço estiver ligeiramente acima da linha horizontal e segure 1 segundo.',
      'Desça de maneira controlada até o abdômen e repita.'
    ],
    feel_cue: 'Ativação focada e precisa na parte posterior e externa do ombro.',
    caution: 'Não gire o tronco para trás para compensar a amplitude; o peito deve permanecer perpendicular ao chão.',
    breathing: 'Expire ao subir o antebraço e inspire na descida controlada.'
  },
  {
    id: 'wall-slide-scapular',
    title: 'Deslizamento Escapular na Parede (Wall Slide)',
    region: 'ombro',
    region_label: 'Ombros & Escápulas',
    clinical_objective: 'Ativação do serrátil anterior e trapézio inferior para reeducação do ritmo escapuloumeral.',
    execution_type: 'reps',
    default_reps: 10,
    default_sets: 3,
    unilateral: false,
    position: 'Em pé de costas para a parede.',
    steps: [
      'Fique em pé encostando o sacro, a coluna torácica e a parte de trás da cabeça na parede.',
      'Posicione os braços em formato de "W", com cotovelos e costas das mãos encostados na parede.',
      'Deslize os antebraços para cima pela parede até formar um "Y", mantendo o contato com a parede o máximo possível.',
      'No ponto mais alto, sinta as escápulas girarem suavemente para cima e para fora.',
      'Retorne lentamente à posição em "W" mantendo o abdômen firme.'
    ],
    feel_cue: 'Trabalho focado entre as escápulas e na lateral das costelas (serrátil anterior).',
    caution: 'Não empine o bumbum nem deixe a lombar descolar da parede ao erguer os braços.',
    breathing: 'Expire ao deslizar os braços para cima e inspire ao retornar à posição de W.'
  },
  {
    id: 'ankle-dorsiflexion-wall',
    title: 'Mobilidade de Tornozelo na Parede (Dorsiflexão)',
    region: 'joelho',
    region_label: 'Joelhos & Pernas',
    clinical_objective: 'Aumento da amplitude de dorsiflexão talocrural para redução de sobrecarga patelar e lombar.',
    execution_type: 'reps',
    default_reps: 12,
    default_sets: 3,
    unilateral: true,
    position: 'Em pé virado para a parede em posição de passada.',
    steps: [
      'Fique em pé de frente para a parede. Coloque o pé a cerca de 5 a 8 cm de distância do rodapé.',
      'O outro pé fica posicionado confortavelmente para trás.',
      'Mantenha as duas mãos na parede para equilíbrio.',
      'Projete o joelho da frente em linha reta em direção à parede até tocá-la, SEM tirar o calcanhar do chão.',
      'Sustente 1 segundo com o joelho na parede e retorne.',
      'Se o calcanhar não sair do chão com facilidade, afaste o pé mais 1 cm para trás.'
    ],
    feel_cue: 'Alongamento na panturrilha/Aquiles e pressão de mobilidade articular na frente do tornozelo.',
    caution: 'O calcanhar deve permanecer 100% apoiado no solo o tempo todo; não deixe o joelho cair para dentro.',
    breathing: 'Expire ao avançar o joelho para a parede e inspire ao retornar à posição inicial.'
  },
  {
    id: 'doorway-pectoral-stretch',
    title: 'Alongamento de Peitoral no Vão da Porta',
    region: 'cervical',
    region_label: 'Cervical & Postura',
    clinical_objective: 'Inibição e alongamento do peitoral menor para correção de postura cifótica e anteriorização de ombros.',
    execution_type: 'duration',
    default_duration_seconds: 40,
    default_sets: 3,
    unilateral: false,
    position: 'Em pé no batente de uma porta aberta.',
    steps: [
      'Posicione-se no centro do vão de uma porta aberta.',
      'Apoie os antebraços e cotovelos nos dois lados do batente em um ângulo de 90° (cotovelos na altura dos ombros).',
      'Dê um passo suave para a frente com uma das pernas até sentir uma abertura confortável no peito e ombros.',
      'Mantenha a cabeça alinhada com o queixo recolhido, sem deixar a cabeça projetar para frente.',
      'Sustente a postura com respiração profunda.'
    ],
    feel_cue: 'Abertura agradável na frente do peito e clavículas, aliviando o enrolamento dos ombros.',
    caution: 'Não arqueie a lombar para compensar o passo à frente; mantenha o tronco reto e vertical.',
    breathing: 'Inspire expandindo o tórax e solte o ar sentindo a musculatura peitoral se soltar.'
  },
  {
    id: 'neck-trapezius-stretch',
    title: 'Alongamento Suave de Trapézio e Cervical',
    region: 'cervical',
    region_label: 'Cervical & Postura',
    clinical_objective: 'Desativação de pontos-gatilho miofasciais no trapézio superior e alívio de cefaleias tensionais.',
    execution_type: 'duration',
    default_duration_seconds: 30,
    default_sets: 3,
    unilateral: true,
    position: 'Sentado com a postura ereta e coluna apoiada.',
    steps: [
      'Sente-se confortavelmente com as costas retas e ombros relaxados.',
      'Incline suavemente a cabeça para a direita, aproximando a orelha direita do ombro direito.',
      'Coloque a mão direita sobre o topo da cabeça, permitindo que apenas o peso natural da mão aprofunde o alongamento (não puxe com força).',
      'O braço esquerdo deve ficar relaxado apontando para o solo ou apoiado sob a coxa.',
      'Sustente por 30 segundos, retorne devagar ao centro e execute para o lado esquerdo.'
    ],
    feel_cue: 'Alongamento suave e reconfortante descendo pela lateral do pescoço até o topo do ombro.',
    caution: 'Nunca puxe a cabeça com força. Se sentir tontura ou dor aguda irradiada pelo braço, pare.',
    breathing: 'Respire devagar e solte o ar pelas narinas ou boca, relaxando as mandíbulas e dentes.'
  },
  {
    id: 'kneeling-hip-flexor-psoas',
    title: 'Alongamento de Psoas e Flexores de Quadril',
    region: 'quadril',
    region_label: 'Quadril & Pernas',
    clinical_objective: 'Alongamento do iliopsoas encurtado por longos períodos na posição sentada, reduzindo hiperlordose lombar.',
    execution_type: 'duration',
    default_duration_seconds: 40,
    default_sets: 3,
    unilateral: true,
    position: 'Posição semi-ajoelhada (um joelho no chão e outro pé à frente).',
    steps: [
      'Ajoelhe-se com um joelho no colchonete e o outro pé à frente com o joelho dobrado a 90° (posição de cavaleiro).',
      'Contraia o glúteo da perna de trás e gire o quadril levemente para dentro (retroversão pélvica).',
      'Com o tronco totalmente ereto, projete o quadril alguns centímetros para a frente até sentir alongar a parte frontal do quadril.',
      'Você pode elevar o braço do mesmo lado da perna de trás em direção ao teto para intensificar suavemente.',
      'Sustente a posição e depois troque de perna.'
    ],
    feel_cue: 'Alongamento focado na dobra frontal da coxa e virilha da perna de trás.',
    caution: 'Não incline o tronco para trás arqueando a coluna lombar; o movimento deve ser pélvico.',
    breathing: 'Mantenha a respiração estável, expirando ao projetar o quadril levemente à frente.'
  },
  {
    id: 'pelvic-tilt-supine',
    title: 'Báscula Pélvica Isolada (Pelvic Tilt Deitado)',
    region: 'lombar',
    region_label: 'Coluna & Lombar',
    clinical_objective: 'Consciência corporal lombo-pélvica, alívio de espasmos nos eretores da espinha e ativação do transverso.',
    execution_type: 'reps',
    default_reps: 15,
    default_sets: 2,
    unilateral: false,
    position: 'Deitado de costas com joelhos flexionados.',
    steps: [
      'Deite-se de costas com joelhos dobrados e pés apoiados no chão.',
      'Coloque as pontas dos dedos sobre os ossos da bacia.',
      'Retroversão: Ao soltar o ar, contraia o abdômen e esmague a coluna lombar contra o solo (eliminando todo o espaço embaixo das costas).',
      'Anteversão: Ao inspirar, relaxe e arqueie ligeiramente a lombar, criando um pequeno vão entre a coluna e o chão.',
      'Alterne suavemente entre as duas posições de forma rítmica.'
    ],
    feel_cue: 'Sensação de controle e massagem suave no cóccix e sacro.',
    caution: 'O movimento é suave e sutil; não tire o quadril do solo.',
    breathing: 'Solte o ar ao colar a lombar no chão e inspire ao arquear suavemente.'
  }
];

export const PHYSIOTHERAPY_PROTOCOLS: PhysiotherapyProtocol[] = [
  {
    id: 'proto-lumbar-sciatica',
    title: 'Descompressão Lombar & Alívio Ciático',
    subtitle: 'Protocolo de alívio rápido para crises de dor lombar, rigidez matinal e pinçamento ciático.',
    estimated_minutes: 10,
    target_region: 'Coluna Lombar & Quadril',
    description: 'Sequência clínica de descompressão por gravidade, mobilidade segmentar e relaxamento miofascial do piriforme.',
    exercises: [
      { exercise_id: 'knee-to-chest-double', sets: 2, duration_seconds: 45, notes: 'Foque em aplanar a lombar no chão.' },
      { exercise_id: 'knee-to-chest-single', sets: 2, duration_seconds: 30, notes: 'Faça em ambas as pernas com calma.' },
      { exercise_id: 'piriformis-figure-4', sets: 2, duration_seconds: 35, notes: 'Alívio do nervo ciático.' },
      { exercise_id: 'lumbar-twist-knees', sets: 2, duration_seconds: 35, notes: 'Torção suave com ombros apoiados.' },
      { exercise_id: 'childs-pose-decompression', sets: 2, duration_seconds: 60, notes: 'Solte todo o peso do tronco à frente.' },
      { exercise_id: 'sphinx-mckenzie-extension', sets: 2, duration_seconds: 35, notes: 'Extensão suave para centralizar o disco.' }
    ]
  },
  {
    id: 'proto-legs-90-l-decompression',
    title: 'Pernas em L & Descompressão Posterior',
    subtitle: 'Foco exclusivo nos exercícios terapêuticos a 90 graus com pernas elevadas em L.',
    estimated_minutes: 12,
    target_region: 'Cadeia Posterior & Lombar',
    description: 'Alongamento neural, drenagem circulatória e descompressão das vértebras lombares com elevação de pernas em 90°.',
    exercises: [
      { exercise_id: 'legs-up-the-wall-90', sets: 1, duration_seconds: 180, notes: 'Pernas verticais na parede em L; respire profundamente.' },
      { exercise_id: 'hamstring-stretch-band-90', sets: 2, duration_seconds: 40, notes: 'Alongamento de isquiotibiais a 90° com faixa.' },
      { exercise_id: 'straight-leg-raise-90', sets: 2, reps: 10, notes: 'Elevação controlada até formar 90 graus com o corpo.' },
      { exercise_id: 'knee-to-chest-single', sets: 2, duration_seconds: 30, notes: 'Abrace a perna de encontro à barriga.' },
      { exercise_id: 'pelvic-tilt-supine', sets: 2, reps: 15, notes: 'Báscula pélvica aplanando a lombar.' }
    ]
  },
  {
    id: 'proto-knees-and-hips',
    title: 'Joelhos Estáveis & Fortalecimento de Quadril',
    subtitle: 'Prevenção de dor patelar, fortalecimento do vasto medial e estabilização de pelve.',
    estimated_minutes: 14,
    target_region: 'Joelhos & Quadril',
    description: 'Exercícios terapêuticos sem impacto para condromalácia, tendinite patelar e fraqueza de glúteo médio.',
    exercises: [
      { exercise_id: 'vmo-terminal-knee-extension', sets: 3, reps: 10, notes: 'Sustente 5s pressionando o rolo sob o joelho.' },
      { exercise_id: 'clamshell-hip-stability', sets: 3, reps: 12, notes: 'Ostra deitado sem girar o quadril.' },
      { exercise_id: 'glute-bridge-pelvic-tilt', sets: 3, reps: 12, notes: 'Ponte de glúteo com báscula inicial.' },
      { exercise_id: 'ankle-dorsiflexion-wall', sets: 2, reps: 12, notes: 'Mobilidade de tornozelo na parede sem tirar o calcanhar.' },
      { exercise_id: 'kneeling-hip-flexor-psoas', sets: 2, duration_seconds: 35, notes: 'Alongamento do flexor de quadril/psoas.' }
    ]
  },
  {
    id: 'proto-posture-and-shoulders',
    title: 'Postura, Ombros & Coluna Torácica',
    subtitle: 'Correção de ombros caídos para frente, rigidez torácica e alívio do manguito rotador.',
    estimated_minutes: 11,
    target_region: 'Ombros, Escápulas & Cervical',
    description: 'Sequência terapêutica para abertura torácica, descompressão glenoumeral e reposicionamento das escápulas.',
    exercises: [
      { exercise_id: 'wall-slide-scapular', sets: 3, reps: 10, notes: 'Deslize os braços em W para Y encostado na parede.' },
      { exercise_id: 'codman-pendulum-shoulder', sets: 2, duration_seconds: 60, notes: 'Balanço pendular livre pelo peso do braço.' },
      { exercise_id: 'shoulder-external-rotation-side', sets: 2, reps: 12, notes: 'Rotação externa com cotovelo apoiado.' },
      { exercise_id: 'doorway-pectoral-stretch', sets: 2, duration_seconds: 40, notes: 'Alongamento de peitoral no batente da porta.' },
      { exercise_id: 'cat-cow-mobility', sets: 2, reps: 10, notes: 'Gato-camelo para soltar a coluna torácica.' },
      { exercise_id: 'neck-trapezius-stretch', sets: 2, duration_seconds: 30, notes: 'Alongamento suave sem forçar o pescoço.' }
    ]
  }
];
