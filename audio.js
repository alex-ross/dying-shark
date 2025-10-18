class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.music = null;
        this.isMuted = false;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
            this.initialized = true;
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    createSounds() {
        if (!this.audioContext) return;

        // Jump/swim sound - short whoosh
        this.sounds.jump = () => {
            if (this.isMuted) return;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };

        // Score sound - pleasant ding
        this.sounds.score = () => {
            if (this.isMuted) return;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };

        // Death sound - dramatic crash
        this.sounds.death = () => {
            if (this.isMuted) return;
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);

            gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);
        };
    }

    createBackgroundMusic() {
        if (!this.audioContext || this.isMuted) return;

        // Ensure audio context is running
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Simple ocean-themed melody
        const notes = [
            { freq: 220, duration: 0.5 }, // A3
            { freq: 246.94, duration: 0.5 }, // B3
            { freq: 261.63, duration: 0.5 }, // C4
            { freq: 293.66, duration: 0.5 }, // D4
            { freq: 329.63, duration: 0.5 }, // E4
            { freq: 349.23, duration: 0.5 }, // F4
            { freq: 392.00, duration: 0.5 }, // G4
            { freq: 440.00, duration: 1.0 }, // A4
        ];

        let currentTime = this.audioContext.currentTime;

        notes.forEach(note => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(note.freq, currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + note.duration);

            oscillator.start(currentTime);
            oscillator.stop(currentTime + note.duration);

            currentTime += note.duration;
        });

        // Loop the melody
        setTimeout(() => {
            if (!this.isMuted) {
                this.createBackgroundMusic();
            }
        }, currentTime * 1000);
    }

    playSound(soundName) {
        if (this.isMuted) return;

        if (this.sounds[soundName] && this.audioContext) {
            try {
                // Ensure audio context is running
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                this.sounds[soundName]();
            } catch (error) {
                console.warn('Audio playback failed:', error);
            }
        }
    }

    startMusic() {
        if (!this.isMuted && this.audioContext) {
            // Ensure audio context is running
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.createBackgroundMusic();
        }
    }

    stopMusic() {
        // Music will stop naturally when muted
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        return this.isMuted;
    }

    // Handle mobile autoplay policy
    async enableAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
}

// Global audio manager instance
const audioManager = new AudioManager();
