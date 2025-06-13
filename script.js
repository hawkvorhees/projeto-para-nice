// script.js

const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const messageContainer = document.getElementById('messageContainer');
const messageSpan = document.getElementById('message');
const backgroundMusic = document.getElementById('backgroundMusic');
const initialImage = document.getElementById('initialImage'); // Referência à imagem inicial

// Variáveis para as cores do coração
const originalGlowColor = '#e080e0'; // Rosa meio roxo original
const newHeartColor = '#660000'; // Nova cor do coração (ciano, você pode mudar)
let heartColorChangeTimeout; // Para limpar o timeout se a animação for reiniciada
// REMOVIDO: let heartBlurTimeout; // Não precisamos mais desta variável

// Configurações do Canvas
let animationFrameId; // Para controlar o requestAnimationFrame
let isAnimating = false;
let messageSpans = []; // Array para guardar as referências aos spans de palavras

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight; // Canvas agora ocupa a altura total da tela
}

// Redimensiona o canvas ao carregar a página e ao redimensionar o janela
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// --- Configurações das Partículas ---
const numParticles = 1000; // Aumente ou diminua para mais/menos partículas
const particles = [];
const heartPoints = []; // Armazenará os pontos para formar o coração

const particleConfig = {
    explosionSpeed: 8, // Velocidade inicial da explosão
    gravity: 0.2,       // Gravidade reduzida - Partículas caem mais devagar
    friction: 0.96,     // Atrito ligeiramente reduzido - Partículas se movem mais longe
    formSpeed: 0.015,    // Velocidade com que as partículas se movem para formar o coração
    maxRadius: 3,     // Raio máximo da partícula (ligeiramente maior para o glow)
    minRadius: 1.2,     // Raio mínimo da partícula
    glowColor: originalGlowColor, // A cor inicial do glow agora é a original
    glowBlur: 8,        // Intensidade do glow
    explosionDuration: 300, // Tempo no estado de explosão
    fadeSpeed: 0.002,   // Fade out mais lento durante a explosão
    jiggleAmplitude: 2,   // Amplitude do movimento sutil no coração (ajuste para mais/menos balanço)
    jiggleFrequency: 0.005 // Frequência do movimento sutil (ajuste para mais/menos velocidade)
};

// --- Classe da Partícula ---
class Particle {
    constructor(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.radius = Math.random() * (particleConfig.maxRadius - particleConfig.minRadius) + particleConfig.minRadius;
        this.color = particleConfig.glowColor; // Cor inicial da partícula é a cor atual do coração

        // Propriedades para a fase de explosão
        this.vx = (Math.random() - 0.5) * particleConfig.explosionSpeed;
        this.vy = (Math.random() - 0.5) * particleConfig.explosionSpeed;
        this.alpha = 1; // Opacidade
        this.life = particleConfig.explosionDuration; // Tempo de vida da explosão
        this.isExploding = true; // Estado inicial

        // Propriedades para a fase de formação
        this.ease = 0.05 + Math.random() * 0.05; // Pequena variação na velocidade de agrupamento
        this.jiggleOffset = Math.random() * Math.PI * 2; // Offset inicial para o jiggle
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.shadowColor = particleConfig.glowColor; // Usa a cor atual do coração para o glow
        ctx.shadowBlur = particleConfig.glowBlur;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        if (this.isExploding) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += particleConfig.gravity; // Aplica gravidade
            this.vx *= particleConfig.friction; // Aplica atrito
            this.vy *= particleConfig.friction;
            this.life--;
            this.alpha -= particleConfig.fadeSpeed; // Fade out mais lento
            if (this.life <= 0 || this.alpha <= 0.1) { // Quando a explosão quase sumir, muda para a fase de formação
                this.isExploding = false;
                this.alpha = 1; // Reseta a opacidade para a fase de formação
            }
        } else {
            // Movimento em direção ao ponto alvo do coração
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0.5) { // Se não chegou no alvo, move
                this.x += dx * particleConfig.formSpeed;
                this.y += dy * particleConfig.formSpeed;
                // Atualiza a cor da partícula individualmente se a cor global do coração mudou
                if (this.color !== particleConfig.glowColor) {
                    this.color = particleConfig.glowColor; // Partículas que estão se movendo adotam a nova cor
                }
            } else {
                // Chegou no alvo, aplica o movimento sutil e garante a cor atual do coração
                this.x = this.targetX + Math.sin(performance.now() * particleConfig.jiggleFrequency + this.jiggleOffset) * particleConfig.jiggleAmplitude;
                this.y = this.targetY + Math.cos(performance.now() * particleConfig.jiggleFrequency + this.jiggleOffset) * particleConfig.jiggleAmplitude;
                if (this.color !== particleConfig.glowColor) {
                    this.color = particleConfig.glowColor; // Partículas paradas também adotam a nova cor
                }
            }
        }
    }
}

// --- Função para gerar os pontos do coração (usando uma equação paramétrica) ---
function generateHeartPoints() {
    heartPoints.length = 0; // Limpa pontos anteriores
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = Math.min(canvas.width, canvas.height) * 0.18; // Ajusta o tamanho do coração

    for (let i = 0; i < numParticles; i++) {
        // Parametrização da curva do coração
        const t = Math.random() * (Math.PI * 2); // Ângulo aleatório
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

        heartPoints.push({
            x: centerX + x * scale * 0.08, // Ajuste para centralizar e dimensionar
            y: centerY - y * scale * 0.08  // Y invertido para ficar na orientação correta
        });
    }

    // Embaralha os pontos para que as partículas aleatórias caiam em posições aleatórias do coração
    for (let i = heartPoints.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        ([heartPoints[i], heartPoints[j]] = [heartPoints[j], heartPoints[i]]);
    }
}

// --- Inicializa as Partículas ---
function initParticles() {
    // Garante que a cor original do coração seja usada ao inicializar
    particleConfig.glowColor = originalGlowColor;
    generateHeartPoints();
    for (let i = 0; i < numParticles; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        const targetPoint = heartPoints[i % heartPoints.length];
        particles.push(new Particle(startX, startY, targetPoint.x, targetPoint.y));
    }
}

// --- Função para mudar a cor do coração (sem desfoque) ---
function changeHeartColor() {
    console.log("Efeito de mudança de cor ativado!");
    // Altera a cor global do coração para todas as partículas
    particleConfig.glowColor = newHeartColor;

    // REMOVIDO: Não há mais aplicação de classe de desfoque
}


// --- Função de Animação Principal ---
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas a cada frame

    let allParticlesFormed = true;

    particles.forEach((particle) => {
        particle.update();
        particle.draw();
        if (
            particle.isExploding ||
            Math.abs(particle.x - particle.targetX) > particleConfig.jiggleAmplitude * 2 || // Aumentei a tolerância para considerar formado
            Math.abs(particle.y - particle.targetY) > particleConfig.jiggleAmplitude * 2
        ) {
            allParticlesFormed = false; // Se alguma partícula ainda não chegou ao destino ou está explodindo
        }
    });

    if (allParticlesFormed && !messageContainer.classList.contains('visible')) {
        console.log('Coração formado!');
        showMessage(`Esse é meu jeito de dizer: \nEu te amo!`);
    }

    if (isAnimating) {
        animationFrameId = requestAnimationFrame(animate);
    }
}

// Função auxiliar para normalizar texto (remover pontuação e minúsculas)
function normalizeText(text) {
    return text.replace(/[.,!?;:]/g, '').toLowerCase();
}

// --- Exibe a Mensagem Palavra por Palavra ---
function showMessage(fullMessage) {
    const words = fullMessage.split(/\s+/); // Usa split(/\s+/) para robustez com múltiplos espaços
    let currentWordIndex = 0;
    messageSpan.innerHTML = ''; // Limpa qualquer texto anterior
    messageSpans = []; // Limpa o array de spans
    messageContainer.classList.add('visible'); // Torna o contêiner da mensagem visível

    function displayNextWord() {
        if (currentWordIndex < words.length) {
            const word = words[currentWordIndex];
            const span = document.createElement('span');
            span.textContent = word; // Apenas a palavra
            messageSpans.push(span); // Armazena a referência ao span

            messageSpan.appendChild(span);

            // Adiciona um espaço apenas se não for a última palavra
            if (currentWordIndex < words.length - 1) {
                const spaceNode = document.createTextNode(' ');
                messageSpan.appendChild(spaceNode);
            }

            // Força o reflow para a transição funcionar em navegadores modernos
            void span.offsetWidth;

            span.classList.add('visible');
            currentWordIndex++;
            setTimeout(displayNextWord, 400); // Tempo entre as palavras (ajuste)
        } else {
            // Quando todas as palavras aparecerem, mude a cor de "eu te amo"
            const targetPhraseNormalized = ["eu", "te", "amo"]; 

            setTimeout(() => {
                console.log("DEBUG DE COR (após delay final): Tentando destacar 'eu te amo'. Total spans capturados:", messageSpans.length);
                console.log("DEBUG DE COR (conteúdo dos spans no array):", messageSpans.map(s => `"${s.textContent}"`));

                let startIndex = -1;
                for (let i = 0; i <= messageSpans.length - targetPhraseNormalized.length; i++) {
                    const currentSpan = messageSpans[i];
                    if (!currentSpan) continue;

                    let match = true;
                    for (let j = 0; j < targetPhraseNormalized.length; j++) {
                        const wordToCheckSpan = messageSpans[i + j];
                        if (!wordToCheckSpan || normalizeText(wordToCheckSpan.textContent) !== targetPhraseNormalized[j]) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        startIndex = i;
                        break;
                    }
                }

                if (startIndex !== -1) {
                    console.log(`DEBUG DE COR: Sequência 'eu te amo' encontrada a partir do índice ${startIndex}.`);
                    for (let k = 0; k < targetPhraseNormalized.length; k++) {
                        const spanToHighlight = messageSpans[startIndex + k];
                        if (spanToHighlight) {
                            spanToHighlight.classList.add('highlight-red');
                            console.log(`DEBUG DE COR: 'highlight-red' adicionada a '${spanToHighlight.textContent}'. Classe aplicada: ${spanToHighlight.classList.contains('highlight-red')}`);
                        }
                    }
                } else {
                    console.error("DEBUG DE COR: A sequência 'eu te amo' (normalizada) não foi encontrada nos spans da mensagem. Verifique a frase exata em showMessage().");
                }
            }, 2000); // ATRASO DE 2 SEGUNDOS para o destaque
        }
    }

    // Inicia a exibição das palavras após um pequeno delay
    setTimeout(displayNextWord, 1000);
}

// --- Evento do Botão Iniciar ---
startButton.addEventListener('click', () => {
    startButton.style.display = 'none'; // Esconde o botão
    initialImage.classList.add('hidden-image'); // Esconde a imagem inicial

    // Inicia a música de fundo
    if (backgroundMusic) {
        backgroundMusic.volume = 0.3; // Define o volume (0.0 a 1.0)
        backgroundMusic.play().catch(error => {
            console.error("Erro ao tentar tocar a música:", error);
        });
    }

    // Define o timeout para a mudança de cor após 42 segundos
    heartColorChangeTimeout = setTimeout(changeHeartColor, 42000); // 42 segundos

    // Se já estiver animando, para a animação atual para reiniciar
    if (isAnimating) {
        cancelAnimationFrame(animationFrameId);
        isAnimating = false;
        particles.length = 0; // Limpa as partículas
        messageContainer.classList.remove('visible');
        messageSpan.innerHTML = '';
        messageSpans = []; // Limpa o array de spans
        // Garante que o timeout anterior seja limpo ao reiniciar
        clearTimeout(heartColorChangeTimeout);
        // REMOVIDO: clearTimeout(heartBlurTimeout); // Não precisamos mais deste timeout
        // REMOVIDO: canvas.classList.remove('blurred-heart'); // Não aplicamos mais desfoque
    }

    initParticles(); // Inicializa novas partículas
    isAnimating = true;
    animate(); // Começa a animação
});

// Opcional: para reiniciar a animação ao clicar no canvas depois de formada
canvas.addEventListener('click', () => {
    if (!isAnimating && messageContainer.classList.contains('visible')) {
        messageContainer.classList.remove('visible');
        messageSpan.innerHTML = ''; // Limpa a mensagem
        messageSpans = []; // Limpa o array de spans
        startButton.style.display = 'block'; // Mostra o botão novamente
        initialImage.classList.remove('hidden-image'); // Mostra a imagem inicial novamente
        // Opcional: para a música ao reiniciar
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0; // Volta para o início
        }
        // Limpar timeouts e classes ao reiniciar
        clearTimeout(heartColorChangeTimeout);
        // REMOVIDO: clearTimeout(heartBlurTimeout); // Não precisamos mais deste timeout
        // REMOVIDO: canvas.classList.remove('blurred-heart'); // Não aplicamos mais desfoque
        // Limpar as partículas e reiniciar o estado para uma nova animação
        particles.length = 0;
        // Resetar a cor do coração para a original quando reiniciar
        particleConfig.glowColor = originalGlowColor;
    }
});
