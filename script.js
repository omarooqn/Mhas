// المتغيرات لحفظ النقاط
let scores = {
    faraid: 0,
    sunan: 0,
    adhkar: 0,
    qurbat: 0,
    sins: 0,
    customQurbat: 0,
    customSins: 0
};

// العدادات
let counts = { fixed: 0, custom: 0 };
let customActionsArray = [];

// استهداف جميع المدخلات
const inputs = document.querySelectorAll('.calc-input');
inputs.forEach(input => {
    input.addEventListener('change', calculateAll);
});

function calculateAll() {
    // تصفير مؤقت للجمع
    scores.faraid = 0; scores.sunan = 0; scores.qurbat = 0; scores.sins = 0;
    let isKufr = false;
    let isKabeera = false;

    inputs.forEach(input => {
        let val = parseInt(input.value) || 0;
        let category = input.getAttribute('data-category');

        if (input.tagName === 'SELECT') {
            scores[category] += val;
            if (val === -200 && category === 'faraid') isKufr = true; // ترك صلاة
        } 
        else if (input.tagName === 'INPUT' && input.type === 'checkbox' && input.checked) {
            scores[category] += val;
            if (input.getAttribute('data-is-kabeera') === 'true') isKabeera = true; // ارتكاب كبيرة
        }
    });

    // تحديث الإنذارات
    document.getElementById('alert-kufr').style.display = isKufr ? 'block' : 'none';
    document.getElementById('alert-danger').style.display = isKabeera ? 'block' : 'none';

    updateDashboard();
}

function incrementCounter(type) {
    counts[type]++;
    document.getElementById(`count-${type}`).innerText = counts[type];
    
    if (counts[type] % 100 === 0) {
        scores.adhkar += 20; // 20 نقطة لكل 100
        showToast(`أتممت 100 ذكر! (+20 نقطة)`);
        updateDashboard();
    }
}

function addCustomAction() {
    const name = document.getElementById('action-name').value;
    const type = document.getElementById('action-type').value;
    const points = parseInt(document.getElementById('action-points').value) || 0;

    if (!name || points === 0) {
        showToast("الرجاء إدخال اسم العمل والدرجة!");
        return;
    }

    if (type === 'good') {
        scores.customQurbat += Math.abs(points);
    } else {
        scores.customSins -= Math.abs(points); // بالسالب
    }

    // إضافة للواجهة
    const list = document.getElementById('custom-actions-list');
    const item = document.createElement('div');
    item.className = `custom-item ${type === 'good' ? 'item-good' : 'item-bad'}`;
    item.innerHTML = `<span>${name}</span> <strong>${type === 'good' ? '+' : '-'}${Math.abs(points)}</strong>`;
    list.appendChild(item);

    // تصفير الحقول
    document.getElementById('action-name').value = '';
    document.getElementById('action-points').value = '';

    updateDashboard();
}

function updateDashboard() {
    // تحديث العدادات الفرعية بالرأس
    document.getElementById('score-faraid').innerText = scores.faraid;
    document.getElementById('score-sunan').innerText = scores.sunan;
    document.getElementById('score-adhkar').innerText = scores.adhkar;
    
    // القربات تشمل (القربات الثابتة + الأعمال الحرة الصالحة)
    let totalQurbatDisplay = scores.qurbat + scores.customQurbat;
    document.getElementById('score-qurbat').innerText = totalQurbatDisplay;

    // المجموع الكلي
    let grandTotal = scores.faraid + scores.sunan + scores.adhkar + totalQurbatDisplay + scores.sins + scores.customSins;
    document.getElementById('total-score').innerText = grandTotal;

    // تحديث الحالة (مقتصد، رابح، خاسر) - تم تعديل النصوص هنا
    const badge = document.getElementById('status-badge');
    if (grandTotal >= 750) {
        badge.innerText = "رابح";
        badge.className = "badge badge-winner";
    } else if (grandTotal >= 500) {
        badge.innerText = "مقتصد";
        badge.className = "badge badge-safe";
    } else {
        badge.innerText = "خاسر";
        badge.className = "badge badge-loser";
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.className = "toast show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

// تهيئة مبدئية
calculateAll();
