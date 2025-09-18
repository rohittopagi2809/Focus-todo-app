(function () {
    const STORAGE_KEY = 'focus_todos_v2';
    const THEME_KEY = 'focus_theme_v1';

    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const dateInput = document.getElementById('date');
    const list = document.getElementById('list');
    const count = document.getElementById('count');
    const clearDone = document.getElementById('clearDone');
    const empty = document.getElementById('empty');
    const themeToggle = document.getElementById('themeToggle');
    const filterButtons = Array.from(document.querySelectorAll('.pill[data-filter]'));

    let todos = loadTodos();
    let filter = 'all';

  // ================= THEME INITIALIZATION =================
    (function initTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        const theme = saved || (prefersLight ? 'light' : 'dark');
        setTheme(theme);
    })();

    themeToggle.addEventListener('click', () => {
        const next = document.body.dataset.theme === 'light' ? 'dark' : 'light';
        setTheme(next);
    });

    function setTheme(theme) {
        document.body.dataset.theme = theme;
        localStorage.setItem(THEME_KEY, theme);
    }

  // ================= LOCAL STORAGE HANDLING =================
    function loadTodos() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }

  // Unique ID generator
    function uid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

  // ================= ADD TASK =================
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        const due = dateInput.value || null;
        todos.unshift({
        id: uid(),
        text,
        done: false,
        createdAt: Date.now(),
        due
    });

        input.value = '';
        dateInput.value = '';

        save();
        render();
    });

  // ================= CLEAR COMPLETED =================
    clearDone.addEventListener('click', () => {
        todos = todos.filter(t => !t.done);
        save();
        render();
    });

  // ================= FILTERS =================
    filterButtons.forEach(btn =>
        btn.addEventListener('click', () => {
            filter = btn.dataset.filter;
            filterButtons.forEach(b => b.classList.toggle('active', b === btn));
            render();
        })
    );

  // ================= RENDER =================
    function render() {
        let visible = todos;

        if (filter === 'active') {
            visible = todos.filter(t => !t.done);
        }
        if (filter === 'completed') {
            visible = todos.filter(t => t.done);
        }
        if (filter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            visible = todos.filter(t => t.due === today);
        }
        if (filter === 'upcoming') {
            const today = new Date().toISOString().split('T')[0];
            visible = todos.filter(t => t.due && t.due > today);
        }

        empty.hidden = !!todos.length;

        const left = todos.filter(t => !t.done).length;
        count.textContent = `${left} item${left !== 1 ? 's' : ''}`;

        list.innerHTML = '';
        visible.forEach(todo => list.appendChild(renderItem(todo)));
    }

    function renderItem(todo) {
        const li = document.createElement('li');
        li.className = 'item' + (todo.done ? ' completed' : '');
        li.dataset.id = todo.id;

        // Checkbox
        const checkWrap = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!todo.done;
        cb.addEventListener('change', () => toggle(todo.id));
        checkWrap.appendChild(cb);

        // Text (editable)
        const text = document.createElement('div');
        text.className = 'text';
        text.textContent = todo.text;
        text.setAttribute('contenteditable', 'true');
        text.addEventListener('dblclick', () => text.focus());
        text.addEventListener('blur', () => commitEdit(todo.id, text.textContent));

        // Actions (due date + delete)
        const actions = document.createElement('div');

        const due = document.createElement('div');
        due.className = 'due';
        due.textContent = todo.due ? `Due: ${todo.due}` : '';

        const del = document.createElement('button');
        del.className = 'del';
        del.textContent = 'Delete';
        del.addEventListener('click', () => remove(todo.id));

        actions.appendChild(due);
        actions.appendChild(del);

        // Append everything
        li.appendChild(checkWrap);
        li.appendChild(text);
        li.appendChild(actions);

        return li;
    }

  // ================= HELPERS =================
    function toggle(id) {
        const t = todos.find(t => t.id === id);
        if (!t) return;
        t.done = !t.done;
        save();
        render();
    }

    function remove(id) {
        todos = todos.filter(t => t.id !== id);
        save();
        render();
    }

    function commitEdit(id, newText) {
        const txt = (newText || '').trim();
        const t = todos.find(t => t.id === id);
        if (!t) return;

        if (!txt) {
            remove(id);
            return;
        }

        t.text = txt;
        save();
        render();
    }

  // Initial render
    render();
})();
