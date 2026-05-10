// --- المتغيرات العالمية ---
let scores = { faraid: 0, sunan: 0, adhkar: 0, qurbat: 0, sins: 0, customQurbat: 0, customSins: 0 };
let counts = { fixed: 0, custom: 0 };
let globalGrandTotal = 0;

// تواريخ اليوم
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const todayDisplayStr = new Date().toLocaleDateString('ar-SA', options);
const todaySimpleStr = new Date().toLocaleDateString('en-CA');

// متغير لتحديد اليوم النشط (للتعديل)
let activeDateStr = todaySimpleStr;
let activeDisplayStr = todayDisplayStr;

// --- عند تحميل الصفحة ---
window.onload = () => {
    document.getElementById('current-date').innerText = activeDisplayStr;

    // استرجاع المظهر
    if (localStorage.getItem('hasadTheme') === 'light') {
        document.body.classList.add('light-mode');
    }

    // استرجاع بيانات اليوم تلقائياً
    restoreCurrentState(todaySimpleStr);

    // ربط الحفظ التلقائي بالتغييرات
    document.querySelectorAll('.calc-input').forEach(input => {
        input.addEventListener('change', () => {
            calculateAll();
            saveCurrentStateLocally();
        });
    });
};

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('hasadTheme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// --- العمليات الحسابية ---
function calculateAll() {
    scores.faraid = 0; scores.sunan = 0; scores.qurbat = 0; scores.sins = 0;
    let isKufr = false, isKabeera = false;

    document.querySelectorAll('.calc-input').forEach(input => {
        let val = parseInt(input.value) || 0;
        let category = input.getAttribute('data-category');

        if (input.tagName === 'SELECT') {
            scores[category] += val;
            if (val === -200 && category === 'faraid') isKufr = true;
        }
        else if (input.tagName === 'INPUT' && input.type === 'checkbox' && input.checked) {
            scores[category] += val;
            if (input.getAttribute('data-is-kabeera') === 'true') isKabeera = true;
        }
    });

    document.getElementById('alert-kufr').style.display = isKufr ? 'block' : 'none';
    document.getElementById('alert-danger').style.display = isKabeera ? 'block' : 'none';
    updateDashboard();
}

function incrementCounter(type) {
    counts[type]++;
    document.getElementById(`count-${type}`).innerText = counts[type];
    if (counts[type] % 100 === 0) {
        scores.adhkar += 20;
        showToast(`أتممت 100 ذكر! (+20 نقطة)`);
    }
    updateDashboard();
    saveCurrentStateLocally();
}

function addCustomAction() {
    const name = document.getElementById('action-name').value;
    const type = document.getElementById('action-type').value;
    const points = parseInt(document.getElementById('action-points').value) || 0;

    if (!name || points === 0) return showToast("أدخل اسم العمل والدرجة!");

    if (type === 'good') scores.customQurbat += Math.abs(points);
    else scores.customSins -= Math.abs(points);

    const list = document.getElementById('custom-actions-list');
    const item = document.createElement('div');
    item.className = `custom-item ${type === 'good' ? 'item-good' : 'item-bad'}`;
    item.innerHTML = `<span>${name}</span> <strong>${type === 'good' ? '+' : '-'}${Math.abs(points)}</strong>`;
    list.appendChild(item);

    document.getElementById('action-name').value = '';
    document.getElementById('action-points').value = '';

    updateDashboard();
    saveCurrentStateLocally();
}

function updateDashboard() {
    document.getElementById('score-faraid').innerText = scores.faraid;
    document.getElementById('score-sunan').innerText = scores.sunan;
    document.getElementById('score-adhkar').innerText = scores.adhkar;

    let totalQurbatDisplay = scores.qurbat + scores.customQurbat;
    document.getElementById('score-qurbat').innerText = totalQurbatDisplay;

    globalGrandTotal = scores.faraid + scores.sunan + scores.adhkar + totalQurbatDisplay + scores.sins + scores.customSins;
    document.getElementById('total-score').innerText = globalGrandTotal;

    const badge = document.getElementById('status-badge');
    if (globalGrandTotal >= 750) { badge.innerText = "رابح"; badge.className = "badge badge-winner"; }
    else if (globalGrandTotal >= 500) { badge.innerText = "مقتصد"; badge.className = "badge badge-safe"; }
    else { badge.innerText = "خاسر"; badge.className = "badge badge-loser"; }
}

// --- نظام الحفظ التلقائي ---
function saveCurrentStateLocally() {
    const inputsData = Array.from(document.querySelectorAll('.calc-input')).map(el => el.type === 'checkbox' ? el.checked : el.value);
    const state = {
        date: activeDateStr,
        inputs: inputsData,
        counts: counts,
        customQurbat: scores.customQurbat,
        customSins: scores.customSins,
        customActionsHTML: document.getElementById('custom-actions-list').innerHTML,
        adhkarScore: scores.adhkar 
    };
    localStorage.setItem(`hasadState_${activeDateStr}`, JSON.stringify(state));
}

function restoreCurrentState(targetDateStr) {
    const savedState = JSON.parse(localStorage.getItem(`hasadState_${targetDateStr}`));
    if (savedState) {
        document.querySelectorAll('.calc-input').forEach((el, index) => {
            if (el.type === 'checkbox') el.checked = savedState.inputs[index];
            else el.value = savedState.inputs[index];
        });

        counts = savedState.counts || { fixed: 0, custom: 0 };
        document.getElementById('count-fixed').innerText = counts.fixed;
        document.getElementById('count-custom').innerText = counts.custom;

        document.getElementById('custom-actions-list').innerHTML = savedState.customActionsHTML || '';
        scores.customQurbat = savedState.customQurbat || 0;
        scores.customSins = savedState.customSins || 0;
        scores.adhkar = savedState.adhkarScore || 0;
    } else {
        resetFormOnly(); 
    }
    calculateAll();
}

// تصفير المدخلات 
function resetFormOnly() {
    document.querySelectorAll('select').forEach(s => s.value = "0");
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    counts = { fixed: 0, custom: 0 };
    document.getElementById('count-fixed').innerText = "0";
    document.getElementById('count-custom').innerText = "0";
    document.getElementById('custom-actions-list').innerHTML = "";
    scores.customQurbat = 0; scores.customSins = 0; scores.adhkar = 0;
}

// زر تصفير اليوم
function resetToday() {
    if(confirm("هل أنت متأكد أنك تريد تصفير جميع مدخلات هذا اليوم؟")) {
        resetFormOnly();
        calculateAll();
        saveCurrentStateLocally();
        showToast("تم التصفير بنجاح");
    }
}

// --- نظام الأرشيف ---
function saveDay() {
    let archive = JSON.parse(localStorage.getItem('strictHasadArchiveData')) || [];
    archive = archive.filter(item => item.date !== activeDateStr); // إزالة القديم إن وجد لتحديثه

    const badge = document.getElementById('status-badge');
    const inputsData = Array.from(document.querySelectorAll('.calc-input')).map(el => el.type === 'checkbox' ? el.checked : el.value);

    const dayData = {
        date: activeDateStr,
        displayDate: activeDisplayStr,
        score: globalGrandTotal,
        statusText: badge.innerText,
        statusClass: badge.className,
        savedState: {
            inputs: inputsData,
            counts: counts,
            customQurbat: scores.customQurbat,
            customSins: scores.customSins,
            customActionsHTML: document.getElementById('custom-actions-list').innerHTML,
            adhkarScore: scores.adhkar
        }
    };

    archive.push(dayData);
    archive.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('strictHasadArchiveData', JSON.stringify(archive));
    
    saveCurrentStateLocally(); 
    showToast('تم حفظ اليوم في الأرشيف بنجاح!');
    
    if (activeDateStr !== todaySimpleStr) {
        setTimeout(() => { exitEditMode(); toggleArchive(); }, 1000);
    }
}

function loadArchive() {
    const archiveList = document.getElementById('archive-list');
    const archive = JSON.parse(localStorage.getItem('strictHasadArchiveData')) || [];
    archiveList.innerHTML = '';

    if (archive.length === 0) {
        archiveList.innerHTML = '<p style="text-align:center; color:var(--text-muted);">لا توجد سجلات محفوظة.</p>';
        return;
    }

    archive.forEach(item => {
        const div = document.createElement('div');
        div.className = 'archive-item';
        div.innerHTML = `
            <div>
                <strong style="display:block; margin-bottom:5px;">${item.displayDate}</strong>
                <span class="${item.statusClass}" style="font-size:0.8rem; padding:3px 10px; border-radius:12px; color: ${item.statusClass.includes('winner') ? 'black' : 'white'}">${item.statusText}</span>
                <div style="margin-top: 15px; display:flex; gap:10px;">
                    <button class="btn-edit" onclick="editArchivedDay('${item.date}')">✏️ تعديل</button>
                    <button class="btn-delete" onclick="deleteArchivedDay('${item.date}')">🗑️ حذف</button>
                </div>
            </div>
            <div style="font-size:2rem; font-weight:900;">${item.score}</div>
        `;
        archiveList.appendChild(div);
    });
}

function deleteArchivedDay(dateStr) {
    if(confirm("هل أنت متأكد من حذف هذا اليوم نهائياً؟")) {
        let archive = JSON.parse(localStorage.getItem('strictHasadArchiveData')) || [];
        archive = archive.filter(item => item.date !== dateStr);
        localStorage.setItem('strictHasadArchiveData', JSON.stringify(archive));
        localStorage.removeItem(`hasadState_${dateStr}`); 
        loadArchive();
        showToast("تم الحذف بنجاح");
    }
}

function editArchivedDay(dateStr) {
    let archive = JSON.parse(localStorage.getItem('strictHasadArchiveData')) || [];
    let dayToEdit = archive.find(item => item.date === dateStr);
    
    if (dayToEdit) {
        activeDateStr = dayToEdit.date;
        activeDisplayStr = dayToEdit.displayDate;
        
        localStorage.setItem(`hasadState_${activeDateStr}`, JSON.stringify({
            date: activeDateStr,
            ...dayToEdit.savedState
        }));
        
        document.getElementById('current-date').innerText = activeDisplayStr + " (وضع التعديل ✏️)";
        document.getElementById('current-date').style.color = "var(--warning)";
        
        restoreCurrentState(activeDateStr);
        toggleArchive(); 
        showToast("أنت الآن تعدل بيانات يوم سابق");
    }
}

function exitEditMode() {
    activeDateStr = todaySimpleStr;
    activeDisplayStr = todayDisplayStr;
    document.getElementById('current-date').innerText = activeDisplayStr;
    document.getElementById('current-date').style.color = "var(--text-main)";
    restoreCurrentState(todaySimpleStr);
}

function toggleArchive() {
    const mainContent = document.getElementById('main-content');
    const archiveContent = document.getElementById('archive-content');
    const btnArchive = document.getElementById('btn-archive');

    if (mainContent.style.display === 'none') {
        mainContent.style.display = 'block';
        archiveContent.style.display = 'none';
        btnArchive.innerText = 'الأرشيف';
        
        if (activeDateStr !== todaySimpleStr) exitEditMode();
    } else {
        mainContent.style.display = 'none';
        archiveContent.style.display = 'block';
        btnArchive.innerText = 'العودة لليوم';
        loadArchive();
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.className = "toast show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}
