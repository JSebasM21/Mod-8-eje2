class ContadorPro {
    constructor() {
        // Estado inicial
        this.contador = 0;
        this.minLimit = -100;
        this.maxLimit = 100;
        this.changeCount = 0;
        this.historial = [];
        this.stats = {
            sessionChanges: 0,
            minValue: 0,
            maxValue: 0,
            totalOperations: 0
        };
        
        // Configuración
        this.config = {
            soundEnabled: true,
            animationsEnabled: true,
            notificationsEnabled: true,
            autoSaveEnabled: true,
            maxHistoryItems: 50
        };
        
        // Elementos DOM
        this.contadorElement = document.getElementById('contador');
        this.mensajeElement = document.getElementById('mensaje');
        this.historialList = document.getElementById('historialList');
        this.statusIndicator = document.getElementById('statusIndicator');
        
        // Audio
        this.clickSound = document.getElementById('clickSound');
        this.errorSound = document.getElementById('errorSound');
        this.successSound = document.getElementById('successSound');
        
        this.initialize();
    }

    initialize() {
        this.cargarDesdeLocalStorage();
        this.setupEventListeners();
        this.actualizarDisplay();
        this.actualizarHistorial();
        this.actualizarStats();
        this.actualizarHora();
        
        // Actualizar hora cada segundo
        setInterval(() => this.actualizarHora(), 1000);
        
        // Auto-guardar cada 30 segundos
        setInterval(() => this.guardarEnLocalStorage(), 30000);
        
        console.log('🎮 Contador Pro inicializado');
        this.mostrarNotificacion('Contador Pro listo', 'success');
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('btnIncrementar').addEventListener('click', () => this.cambiarValor(1));
        document.getElementById('btnDecrementar').addEventListener('click', () => this.cambiarValor(-1));
        document.getElementById('btnIncrementar10').addEventListener('click', () => this.cambiarValor(10));
        document.getElementById('btnDecrementar10').addEventListener('click', () => this.cambiarValor(-10));
        document.getElementById('btnResetear').addEventListener('click', () => this.resetear());

        // Botones rápidos
        document.querySelectorAll('.btn-quick').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = parseInt(e.currentTarget.dataset.value);
                this.cambiarValor(value);
            });
        });

        // Entrada manual
        document.getElementById('btnSetValue').addEventListener('click', () => this.establecerValorManual());
        document.getElementById('inputManual').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.establecerValorManual();
        });

        // Límites
        document.getElementById('btnApplyLimits').addEventListener('click', () => this.aplicarLimites());

        // Historial
        document.getElementById('btnClearHistory').addEventListener('click', () => this.limpiarHistorial());
        document.getElementById('btnExportHistory').addEventListener('click', () => this.exportarHistorial());

        // Configuración
        document.getElementById('soundToggle').addEventListener('change', (e) => this.toggleSound(e.target.checked));
        document.getElementById('animationsToggle').addEventListener('change', (e) => this.toggleAnimations(e.target.checked));
        document.getElementById('notificationsToggle').addEventListener('change', (e) => this.toggleNotifications(e.target.checked));
        document.getElementById('autoSaveToggle').addEventListener('change', (e) => this.toggleAutoSave(e.target.checked));

        // Atajos de teclado
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    cambiarValor(cantidad) {
        const nuevoValor = this.contador + cantidad;
        
        // Validar límites
        if (nuevoValor < this.minLimit) {
            this.mostrarError(`No se puede decrementar. Mínimo: ${this.minLimit}`);
            return;
        }
        
        if (nuevoValor > this.maxLimit) {
            this.mostrarError(`No se puede incrementar. Máximo: ${this.maxLimit}`);
            return;
        }
        
        // Validar valor numérico
        if (isNaN(nuevoValor) || !isFinite(nuevoValor)) {
            this.mostrarError('Valor no válido');
            return;
        }
        
        // Actualizar estadísticas
        this.stats.sessionChanges++;
        this.stats.totalOperations++;
        
        if (nuevoValor > this.stats.maxValue) this.stats.maxValue = nuevoValor;
        if (nuevoValor < this.stats.minValue) this.stats.minValue = nuevoValor;
        
        // Guardar en historial
        this.agregarAlHistorial({
            valorAnterior: this.contador,
            valorNuevo: nuevoValor,
            cambio: cantidad,
            timestamp: new Date()
        });
        
        // Actualizar contador
        this.contador = nuevoValor;
        this.changeCount++;
        
        // Efectos
        this.playSound('click');
        this.animarCambio(cantidad);
        this.actualizarDisplay();
        this.actualizarStats();
        
        if (this.config.autoSaveEnabled) {
            this.guardarEnLocalStorage();
        }
    }

    establecerValorManual() {
        const input = document.getElementById('inputManual');
        const valor = parseInt(input.value);
        
        if (isNaN(valor)) {
            this.mostrarError('Por favor, ingresa un número válido');
            input.focus();
            return;
        }
        
        if (valor < this.minLimit || valor > this.maxLimit) {
            this.mostrarError(`El valor debe estar entre ${this.minLimit} y ${this.maxLimit}`);
            return;
        }
        
        const cambio = valor - this.contador;
        this.cambiarValor(cambio);
        input.value = '';
        input.focus();
        
        this.mostrarNotificacion(`Valor establecido a ${valor}`, 'success');
    }

    resetear() {
        if (this.contador === 0) return;
        
        this.agregarAlHistorial({
            valorAnterior: this.contador,
            valorNuevo: 0,
            cambio: -this.contador,
            timestamp: new Date(),
            esReset: true
        });
        
        this.contador = 0;
        this.playSound('success');
        this.actualizarDisplay();
        this.mostrarNotificacion('Contador reseteado a cero', 'info');
    }

    aplicarLimites() {
        const minInput = document.getElementById('minLimit');
        const maxInput = document.getElementById('maxLimit');
        
        const nuevoMin = parseInt(minInput.value);
        const nuevoMax = parseInt(maxInput.value);
        
        // Validaciones
        if (isNaN(nuevoMin) || isNaN(nuevoMax)) {
            this.mostrarError('Los límites deben ser números válidos');
            return;
        }
        
        if (nuevoMin >= nuevoMax) {
            this.mostrarError('El límite mínimo debe ser menor que el máximo');
            return;
        }
        
        if (Math.abs(nuevoMax - nuevoMin) > 1000000) {
            this.mostrarError('El rango entre límites es demasiado grande');
            return;
        }
        
        // Verificar si el valor actual está dentro de los nuevos límites
        if (this.contador < nuevoMin || this.contador > nuevoMax) {
            this.mostrarError(`El valor actual (${this.contador}) está fuera de los nuevos límites`);
            return;
        }
        
        this.minLimit = nuevoMin;
        this.maxLimit = nuevoMax;
        
        this.actualizarDisplay();
        this.mostrarNotificacion(`Límites actualizados: ${nuevoMin} a ${nuevoMax}`, 'success');
        
        // Actualizar información de límites
        document.getElementById('limitsInfo').innerHTML = 
            `<i class="fas fa-check-circle"></i> Límites aplicados correctamente`;
    }

    agregarAlHistorial(data) {
        const historialItem = {
            id: Date.now(),
            valor: data.valorNuevo,
            cambio: data.cambio,
            timestamp: data.timestamp.toLocaleTimeString(),
            fecha: data.timestamp.toLocaleDateString(),
            esReset: data.esReset || false
        };
        
        this.historial.unshift(historialItem);
        
        // Limitar tamaño del historial
        if (this.historial.length > this.config.maxHistoryItems) {
            this.historial.pop();
        }
        
        this.actualizarHistorial();
    }

    actualizarDisplay() {
        // Actualizar número
        this.contadorElement.textContent = this.contador;
        
        // Aplicar clases según el valor
        this.contadorElement.classList.remove('positivo', 'negativo', 'cero');
        
        if (this.contador > 0) {
            this.contadorElement.classList.add('positivo');
            this.mensajeElement.innerHTML = `El contador está en <strong>positivo</strong> (+${this.contador})`;
        } else if (this.contador < 0) {
            this.contadorElement.classList.add('negativo');
            this.mensajeElement.innerHTML = `El contador está en <strong>negativo</strong> (${this.contador})`;
        } else {
            this.contadorElement.classList.add('cero');
            this.mensajeElement.innerHTML = 'El contador está en <strong>cero</strong>';
        }
        
        // Actualizar indicador de estado
        this.actualizarStatusIndicator();
        
        // Actualizar límites actuales
        document.getElementById('currentLimits').textContent = 
            `${this.minLimit} a ${this.maxLimit}`;
    }

    actualizarStatusIndicator() {
        const indicator = this.statusIndicator;
        const porcentaje = ((this.contador - this.minLimit) / (this.maxLimit - this.minLimit)) * 100;
        
        // Remover clases previas
        indicator.classList.remove('error', 'warning');
        
        if (this.contador === this.minLimit || this.contador === this.maxLimit) {
            // En límite
            indicator.className = 'status-indicator warning';
            indicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> En límite';
            this.mostrarNotificacion('¡Cuidado! Has alcanzado un límite', 'warning');
        } else if (porcentaje > 90 || porcentaje < 10) {
            // Cerca del límite
            indicator.className = 'status-indicator warning';
            indicator.innerHTML = '<i class="fas fa-exclamation-circle"></i> Cerca del límite';
        } else {
            // Normal
            indicator.className = 'status-indicator';
            indicator.innerHTML = '<i class="fas fa-check-circle"></i> Normal';
        }
    }

    actualizarHistorial() {
        const list = this.historialList;
        list.innerHTML = '';
        
        this.historial.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item fade-in';
            
            const cambioClass = item.cambio > 0 ? 'positive' : 'negative';
            const cambioSign = item.cambio > 0 ? '+' : '';
            
            div.innerHTML = `
                <div>
                    <span class="history-value">${item.valor}</span>
                    <span class="history-change ${cambioClass}">
                        ${cambioSign}${item.cambio}
                    </span>
                </div>
                <div class="history-time">
                    ${item.timestamp}
                </div>
            `;
            
            list.appendChild(div);
        });
        
        // Actualizar contador de historial
        document.getElementById('historialCount').textContent = this.historial.length;
    }

    actualizarStats() {
        document.getElementById('sesionCount').textContent = this.stats.sessionChanges;
        document.getElementById('changeCount').textContent = this.changeCount;
        document.getElementById('minValue').textContent = this.stats.minValue;
        document.getElementById('maxValue').textContent = this.stats.maxValue;
    }

    actualizarHora() {
        const ahora = new Date();
        const hora = ahora.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('displayTime').textContent = hora;
        document.getElementById('currentDate').textContent = ahora.toLocaleDateString('es-ES');
    }

    limpiarHistorial() {
        if (this.historial.length === 0) return;
        
        if (confirm('¿Estás seguro de que quieres limpiar el historial?')) {
            this.historial = [];
            this.actualizarHistorial();
            this.mostrarNotificacion('Historial limpiado', 'info');
        }
    }

    exportarHistorial() {
        if (this.historial.length === 0) {
            this.mostrarNotificacion('No hay historial para exportar', 'warning');
            return;
        }
        
        const datos = {
            fechaExportacion: new Date().toISOString(),
            contadorActual: this.contador,
            totalCambios: this.changeCount,
            historial: this.historial
        };
        
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contador-historial-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.mostrarNotificacion('Historial exportado', 'success');
    }

    // Sistema de sonidos
    playSound(type) {
        if (!this.config.soundEnabled) return;
        
        try {
            const sound = {
                click: this.clickSound,
                error: this.errorSound,
                success: this.successSound
            }[type];
            
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => console.log('Error reproduciendo sonido:', e));
            }
        } catch (e) {
            console.log('Error en sistema de sonido:', e);
        }
    }

    // Sistema de notificaciones
    mostrarNotificacion(mensaje, tipo = 'info') {
        if (!this.config.notificationsEnabled) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.innerHTML = `
            <div class="toast-content">
                <strong>${tipo.toUpperCase()}:</strong> ${mensaje}
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        const container = document.querySelector('.toast-container') || this.crearToastContainer();
        container.appendChild(toast);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            toast.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Botón de cerrar
        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    }

    crearToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    mostrarError(mensaje) {
        this.playSound('error');
        this.mostrarNotificacion(mensaje, 'error');
        
        if (this.config.animationsEnabled) {
            this.contadorElement.classList.add('error');
            setTimeout(() => this.contadorElement.classList.remove('error'), 500);
        }
    }

    animarCambio(cantidad) {
        if (!this.config.animationsEnabled) return;
        
        const display = document.querySelector('.contador-display');
        display.classList.add(cantidad > 0 ? 'success' : 'warning');
        
        setTimeout(() => {
            display.classList.remove('success', 'warning');
        }, 300);
    }

    // Sistema de persistencia
    guardarEnLocalStorage() {
        try {
            const datos = {
                contador: this.contador,
                minLimit: this.minLimit,
                maxLimit: this.maxLimit,
                historial: this.historial,
                stats: this.stats,
                changeCount: this.changeCount,
                config: this.config,
                fechaGuardado: new Date().toISOString()
            };
            
            localStorage.setItem('contadorProData', JSON.stringify(datos));
            console.log('💾 Datos guardados');
        } catch (e) {
            console.error('Error guardando en LocalStorage:', e);
        }
    }

    cargarDesdeLocalStorage() {
        try {
            const datos = JSON.parse(localStorage.getItem('contadorProData'));
            
            if (datos) {
                this.contador = datos.contador || 0;
                this.minLimit = datos.minLimit || -100;
                this.maxLimit = datos.maxLimit || 100;
                this.historial = datos.historial || [];
                this.stats = datos.stats || this.stats;
                this.changeCount = datos.changeCount || 0;
                this.config = { ...this.config, ...datos.config };
                
                // Actualizar checkboxes de configuración
                document.getElementById('soundToggle').checked = this.config.soundEnabled;
                document.getElementById('animationsToggle').checked = this.config.animationsEnabled;
                document.getElementById('notificationsToggle').checked = this.config.notificationsEnabled;
                document.getElementById('autoSaveToggle').checked = this.config.autoSaveEnabled;
                
                console.log('📂 Datos cargados desde LocalStorage');
            }
        } catch (e) {
            console.error('Error cargando desde LocalStorage:', e);
            // Si hay error, limpiar datos corruptos
            localStorage.removeItem('contadorProData');
        }
    }

    // Control de características
    toggleSound(enabled) {
        this.config.soundEnabled = enabled;
        this.mostrarNotificacion(`Sonidos ${enabled ? 'activados' : 'desactivados'}`, 'info');
    }

    toggleAnimations(enabled) {
        this.config.animationsEnabled = enabled;
        this.mostrarNotificacion(`Animaciones ${enabled ? 'activadas' : 'desactivadas'}`, 'info');
    }

    toggleNotifications(enabled) {
        this.config.notificationsEnabled = enabled;
        this.mostrarNotificacion(`Notificaciones ${enabled ? 'activadas' : 'desactivadas'}`, 'info');
    }

    toggleAutoSave(enabled) {
        this.config.autoSaveEnabled = enabled;
        this.mostrarNotificacion(`Auto-guardado ${enabled ? 'activado' : 'desactivado'}`, 'info');
    }

    // Atajos de teclado
    handleKeyboardShortcuts(e) {
        // Ignorar si está escribiendo en un input
        if (e.target.tagName === 'INPUT') return;
        
        e.preventDefault();
        
        const shortcuts = {
            'ArrowUp': () => this.cambiarValor(1),
            'ArrowDown': () => this.cambiarValor(-1),
            '+': () => this.cambiarValor(10),
            '-': () => this.cambiarValor(-10),
            'r': () => this.resetear(),
            'R': () => this.resetear(),
            'l': () => document.getElementById('btnApplyLimits').click(),
            'L': () => document.getElementById('btnApplyLimits').click(),
            'h': () => document.getElementById('btnClearHistory').click(),
            'H': () => document.getElementById('btnClearHistory').click(),
            'Escape': () => {
                document.getElementById('inputManual').value = '';
                document.getElementById('inputManual').focus();
            },
            's': () => this.guardarEnLocalStorage(),
            'S': () => this.guardarEnLocalStorage()
        };
        
        if (shortcuts[e.key]) {
            shortcuts[e.key]();
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const contador = new ContadorPro();
    
    // Exponer globalmente para debugging (opcional)
    window.contador = contador;
    
    // Mostrar atajos en consola
    console.log('🎮 Contador Pro - Atajos de teclado:');
    console.log('  ↑ : +1');
    console.log('  ↓ : -1');
    console.log('  + : +10');
    console.log('  - : -10');
    console.log('  R : Resetear');
    console.log('  L : Aplicar límites');
    console.log('  H : Limpiar historial');
    console.log('  S : Guardar manualmente');
    console.log('  ESC : Limpiar entrada manual');
});