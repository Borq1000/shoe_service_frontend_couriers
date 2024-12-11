# Проблема с временем жизни JWT токенов

## Описание проблемы

В текущей реализации сессия пользователя истекает слишком быстро, что приводит к частым автоматическим выходам из системы. Это создает неудобства для пользователей, которым приходится часто повторно авторизовываться.

## Текущая реализация

В настоящее время в Django REST Framework JWT используются следующие настройки:

- `ACCESS_TOKEN_LIFETIME`: короткий срок жизни (предположительно 5-15 минут)
- `REFRESH_TOKEN_LIFETIME`: средний срок жизни (предположительно 1-24 часа)

## Необходимые изменения

### 1. Увеличение времени жизни токенов

В файле `settings.py` необходимо обновить настройки Simple JWT:

```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),  # Увеличиваем до 1 дня
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),  # Увеличиваем до 7 дней
    'ROTATE_REFRESH_TOKENS': True,  # Автоматическое обновление refresh токена
    'BLACKLIST_AFTER_ROTATION': True,  # Добавление старых токенов в черный список
}
```

### 2. Обновление механизма refresh токенов

Необходимо реализовать автоматическое обновление access токена на фронтенде:

```typescript
// Пример реализации для frontend
async function refreshToken() {
  try {
    const response = await fetch("/api/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: localStorage.getItem("refresh_token"),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("access_token", data.access);
      if (data.refresh) {
        // Если сервер отправил новый refresh токен
        localStorage.setItem("refresh_token", data.refresh);
      }
      return data.access;
    }
  } catch (error) {
    // В случае ошибки обновления токена - разлогиниваем пользователя
    console.error("Failed to refresh token:", error);
    // Редирект на страницу логина
  }
}
```

### 3. Безопасность

Для обеспечения безопасности при увеличении времени жизни токенов необходимо:

1. Реализовать механизм blacklist для отозванных токенов
2. Добавить проверку IP-адреса при обновлении токена
3. Добавить возможность принудительного выхода со всех устройств

```python
# Пример настроек для blacklist в settings.py
SIMPLE_JWT = {
    # ... остальные настройки ...
    'BLACKLIST_AFTER_ROTATION': True,
    'TOKEN_BLACKLIST_ENABLED': True,
}
```

## Ожидаемый результат

После внесения изменений:

1. Пользователи смогут оставаться в системе до 7 дней без необходимости повторной авторизации
2. Access токен будет автоматически обновляться на фронтенде
3. При необходимости администраторы смогут принудительно завершать сессии пользователей
4. Система останется безопасной благодаря механи��му blacklist и дополнительным проверкам
