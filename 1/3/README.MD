## 📌 Задача

Написать функцию fetchWithRetry(url, maxRetries = 3, delayMs = 1000), которая:
____

- Делает GET-запрос к указанному URL с помощью fetch;
- В случае успеха возвращает JSON-ответ;
- В случае ошибки (сетевой сбой, таймаут, неуспешный статус) — повторяет попытку до maxRetries раз;
- Между попытками ждёт delayMs миллисекунд;
- Если все попытки исчерпаны — выбрасывает последнюю ошибку.

```js
async function fetchWithRetry(
  url: string,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      // Если HTTP-статус не в диапазоне 2xx — считаем ошибкой
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data; // Успех — возвращаем данные
    } catch (error) {
      lastError = error as Error;
      console.error(`Попытка ${attempt} не удалась:`, error.message);

      // Не ждём после последней попытки
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // Если дошли сюда — все попытки провалились
  throw new Error(`Не удалось получить данные после ${maxRetries} попыток. Последняя ошибка: ${lastError?.message}`);
}
```

## Пример использования

```js
(async () => {
  try {
    const data = await fetchWithRetry('https://jsonplaceholder.typicode.com/posts/1', 3, 500);
    console.log('Успешно получено:', data);
  } catch (error) {
    console.error('Окончательный провал:', error.message);
  }
})();
```

## 💡 Комментарии
- Такой подход часто используется в микросервисных архитектурах или при работе с нестабильными API.
- В Java/Spring Boot аналогичное поведение можно реализовать через RetryTemplate из Spring Retry или с помощью Resilience4j.