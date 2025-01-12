// Elementos del DOM
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const savingsForm = document.getElementById('savings-form');
const expensesForm = document.getElementById('expenses-form');
const incomeForm = document.getElementById('income-form');
const exchangeRateForm = document.getElementById('exchange-rate-form');
const categoryForm = document.getElementById('category-form');
const savingsList = document.getElementById('savings-list').querySelector('tbody');
const expensesList = document.getElementById('expenses-list').querySelector('tbody');
const totalSavingsElement = document.getElementById('total-savings');
const budgetSummaryElement = document.getElementById('budget-summary');
const expensesByCategoryElement = document.getElementById('expenses-by-category');
const dailyExpensesSummaryElement = document.getElementById('daily-expenses-summary');
const categoryListElement = document.getElementById('category-list');
const expenseCategorySelect = document.getElementById('expense-category');

// Estado de la aplicación
let savings = JSON.parse(localStorage.getItem('savings')) || [];
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let income = parseFloat(localStorage.getItem('income')) || 0;
let exchangeRate = parseFloat(localStorage.getItem('exchangeRate')) || 1;
let categories = JSON.parse(localStorage.getItem('categories')) || ['Alimentación', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Educación', 'Otros'];

// Funciones auxiliares
function saveToLocalStorage() {
    localStorage.setItem('savings', JSON.stringify(savings));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('income', income.toString());
    localStorage.setItem('exchangeRate', exchangeRate.toString());
    localStorage.setItem('categories', JSON.stringify(categories));
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency }).format(amount);
}

function formatDateTime(date, time) {
    return new Date(`${date}T${time}`).toLocaleString('es-ES');
}

function updateTotalSavings() {
    const total = savings.reduce((sum, entry) => sum + (entry.type === 'deposit' ? entry.amount : -entry.amount), 0);
    totalSavingsElement.innerHTML = `
        <p>Total de Ahorros: ${formatCurrency(total)} / ${formatCurrency(total * exchangeRate, 'VES')}</p>
    `;
}

function updateBudgetSummary() {
    const totalSavings = savings.reduce((sum, entry) => sum + (entry.type === 'deposit' ? entry.amount : -entry.amount), 0);
    const totalExpenses = expenses.reduce((sum, entry) => sum + entry.amount, 0);
    const remaining = income - totalExpenses;

    budgetSummaryElement.innerHTML = `
        <p>Ingresos: ${formatCurrency(income)} / ${formatCurrency(income * exchangeRate, 'VES')}</p>
        <p>Gastos Totales: ${formatCurrency(totalExpenses)} / ${formatCurrency(totalExpenses * exchangeRate, 'VES')}</p>
        <p>Ahorros: ${formatCurrency(totalSavings)} / ${formatCurrency(totalSavings * exchangeRate, 'VES')}</p>
        <p>Restante: ${formatCurrency(remaining)} / ${formatCurrency(remaining * exchangeRate, 'VES')}</p>
    `;
}

function updateExpensesByCategory() {
    const categoriesSum = {};
    expenses.forEach(expense => {
        categoriesSum[expense.category] = (categoriesSum[expense.category] || 0) + expense.amount;
    });

    let html = '<ul>';
    for (const [category, amount] of Object.entries(categoriesSum)) {
        html += `<li>${category}: ${formatCurrency(amount)} / ${formatCurrency(amount * exchangeRate, 'VES')}</li>`;
    }
    html += '</ul>';

    expensesByCategoryElement.innerHTML = html;
}

function updateDailyExpensesSummary() {
    const dailyExpenses = {};
    expenses.forEach(expense => {
        const date = expense.date;
        dailyExpenses[date] = (dailyExpenses[date] || 0) + expense.amount;
    });

    let html = '<ul>';
    for (const [date, amount] of Object.entries(dailyExpenses)) {
        html += `<li>${date}: ${formatCurrency(amount)} / ${formatCurrency(amount * exchangeRate, 'VES')}</li>`;
    }
    html += '</ul>';

    dailyExpensesSummaryElement.innerHTML = html;
}

function renderSavingsList() {
    savingsList.innerHTML = '';
    savings.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(entry.date, entry.time)}</td>
            <td>${entry.type === 'deposit' ? 'Depósito' : 'Retiro'}</td>
            <td>${formatCurrency(entry.amount)}</td>
            <td>${formatCurrency(entry.amount * exchangeRate, 'VES')}</td>
            <td>${entry.description}</td>
            <td>
                <button onclick="editSavings(${index})">Editar</button>
                <button onclick="deleteSavings(${index})">Eliminar</button>
            </td>
        `;
        savingsList.appendChild(row);
    });
}

function renderExpensesList() {
    expensesList.innerHTML = '';
    expenses.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(entry.date, entry.time)}</td>
            <td>${formatCurrency(entry.amount)}</td>
            <td>${formatCurrency(entry.amount * exchangeRate, 'VES')}</td>
            <td>${entry.category}</td>
            <td>${entry.description}</td>
            <td>
                <button onclick="editExpense(${index})">Editar</button>
                <button onclick="deleteExpense(${index})">Eliminar</button>
            </td>
        `;
        expensesList.appendChild(row);
    });
}

function updateCategoryList() {
    categoryListElement.innerHTML = '';
    categories.forEach((category, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${category}
            <div>
                <button onclick="editCategory(${index})">Editar</button>
                <button onclick="deleteCategory(${index})">Eliminar</button>
            </div>
        `;
        categoryListElement.appendChild(li);
    });
    updateExpenseCategorySelect();
}

function updateExpenseCategorySelect() {
    expenseCategorySelect.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        expenseCategorySelect.appendChild(option);
    });
}

function setCurrentDateTime() {
    const now = new Date();
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const timeInputs = document.querySelectorAll('input[type="time"]');
    
    dateInputs.forEach(input => {
        input.valueAsDate = now;
    });
    
    timeInputs.forEach(input => {
        input.value = now.toTimeString().slice(0, 5);
    });
}

// Event Listeners
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

savingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('savings-type').value;
    const amount = parseFloat(document.getElementById('savings-amount').value);
    const date = document.getElementById('savings-date').value;
    const time = document.getElementById('savings-time').value;
    const description = document.getElementById('savings-description').value;

    savings.push({ type, amount, date, time, description });
    saveToLocalStorage();
    renderSavingsList();
    updateTotalSavings();
    updateBudgetSummary();
    savingsForm.reset();
    setCurrentDateTime();
});

expensesForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value;
    const time = document.getElementById('expense-time').value;
    const category = document.getElementById('expense-category').value;
    const description = document.getElementById('expense-description').value;

    expenses.push({ amount, date, time, category, description });
    saveToLocalStorage();
    renderExpensesList();
    updateBudgetSummary();
    updateExpensesByCategory();
    updateDailyExpensesSummary();
    expensesForm.reset();
    setCurrentDateTime();
});

incomeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    income = parseFloat(document.getElementById('monthly-income').value);
    saveToLocalStorage();
    updateBudgetSummary();
});

exchangeRateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    exchangeRate = parseFloat(document.getElementById('exchange-rate').value);
    saveToLocalStorage();
    renderSavingsList();
    renderExpensesList();
    updateTotalSavings();
    updateBudgetSummary();
    updateExpensesByCategory();
    updateDailyExpensesSummary();
});

categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newCategory = document.getElementById('category-name').value.trim();
    if (newCategory && !categories.includes(newCategory)) {
        categories.push(newCategory);
        saveToLocalStorage();
        updateCategoryList();
        categoryForm.reset();
    }
});

// Funciones de edición y eliminación
window.editSavings = function(index) {
    const entry = savings[index];
    document.getElementById('savings-type').value = entry.type;
    document.getElementById('savings-amount').value = entry.amount;
    document.getElementById('savings-date').value = entry.date;
    document.getElementById('savings-time').value = entry.time;
    document.getElementById('savings-description').value = entry.description;
    savings.splice(index, 1);
    saveToLocalStorage();
    renderSavingsList();
    updateTotalSavings();
    updateBudgetSummary();
};

window.deleteSavings = function(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta transacción de ahorro?')) {
        savings.splice(index, 1);
        saveToLocalStorage();
        renderSavingsList();
        updateTotalSavings();
        updateBudgetSummary();
    }
};

window.editExpense = function(index) {
    const entry = expenses[index];
    document.getElementById('expense-amount').value = entry.amount;
    document.getElementById('expense-date').value = entry.date;
    document.getElementById('expense-time').value = entry.time;
    document.getElementById('expense-category').value = entry.category;
    document.getElementById('expense-description').value = entry.description;
    expenses.splice(index, 1);
    saveToLocalStorage();
    renderExpensesList();
    updateBudgetSummary();
    updateExpensesByCategory();
    updateDailyExpensesSummary();
};

window.deleteExpense = function(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
        expenses.splice(index, 1);
        saveToLocalStorage();
        renderExpensesList();
        updateBudgetSummary();
        updateExpensesByCategory();
        updateDailyExpensesSummary();
    }
};

window.editCategory = function(index) {
    const category = categories[index];
    const li = categoryListElement.children[index];
    li.innerHTML = `
        <form class="edit-category-form">
            <input type="text" value="${category}" required>
            <button type="submit">Guardar</button>
            <button type="button" onclick="cancelEditCategory(${index})">Cancelar</button>
        </form>
    `;
    li.querySelector('form').addEventListener('submit', function(e) {
        e.preventDefault();
        const newCategory = this.querySelector('input').value.trim();
        if (newCategory && !categories.includes(newCategory)) {
            categories[index] = newCategory;
            saveToLocalStorage();
            updateCategoryList();
        }
    });
};

window.cancelEditCategory = function(index) {
    updateCategoryList();
};

window.deleteCategory = function(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
        categories.splice(index, 1);
        saveToLocalStorage();
        updateCategoryList();
    }
};

// Inicialización
renderSavingsList();
renderExpensesList();
updateTotalSavings();
updateBudgetSummary();
updateExpensesByCategory();
updateDailyExpensesSummary();
updateCategoryList();
setCurrentDateTime();
document.getElementById('exchange-rate').value = exchangeRate;