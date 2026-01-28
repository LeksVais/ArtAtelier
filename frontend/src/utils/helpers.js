// helpers.js
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status) => {
  const colors = {
    planned: 'default',
    in_work: 'primary',
    on_approval: 'warning',
    completed: 'success',
    paused: 'error',
    created: 'info',
    on_review: 'secondary',
  };
  return colors[status] || 'default';
};

export const truncateText = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Байт';
  const k = 1024;
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^(\+7|8)[0-9]{10}$/;
  return re.test(phone.replace(/\D/g, ''));
};

// Новые функции для валидации проекта
export const validateRequired = (value) => {
  return value !== null && value !== undefined && value !== '';
};

export const validateProjectTitle = (title) => {
  if (!validateRequired(title)) return false;
  if (title.length < 3 || title.length > 255) return false;
  
  // Проверка разрешенных символов согласно ТП
  const re = /^[а-яёА-ЯЁa-zA-Z0-9\s\-,\\.()]+$/;
  return re.test(title);
};

// Функция для валидации описания проекта
export const validateProjectDescription = (description) => {
  if (!description || description.trim() === '') return true; // Описание не обязательное
  
  const re = /^[а-яёА-ЯЁa-zA-Z0-9\s\-,\\.():;!?"'«»]+$/;
  return re.test(description);
};

// Функция для проверки бюджета
export const validateBudget = (budget) => {
  if (!budget || budget.trim() === '') return true; // Бюджет не обязательный
  
  const num = parseFloat(budget);
  return !isNaN(num) && num >= 0;
};

// Функция для проверки даты
export const validateFutureDate = (date) => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};


