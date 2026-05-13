// ─── DATA E CONFIGURAÇÕES INICIAIS ──────────────────────────────────────────

let events = JSON.parse(localStorage.getItem('folclore_events') || '[]');
let settings = JSON.parse(localStorage.getItem('folclore_settings') || 'null') || {
    name: 'Grupo Folclórico e Etnográfico de Albergaria-a-Velha',
    subtitle: 'Fundado a 1 de janeiro de 1984',
    about: 'Bem-vindo ao nosso grupo de folclore! Somos uma associação cultural dedicada à preservação, estudo e divulgação das tradições, músicas e danças populares da nossa região.',
    local: 'Largo à Rua Serpa Pinto',
    contact: '919640648',
    email: 'grupofeav@gmail.com'
};

let currentDate = new Date();
let currentView = 'month';
let currentFilter = 'todos';

// ─── GESTÃO DE DEFINIÇÕES ───────────────────────────────────────────────────

function applySettings() {
    document.getElementById('groupName').textContent = settings.name;
    document.getElementById('groupSub').textContent = settings.subtitle;

    // Atualiza o título da página e do rodapé
    document.getElementById('footerBrand').textContent = settings.name;
    document.title = settings.name + ' · Calendário';

    // Preenche o formulário de definições
    document.getElementById('settingName').value = settings.name;
    document.getElementById('settingSubtitle').value = settings.subtitle;
    document.getElementById('settingAbout').value = settings.about;
    document.getElementById('settingLocal').value = settings.local;
    document.getElementById('settingContact').value = settings.contact;
    document.getElementById('settingEmail').value = settings.email;
}

function saveSettings() {
    settings.name = document.getElementById('settingName').value || settings.name;
    settings.subtitle = document.getElementById('settingSubtitle').value || settings.subtitle;
    settings.about = document.getElementById('settingAbout').value || settings.about;
    settings.local = document.getElementById('settingLocal').value || settings.local;
    settings.contact = document.getElementById('settingContact').value || settings.contact;
    settings.email = document.getElementById('settingEmail').value || settings.email;

    localStorage.setItem('folclore_settings', JSON.stringify(settings));
    applySettings();
    showToast('Definições guardadas! ✓');
}

// ─── NAVEGAÇÃO ENTRE TABS ────────────────────────────────────────────────────

function showTab(tab) {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));

    document.getElementById('tab-' + tab).classList.add('active');
    // Ativa o botão correto na navegação
    event.currentTarget.classList.add('active');

    if (tab === 'atividades') renderAllEvents();
}

// ─── LÓGICA DO CALENDÁRIO ────────────────────────────────────────────────────

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    document.getElementById('calMonthLabel').textContent = MONTHS[month] + ' ' + year;
    
    const body = document.getElementById('calBody');
    body.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const today = new Date();
    
    let cells = [];
    
    // Dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i--) {
        cells.push({ day: daysInPrev - i, month: month - 1, year, other: true });
    }
    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
        cells.push({ day: i, month, year, other: false });
    }
    // Dias do próximo mês para completar a grelha
    while (cells.length % 7 !== 0) {
        cells.push({ day: cells.length - firstDay - daysInMonth + 1, month: month + 1, year, other: true });
    }
    
    cells.forEach(c => {
        const d = new Date(c.year, c.month, c.day);
        const dateStr = d.toISOString().slice(0, 10);
        const dayEvents = events.filter(e => e.date === dateStr);
        
        // Esta é a linha que identifica o dia de hoje
        const isToday = d.toDateString() === today.toDateString();
        
        const cell = document.createElement('div');
        // Adiciona a classe 'today' se for o dia atual
        cell.className = 'cal-cell' + (c.other ? ' other-month' : '') + (isToday ? ' today' : '');
        
        const dateEl = document.createElement('div');
        dateEl.className = 'cal-date';
        dateEl.textContent = c.day;
        cell.appendChild(dateEl);
        
        // Mostrar até 2 eventos como dots/labels
        dayEvents.slice(0, 2).forEach(ev => {
            const dot = document.createElement('span');
            dot.className = 'cal-event-dot tipo-' + ev.tipo;
            dot.textContent = ev.title;
            dot.title = ev.title;
            dot.onclick = (e) => { e.stopPropagation(); openEditModal(ev.id); };
            cell.appendChild(dot);
        });
        
        if (dayEvents.length > 2) {
            const more = document.createElement('span');
            more.className = 'cal-event-dot';
            more.style.background = 'var(--brown-mid)';
            more.textContent = '+' + (dayEvents.length - 2) + ' mais';
            cell.appendChild(more);
        }
        
        cell.onclick = () => {
            document.getElementById('formDate').value = dateStr;
            openModal();
        };
        
        body.appendChild(cell);
    });
}

function changeMonth(dir) {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1);
    renderCalendar();
    if (currentView === 'list') renderListView();
}

function setCalView(view, btn) {
    currentView = view;
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('calView').style.display = view === 'month' ? 'block' : 'none';
    document.getElementById('listView').style.display = view === 'list' ? 'block' : 'none';
    if (view === 'list') renderListView();
}

// ─── LISTAGEM E FILTROS ──────────────────────────────────────────────────────

function buildEventCard(ev) {
    const card = document.createElement('div');
    card.className = 'event-card tipo-' + ev.tipo;

    // Mapeamento para as tuas novas variáveis do style.css
    const colorMap = {
        'ensaio': 'var(--folk-green)',
        'atuacao': 'var(--folk-red)',
        'reuniao': 'var(--folk-gold)',
        'outro': 'var(--brown-mid)'
    };
    const eventColor = colorMap[ev.tipo] || 'var(--brown-mid)';

    card.innerHTML = `
    <div class="event-card-header">
    <span class="event-tipo" style="color: ${eventColor}">${ev.tipo.toUpperCase()}</span>
    <div class="event-actions">
    <button class="action-btn edit" onclick="editEvent('${ev.id}')" title="Editar">✏️</button>
    <button class="action-btn delete" onclick="deleteEvent('${ev.id}')" title="Eliminar">🗑️</button>
    </div>
    </div>
    <h3 class="event-card-title">${ev.title}</h3>
    <div class="event-card-info">
    <span>📅 ${formatDate(ev.date)}</span>
    <span>⏰ ${ev.time || '--:--'}</span>
    </div>
    <div class="event-card-info">
    <span>📍 ${ev.local || 'Local não definido'}</span>
    </div>
    ${ev.desc ? `<p class="event-card-desc">${ev.desc}</p>` : ''}
    `;
    return card;
}

function renderAllEvents() {
    const list = document.getElementById('allEventsList');
    const filtered = events
    .filter(e => currentFilter === 'todos' || e.tipo === currentFilter)
    .sort((a, b) => new Date(a.date + 'T' + (a.time||'00:00')) - new Date(b.date + 'T' + (b.time||'00:00')));

    list.innerHTML = '';
    if (filtered.length === 0) {
        // Mudámos o emoji e a cor para combinar com o estilo rústico
        list.innerHTML = `<div class="empty-state"><div class="emoji" style="color:var(--folk-gold)">❧</div><p>Ainda não há atividades registadas.</p></div>`;
        return;
    }
    filtered.forEach(ev => list.appendChild(buildEventCard(ev)));
}

function renderListView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthEvents = events
    .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => new Date(a.date + 'T' + (a.time||'00:00')) - new Date(b.date + 'T' + (b.time||'00:00')));

    const container = document.getElementById('listViewEvents');
    if (monthEvents.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="emoji">📅</div><p>Sem atividades em ${MONTHS[month]}.</p></div>`;
        return;
    }
    container.innerHTML = '';
    monthEvents.forEach(ev => container.appendChild(buildEventCard(ev)));
}

function filterEvents(tipo, btn) {
    currentFilter = tipo;
    document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAllEvents();
}

// ─── LÓGICA DO MODAL (ADICIONAR/EDITAR) ───────────────────────────────────────

function openModal() {
    document.getElementById('modalTitleText').textContent = 'Nova Atividade';
    document.getElementById('editingId').value = '';
    document.getElementById('formTitle').value = '';
    
    // Define a data de hoje por defeito se o campo estiver vazio
    if (!document.getElementById('formDate').value) {
        document.getElementById('formDate').value = new Date().toISOString().slice(0,10);
    }
    
    document.getElementById('formTime').value = '';
    document.getElementById('formTipo').value = 'ensaio';
    document.getElementById('formLocal').value = '';
    document.getElementById('formDesc').value = '';
    
    // Mudado de 'open' para 'active' para ligar ao novo CSS
    document.getElementById('modalOverlay').classList.add('active');
}

function openEditModal(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    
    document.getElementById('modalTitleText').textContent = 'Editar Atividade';
    document.getElementById('editingId').value = id;
    document.getElementById('formTitle').value = ev.title;
    document.getElementById('formDate').value = ev.date;
    document.getElementById('formTime').value = ev.time || '';
    document.getElementById('formTipo').value = ev.tipo;
    document.getElementById('formLocal').value = ev.local || '';
    document.getElementById('formDesc').value = ev.desc || '';
    
    // Mudado de 'open' para 'active' para ligar ao novo CSS
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    // Mudado de 'open' para 'active'
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('formDate').value = '';
}

function closeModalOnOverlay(e) {
    // Fecha apenas se clicar fora da caixa branca do formulário
    if (e.target === document.getElementById('modalOverlay')) {
        closeModal();
    }
}

function saveEvent() {
    const title = document.getElementById('formTitle').value.trim();
    const date = document.getElementById('formDate').value;
    
    if (!title || !date) { 
        alert('Por favor, preenche pelo menos o título e a data da atividade.'); 
        return; 
    }

    const editingId = document.getElementById('editingId').value;
    const ev = {
        id: editingId || Date.now().toString(),
        title: title,
        date: date,
        time: document.getElementById('formTime').value,
        tipo: document.getElementById('formTipo').value,
        local: document.getElementById('formLocal').value.trim(),
        desc: document.getElementById('formDesc').value.trim()
    };

    if (editingId) {
        events = events.map(e => e.id === editingId ? ev : e);
    } else {
        events.push(ev);
    }

    localStorage.setItem('folclore_events', JSON.stringify(events));
    closeModal();
    
    // Atualiza ambas as vistas para refletir as mudanças
    renderCalendar();
    renderAllEvents();
    
    showToast(editingId ? 'Atividade atualizada! ✓' : 'Atividade adicionada! ✓');
}

function deleteEvent(id) {
    if (!confirm('Tens a certeza que queres eliminar esta atividade do calendário?')) return;
    
    events = events.filter(e => e.id !== id);
    localStorage.setItem('folclore_events', JSON.stringify(events));
    
    renderCalendar();
    renderAllEvents();
    showToast('Atividade eliminada.');
}

// ─── UTILITÁRIOS (TOASTS E SEED DATA) ─────────────────────────────────────────

function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
        position: 'fixed', bottom: '100px', right: '36px',
        background: 'var(--brown)', color: 'var(--cream)',
                  padding: '12px 22px', borderRadius: '8px',
                  fontFamily: "'Cinzel', serif", fontSize: '13px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  zIndex: '9999', opacity: '0',
                  transition: 'opacity 0.3s, transform 0.3s',
                  transform: 'translateY(10px)'
    });
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 400);
    }, 2500);
}

function seedData() {
    if (events.length > 0) return;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const pad = n => String(n).padStart(2,'0');
    events = [
        { id:'s1', title:'Ensaio Semanal', date:`${y}-${pad(m+1)}-${pad(8)}`, time:'21:00', tipo:'ensaio', local:'Casa do Povo', desc:'Preparação para a próxima atuação.' },
        { id:'s3', title:'Atuação — Festa da Aldeia', date:`${y}-${pad(m+1)}-${pad(20)}`, time:'16:00', tipo:'atuacao', local:'Largo da Igreja', desc:'Trajar a rigor.' }
    ];
    localStorage.setItem('folclore_events', JSON.stringify(events));
}

// Função de utilitário para formatar datas (Ex: 2026-05-11 -> 11/05/2026)
function formatDate(dateStr) {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}
// ─── INICIALIZAÇÃO ──────────────────────────────────────────────────────────

seedData();
applySettings();
renderCalendar();
