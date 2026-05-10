let scores = { faraid: 0, sunan: 0, adhkar: 0, qurbat: 0, sins: 0, customQurbat: 0, customSins: 0 };
let counts = { fixed: 0, custom: 0 };
let globalGrandTotal = 0; 

// إعداد التاريخ والمود عند الفتح
window.onload = () => {
    // إعداد التاريخ
    const dateElement = document.getElementById('current-date');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString('ar-SA', options);
    }

    // جلب وضع الشاشة (نهاري/ليلي) من الذاكرة
    const savedTheme = localStorage.getItem('hasadTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
};

const inputs = document.querySelectorAll('.calc-input');
inputs.forEach(input => { input.addEventListener('change', calculateAll); });

// وظيفة تبديل المظهر
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('hasadTheme', 'light');
    } else {
        localStorage.setItem('hasadTheme', 'dark');
    }
}

// حساب الدرجات الكلي
function calculateAll() {
    scores.faraid = 0; scores.sunan = 0; scores.qurbat = 0; scores.sins = 0;
    let isKufr = false, isKabeera = false;

    inputs.forEach(input => {
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

// زيادة العدادات
function incrementCounter(type) {
    counts[type]++;
    document.getElementById(`count-${type}`).innerText = counts[type];
    if (counts[type] % 100 === 0) {
        scores.adhkar += 20; 
        showToast(`أتممت 100 ذكر! (+20 نقطة)`);
        updateDashboard();
    }
}

// إضافة الأعمال الحرة
function addCustomAction() {
    const name = document.getElementById('action-name').value;
    const type = document.getElementById('action-type').value;
    const points = parseInt(document.getElementById('action-points').value) || 0;

    if (!name || points === 0) { showToast("أدخل اسم العمل والدرجة!"); return; }

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
}

// تحديث لوحة التحكم
function updateDashboard() {
    document.getElementById('score-faraid').innerText = scores.faraid;
    document.getElementById('score-sunan').innerText = scores.sunan;
    document.getElementById('score-adhkar').innerText = scores.adhkar;
    
    let totalQurbatDisplay = scores.qurbat + scores.customQurbat;
    document.getElementById('score-qurbat').innerText = totalQurbatDisplay;

    globalGrandTotal = scores.faraid + scores.sunan + scores.adhkar + totalQurbatDisplay + scores.sins + scores.customSins;
    document.getElementById('total-score').innerText = globalGrandTotal;

    const badge = document.getElementById('status-badge');
    if (globalGrandTotal >= 750) { 
        badge.innerText = "رابح"; 
        badge.className = "badge badge-winner"; 
    } else if (globalGrandTotal >= 500) { 
        badge.innerText = "مقتصد"; 
        badge.className = "badge badge-safe"; 
    } else { 
        badge.innerText = "خاسر"; 
        badge.className = "badge badge-loser"; 
    }
}

// حفظ أعمال اليوم في الأرشيف
function saveDay() {
    let archive = JSON.parse(localStorage.getItem('strictArchiveData')) || [];
    const simpleDateStr = new Date().toLocaleDateString('en-CA');
    
    // مسح نتيجة اليوم إن كانت مسجلة مسبقاً وتحديثها
    archive = archive.filter(item => item.date !== simpleDateStr); 
    
    const badge = document.getElementById('status-badge');
    const dayData = {
        date: simpleDateStr,
        displayDate: document.getElementById('current-date').innerText,
        score: globalGrandTotal,
        statusText: badge.innerText,
        statusClass: badge.className
    };
    
    archive.push(dayData);
    archive.sort((a, b) => new Date(b.date) - new Date(a.date)); 
    localStorage.setItem('strictArchiveData', JSON.stringify(archive));
    showToast('تم حفظ اليوم بنجاح، تقبل الله!');
}

// فتح وإغلاق الأرشيف
function toggleArchive() {
    const mainContent = document.getElementById('main-content');
    const archiveContent = document.getElementById('archive-content');
    const btnArchive = document.getElementById('btn-archive');
    
    if (mainContent.style.display === 'none') {
        mainContent.style.display = 'block';
        archiveContent.style.display = 'none';
        btnArchive.innerText = 'الأرشيف';
    } else {
        mainContent.style.display = 'none';
        archiveContent.style.display = 'block';
        btnArchive.innerText = 'العودة لليوم';
        loadArchive();
    }
}

// عرض بيانات الأرشيف
function loadArchive() {
    const archiveList = document.getElementById('archive-list');
    const archive = JSON.parse(localStorage.getItem('strictArchiveData')) || [];
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
                <span class="${item.statusClass}" style="font-size:0.8rem; padding:3px 10px; border-radius:12px; color: ${item.statusClass === 'badge badge-winner' ? 'black' : 'white'}">${item.statusText}</span>
            </div>
            <div style="font-size:1.8rem; font-weight:900;">${item.score}</div>
        `;
        archiveList.appendChild(div);
    });
}

// إظهار الإشعارات السفلية
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.className = "toast show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

// استدعاء الحساب لأول مرة عند فتح الصفحة
calculateAll();
